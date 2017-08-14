"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const moment = require("moment");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);
  const releaseDate = moment().isUtc()
    ? moment(data.releaseDate).startOf("day").valueOf()
    : moment.utc(data.releaseDate).startOf("day").valueOf();

  // validation
  if (
    typeof releaseDate === "undefined" ||
    typeof artistId === "undefined"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't update the campaign."));
    return;
  }

  const params = {
    TableName: process.env.CAMPAIGNS_TABLE,
    Key: {
      campaignId: event.pathParameters.campaignId
    },
    ExpressionAttributeValues: {
      ":releaseDate": releaseDate,
      ":artistId": artistId,
      ":updatedAt": timestamp
    },
    UpdateExpression:
      "SET releaseDate = :releaseDate, artistId = :artistId, updatedAt = :updatedAt",
    ReturnValues: "ALL_NEW"
  };

  // update the campaign in the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't update the campaign."));
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
