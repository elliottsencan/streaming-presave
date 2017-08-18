"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const moment = require("moment");
const request = require("request");
const uuid = require("uuid");
const SpotifyWebApi = require("spotify-web-api-node");
const Promise = require("bluebird");
const dynamoDb = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient());
const $post = Promise.promisify(request.post);
const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_CLIENT_CALLBACK
};

module.exports.query = (event, context, callback) => {
  let spotifyHandlers = {};
  const releaseDate = moment().isUtc()
    ? moment().startOf("day").valueOf()
    : moment.utc().startOf("day").valueOf();

  const fetchCampaignsByReleaseDate = releaseDate => {
    const campaignParams = {
      TableName: process.env.CAMPAIGNS_TABLE,
      IndexName: process.env.CAMPAIGNS_TABLE_INDEX,
      KeyConditionExpression: "#releaseDate = :releaseDate",
      ExpressionAttributeNames: {
        "#releaseDate": "releaseDate"
      },
      ExpressionAttributeValues: {
        ":releaseDate": releaseDate
      }
    };

    return dynamoDb.queryAsync(campaignParams).then(result => {
      return result.Items;
    });
  };

  const fetchSubscribers = campaignId => {
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

  const getSpotifyAuthHeader = () => {
    return (
      "Basic " +
      new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
      ).toString("base64")
    );
  };

  const fetchAccessToken = refreshToken => {
    const authParams = {
      url: "https://accounts.spotify.com/api/token",
      headers: {
        Authorization: getSpotifyAuthHeader()
      },
      form: {
        grant_type: "refresh_token",
        refresh_token: refreshToken
      },
      json: true
    };

    return $post(authParams).then(response => {
      return response.body.access_token;
    });
  };

  const getMostRecentAlbumTracks = (handler, artistId) => {
    return handler
      .getArtistAlbums(artistId)
      .then(data => {
        return data.body.items[0].id;
      })
      .then(albumId => {
        return handler.getAlbumTracks(albumId).then(data => {
          return data.body.items
            .map(item => {
              return item.uri;
            })
            .join(",");
        });
      });
  };

  const createUpdateQueueRecord = data => {
    const timestamp = new Date().getTime();
    const updateParams = {
      TableName: process.env.UPDATE_QUEUE_TABLE,
      Item: Object.assign({}, data, {
        updateId: uuid.v1(),
        complete: false,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    };

    return dynamoDb.putAsync(updateParams);
  };
  /*
  control flow
  */

  const getCampaignData = campaign => {
    const campaignId = campaign.campaignId;
    const artistId = campaign.artistId;
    const refreshToken = campaign.refreshToken;
    spotifyHandlers[campaignId] = new SpotifyWebApi(spotifyConfig);
    return fetchAccessToken(refreshToken).then(accessToken => {
      spotifyHandlers[campaignId].setAccessToken(accessToken);
      return getMostRecentAlbumTracks(
        spotifyHandlers[campaignId],
        artistId
      ).then(uris => {
        return {
          uris: uris,
          campaignId: campaignId
        };
      });
    });
  };

  const getSubscriberData = resolvedSubscriber => {
    const refreshToken = resolvedSubscriber.refreshToken;
    return fetchAccessToken(refreshToken).then(accessToken => {
      return Object.assign({}, resolvedSubscriber, {
        accessToken: accessToken
      });
    });
  };

  const getSubscribers = data => {
    return fetchSubscribers(data.campaignId);
  };

  fetchCampaignsByReleaseDate(releaseDate).then(campaigns => {
    const campaignData = campaigns.map(getCampaignData);

    Promise.all(campaignData).then(cdata => {
      const subscribers = [].concat.apply([], cdata.map(getSubscribers));
      Promise.all(subscribers).then(doubleSubscriberArray => {
        const resolvedSubscribers = [].concat.apply([], doubleSubscriberArray);
        const subscriberData = resolvedSubscribers.map(getSubscriberData);
        Promise.all(subscriberData).then(sdata => {
          const queueData = Object.assign({}, cdata[0], sdata[0]);
          createUpdateQueueRecord(queueData).then(() => {
            const response = {
              statusCode: 200
            };
            callback(null, response);
          });
        });
      });
    });
  });
};
