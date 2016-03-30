"use strict";

var pgutil = require('./pgutil.js');
var sfutil = require('./sfutil.js');
var s3 = require('./s3.js');
var Promise = require("bluebird");
var _ = require('underscore');
var moment = require('moment');
var moniker = require('moniker');

var industry = ['Agriculture',
'Apparel',
'Banking',
'Biotechnology',
'Chemicals',
'Communications',
'Construction',
'Consulting',
'Education',
'Electronics',
'Energy',
'Engineering',
'Entertainment',
'Environmental',
'Finance',
'Food & Beverage',
'Government',
'Healthcare',
'Hospitality',
'Insurance',
'Machinery',
'Manufacturing',
'Media',
'Not for Profit',
'Recreation',
'Retail',
'Shipping',
'Technology',
'Telecommunications',
'Transportation',
'Utilities',
'Other'];

var account_type = ['Analyst',
'Press',
'Competitor',
'Prospect',
'Customer',
'Reseller',
'Integrator',
'Investor',
'Partner',
'Other'];

var states = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AS": "American Samoa",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District Of Columbia",
    "FM": "Federated States Of Micronesia",
    "FL": "Florida",
    "GA": "Georgia",
    "GU": "Guam",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MH": "Marshall Islands",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "MP": "Northern Mariana Islands",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PW": "Palau",
    "PA": "Pennsylvania",
    "PR": "Puerto Rico",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VI": "Virgin Islands",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
}
var state_keys = Object.keys(states);


var sources = ['Phone Inquiry', 'Partner Referral', 'Purchased List', 'Web', 'Other'];
var streets = ['Ave', 'Lane', 'Ct', 'Blvd'];
var origins = ['Phone', 'Email', 'Web'];

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

        simulate_opportunities(conn, handle);
        simulate_accounts(conn, handle);
        simulate_cases(conn, handle);

    }
});

var handle = function (err, SObject_type, updated, newones) {
    // update existing
    conn.bulk.load(SObject_type, "upsert", {extIdField: "Id"}, updated, function(err, rets) {
      if (err) { return console.error(err); }
      for (var i=0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log("#" + (i+1) + " loaded successfully, id = " + rets[i].id);
        } else {
          console.log("#" + (i+1) + " error occurred, message = " + rets[i].errors.join(', '));
        }
      }
      console.log('FINALLY: finished loading Account');
    });

    // load new
    conn.bulk.load(SObject_type, "insert", newones, function(err, rets) {
      if (err) { return console.error(err); }
      for (var i=0; i < rets.length; i++) {
        if (rets[i].success) {
          console.log("#" + (i+1) + " loaded successfully, id = " + rets[i].id);
        } else {
          console.log("#" + (i+1) + " error occurred, message = " + rets[i].errors.join(', '));
        }
      }
      console.log('FINALLY: finished loading Account');
    });
}

// // leads
// function simulate_cases (conn, callback) {
//
//     var leads = [];
//     for (var i = 0; i < 10; i++) {
//
//         leads.push({
//                 FirstName : moniker.choose(),
//                 LastName : moniker.choose(),
//                 State: keys[randomIntInc(0,50)],
//                 //City: 'Seattle',
//                 //PostalCode: '98177',
//                 Street: randomIntInc(134,56678)+' '+moniker.choose()+ ' '+streets[randomIntInc(0,3)],
//                 LeadSource: sources[randomIntInc(0,4)],
//                 Company: moniker.choose()
//
//         });
//     }
//
//     // Multiple records creation
//     conn.sobject("Lead").create(leads,
//     function(err, rets) {
//         if (err) { return console.error(err); }
//         for (var i=0; i < rets.length; i++) {
//             if (rets[i].success) {
//                 console.log("Created record id : " + rets[i].id);
//             }
//         }
//         // ...
//     });


// cases
function simulate_cases (conn, callback) {

    var q = [];
    var accounts = [];
    var contacts = [];
    var cases = [];

    var a = new Promise( function(resolve) {
        conn.query("SELECT Id, Name FROM Account", function(err, result) {
            if (err) { return console.error(err); }
            for (var accounts_i = 0; accounts_i < result.records.length; accounts_i++) {
                accounts.push(result.records[accounts_i].Id);
            }
            resolve();
        });
    });
    q.push(a);

    var b = new Promise( function(resolve) {
        conn.query("SELECT Id, Name FROM Contact", function(err, result) {
            if (err) { return console.error(err); }
            for (var contacts_i = 0; contacts_i < result.records.length; contacts_i++) {
                contacts.push(result.records[contacts_i].Id);
            }
            resolve();

        });
    });
    q.push(b);


    var c = new Promise( function(resolve) {
        conn.query("SELECT Id, Status FROM Case WHERE Status = 'New'", function(err, result) {

            if (err) { return console.error(err); }
            for (var cases_i = 0; cases_i < result.records.length; cases_i++) {
                var ccase = result.records[cases_i];
                if (Math.random() < 0.2) {
                    ccase.Status = 'Closed';
                    cases.push(ccase);
                }
            }
            resolve();

        });
    });
    q.push(c);

    Promise.all(q).then( function () {
        var new_cases = [];
        for (var i = 0; i < 10; i++) {
            new_cases.push({
                ContactId : contacts[randomIntInc(0, contacts.length)],
                AccountId : accounts[randomIntInc(0, accounts.length)],
                Description : moniker.choose(),
                Subject: moniker.choose(),
                Status: 'New',
                Origin: origins[randomIntInc(0, contacts.origins)]
            });
        }


        callback(null, 'Case', cases, new_cases);
    });

}

// Accounts

function simulate_accounts (conn, callback) {

    var q = [];
    var accounts = [];
    var ratings = ['Hot', 'Warm', 'Cold'];

    var a = new Promise( function(resolve) {
        console.log('simming accounts');

        conn.query("SELECT Id, Name, AnnualRevenue, Rating, Type FROM Account", function(err, result) {
            if (err) { return console.error(err); }
            console.log('got accounts: '+result.records.length);

            accounts = result.records;

            for (var accounts_i = 0; accounts_i < accounts.length; accounts_i++) {
                var change_amount = (Math.random() < 0.1) ? randomIntInc(1,5)*(-1000) : randomIntInc(1,5)*(15000);
                var account = accounts[accounts_i];
                account.AnnualRevenue = account.AnnualRevenue + change_amount;
                account.Rating = ratings[randomIntInc(0,2)];
                accounts[accounts_i] = account;
            }
            resolve();

        });
    });
    q.push(a);


    Promise.all(q).then( function () {
        console.log('Promise ALl THEN');

        var employees = [2, 12, 50, 67, 89, 234, 4567, 43, 345, 546, 7889, 32, 94, 684, 120, 567, 8098, 15000, 100000];
        var new_accounts = [];
        var new_account = {};
        new_account.Name = moniker.choose();
        new_account.Industry = industry[randomIntInc(0, industry.length-1)];
        new_account.Rating = ratings[randomIntInc(0,2)];
        new_account.Type = account_type[randomIntInc(0, account_type.length-1)];
        new_account.NumberOfEmployees = employees[randomIntInc(0, employees.length-1)];
        new_account.ShippingState =  state_keys[randomIntInc(0,50)],
        new_accounts.push(new_account);

        console.log('UPDATE ACCOUNTS: '+JSON.stringify(accounts, null, 4));
        console.log('NEW ACCOUNT: '+JSON.stringify(new_accounts, null, 4));

        callback(null, 'Account', accounts, new_accounts);
    });
}


// Opportunities


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

        callback(null, 'Opportunity', opportunities, new_opportunities);
    });
}

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
