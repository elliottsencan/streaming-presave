"use strict";
const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const Promise = require("bluebird");
const uuid = require("uuid");
const dynamoDb = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient());
const request = require("request");
const $post = Promise.promisify(request.post);
const SpotifyWebApi = require("spotify-web-api-node");
const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_CLIENT_CALLBACK
};

const dummyFetchedReleaseData = {
  uris:
    "spotify:track:01il5YrqZZiptglvAmcMrW,spotify:track:6kx9Z1R1tm4DZM6iKy6GcV,spotify:track:4dhqPvTeRDnti751EXPznk,spotify:track:1C3pyT8S8fkaI91khmTjcF,spotify:track:3xQERbgJrsDgSNHOz9QN97,spotify:track:7fODRVWDnKd8CGfA1CE2Hy,spotify:track:39J85VXiDVmiaBTgdWW0rz,spotify:track:4e7HDxhRYhKM3vZoxJ81V9,spotify:track:2oFxAr34RMq9C08dI2t8Je,spotify:track:3BpZBfCyGLi0xwW1CXk4R2,spotify:track:10XSzgwtOeg2cn0c2UBvHw,spotify:track:7EN2Bj4QIOUN7jbt30bqaT,spotify:track:3ovUC1otltR64PMTj8kaVV,spotify:track:5ceNBjsHTaLoJxUIfZ8ubg,spotify:track:0WNvsaTpzrInZGxnSNHeQI,spotify:track:0eQ8g6xef1I8qtUZauezIR,spotify:track:06IVT9yqDiB70tCwzPe7qs,spotify:track:1TCWucX5mKFWd1Z43qQAWD,spotify:track:1DKYM39oWTI79juSruYM3r,spotify:track:2j7WFfLoM12mfvvKoSp7FZ,spotify:track:0akvD9y8NSgYiYSRSu3y1B,spotify:track:51dbbhs2gcXJSIvILIYCbm,spotify:track:0sRleWntQ5MZjemMZ2UauH,spotify:track:5jwKzpF7HtMwLmqBORKjZy,spotify:track:3gyCdQfiaXuJoUhIsuWISp,spotify:track:1ByQCDDB16FDsNbvNL8dlM,spotify:track:2l7M5px0P631NiGO2fQ9wF,spotify:track:6tFwEEnMrmdAqeotTbpHuO,spotify:track:5Yc037C8ERfOaYkiYV8kUt,spotify:track:2aBc43ob5athlXVWnHz477,spotify:track:7iIaqMJgoXohyND7RfIOdN,spotify:track:5oYzXxKof6mkdCX6lsvgGJ,spotify:track:3wW8Pog5y4zG7g6KkSOG5h,spotify:track:0vCNA91jB2WzDOxJkxEvIf,spotify:track:6Z0LrMp5HXGawA4WKIPnFI,spotify:track:5IF9uO7iFNZanDLzr2dpvC,spotify:track:0rf5aGnwnGe77fh2MbCQeK,spotify:track:5UO4jjoVN7oqc52W4JjSfI",
  releases:
    "spotify:album:7rcNekIxuK4G6jyPt55a2U,2jnwx610OS3WXbtHFQwgiK,6zJ7dE0pQz8JGFIlG3fquu,3nadqCHaRsAaUQ47lKMeYP,3Gy6ObDHGHLrLOB0Rvf5qb,4Hy04BdJNVhdqnpY69Jso4,4KxPQ4m5n51DEYEOeehKko,0WQZ5iyDxEG9HDSAsXn2HG,5k1wh9VIgo6JWsW48CRS28,1d9JYhyNtfqevmM2JDSxPt,2PGeNYKwJPCfImBFA1CcC8,1gCyUyQvqDEJOjo18WdE5I,6XL0i4TCp2D1zDT4EbCCOO"
};

