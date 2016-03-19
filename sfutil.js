"use strict";

// declare public exports
module.exports = {
  getSFConnection: getSFConnection
}

var jsforce = require('jsforce');
var fs = require('fs');
var _ = require('underscore');
var pgutil = require('./pgutil.js');


function getSFConnection (access) {

    //console.log('new connection with access: '+JSON.stringify(access));

    // sometimes I just use "node" rather than "heroku" to run tests
    // the dotenv imports the .env file as though we were using heroku
    if (typeof(process.env.SFORCE_CLIENT_ID) === 'undefined') {
        require('dotenv').config();
    }

    var conn = new jsforce.Connection({
      oauth2 : {
        clientId : process.env.SFORCE_CLIENT_ID,
        clientSecret : process.env.SFORCE_SECRET,
        redirectUri : process.env.SFORCE_CALLBACK
      },
        instanceUrl : access.instanceurl,
        accessToken : access.access_token,
        refreshToken : access.refresh_token
    });
    conn.on("refresh", function(accessToken, res) {
        console.log('[OAUTH REFRESHED]');
        access.access_token = accessToken;
        pgutil.upsertAccess(access);
    });

    return conn;
}

function upsertInsights (insights) {

    conn.bulk.load("Insight__c", "upsert", {extIdField: "Path__c"}, insights, function(err, rets) {
      if (err) { return console.error(err); }
      for (var i=0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log("#" + (i+1) + " loaded successfully, id = " + rets[i].id);
        } else {
          console.log("#" + (i+1) + " error occurred, message = " + rets[i].errors.join(', '));
        }
      }
      // ...
    });


}
