"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const Promise = require("bluebird");
const dynamoDb = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient());
const request = require("request");
const $post = Promise.promisify(request.post);
const SpotifyWebApi = require("spotify-web-api-node");
const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_CLIENT_CALLBACK
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
    console.log('fetch access token response ', response);
    insertSpotifyTransactionHistoryRecord(
      "successfully fetched access token:" +
        response.body.access_token +
        "  with " +
        refreshToken
    );
    return response.body.access_token;
  }).catch(error => {
    insertSpotifyTransactionHistoryRecord(
      "spotify fetch failed : " + JSON.stringify(error)
    );
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

module.exports.create = (event, context, callback) => {
  console.log(JSON.stringify(event.Records));
  event.Records.forEach(function(record) {
    console.log("creating release data record from " + JSON.stringify(record));
    const campaignId = record.dynamodb.NewImage.campaignId.S;
    const artistId = record.dynamodb.NewImage.artistId.S;
    const artistName = record.dynamodb.NewImage.artistId.S;
    const refreshToken = record.dynamodb.NewImage.refreshToken.S;
    if (
      typeof refreshToken === "undefined" ||
      typeof artistId === "undefined" ||
      typeof artistName === "undefined" ||
      typeof campaignId === "undefined"
    ) {
      console.error("Validation Failed");
      callback(new Error("Couldn't create release data entry."));
      return;
    }

    fetchReleaseData(refreshToken, artistId).then(releaseResponse => {
      console.log("response from creating release data " + releaseResponse);
      const timestamp = new Date().getTime();
      const updateParams = {
        TableName: process.env.RELEASE_DATA_TABLE,
        Item: {
          refreshToken: refreshToken,
          artistId: artistId,
          artistName: artistName,
          campaignId: campaignId,
          uris: releaseResponse.uris,
          releases: releaseResponse.releases,
          updatedAt: timestamp,
          createdAt: timestamp
        }
      };

      dynamoDb.putAsync(updateParams).then(data => {
        const dynamDbResponse = {
          statusCode: 200,
          body: JSON.stringify(data)
        };
        callback(null, dynamDbResponse);
      });
    });
  });
};