const insertSpotifyTransactionHistoryRecord = message => {
  const timestamp = new Date().getTime();
  const updateParams = {
    TableName: process.env.SPOTIFY_TRANSACTION_HISTORY_TABLE,
    Item: {
      timestamp: timestamp,
      message: message
    }
  };

  return dynamoDb.putAsync(updateParams);
};

const fetchAccessToken = refreshToken => {
  insertSpotifyTransactionHistoryRecord(
    "began fetching access token with " + refreshToken
  );
  const authParams = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64")
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refreshToken
    },
    json: true
  };

  return $post(authParams).then(response => {
    insertSpotifyTransactionHistoryRecord(
      "successfully fetched access token:" +
        response.body.access_token +
        "  with " +
        refreshToken
    );
    return response.body.access_token;
  });
};

const fetchArtistAlbums = (refreshToken, artistId) => {
  insertSpotifyTransactionHistoryRecord(
    "began fetching artist:" + artistId + "'s albums"
  );
  return fetchAccessToken(refreshToken).then(accessToken => {
    const spotifyAPI = new SpotifyWebApi(spotifyConfig);
    spotifyAPI.setAccessToken(accessToken);
    return spotifyAPI
      .getArtistAlbums(artistId)
      .then(response => {
        insertSpotifyTransactionHistoryRecord(
          "succesfully fetched artist: " +
            artistId +
            "'s albums with response of " +
            JSON.stringify(response)
        );
        return response.body.items.map(item => {
          return item.id;
        });
      })
      .catch(error => {});
  });
};

const fetchAlbumTrackUris = (refreshToken, albumId) => {
  insertSpotifyTransactionHistoryRecord(
    "began fetching album:" + albumId + "'s tracks"
  );
  return fetchAccessToken(refreshToken).then(accessToken => {
    const spotifyAPI = new SpotifyWebApi(spotifyConfig);
    spotifyAPI.setAccessToken(accessToken);
    return spotifyAPI
      .getAlbumTracks(albumId)
      .then(response => {
        insertSpotifyTransactionHistoryRecord(
          "successfully fetched album:" +
            albumId +
            "'s tracks with response of " +
            JSON.stringify(response)
        );
        return response.body.items
          .map(item => {
            return item.uri;
          })
          .join(",");
      })
      .catch(error => {});
  });
};

const fetchReleaseData = (refreshToken, artistId) => {
  console.log("fetching artist albums");
  insertSpotifyTransactionHistoryRecord(
    "began fetching artistsId: " + artistId + "'s release data"
  );
  let response = {};
  return fetchArtistAlbums(refreshToken, artistId).then(albumIds => {
    console.log("fetching album tracks");
    response.releases = albumIds.join(",");
    const trackUris = albumIds.map(albumId => {
      return fetchAlbumTrackUris(refreshToken, albumId);
    });
    return Promise.all(trackUris).then(result => {
      console.log("joining results");
      response.uris = result.join(",");
      insertSpotifyTransactionHistoryRecord(
        "successfully fetched artistsId: " + artistId + "'s release data"
      );
      return response;
    });
  });
};

