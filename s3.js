"use strict";

module.exports = {
    listBuckets : listBuckets,
    ensureBucket : ensureBucket
}

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var _ = require('underscore');

if (typeof(process.env.AWS_ACCESS_KEY_ID) === 'undefined') {
    require('dotenv').config();
}
AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, region: 'us-west-2'});



// Create a bucket using bound parameters and put something in it.
// Make sure to change the bucket name from "myBucket" to something unique.
// var s3bucket = new AWS.S3({params: {Bucket: 'current-actions'}});
// s3bucket.createBucket(function() {
//   var params = {Key: 'myKey', Body: 'Hello!'};
//   s3bucket.upload(params, function(err, data) {
//     if (err) {
//       console.log("Error uploading data: ", err);
//     } else {
//       console.log("Successfully uploaded data to myBucket/myKey");
//     }
//   });
// });

function ensureBucket(bucketName, callback) {
    listBuckets(function(buckets) {
        var createNew = true;
        for (var i = 0; i < buckets.length; i++) {
            console.log('eval existing bucket: '+JSON.stringify(buckets[i]));
            if (bucketName === buckets[i].Name) {
                createNew = false;
                console.log('existing bucket match for: '+bucketName);
                break;
            }
        }
        if (createNew) {
            console.log('create new bucket for: '+bucketName);
            createBucket(bucketName, function (){});
        }
    });
}

function createBucket (bucketName, callback) {
    var s3 = new AWS.S3();
    var params = { Bucket: bucketName};

    s3.createBucket(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else  console.log(data);           // successful response
        callback();
    });

}

function listBuckets(callback) {
    var s3 = new AWS.S3();
    s3.listBuckets(function(err, data) {
        if (err) { console.log("Error:", err); }
        callback(data.Buckets);
    });
};

// var params = {
//   Bucket: 'bucketName',
//   Key: 'keyName',
//   Body: 'body',
//   ACL: 'public-read'
// };
//
// s3.client.putObject(params, function (err, data) {
//   if (!err) {
//     console.log("Object is public at https://s3.amazonaws.com/" +
//       params.Bucket + "/" + params.Key);
//   }
// });

// var s3 = new AWS.S3();
// var params = {Bucket: 'current-actions', Key: 'sobjects.json'};
// s3.getSignedUrl('getObject', params, function (err, url) {
//   console.log("The URL is", url);
// });


//getAccounts();

function getAccounts () {
    var s3 = new AWS.S3();
    var params = {Bucket: 'current-actions', Key: 'sobjects.json'};

    s3.getObject(params, function(err, data) {
        if (err){ return console.log(err, err.stack);} // an error occurred

        var accounts = JSON.parse(data.Body.toString());           // successful response
        listSObjects(accounts);
    });
}


function listSObjects (objects) {
    for (var i = 0; i < objects.length; i++) {
        console.log(i + ' : '+objects[i]);
    }
}
