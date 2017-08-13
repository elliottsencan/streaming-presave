"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);
  if (
    typeof data.campaignId === "undefined"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't update release."));
    return;
  }

  const params = {
    TableName: process.env.RELEASES_TABLE,
    Key: {
      releaseId: event.pathParameters.releaseId
    },
    ExpressionAttributeValues: {
      ":campaignId": data.campaignId,
      ":updatedAt": timestamp
    },
    UpdateExpression:
      "SET releaseDate = :releaseDate, campaignId = :campaignId, updatedAt = :updatedAt",
    ReturnValues: "ALL_NEW"
  };

  // update the release in the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't update release."));
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
