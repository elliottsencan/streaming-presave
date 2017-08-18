"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-
const sns = new AWS.SNS();
const moment = require("moment");
const SpotifyWebApi = require("spotify-web-api-node");
const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_CLIENT_CALLBACK
};

module.exports.process = (event, context, callback) => {
  event.Records.forEach(function(record) {
    console.log(record.dynamodb.NewImage);
    const subscriberId = record.dynamodb.NewImage.subscriberId.S;
    const playlistId = record.dynamodb.NewImage.playlistId.S;
    const campaignId = record.dynamodb.NewImage.campaignId.S;
    const spotifyUris = record.dynamodb.NewImage.uris.S;
    const accessToken = record.dynamodb.NewImage.accessToken.S;
    const spotifyId = record.dynamodb.NewImage.spotifyId.S;
    if (
      typeof subscriberId === "undefined" ||
      typeof playlistId === "undefined" ||
      typeof campaignId === "undefined" ||
      typeof spotifyUris === "undefined" ||
      typeof accessToken === "undefined" ||
      typeof spotifyId === "undefined"
    ) {
      console.error("Validation Failed");
      callback(new Error("Couldn't create release."));
      return;
    }

    const spotifyAPI = new SpotifyWebApi(spotifyConfig);
    spotifyAPI.setAccessToken(accessToken);

    spotifyAPI
      .addTracksToPlaylist(spotifyId, playlistId, spotifyUris.split(","))
      .then(data => {
        console.log("wtf  heres that data ", data);
        var params = {
          Message:
            "Adding " +
            spotifyUris +
            " to playlist " +
            playlistId +
            " for campaign " +
            campaignId,
          TopicArn: "arn:aws:sns:us-east-1:353948116047:presave-playlist-update"
        };
        sns.publish(params, function(err, data) {
          if (err) console.log(err, err.stack);
          else console.log("malformed SSN message sent successfully");

          console.log("YO THIS SHIT WORKED ", data);
          callback(null, {
            response: 200,
            body: data
          });
        });
      });
  });
};
