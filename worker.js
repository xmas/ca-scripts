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
        console.log(access);
        if (access.orgid === '00D61000000adM6EAI') {

            console.log('get connection to org: '+access.orgid);
            var conn = sfutil.getSFConnection(access);

            s3.ensureBucket(access.orgid, function() {

                // report.evalReportFolder('Current Actions', access, conn, function (results) {
                //     console.log('back in workder.js, and we have tons of insights now: '+results.length);
                //     for (var r = 0; r < results.length; r++) {
                //         console.log('result: '+results[r].Name);
                //     }
                //     // sfutil.upsertInsights(conn, results, function (res) {
                //     //     console.log('back in worker js: '+res);
                //     // });
                // });

                report.evalReport('00O61000003tTFS', access, conn, function (results) {
                    console.log('back in and upserting insights for the single report: '+results.length);
                    for (var r = 0; r < results.length; r++) {
                        console.log('result: '+results[r].Name);
                    }
                    sfutil.upsertInsights(conn, results, function (res) {
                        console.log('back in worker js: '+res);
                    });
                });



            });
        }

    }

});

// var up = {thing: 'test'};
// s3.uploadObject('00d61000000adm6eai', 'test', JSON.stringify(up), function(res) {
//     console.log(res);
// })
