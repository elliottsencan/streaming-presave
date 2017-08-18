"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const uuid = require("uuid");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // validation
  if (
    typeof data.refreshToken === "undefined" ||
    typeof data.campaignId === "undefined" ||
    typeof data.playlistId === "undefined" ||
    typeof data.email === "undefined" ||
    typeof data.spotifyId === "undefined"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't update subscriber."));
    return;
  }

  const params = {
    TableName: process.env.SUBSCRIBERS_TABLE,
    Item: {
      subscriberId: uuid.v1(),
      refreshToken: data.refreshToken,
      campaignId: data.campaignId,
      playlistId: data.playlistId,
      email: data.email,
      spotifyId: data.spotifyId,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };

  // write the subscriber to the database
  dynamoDb.put(params, error => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't create the campaign subscriber."));
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item)
    };
    callback(null, response);
  });
};
