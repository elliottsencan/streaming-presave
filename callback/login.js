"use strict";
module.exports.login = (event, context, callback) => {
  const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';
  const url = 'https://accounts.spotify.com/authorize?client_id=' + process.env.SPOTIFY_CLIENT_ID +
  '&response_type=code&redirect_uri=' + process.env.SPOTIFY_CLIENT_CALLBACK +
  '&scope=user-read-private%20user-read-email%20user-follow-modify%20user-library-modify%20playlist-modify-public%20playlist-modify-private&state=' + event.pathParameters.campaignId;
    const response = {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: url
    };

    callback(null, response);
};
