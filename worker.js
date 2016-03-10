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
        //report.evalReport('00O61000003tJVN', conn);
        //report.evalReportFolder(conn);
        s3.ensureBucket(access.orgid, function() {

            report.evalReportFolder('Current Actions', access, conn, function (result) {
                 console.log('in worker.js we evalled a folder');
                 console.log(result);
             });
        


            // console.log('eval report 00O61000003tJVN');
            // report.evalReport('00O61000003tJVN', null, conn, function (result) {
            //     console.log('in worker.js we evalled a report');
            //     console.log(result);
            // });

        });
    }

});

// var up = {thing: 'test'};
// s3.uploadObject('00d61000000adm6eai', 'test', JSON.stringify(up), function(res) {
//     console.log(res);
// })
