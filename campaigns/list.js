"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const params = {
  TableName: process.env.CAMPAIGNS_TABLE
};

module.exports.list = (event, context, callback) => {
  // fetch all campaigns from the database
  dynamoDb.scan(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't fetch campaigns."));
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result.Items)
    };
    callback(null, response);
  });
};
