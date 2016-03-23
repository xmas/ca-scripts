"use strict";

var pgutil = require('./pgutil.js');
var sfutil = require('./sfutil.js');
var s3 = require('./s3.js');
var Promise = require("bluebird");
var _ = require('underscore');
var moment = require('moment');
var moniker = require('moniker');


if (typeof(process.env.SFORCE_CLIENT_ID) === 'undefined') {
    require('dotenv').config();
}
var conn;

pgutil.orgAccessList(function(results) {
    var orgs = results.rows;

    for (var i = 0; i < orgs.length; i++) {
        var access = orgs[i];
        console.log('get connection to org: '+access.orgid);
        conn = sfutil.getSFConnection(access);

        simulate_opportunities(conn, handle_opps);



    }
});

// Opportunities

var handle_opps = function (err, updated_opps, new_opps) {
    if (err) {
        return console.error(err);
    }

    // update existing
    conn.bulk.load("Opportunity", "upsert", {extIdField: "Id"}, updated_opps, function(err, rets) {
      if (err) { return console.error(err); }
      for (var i=0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log("#" + (i+1) + " loaded successfully, id = " + rets[i].id);
        } else {
          console.log("#" + (i+1) + " error occurred, message = " + rets[i].errors.join(', '));
        }
      }
      console.log('FINALLY: finished loading Opportunity');
    });

    // load new
    conn.bulk.load("Opportunity", "insert", new_opps, function(err, rets) {
      if (err) { return console.error(err); }
      for (var i=0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log("#" + (i+1) + " loaded successfully, id = " + rets[i].id);
        } else {
          console.log("#" + (i+1) + " error occurred, message = " + rets[i].errors.join(', '));
        }
      }
      console.log('FINALLY: finished loading Opportunity');
    });
}

function simulate_opportunities (conn, callback) {

    var q = [];

    var stages_by_order = {};
    var stages_by_name = {};
    var stage_max = 9; // 'Closed Won'

    var opps = [];
    var accounts = [];

    var a = new Promise( function(resolve) {
        conn.query("SELECT Id, ApiName, SortOrder FROM OpportunityStage ORDER BY SortOrder ASC", function(err, result) {
            if (err) { return console.error(err); }
            //console.log('ret value: '+JSON.stringify(result, null, 4));
            for (var stage_i = 0; stage_i < result.records.length; stage_i++) {
                stages_by_order[result.records[stage_i].SortOrder] = result.records[stage_i].ApiName;
                stages_by_name[result.records[stage_i].ApiName] = result.records[stage_i].SortOrder;
            }
            //console.log(stages_by_name);
            //console.log(stages_by_order);
            resolve();
        });
    });
    q.push(a);

    var b= new Promise( function(resolve) {
        conn.query("SELECT Id, Name, Amount, CloseDate, StageName  FROM Opportunity", function(err, result) {
            if (err) { return console.error(err); }
            //console.log('OPP RET value: '+JSON.stringify(result, null, 4));

            opps = result.records;
            resolve();

        });
    });
    q.push(b);

    var c = new Promise( function(resolve) {
        conn.query("SELECT Id, Name FROM Account", function(err, result) {
            if (err) { return console.error(err); }
            for (var accounts_i = 0; accounts_i < result.records.length; accounts_i++) {
                accounts.push(result.records[accounts_i].Id);
            }
            resolve();
        });
    });
    q.push(c);

    Promise.all(q).then( function () {
        var opportunities = [];
        var today = moment();

        console.log('permuting opps: '+opps.length);
        for (var o = 0; o < opps.length; o++) {

            var opp = opps[o];
            var new_opp = {};
            new_opp.Id = opp.Id;
            console.log("Simming Opp: "+opp.Name);


            // Opp Stage
            var current_stage = stages_by_name[opp.StageName];
            if (current_stage < stage_max) {
                // if the stage is "Closed Won" or "Closed Lost", do nothing

                if (Math.random() < 0.9) {
                    // advance the stage
                    if (current_stage === stage_max) {
                        // close the opp
                    } else {
                        //console.log('  ADVANCE STAGE++++++++');
                        current_stage++;
                        new_opp.StageName = stages_by_order[current_stage];
                    }

                } else if (Math.random() < 0.1) {
                    // regress the stage
                    if (current_stage <= 1) {
                        // do notihng
                    } else {
                        //console.log('  REGRESS STAGE--------------');
                        current_stage--;
                        new_opp.StageName = stages_by_order[current_stage];
                    }
                }
                // if (new_opp.StageName) {
                //     console.log('  old stage: '+opp.StageName+' new stage: '+new_opp.StageName);
                // }


                // // close date
                // if (Math.random() < 0.1) {
                //     var current_close_date = moment(opp.CloseDate);
                //     current_close_date.add(1, 'months');
                //     new_opp.CloseDate = current_close_date.format('YYYY-MM-DD');
                //
                // }
                new_opp.CloseDate = '2016-05-23';

                // Opp Amount
                var change_amount = (Math.random() < 0.1) ? randomIntInc(1,5)*(-1000) : randomIntInc(1,5)*(1500);
                //console.log('  change: '+change_amount);
                if (opp.Amount < 0) {
                    opp.Amount = randomIntInc(6,15)*(1000);
                }
                new_opp.Amount = opp.Amount + change_amount;
                //console.log('  old amount: '+opp.Amount+' new ammount: '+new_opp.Amount);

                opportunities.push(new_opp);


            }

        }


        var new_opportunities = [];
        for (var a_i = 0; a_i < accounts.length; a_i++) {
            var new_opps = randomIntInc(0,3);
            while (new_opps--) {
                //80% chance for a new Opportunity
                var new_opp ={};
                new_opp.Name = moniker.choose();
                new_opp.AccountId = accounts[a_i];
                new_opp.Amount = randomIntInc(6,15)*(1000);
                new_opp.CloseDate = '2016-05-23';
                new_opp.StageName = 'Qualification';
                //new_opp.StageName = stages_by_order[randomIntInc(0,3)];
                new_opportunities.push(new_opp);
            }
        }
        console.log(JSON.stringify(new_opportunities, null, 4));

        callback(null, opportunities, new_opportunities);
    });
}

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
