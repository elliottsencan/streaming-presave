"use strict";
const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const uuid = require("uuid");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);
  if (
    typeof data.refreshToken !== "string" ||
    typeof data.artistId !== "string" ||
    typeof data.artistName !== "string"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't create campaign."));
    return;
  }

  const params = {
    TableName: process.env.CAMPAIGNS_TABLE,
    Item: {
      campaignId: uuid.v1(),
      refreshToken : data.refreshToken,
      artistId: data.artistId,
      artistName: data.artistName,
      callback: data.callback,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };

  // write the campaign to the database
  dynamoDb.put(params, error => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't create the campaign item."));
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
