"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const uuid = require("uuid");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  console.log(event.body);
  const data = JSON.parse(event.body);

  // validation
  if (
    typeof data.refreshToken === "undefined" ||
    typeof data.campaignId === "undefined" ||
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
      spotifyId: data.spotifyId,
      createdAt: timestamp,
      updatedAt: timestamp,
      //optional
      playlistId: data.playlistId || null,
      email: data.email || null
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
      headers: {
        "X-Requested-With": '*',
        "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": 'POST,GET,OPTIONS'
      },
      body: JSON.stringify(params.Item)
    };
    callback(null, response);
  });
};
