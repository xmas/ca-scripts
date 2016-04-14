"use strict";

var pgutil = require('./pgutil.js');

pgutil.setupDatabase( function (results) {

console.log('database setup finished with result: '+results);

});
