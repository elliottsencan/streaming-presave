"use strict";

const request = require("request");
const Promise = require("bluebird");
const $post = Promise.promisify(request.post);

module.exports.callback = (event, context, callback) => {

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: event.pathParameters.code,
      redirect_uri: process.env.SPOTIFY_CLIENT_CALLBACK,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
    },
    json: true
  };

  $post(authOptions).then((data) => {
    console.log(data);
    const response = {
      statusCode: 200,
      body: JSON.stringify(data.body)
    };

    callback(null, response);
  });
};
