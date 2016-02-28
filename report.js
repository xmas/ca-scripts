#!/usr/bin/nodejs

"use strict";

var jsforce = require('jsforce');
var fs = require('fs');
var _ = require('underscore');
var sleep = require('sleep');

var reports = [];

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

    getReports();
    //evalMetaData('00O61000002qafS');
    //evalReport('00O61000003gDUyEAM');




});

function evalReport (reportId) {
    // execute report synchronously with details option,
    // to get detail rows in execution result.
    var report = conn.analytics.report(reportId);
    report.execute({ details: true }, function(err, report) {
        if (err) {
            return console.error(err);
        }
        saveOutput("full.json", JSON.stringify(report));
        var headers = createColumnHeaders(report);
        report.headers = headers;
        var groupingsDown = report.groupingsDown.groupings;
        var path = [];
        var path_node = {
            label : report.attributes.label,
            value : report.attributes.reportId.replace(" ", "")
        };
        path.push(path_node);
        var insights = evalGrouping(groupingsDown, path, report, 0, []);
        //console.log(insights);
        //saveOutput("insights.json", JSON.stringify(insights));

        createInsights(insights);
    });
}

function createInsights (insights) {

    conn.bulk.load("Insight__c", "insert", insights, function(err, rets) {
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


function evalGrouping (parentGroup, path, report, level, insights) {

    for (var i = 0; i < parentGroup.length; i++) {

        // eval this group
        var group = parentGroup[i];
        var clone_path = _.clone(path);
        console.log('going to nonNullValue: '+group.value );
        var path_node = {
            label : group.label,
            value : nonNullValue(group.value).replace(" ", "")
        };
        clone_path.push(path_node);

        var insight = evalData(group, clone_path, report, level);
        if (insight != null) {
            insights.push(insight);
        }

        // eval child groupings
        var childGroup = group.groupings;
        evalGrouping(childGroup, clone_path, report, level+1, insights);
    }
    return insights;
}

function evalData (group, path, report, level) {
    console.log('path: '+arrayFromKey(path, "value").join(".")+' key: '+group.key+' label: '+group.label+' value: '+group.value+' level: '+level);

    var keyT = group.key+'!T';
    var data = report.factMap[keyT];
    var count = data.rows.length;
    if (count === 0) {
        return;
    }

    //
    // var store = {};
    //
    // store.data = data;
    // store.path = path;
    // store.label = group.label;
    // store.value = group.value;
    // store.groupingColumnInfo = groupingColumnInfo;
    // if (data.rows.length <= 0) {
    //     return;
    // }
    // store.detailColumnInfo = report.reportExtendedMetadata.detailColumnInfo;
    // console.log(table);
    // saveOutput('store.json', JSON.stringify(store), path.join("."));

    // var answer = {};
    // answer['title'] = path.join(".");
    // answer['details'] = 'Found '+data.rows.length + ' objects.';
    // answer['path'] = path.join(".");
    // answer['guid'] = '0';
    //
    // return answer;
    var insight = {};

    insight.Data_Source__c = report.attributes.reportName;
    insight.ReportID__c = report.attributes.reportId;

    var groupInfo =  groupingColumnInfoForLevel(level, report);
    insight.Long_Name__c = report.reportMetadata.reportType.label+' found ('+ count +') today that match:';
    insight.Name = report.reportMetadata.reportType.label+' from '+ arrayFromKey(path, "label").join(" : ");

    var table = buildTable(report.headers, data.rows);
    insight.Table_Data__c = table;

    insight.Details__c = count+' '+report.reportMetadata.reportType.label+' found.';
    insight.Report_Type_Label__c = report.reportMetadata.reportType.label;
    insight.Path__c = arrayFromKey(path, "value").join(".");

    // create the parents list
    insight.Parents__c = '';
    if (path.length > 1) {
        // TODO: consider moving the ul tag to the component
        var parents = '<ul class="slds-list--horizontal slds-has-dividers--right slds-has-inline-block-links">';

        for (var i = 1; i < path.length; i++) {
            var groupingColumnInfo =  groupingColumnInfoForLevel(i -1, report);
            console.log(JSON.stringify(groupingColumnInfo));
            var node = path[i];
            var dataType = groupingColumnInfo.dataType;
            var node_li = '<span style="font-weight:700">'+groupingColumnInfo.label+': </span>';
            if (node.value != null && dataType === "string") {
                var myRe = /(\d\d\d\d\d)/;
                var myArray = myRe.exec(node.value);
                console.log(node.value);

                if (myArray!= null && myArray.length > 0) {
                    node_li = node_li + '<a href="https://rowan-dev-ed.my.salesforce.com/'+node.value+'">'+node.label+'</a>';
                    insight = setAssocForLevel(node.value, node.label, i, insight);
                }
            } else {
                node_li = node_li +node.label
            }
        parents = parents + '<li class="slds-list__item" >'+node_li+'</li>';
        }
        parents = parents + '</ul>';
        insight.Parents__c = parents;
    }

    return insight;
}

function setAssocForLevel (assoc_id, assoc_label, level, insight) {
    if (level === 1) {
        insight.AssocID__c = assoc_id;
        insight.AssocLabel__c = assoc_label;
    } else if (level === 2) {
        insight.Assoc2ID__c = assoc_id;
        insight.AssocLabel2__c = assoc_label;
    } else if (level === 3) {
        insight.Assoc3ID__c = assoc_id;
        insight.AssocLabel3__c = assoc_label;
    }

    return insight;
}


function buildTable (headers, rows) {

    if (rows.length != 0 && headers.length != rows[0].dataCells.length) {
        console.log("ERROR mismatch in lengths: "+headers+ " --- "+ rows[0].dataCells);
        return;
    }

    var html = '<div class="slds"><table class="slds-table slds-table--bordered"><thead> <tr class="slds-text-heading--label">';

    for (var i = 0; i < headers.length; i++) {
        var header = headers[i];
        html = html + '<th scope="col"><span class="slds-truncate">';
        html = html + header;
        html = html + '</span></th>';
    }
    html = html + '  </thead><tbody>';

    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].dataCells;
        html = html + '<tr class="slds-hint-parent">';
        for (var cell_i = 0; cell_i < cells.length; cell_i++) {
            var cell = cells[cell_i];
            var head = headers[cell_i];

            html = html + '<td data-label="'+head+'">';
            html = html + '<span class="slds-truncate">'+cell.label+'</span></td>';

            //console.log('col: '+head+' label: '+cell.label+' value:'+cell.value);
        }
    }

    html = html + '</tbody></table></div>';

    return html;
}

function arrayFromKey (array, key) {
    var new_array = [];
    for (var i = 0; i < array.length; i++) {
        new_array.push(array[i][key]);
    }
    return new_array;
}

function groupingColumnInfoForLevel (level, report) {
    var groupingColumnInfo = report.reportExtendedMetadata.groupingColumnInfo;
    for(var key in groupingColumnInfo) {
        if (groupingColumnInfo[key].groupingLevel === level) {
            return groupingColumnInfo[key];
        }
    }
}

function createColumnHeaders (report) {
    // create the array of column headers
    var detailColumns = report.reportMetadata.detailColumns;
    var detailColumnInfo = report.reportExtendedMetadata.detailColumnInfo;

    var columns = [];
    for (var i = 0; i < detailColumns.length; i++) {
        var detailColumn = detailColumns[i];
        var info = detailColumnInfo[detailColumn];

        columns.push(info.label);
    }
    return columns;
}


function nonNullValue (value) {
    if ( _.isNull(value)) {
        console.log('need to repalce a null value of: '+value)
        var thing = "Other";
        return thing;
    }

    if (!_.isString(value)) {
        return JSON.stringify(value);
    }
    //console.log(value);
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
        for (var i=0; i < 18; i++) {
            // console.log(reports[i].id);
            // console.log(reports[i].name);
            // var line = [reports[i].id, reports[i].name];
            //lines.push(reports[i].id);
            evalReport(reports[i].id);
            // if ( i % 5) {
            //     suspend();
            // }
        }
        //saveOutput("out.json", JSON.stringify(lines));


        // var answer = {};
        // answer['title'] = 'Report List';
        // answer['details'] = 'Found '+lines.length + ' reports.';
        // answer['path'] = 'reportList';
        // answer['guid'] = '0';
        // saveOutput("answer.json", JSON.stringify(answer));
    });


}

function suspend() {
    sleep.sleep(30000);
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
