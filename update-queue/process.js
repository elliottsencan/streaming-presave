"use strict";
const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-
const sns = new AWS.SNS();
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
    insertSpotifyTransactionHistoryRecord(
      "successfully fetched access token:" +
        response.body.access_token +
        "  with " +
        refreshToken
    );
    return response.body.access_token;
  });
};

module.exports.process = (event, context, callback) => {
  event.Records.forEach(function(record) {
    console.log(JSON.stringify(record.dynamodb.NewImage));
    if (record.dynamodb.NewImage) {
      const subscriberId = record.dynamodb.NewImage.subscriberId.S;
      const campaignId = record.dynamodb.NewImage.campaignId.S;
      const releaseTitle = record.dynamodb.NewImage.releaseTitle.S;
      const playlistId = record.dynamodb.NewImage.playlistId ? record.dynamodb.NewImage.playlistId.S : null;
      const uris = record.dynamodb.NewImage.uris.S;
      const refreshToken = record.dynamodb.NewImage.refreshToken.S;
      const spotifyId = record.dynamodb.NewImage.spotifyId.S;
      if (
        typeof subscriberId === "undefined" ||
        typeof campaignId === "undefined" ||
        typeof uris === "undefined" ||
        typeof refreshToken === "undefined" ||
        typeof spotifyId === "undefined"
      ) {
        console.error("Validation Failed");
        callback(new Error("Couldn't process update queue record."));
        return;
      }

      fetchAccessToken(refreshToken).then(accessToken => {
        const spotifyAPI = new SpotifyWebApi(spotifyConfig);
        spotifyAPI.setAccessToken(accessToken);
        const $playlist = playlistId ? Promise.resolve(playlistId) : spotifyAPI.createPlaylist(spotifyId, releaseTitle, { 'public' : false }).then(data => { console.log('returned subscriber data ', data); return data.id });
        
        insertSpotifyTransactionHistoryRecord(
          "began inserting " +
            uris +
            " into playlist " +
            playlistId +
            " belonging to " +
            spotifyId
        );
        spotifyAPI
          .addTracksToPlaylist(spotifyId, playlistId, uris.split(","))
          .then(data => {
            insertSpotifyTransactionHistoryRecord(
              "successfully inserted " +
                uris +
                " into playlist " +
                playlistId +
                " belonging to " +
                spotifyId
            );
            var params = {
              Message:
                "Successfully added " +
                uris +
                " to playlist " +
                playlistId +
                " for campaign " +
                campaignId,
              TopicArn:
                "arn:aws:sns:us-east-1:353948116047:presave-playlist-update"
            };
            sns.publish(params, function(err, data) {
              if (err) {
                console.log(err, err.stack);
              } else {
                console.log("successfully added items to playlist");
              }

              callback(null, {
                response: 200,
                body: JSON.stringify(data)
              });
            });
          });
      });
    }
  });
};
