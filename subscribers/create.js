"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // validation
  if (
    typeof data.subscribers === "undefined"
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
      ':subscribers': [data.subscribers],
      ":updatedAt": timestamp
    },
    UpdateExpression:
      "SET subscribers = list_append(subscribers, :subscribers), updatedAt = :updatedAt",
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
