"use strict";
const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const moment = require("moment");
const uuid = require("uuid");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);
  const releaseDate = moment().isUtc()
    ? moment(data.releaseDate).startOf("day").valueOf()
    : moment.utc(data.releaseDate).startOf("day").valueOf();
  if (
    typeof data.refreshToken !== "string" ||
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
      campaignId: uuid.v1(),
      refreshToken : data.refreshToken,
      artistId: data.artistId,
      releaseDate: releaseDate,
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
