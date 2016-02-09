#!/usr/bin/nodejs

"use strict";

var jsforce = require('jsforce');
var fs = require('fs');
//var _ = require('underscore');

var conn = new jsforce.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
  //loginUrl : 'https://na34.salesforce.com'
});
conn.login('rowanxmas@gmail.com', '111qqqSSS8wDvDVUSsCXWJfMViL5cSgVKx', function(err, res) {
    if (err) { return console.error(err); }
    // Now you can get the access token and instance URL information.
    // Save them to establish connection next time.
    // console.log('access token: '+conn.accessToken);
    // console.log('instanceUrl: '+conn.instanceUrl);
    // // logged in user property
    // console.log("User ID: " + res.id);
    // console.log("Org ID: " + res.organizationId);
    // ...

    //getReports();
    //evalMetaData('00O61000002qafS');
    evalReport('00O61000002qafS');

});

function evalReport (reportId) {
    // execute report synchronously with details option,
    // to get detail rows in execution result.
    var report = conn.analytics.report(reportId);
    report.execute({ details: true }, function(err, report) {
        if (err) {
            return console.error(err);
        }
        var groupingsDown = report.groupingsDown.groupings;
        var answer = evalGrouping(groupingsDown, report.attributes.reportId.replace(" ", ""), report, 0, []);
        console.log(answer);
        saveOutput("answers.json", JSON.stringify(answer));
    });
}

function evalGrouping (parentGroup, parentPath, report, level, answer) {

    for (var i = 0; i < parentGroup.length; i++) {

        // eval this group
        var group = parentGroup[i];
        var path = parentPath+'.'+nonNullValue(group.value).replace(" ", "");
        answer.push(evalData(group, path, report, level));

        // eval child groupings
        var childGroup = group.groupings;
        evalGrouping(childGroup, path, report, level+1, answer);
    }
    return answer;
}

function evalData (group, path, report, level) {
    console.log('path: '+path+' key: '+group.key+' label: '+group.label+' value: '+group.value+' level: '+level);

    var keyT = group.key+'!T';
    var data = report.factMap[keyT];
    var groupingColumnInfo =  groupingColumnInfoForLevel(level, report);


    var store = {};

    store.data = data;
    store.path = path;
    store.label = group.label;
    store.value = group.value;
    store.groupingColumnInfo = groupingColumnInfo;
    if (data.rows.length > 0) {
        store.detailColumnInfo = report.reportExtendedMetadata.detailColumnInfo;
    }

    saveOutput('store.json', JSON.stringify(store), path);

    var answer = {};
    answer['title'] = path;
    answer['details'] = 'Found '+data.rows.length + ' objects.';
    answer['path'] = path;
    answer['guid'] = '0';

    return answer;
}

function groupingColumnInfoForLevel (level, report) {
    var groupingColumnInfo = report.reportExtendedMetadata.groupingColumnInfo;
    for(var key in groupingColumnInfo) {
        if (groupingColumnInfo[key].groupingLevel === level) {
            return groupingColumnInfo[key];
        }
    }
}

function nonNullValue (value) {
    if (value == null) {
        value = "Other";
    }
    return value;
}

function evalMetaData (reportId) {
    conn.analytics.report(reportId).describe(function(err, meta) {
        if (err) { return console.error(err); }
        console.log(JSON.stringify(meta.reportMetadata, null, 4));
        console.log(JSON.stringify(meta.reportTypeMetadata, null, 4));
        console.log(JSON.stringify(meta.reportExtendedMetadata, null, 4));
    });
}




function getReports() {
    conn.analytics.reports(function(err, reports) {
        if (err) { return console.error(err); }

        console.log("reports length: "+reports.length);

        var lines = [];
        for (var i=0; i < reports.length; i++) {
            console.log(reports[i].id);
            console.log(reports[i].name);
            var line = [reports[i].id, reports[i].name];
            lines.push(line);
        }
        saveOutput("out.json", JSON.stringify(lines));

        var answer = {};
        answer['title'] = 'Report List';
        answer['details'] = 'Found '+lines.length + ' reports.';
        answer['path'] = 'reportList';
        answer['guid'] = '0';
        saveOutput("answer.json", JSON.stringify(answer));
    });


}



function saveOutput (filename, output, dir) {


    if (dir && !fs.existsSync(dir)){
        fs.mkdirSync(dir);
        filename = dir+'/'+filename;
    }

    fs.writeFile(filename, output, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}
