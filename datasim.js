#!/usr/bin/nodejs

"use strict";

var jsforce = require('jsforce');
var fs = require('fs');
var moniker = require('moniker');
//var _ = require('underscore');

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

var sources = ['Phone Inquiry', 'Partner Referral', 'Purchased List', 'Web', 'Other'];
var streets = ['Ave', 'Lane', 'Ct', 'Blvd'];

var conn = new jsforce.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
  //loginUrl : 'https://na34.salesforce.com'
});
conn.login('rowanxmas@gmail.com', '111qqqSSS8wDvDVUSsCXWJfMViL5cSgVKx', function(err, res) {
    if (err) { return console.error(err); }
    sim();



    // // Single record retrieval
    // conn.sobject("Lead").retrieve("00Q6100000BSOJnEAP", function(err, lead) {
    //     if (err) { return console.error(err); }
    //     console.log("LeadSource : " + lead.LeadSource);
    //     // ...
    // });
});



function sim (reportId) {

    // Single record creation

    var keys = Object.keys(states);

    // conn.sobject("Lead").create({
    //         FirstName : moniker.choose(),
    //         LastName : moniker.choose(),
    //         State: keys[randomIntInc(0,50)],
    //         //City: 'Seattle',
    //         //PostalCode: '98177',
    //         Street: '123 Main St.',
    //         LeadSource: 'Web',
    //         Company: 'Fake Co'
    //
    // } ,  function(err, ret) {
    //   if (err || !ret.success) { return console.error(err, ret); }
    //   console.log("Created record id : " + ret.id);
    //   // ...
    // });

    var leads = [];
    for (var i = 0; i < 10; i++) {

        leads.push({
                FirstName : moniker.choose(),
                LastName : moniker.choose(),
                State: keys[randomIntInc(0,50)],
                //City: 'Seattle',
                //PostalCode: '98177',
                Street: randomIntInc(134,56678)+' '+moniker.choose()+ ' '+streets[randomIntInc(0,3)],
                LeadSource: sources[randomIntInc(0,4)],
                Company: moniker.choose()

        });
    }

    // Multiple records creation
    conn.sobject("Lead").create(leads,
    function(err, rets) {
        if (err) { return console.error(err); }
        for (var i=0; i < rets.length; i++) {
            if (rets[i].success) {
                console.log("Created record id : " + rets[i].id);
            }
        }
        // ...
    });

}


function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
