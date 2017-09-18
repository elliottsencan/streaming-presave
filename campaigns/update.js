"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);
  
  // validation
  if (
    typeof data.artistId === "undefined" ||
    typeof data.artistName === "undefined" ||
    typeof data.callback === "undefined"
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
      ":artistName": data.artistName,
      ":callback": data.callback,
      ":artistId": data.artistId,
      ":updatedAt": timestamp
    },
    UpdateExpression:
      "SET artistId = :artistId, updatedAt = :updatedAt, artistName = :artistName, callback = :callback",
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
      headers: {
        "X-Requested-With": '*',
        "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": 'POST,GET,OPTIONS'
      },
      body: JSON.stringify(result.Attributes)
    };
    callback(null, response);
  });
};
