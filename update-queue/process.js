"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-
const moment = require("moment");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.process = (event, context, callback) => {
  event.Records.forEach(function(record) {
    const timestamp = new Date().getTime();
    console.log(record.dynamodb.NewImage);
    const subscriberId = record.dynamodb.NewImage.subscriberId.S;
    const playlistId = record.dynamodb.NewImage.playlistId.S;
    const campaignId = record.dynamodb.NewImage.campaignId.S;
    const spotifyUris = record.dynamodb.NewImage.spotifyUris.S;
    if (typeof subcriberId === "undefined" || typeof playlistId === "undefined" || typeof spotifyUris === "undefined" || typeof campaignId === "undefined") {
      console.error("Validation Failed");
      callback(new Error("Couldn't create release."));
      return;
    }

  });
};