module.exports.scheduled = (event, context, callback) => {
  const getCampaigns = () => {
    console.log("fetching campaigns");
    const campaignParams = {
      TableName: process.env.CAMPAIGNS_TABLE
    };
    return dynamoDb.scanAsync(campaignParams).then(result => {
      return result.Items;
    });
  };

  const getReleaseData = campaignId => {
    console.log("fetching release data for ", campaignId);
    const releaseData = {
      TableName: process.env.RELEASE_DATA_TABLE,
      KeyConditionExpression: "#campaignId = :campaignId",
      ExpressionAttributeNames: {
        "#campaignId": "campaignId"
      },
      ExpressionAttributeValues: {
        ":campaignId": campaignId
      }
    };
    return dynamoDb.queryAsync(releaseData).then(result => {
      return result.Items[0];
    });
  };

  const getSubscribers = campaignId => {
    console.log("fetching subscribers for campaign ", campaignId);
    const subscriberParams = {
      TableName: process.env.SUBSCRIBERS_TABLE,
      IndexName: process.env.SUBSCRIBERS_TABLE_INDEX,
      KeyConditionExpression: "#campaignId = :campaignId",
      ExpressionAttributeNames: {
        "#campaignId": "campaignId"
      },
      ExpressionAttributeValues: {
        ":campaignId": campaignId
      }
    };

    return dynamoDb.queryAsync(subscriberParams).then(result => {
      return result.Items;
    });
  };

  const updateReleaseData = (campaignId, releaseData) => {
    const timestamp = new Date().getTime();
    console.log(
      "updating release data for " +
        campaignId +
        " with release data " +
        JSON.stringify(releaseData)
    );
    const params = {
      TableName: process.env.RELEASE_DATA_TABLE,
      Key: {
        campaignId: campaignId
      },
      ExpressionAttributeValues: {
        ":uris": releaseData.uris,
        ":releases": releaseData.releases,
        ":updatedAt": timestamp
      },
      UpdateExpression:
        "SET uris = :uris, releases = :releases, updatedAt = :updatedAt",
      ReturnValues: "ALL_NEW"
    };

    return dynamoDb.updateAsync(params);
  };

  const insertUpdateQueueRecord = data => {
    const timestamp = new Date().getTime();
    console.log("inserting update queue record with data ", data);
    const updateParams = {
      TableName: process.env.UPDATE_QUEUE_TABLE,
      Item: {
        updateId: uuid.v1(),
        subscriberId: data.subscriberId,
        playlistId: data.playlistId,
        campaignId: data.campaignId,
        uris: data.uris,
        refreshToken: data.refreshToken,
        spotifyId: data.spotifyId,
        complete: false,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };

    return dynamoDb.putAsync(updateParams);
  };

  getCampaigns().then(campaigns => {
    const $releaseData = campaigns.map(campaign => {
      const refreshToken = campaign.refreshToken;
      const artistId = campaign.artistId;
      const campaignId = campaign.campaignId;
      return Promise.all([
        campaignId,
        getReleaseData(campaignId),
        fetchReleaseData(refreshToken, artistId)
      ]);
    });

    Promise.all($releaseData).then(releaseData => {
      releaseData.forEach(releaseDataDiff => {
        console.log("release data diff ", JSON.stringify(releaseDataDiff));
        const campaignId = releaseDataDiff[0];
        const storedReleaseData = releaseDataDiff[1];
        // const fetchedReleaseData = releaseDataDiff[2];
        const fetchedReleaseData = dummyFetchedReleaseData;
        const storedReleasesUris = storedReleaseData.uris.split(",");
        const fetchedReleaseUris = fetchedReleaseData.uris.split(",");
        console.log('storedReleaseUris count', storedReleasesUris.length);
        console.log('fetchedReleaseUris count', fetchedReleaseUris.length);

        if (fetchedReleaseUris.length > storedReleasesUris.length) {
          console.log('inserting new uris');
          const diffLength = fetchedReleaseUris.length - storedReleasesUris.length;
          const newUris = fetchedReleaseUris.slice(0, diffLength).join(",");
          console.log('new uris ', newUris);
          updateReleaseData(campaignId, fetchedReleaseData);
          getSubscribers(campaignId).then(subscribers => {
            subscribers.forEach(subscriber => {
              console.log('subscriber is ', JSON.stringify(subscriber));
              insertUpdateQueueRecord({
                subscriberId: subscriber.subscriberId,
                campaignId: subscriber.campaignId,
                refreshToken: subscriber.refreshToken,
                email: subscriber.email,
                playlistId: subscriber.playlistId,
                spotifyId: subscriber.spotifyId,
                uris: newUris
              }).then(insertUpdateParams => {
                const insertUpdateResponse = {
                  statusCode: 200,
                  body: JSON.stringify(insertUpdateParams)
                };
                callback(null, JSON.stringify(insertUpdateParams));
              });
            });
          });
        }
      });
    });
  });
};
