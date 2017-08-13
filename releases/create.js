"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-
const moment = require("moment");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  event.Records.forEach(function(record) {
    const timestamp = new Date().getTime();
    const parsedReleaseDate = parseInt(record.dynamodb.NewImage.releaseDate.N, 10);
    const releaseId = moment(parsedReleaseDate).startOf('day').valueOf();
    const campaignId = record.dynamodb.NewImage.campaignId.S;
    if (typeof releaseId === "undefined" || typeof campaignId === "undefined") {
      console.error("Validation Failed");
      callback(new Error("Couldn't create release."));
      return;
    }

    const params = {
      TableName: process.env.RELEASES_TABLE,
      Item: {
        releaseId: releaseId,
        campaignId: campaignId,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };

    // write the release to the database
    dynamoDb.put(params, error => {
      // handle potential errors
      if (error) {
        console.error(error);
        callback(new Error("Couldn't create the release."));
        return;
      }

      // create a response
      const response = {
        statusCode: 200,
        body: JSON.stringify(params.Item)
      };
      callback(null, response);
    });
  });
};
