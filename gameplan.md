authorize from spotify
create campaign
-- campaign id (refresh token)
-- artist id
-- release date key (normalized to beginning of day in milliseconds)
subscribers added through api
-- refresh token
-- playlist id
-- email
triggers subscriber email push to mailchimp

cron job
-- query all release records by beginning of day
-- get all matching campaigns
-- refresh spotify token
-- grab most recent album

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

curl -X POST https://uga2hb00rc.execute-api.us-east-1.amazonaws.com/dev/campaigns --data '{ "refreshToken" : "AQCzCkSGsXBxgqW4mSjNU9B9CO9GjUoLb0bD55hJbKSOUdm_sdfCo1_YayP5LoI_tCKDrXXC20nlY3gNSs7Nw5u8dqMX9E5A1jgVggOQmFWgK8xotCLxByBmVTvUTNKD3H0", "artistId": "hollywoodprinciple", "releaseDate" : 1502675792993}'

create subscriber

curl -X POST https://uga2hb00rc.execute-api.us-east-1.amazonaws.com/dev/subscribers --data '{ "campaignId" : "bacc2440-8096-11e7-a762-dfedfc045996", "refreshToken" : "AQCzCkSGsXBxgqW4mSjNU9B9CO9GjUoLb0bD55hJbKSOUdm_sdfCo1_YayP5LoI_tCKDrXXC20nlY3gNSs7Nw5u8dqMX9E5A1jgVggOQmFWgK8xotCLxByBmVTvUTNKD3H0", "playlistId": "6sM5NRcuAVVLyVWXbEFG40", "email" : "elliott.sencan-11@sandiego.edu"}'
