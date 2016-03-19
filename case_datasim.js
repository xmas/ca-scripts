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
var origins = ['Phone', 'Email', 'Web'];

var conn = new jsforce.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
  //loginUrl : 'https://na34.salesforce.com'
});
conn.login('rowanxmas@gmail.com', '111qqqSSS8wDvDVUSsCXWJfMViL5cSgVKx', function(err, res) {
    if (err) { return console.error(err); }
    sim();

});



function sim () {
    var keys = Object.keys(states);

    var contacts = [];
    var accounts = [];
    conn.query("SELECT Id, Name FROM Contact", function(err, result) {
        if (err) { return console.error(err); }
        for (var contacts_i = 0; contacts_i < result.records.length; contacts_i++) {
            contacts.push(result.records[contacts_i].Id);
        }

        conn.query("SELECT Id, Name FROM Account", function(err, result) {
            if (err) { return console.error(err); }
            for (var accounts_i = 0; accounts_i < result.records.length; accounts_i++) {
                accounts.push(result.records[accounts_i].Id);
            }

            var cases = [];
            for (var i = 0; i < 10; i++) {

                cases.push({
                        ContactId : contacts[randomIntInc(0, contacts.length)],
                        AccountId : accounts[randomIntInc(0, accounts.length)],
                        Description : moniker.choose(),
                        Subject: moniker.choose(),
                        Status: 'New',
                        Origin: origins[randomIntInc(0, contacts.origins)]

                });
            }

            // Multiple records creation
            conn.sobject("Case").create(cases,
            function(err, rets) {
                if (err) { return console.error(err); }
                for (var i=0; i < rets.length; i++) {
                    if (rets[i].success) {
                        console.log("Created record id : " + rets[i].id);
                    }
                }
                // ...
            });


        });


    });



    // var leads = [];
    // for (var i = 0; i < 10; i++) {
    //
    //     leads.push({
    //             FirstName : moniker.choose(),
    //             LastName : moniker.choose(),
    //             State: keys[randomIntInc(0,50)],
    //             //City: 'Seattle',
    //             //PostalCode: '98177',
    //             Street: randomIntInc(134,56678)+' '+moniker.choose()+ ' '+streets[randomIntInc(0,3)],
    //             LeadSource: sources[randomIntInc(0,4)],
    //             Company: moniker.choose()
    //
    //     });
    // }
    //
    // // Multiple records creation
    // conn.sobject("Lead").create(leads,
    // function(err, rets) {
    //     if (err) { return console.error(err); }
    //     for (var i=0; i < rets.length; i++) {
    //         if (rets[i].success) {
    //             console.log("Created record id : " + rets[i].id);
    //         }
    //     }
    //     // ...
    // });

}


function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
