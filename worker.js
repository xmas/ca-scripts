"use strict";

var pgutil = require('./pgutil.js');
var report = require('./report.js');
var sfutil = require('./sfutil.js');

if (typeof(process.env.SFORCE_CLIENT_ID) === 'undefined') {
    require('dotenv').config();
}

pgutil.orgAccessList(function(results) {
    var orgs = results.rows;

    for (var i = 0; i < orgs.length; i++) {
        var access = orgs[i];
        console.log('get connection to org: '+access.orgid);
        var conn = sfutil.getSFConnection(access);
        //report.evalReport('00O61000003tJVN', conn);
        report.evalReportFolder(conn);

    }

});
