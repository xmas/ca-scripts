"use strict";

var pgutil = require('./pgutil.js');
var report = require('./report.js');
var sfutil = require('./sfutil.js');
var s3 = require('./s3.js');

if (typeof(process.env.SFORCE_CLIENT_ID) === 'undefined') {
    require('dotenv').config();
}

pgutil.orgAccessList(function(results) {
    var orgs = results.rows;

    for (var i = 0; i < orgs.length; i++) {
        var access = orgs[i];
        console.log('get connection to org: '+access.orgid);
        var conn = sfutil.getSFConnection(access);

conn.query("SELECT Id, Name FROM Contact", function(err, result) {
    if (err) { return console.error(err); }
    for (var contacts_i = 0; contacts_i < result.records.length; contacts_i++) {
        contacts.push(result.records[contacts_i].Id);
    }
