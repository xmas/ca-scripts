// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

/**
 * Don't hard-code your credentials!
 * Export the following environment variables instead:
 *
 * export AWS_ACCESS_KEY_ID='AKID'
 * export AWS_SECRET_ACCESS_KEY='SECRET'
 */

// Set your region for future requests.
AWS.config.region = 'us-west-2';

// Create a bucket using bound parameters and put something in it.
// Make sure to change the bucket name from "myBucket" to something unique.
var s3bucket = new AWS.S3({params: {Bucket: 'current-actions'}});
s3bucket.createBucket(function() {
  var params = {Key: 'myKey', Body: 'Hello!'};
  s3bucket.upload(params, function(err, data) {
    if (err) {
      console.log("Error uploading data: ", err);
    } else {
      console.log("Successfully uploaded data to myBucket/myKey");
    }
  });
});

var s3 = new AWS.S3();
s3.listBuckets(function(err, data) {
  if (err) { console.log("Error:", err); }
  else {
    for (var index in data.Buckets) {
      var bucket = data.Buckets[index];
      console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
    }
  }
});

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

getAccounts();

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
