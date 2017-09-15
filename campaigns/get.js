"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = (event, context, callback) => {
  const params = {
    TableName: process.env.CAMPAIGNS_TABLE,
    Key: {
      campaignId: event.pathParameters.campaignId
    }
  };

  // fetch campaign from the database
  dynamoDb.get(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't fetch the campaign."));
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
      body: JSON.stringify(result.Item)
    };
    callback(null, response);
  });
};
