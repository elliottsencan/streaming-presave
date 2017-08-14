"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // validation
  if (
    typeof data.subscriberId === "undefined" ||
    typeof data.campaignId === "undefined" ||
    typeof data.playlistId === "undefined" ||
    typeof data.email === "undefined"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't update subscriber."));
    return;
  }

  const params = {
    TableName: process.env.SUBSCRIBERS_TABLE,
    Item: {
      subscriberId: data.subscriberId,
      campaignId: data.campaignId,
      playlistId: data.playlistId,
      email: email,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };

  // update the campaign in the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't update the subscriber."));
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
    callback(null, response);
  });
};
