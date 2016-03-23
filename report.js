"use strict";

// declare public exports
module.exports = {
  evalReportFolder: evalReportFolder,
  evalReport: evalReport
}

var sfutil = require('./sfutil.js');
var jsforce = require('jsforce');
var fs = require('fs');
var _ = require('underscore');
var s3 = require('./s3.js');
var diff = require('./diff.js');
var Promise = require("bluebird");

var conn = {};
var access = {};

function evalReportFolder (folderName, sfacess, sfconn, callback) {
    conn = sfconn;
    access = sfacess;
    folderName = _.isUndefined(folderName) ? 'Current Actions' : folderName;
    var total_insights = [];

    conn.query("SELECT Id, Name FROM Folder WHERE Name = '"+folderName+"'",
    function(err, result) {
        if (err) { return console.error(err); }
        var folderID = result.records[0].Id;
        conn.query("SELECT Id, Name, Description FROM Report WHERE Ownerid = '"+folderID+"' and Ownerid != null", function(err, result) {
            if (err) { return console.error(err); }

            var report_promises = [];
            for (var i = 0; i < result.records.length; i++) {
                var eval_report_promise = new Promise( function(resolve) {
                    evalReport(result.records[i].Id, access, conn, function (results) {
                        //console.log('in eval report, calling back with some this many datas: '+results.length+' prior total: '+total_insights.length);
                        total_insights = total_insights.concat(results);
                        //console.log('and the new total is: '+total_insights.length);
                        resolve();
                    });
                });
                report_promises.push(eval_report_promise);
            }

            Promise.all(report_promises).then (function () {
                //console.log('about to call back from eval folder with this many insights: '+total_insights.length);
                callback(total_insights);
            });
        });
    });
}

function evalReport (reportId, sfacesss, sfconn, callback) {
    conn = sfconn;
    access = sfacesss;
    var insights = [];

    // execute report synchronously with details option,
    // to get detail rows in execution result.
    console.log('reportId: '+reportId);
    var report = conn.analytics.report(reportId);
    report.execute({ details: true }, function(err, report) {
        if (err) {
            console.error('report exection error');
            return console.error(err);
        }
        //saveOutput("full.json", JSON.stringify(report));
        var headers = createColumnHeaders(report);
        report.headers = headers;
        var groupingsDown = report.groupingsDown.groupings;
        var path = [];
        var path_node = {
            label : report.attributes.reportName,
            value : report.attributes.reportId.replace(" ", "")
        };
        path.push(path_node);

        //console.log(JSON.stringify(report, null, 4));

        promiseGrouping(groupingsDown, path, report, 0, insights, function (data) {
            //console.log('in eval report, calling back with some this many datas: '+data.length);
            callback(data);
        });
        //console.log(insights);
        //saveOutput("insights.json", JSON.stringify(insights));

        //createInsights(insights);
    });
}

