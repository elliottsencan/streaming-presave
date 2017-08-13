"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const moment = require("moment");
var request = require("request");
var querystring = require("querystring");
const dynamoDb = new AWS.DynamoDB.DocumentClient();



module.exports.release = (event, context, callback) => {
  const querySelector = moment().isUtc()
    ? moment().startOf("day").valueOf()
    : moment.utc().startOf("day").valueOf();
  console.log("query selector ", querySelector);
  const params = {
    TableName: process.env.RELEASES_TABLE,
    KeyConditionExpression: "#releaseId = :querySelector",
    ExpressionAttributeNames: {
      "#releaseId": "releaseId"
    },
    ExpressionAttributeValues: {
      ":querySelector": querySelector
    }
  };

  // fetch current releases from the database
  dynamoDb.query(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error("Couldn't fetch release."));
      return;
    }

    result.Items.forEach(function(item) {
      const params = {
        TableName: process.env.CAMPAIGNS_TABLE,
        KeyConditionExpression: "#campaignId = :campaignId",
        ExpressionAttributeNames: {
          "#campaignId": "campaignId"
        },
        ExpressionAttributeValues: {
          ":campaignId": item.campaignId
        }
      };
      dynamoDb.query(params, (error, result) => {
        // handle potential errors
        if (error) {
          console.error(error);
          callback(new Error("Couldn't fetch campaign."));
          return;
        }
        console.log("fetched campaign records ", JSON.stringify(result));

        result.Items.forEach(function(item) {
          // requesting access token from refresh token
          var refresh_token = item.campaignId;
          console.log('client id ', process.env.SPOTIFY_CLIENT_ID);
          console.log('client secret ', process.env.SPOTIFY_CLIENT_SECRET);
          console.log(JSON.stringify(item));
          var authOptions = {
            url: "https://accounts.spotify.com/api/token",
            headers: {
              Authorization:
                "Basic " +
                new Buffer( process.env.SPOTIFY_CLIENT_ID + ":" +  process.env.SPOTIFY_CLIENT_SECRET).toString("base64")
            },
            form: {
              grant_type: "refresh_token",
              refresh_token: refresh_token
            },
            json: true
          };

          console.log('fetching access token');

          request.post(authOptions, function(error, response, body) {
            // console.log('error ', error);
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
        })
      });
    });
  });
};
