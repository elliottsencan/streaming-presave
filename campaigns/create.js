"use strict";
const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);
  const releaseFormat = "MMDDYY";
  const releaseDate = data.releaseDate;
  if (
    typeof data.campaignId !== "string" ||
    typeof data.artistId !== "string" ||
    typeof releaseDate === "undefined"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't create campaign."));
    return;
  }

  const params = {
    TableName: process.env.CAMPAIGNS_TABLE,
    Item: {
      campaignId: data.campaignId,
      artistId: data.artistId,
      releaseDate: releaseDate,
      completed: false,
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
      body: JSON.stringify(params.Item)
    };
    callback(null, response);
  });
};
