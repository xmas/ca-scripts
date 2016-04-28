"use strict";

// declare public exports
module.exports = {
  createTable: createTable,
  getTables: getTables,
  upsertTable: upsertTable,
  updateTable: updateTable
}

var sfutil = require('./sfutil.js');
var jsforce = require('jsforce');
var fs = require('fs');
var _ = require('underscore');
var s3 = require('./s3.js');
var diff = require('./diff.js');
var Promise = require("bluebird");
var rp = require('request-promise');
var request = require('request');

var baseurl = 'http://54.186.202.81:8080';

function appendData (tableId, objectName, callback) {

    console.log('append data: '+tableId+ ' loc: '+objectName);

    var options = {
        method: 'POST',
        url: baseurl+'/table/appendData?tableId='+tableId+'&objectName='+objectName
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        callback('send data to Schemata: '+tableId+'  '+body);
    });
}


function upsertTable(tableData, callback) {

    console.log('upserting data');

    getTables( function (currentTables) {
        var existingTableId = -1;
        for (var i = 0; i < currentTables.length; i++) {
            //console.log('test current tables: '+currentTables[i].id+ ' '+currentTables[i].name);
            if (currentTables[i].name === tableData.name) {
                existingTableId = currentTables[i].id;
                break;
            }
        }
        console.log('current table found: '+existingTableId);

        console.log('test current tables: '+currentTables[i].id+ ' '+currentTables[i].name);


        if (existingTableId > 0) {
            // update existing
            updateTable(existingTableId, tableData, function(response) {
                console.log('callback for existing');
                callback(existingTableId, response);
            });

        } else {
            // create new
            //console.log('create new table from: '+JSON.stringify(tableData, null, 4));
            createTable(tableData, function(response) {
                console.log('callback for new');

                var table = JSON.parse(response);
                callback(table.id, response);
            });
        }
    });

}

function createTable (tableData, callback) {

    var options = { method: 'POST',
        url: baseurl+'/table/create',
        body: JSON.stringify(tableData)
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log('Created a new table w/ Schemata: '+tableData.name);
        // console.log(response);
        // console.log(body);
        callback('new table created: '+body);
    });
}

function updateTable (tableId, tableData, callback) {

    var options = { method: 'POST',
        url: baseurl+'/table/show/tableId',
        body: JSON.stringify(tableData)
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        callback(tableId+' updated');
    });
}

function getTables( callback) {

    var options = { method: 'GET',
      url: baseurl+'/table'
  };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        //  console.log('Retruend existing tables');
        //  console.log(response);
        //  console.log(body);
        callback(JSON.parse(body));
    });
}


// getTables( function (tables) {
//
//     for (var i = 0; i < tables.length; i++) {
//         console.log('id: '+tables[i].id);
//     }
//
// });
//
//
// function makeHeader(num) {
//     var h1 = {}
//     h1.dataType = "string";
//     h1.label = "test"+num;
//     h1.databaseName = "test"+num;
//     return h1;
// }
//
// var test = {};
// test.name = "test";
// test.headers = [makeHeader(1), makeHeader(2)];
//
// var test2 = {};
// test.name = "test2";
// test.headers = [makeHeader(3), makeHeader(4)];
//
//
// upsertTable(test, function(result) {
//     console.log("TeST 1: "+result);
// });
//
// upsertTable(test, function(result) {
//     console.log("TeST 1 REDO: "+result);
// });
//
// upsertTable(test2, function(result) {
//     console.log("TeST 2: "+result);
// });
//
