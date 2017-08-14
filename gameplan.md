authorize from spotify
create campaign
-- campaign id (refresh token)
-- artist id
-- completed (false)
-- release date key (normalized to beginning of day in milliseconds)
triggers new entry in releaseDate table
-- release date key (normalized to beginning of day in milliseconds) and campaign id
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