function createInsights (insights) {

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

function promiseGrouping (parentGroup, path, report, level, insights, callback) {

    if (parentGroup.length === 0) {
        callback(insights);
    }

    var eval_promises = [];
    for (var i = 0; i < parentGroup.length; i++) {

        // eval this group
        var group = parentGroup[i];
        var clone_path = _.clone(path);
        //console.log('going to nonNullValue: '+group.value );
        var path_node = {
            label : group.label,
            value : nonNullValue(group.value).replace(" ", "")
        };
        clone_path.push(path_node);

        var eval_data_promise = new Promise( function(resolve) {
            evalData(group, clone_path, report, level, function(insight) {
                if (insight != null) {
                    //console.log('PUSH to insights: '+insight.Name);
                    insights.push(insight);
                }
                resolve();
            });
        });
        eval_promises.push(eval_data_promise);


        // eval child groupings
        var childGroup = group.groupings;
        var group_promises = new Promise(function(resolve) {
            promiseGrouping(childGroup, clone_path, report, level+1, insights, function () {
                resolve();
            });
        });
        eval_promises.push(group_promises);
    }

    Promise.all(eval_promises).then(function() {
        callback(insights);
    });
}






function evalData (group, path, report, level, callback) {
    //console.log('EVAL DATA --- path: '+arrayFromKey(path, "value").join(".")+' key: '+group.key+' label: '+group.label+' value: '+group.value+' level: '+level);

    var keyT = group.key+'!T';
    var data = report.factMap[keyT];
    var count = data.rows.length;
    var store = {};

    store.data = data;
    store.path = path;
    store.label = group.label;
    store.value = group.value;

    var header_order = report.reportMetadata.detailColumns;
    var header_data = report.reportExtendedMetadata.detailColumnInfo;
    var headers = [];
    for (var header_index = 0; header_index < header_order.length; header_index++) {
        var header_key = header_order[header_index];
        //console.log('header key: '+header_key);
        headers.push(header_data[header_key]);
    }
    store.headers = headers;


    // now that we have our store, we can compare the the previous values

    // diff.calculateDiff(access.orgid, arrayFromKey(path, "value").join("/"), store);
    // console.log('BACK IN REPORTS');

    if ((data.rows.length <= 0) || (count === 0)) {
        // TODO: always return... use old data if we don't have new data? There is value in knowing that things have been removed.
        callback(); // If we miss a callback then bad things happen since the entire callback chain gets fudged
    } else {
        s3.getVersion(access.orgid.toString(), arrayFromKey(path, "value").join("/"), 2, function (data) {

            var delta = {};
            var counts = {};
            counts.new_count = 0;
            counts.deleted_count = 0;
            counts.changed_count = 0;
            if (data) {
                var prev = JSON.parse(data.toString());
                diff.evaldiff(store, prev, function (returned_delta, new_count, deleted_count, changed_count){
                    delta = returned_delta;
                    counts.new_count = new_count;
                    counts.deleted_count = deleted_count;
                    counts.changed_count = changed_count;
                });

                //console.log('diff: '+JSON.stringify(delta, null, 4));
            } else {
                delta = _.clone(store);
            }

            evalInsight(delta, group, path, report, level, count, counts, callback)
        });
    }



}

function evalInsight(store, group, path, report, level, count, counts, callback) {
    var insight = {};

    var data = store.data;

    insight.Data_Source__c = report.attributes.reportName;
    insight.ReportID__c = report.attributes.reportId;

    var groupInfo =  groupingColumnInfoForLevel(level, report);
    var typeLabel = report.reportMetadata.reportType.label;
    var labelPath = arrayFromKey(path, "label").join(" > ");

    insight.Name = '('+ count +') '+typeLabel+' from '+report.attributes.reportName;
    //insight.Long_Name__c = '('+ count +') '+typeLabel+' matching: '+labelPath
    var table = buildTable(report.headers, data.rows);
    insight.Table_Data__c = table;

    insight.Details__c = count+' '+report.reportMetadata.reportType.label+' found.';
    insight.Report_Type_Label__c = report.reportMetadata.reportType.label;
    insight.Path__c = arrayFromKey(path, "value").join("/");

    // create the parents list
    insight.Parents__c = '';
    insight.Is_Read__c = false;

    insight.Today_Total__c = count;
    insight.Today_Changed__c = counts.changed_count;
    insight.Today_New__c = counts.new_count;
    insight.Today_Deleted__c = counts.deleted_count;

    // new or changed Leads where product interest is SLA: Gold and industry is Agriculture.

    // new or changed [Report_Type_Label__c] where [PATH Label [2]] is [Path Value [2]] and [PATH Label [3]] is [Path Value [3]].

    var new_or_changed = insight.Today_New__c + insight.Today_Changed__c;

    var long_title = 'Found '+stringForNumber(new_or_changed)+' new or changed <span class="sobject-link">'+report.reportMetadata.reportType.label+'</span>';
    var where_string = "";

    if (path.length > 1) {

        where_string = ' where '
        var parents = "";
        //'<ul class="slds-list--horizontal slds-has-dividers--right slds-has-inline-block-links">';

        for (var i = 1; i < path.length; i++) {
            var groupingColumnInfo =  groupingColumnInfoForLevel(i -1, report);
            //console.log(JSON.stringify(groupingColumnInfo));
            var node = path[i];
            var dataType = groupingColumnInfo.dataType;
            var node_li = '<span class="sobject-link">'+groupingColumnInfo.label+': </span>';
            if (i > 1) {
                if ( i > 2) {
                    where_string = where_string + ' and ';
                }
                where_string = where_string + groupingColumnInfo.label.toLowerCase()+' is <span class="sobject-link"> ';
            }
            if (node.value != null && dataType === "string") {
                var myRe = /(\d\d\d\d\d)/;
                var myArray = myRe.exec(node.value);
                //console.log(node.value);

                if (myArray!= null && myArray.length > 0) {
                    node_li = node_li + '<a href="https://rowan-dev-ed.my.salesforce.com/'+node.value+'" class="sobject-link">'+node.label+'</a>';
                    if (i > 1) {
                        where_string = where_string +  '<a href="https://rowan-dev-ed.my.salesforce.com/'+node.value+'">'+node.label+'</a></span>'
                    }
                    setAssocForLevel(node.value, node.label, i, insight);
                } else {
                    node_li = node_li +node.label +'</span>';
                    if (i > 1) {
                        where_string = where_string +node.label +'</span>';
                    }
                }
            } else {
                node_li = node_li +node.label +'</span>';

                if (i > 1) {
                    where_string = where_string +node.label +'</span>';
                }
            }
        parents = parents + '<li class="slds-list__item" >'+node_li+'</li>';
        }
        //parents = parents + '</ul>';
        insight.Parents__c = parents;
    }

    long_title = long_title+where_string +'.';

    insight.Long_Name__c = long_title;
    var desc = 'There are '+stringForNumber(insight.Today_New__c)+' new and '+stringForNumber(insight.Today_Changed__c)+' changed <span class="sobject-link">'+report.reportMetadata.reportType.label+'</span>. There are '+stringForNumber(insight.Today_Total__c)+' '+report.reportMetadata.reportType.label.toLowerCase()+' matching this filter.';



    insight.Details__c = desc;

    //console.log('Insight created: '+insight.Name);
    //console.log('         EVAL DATA --- path: '+arrayFromKey(path, "value").join(".")+' key: '+group.key+' label: '+group.label+' value: '+group.value+' level: '+level);

    //console.log(insight);
    var saveToS3 = true;
    saveOutput('store.json', JSON.stringify(store), path, saveToS3);
    callback(insight);
}

function stringForNumber (number) {
    if (number < 0) {
        var string = '(-'+number+')';
        return string;
    }
    return number;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
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
        //console.log('need to replace a null value of: '+value)
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

// function suspend() {
//     sleep.sleep(30000);
// }


function saveOutput (filename, output, path, saveToS3, callback) {

    if (path) {
        var dir = "";
        if (access && saveToS3 ) {
            dir = arrayFromKey(path, "value").join("/");
        } else {
            dir = arrayFromKey(path, "value").join(".");
        }
    }

    if (access) {
        // we have an access object so we'll use S3
        if (dir) {
            filename = dir+'/'+filename;
        }

        s3.uploadObject(access.orgid, filename, output, function(result) {
            console.log(result);
        });

        return;
    }

    // if (dir && !fs.existsSync(dir)){
    //     fs.mkdirSync(dir);
    //     filename = dir+'/'+filename;
    // }

    if (dir) {
        filename = dir+'.'+filename;
    }

    fs.writeFile(filename, output, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}
