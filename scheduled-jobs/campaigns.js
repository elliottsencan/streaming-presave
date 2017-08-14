"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const moment = require("moment");
var request = require("request");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.query = (event, context, callback) => {
  const releaseDate = moment().isUtc()
    ? moment().startOf("day").valueOf()
    : moment.utc().startOf("day").valueOf();

  const params = {
    TableName: process.env.CAMPAIGNS_TABLE,
    KeyConditionExpression: "#releaseDate = :releaseDate",
    ExpressionAttributeNames: {
      "#releaseDate": "releaseDate"
    },
    ExpressionAttributeValues: {
      ":releaseDate": releaseDate
    }
  };

  dynamoDb.scan(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't fetch campaign."));
      return;
    }
    console.log("fetched campaign records ", JSON.stringify(result));

    result.Items.forEach(function(item) {
      // requesting access token from refresh token
      var refreshToken = item.refreshToken;
      console.log("iitem ", JSON.stringify(item));
      var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
          Authorization:
            "Basic " +
            new Buffer(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64")
        },
        form: {
          grant_type: "refresh_token",
          refresh_token: refreshToken
        },
        json: true
      };

      console.log("fetching access token");

      request.post(authOptions, function(error, response, body) {
        console.log(JSON.stringify(body));
        if (!error && response.statusCode === 200) {
          // console.log(body.access_token);
        }

        const resp = {
          statusCode: 200
          // body: JSON.stringify(result.Item),
        };
        callback(null, resp);
      });
    });
  });
};
