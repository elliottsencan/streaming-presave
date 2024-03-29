authorize from spotify
create campaign
-- campaignId
-- refreshToken
-- artistId
-- createdAt
-- updatedAt
triggers create releaseData record

create releaseData
-- campaignId
-- refreshToken
-- releases
-- uris (csv);

subscribers added through api
-- campaign id
-- refresh token
-- email
-- playlist id
-- artist id
-- email
triggers subscriber email push to mailchimp

cron job
-- query all campaigns
-- refresh spotify token
-- fetch albums from spotify, store in ArtistsReleasesByCampaign
-- if fetched album count is larger then stored count, update count, push to queue

update queue
- subscriber refresh token
- playlistid
- spotify song uris
- campaign id

on insert
get access token


create campaign
-- campaign id (refresh token)
-- artist id
-- subscribers list
-- completed
-- release date key (mmddyyyy)
triggers new entry in releaseDate table
-- release date key (mmddyyyy) and campaign id
subscribers added through api
  -- refresh access token with refresh token
  -- playlist id
  -- email
  ---- push email to mailchimp
cron job
-- BatchGetItem(date key)
-- for each
   -- select campaign id record from campaign table
   -- refresh token
   -- fetch most recent album from Spotify
   -- insert new update queue record for each subscriber
      -- refresh access token with refresh token
      -- push most recent album to playlist using *subscriber* access token


lambdas
-- create campaign by refreshid and data
-- update campaign by refreshid and data
-- delete campaign by refreshid and data
-- fetch campaign by refreshid
[x] -- add subscriber to campaign
-- add subscriber to mailchimp
-- release cron job (has to be one function)

triggers
-- create releaseDates on campaign table record insert


update queue
- subscriber refresh token
- playlistid
- spotify song uris
- campaign id
- completed

on insert
get access token

sample api requests

create campaign



curl -X POST https://jd5p2c5j3l.execute-api.us-east-1.amazonaws.com/dev/campaigns --data '{ "refreshToken" :
curl -X POST https://wz4byxcjy3.execute-api.us-east-1.amazonaws.com/dev/campaigns --data '{ "refreshToken" : "AQCzCkSGsXBxgqW4mSjNU9B9CO9GjUoLb0bD55hJbKSOUdm_sdfCo1_YayP5LoI_tCKDrXXC20nlY3gNSs7Nw5u8dqMX9E5A1jgVggOQmFWgK8xotCLxByBmVTvUTNKD3H0", "artistId": "6ldZGvFDjs6KafLouTBHJ9"}'


curl -X POST https://api.fanpresave.com/dev/campaigns --data '{ "refreshToken" : "AQCzCkSGsXBxgqW4mSjNU9B9CO9GjUoLb0bD55hJbKSOUdm_sdfCo1_YayP5LoI_tCKDrXXC20nlY3gNSs7Nw5u8dqMX9E5A1jgVggOQmFWgK8xotCLxByBmVTvUTNKD3H0", "artistId": "6ldZGvFDjs6KafLouTBHJ9", "artistName" : "Hollywood Principle", "callback" : "http://hollywoodprinciple.com/"}'

curl -X PUT https://api.fanpresave.com/dev/campaigns/277eace0-9a94-11e7-b0a9-5b8c9193bfbe --data '{"artistId":"0cm4IOBfqQGuzI0LzyL1yX", "artistName": "Broken Stems", "callback": "http://brokenstems.com/welcome.html"}'

create subscriber

curl -X POST https://wz4byxcjy3.execute-api.us-east-1.amazonaws.com/dev/subscribers --data '{ "campaignId" : "ebf7c070-99cc-11e7-92c5-13966effe53b", "refreshToken" : "AQBcMrs217cSNZKhFhjJ1C7G8yvFeUK0G1ufPE1oO-d-WTvFr8k3-LT4NoeQTLPc8beWnZlwzaJGVGFxZB3vF6WNXKe_7lGODBoOdUB1p9Us8blu2t9YGaHYtM93OyFTQus", "playlistId": "6S3ef71UbM9Uvsmz8bfDdt", "email" : "hollywoodprinciple@gmail.com", "spotifyId" : "hollywoodprinciple"}'

jQuery.post({url: 'http://www.fanpresave.com/api/subscribers', data: { "campaignId" : "ebf7c070-99cc-11e7-92c5-13966effe53b", "refreshToken" : "AQBcMrs217cSNZKhFhjJ1C7G8yvFeUK0G1ufPE1oO-d-WTvFr8k3-LT4NoeQTLPc8beWnZlwzaJGVGFxZB3vF6WNXKe_7lGODBoOdUB1p9Us8blu2t9YGaHYtM93OyFTQus", "playlistId": "6S3ef71UbM9Uvsmz8bfDdt", "email" : "hollywoodprinciple@gmail.com", "spotifyId" : "hollywoodprinciple"}}).then(function(response){console.log(response)})

delete campaign
curl -X DELETE https://jd5p2c5j3l.execute-api.us-east-1.amazonaws.com/dev/campaigns/73043ff0-856c-11e7-b962-3f86dcc2d005

curl -X POST https://www.fanpresave.com/api/campaigns --data '{ "artistId" : "0cm4IOBfqQGuzI0LzyL1yX", "refreshToken" : "AQCLwSnCkvD1kKahExk20aRzUzDIxBFvtV-GWZcMkILz0KfJQL-aDFF-5Rxpy11xPf7-RlqlH5-YMjNmz_SCEkdFve8abCSg82DbZbnx3ox-7gGKokZqrn2Aq9h7Nd6_dvo"}'

typeof data.refreshToken === "undefined" ||
typeof data.artistId === "undefined" ||
typeof data.artistName === "undefined" ||
typeof data.callback === "undefined"

[
{
"callback": "https://www.hollywoodprinciple.com/",
"updatedAt": 1505706829150,
"createdAt": 1505449106935,
"refreshToken": "AQCzCkSGsXBxgqW4mSjNU9B9CO9GjUoLb0bD55hJbKSOUdm_sdfCo1_YayP5LoI_tCKDrXXC20nlY3gNSs7Nw5u8dqMX9E5A1jgVggOQmFWgK8xotCLxByBmVTvUTNKD3H0",
"campaignId": "ebf7c070-99cc-11e7-92c5-13966effe53b",
"artistName": "Hollywood Principle",
"artistId": "6ldZGvFDjs6KafLouTBHJ9"
},
{
"callback": "http://brokenstems.com/welcome.html",
"updatedAt": 1505877717830,
"createdAt": 1505534676653,
"refreshToken": "AQCLwSnCkvD1kKahExk20aRzUzDIxBFvtV-GWZcMkILz0KfJQL-aDFF-5Rxpy11xPf7-RlqlH5-YMjNmz_SCEkdFve8abCSg82DbZbnx3ox-7gGKokZqrn2Aq9h7Nd6_dvo",
"campaignId": "277eace0-9a94-11e7-b0a9-5b8c9193bfbe",
"artistName": "Broken Stems",
"artistId": "0cm4IOBfqQGuzI0LzyL1yX"
}
]