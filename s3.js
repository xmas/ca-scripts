"use strict";

module.exports = {
    listBuckets : listBuckets,
    ensureBucket : ensureBucket,
    getSignedUrlForBucketAndKey : getSignedUrlForBucketAndKey,
    uploadObject : uploadObject
}

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var _ = require('underscore');
var fs = require('fs');

awsConfig();
//uploadPie('current-actions');
function awsConfig() {
    if (typeof(process.env.AWS_ACCESS_KEY_ID) === 'undefined') {
        require('dotenv').config();
    }
    AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, region: 'us-west-2'});
}


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

// function uploadPie (bucket, key, object, callback) {
//     var fs = require('fs');
//     var zlib = require('zlib');
//
//     var chart = { data: [88,15,60,72,23,14,71,59,71,99,28,16,71]};
//
//     var Canvas = require('canvas')
//       , canvas = new Canvas(800, 800)
//       , ctx = canvas.getContext('2d')
//       , Chart = require('nchart')
//       , fs = require('fs');
//
//     var data = {
//           labels: chart,
//           datasets: [
//           {
//               label: "My First dataset",
//               fillColor: "rgba(220,220,220,0.2)",
//               strokeColor: "rgba(220,220,220,1)",
//               pointColor: "rgba(220,220,220,1)",
//               pointStrokeColor: "#fff",
//               pointHighlightFill: "#fff",
//               pointHighlightStroke: "rgba(220,220,220,1)",
//               data: chart
//           }
//
//           ]
//       };
//
//       new Chart(ctx).Line(data);
//
//     canvas.toBuffer(function (err, buf) {
//       if (err) throw err;
//       fs.writeFile(__dirname + '/line.png', buf);
//     });
//
//     var body = fs.createReadStream(__dirname + '/pie.png').pipe(zlib.createGzip());
//     var s3obj = new AWS.S3({params: {Bucket: bucket, Key: 'test.png'}});
//     s3obj.upload({Body: body}).
//     on('httpUploadProgress', function(evt) {
//         console.log(evt);
//     }).
//     send(function(err, data) {
//         console.log(err, data)
//     });
// }

function uploadObject(bucket, key, object, callback) {
    bucket = bucket.toLowerCase();
    //  var s3 = new AWS.S3();
    // //
    // var params = {Bucket: bucket};
    // var request = s3.getBucketLocation(params, function(err, data) {
    //     if (err) {
    //         console.log('bucket location err:')
    //         console.log(err, err.stack); // an error occurred
    //     } else {
    //         console.log('bucket location data:')
    //         console.log(data);           // successful response
    //         console.log('^^^^^^^^^^^');
    //     }
    // });
    //
    // console.log('-----------------------');
    //
    // console.log(request);
    // console.log('-----------------------');

    // fs.writeFile('aws.request', request.toString(), function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    //
    //     console.log("The file was saved!");
    // });
    //
    // console.log(JSON.stringify(AWS.config));

    // var s3 = new AWS.S3();
    // var params = {Bucket: 'bucket',
    // CreateBucketConfiguration: {
    //     LocationConstraint: 'us-west-2'
    // },
    // Key: 'key', Body: object};
    // s3.upload(params, function(err, data) {
    //     if (err) {
    //         console.log(err, err.stack); // an error occurred
    //         console.log('upload returned data:');
    //         console.log(data);
    //         console.log('^^^^^^^^^^^');
    //
    //     }
    //     callback(data);
    // });

    var s3bucket = new AWS.S3({params: {Bucket: bucket}});
    s3bucket.createBucket(function() {
      var params = {Key: key, Body: object};
      s3bucket.upload(params, function(err, data) {
        if (err) {
            console.log("Error uploading data: ", err);
        } else {
            console.log("Successfully uploaded data to: "+bucket+" // "+key);
            console.log(data);
        }
      });
    });

}

function ensureBucket(bucket, callback) {
    bucket = bucket.toLowerCase();
    listBuckets(function(buckets) {
        var createNew = true;
        for (var i = 0; i < buckets.length; i++) {
            console.log('eval existing bucket: '+JSON.stringify(buckets[i]));
            if (bucket === buckets[i].Name) {
                createNew = false;
                console.log('existing bucket match for: '+bucket);
                callback();
                break;
            }
        }
        if (createNew) {
            console.log('create new bucket for: '+bucket);
            createBucket(bucket, function (data){
                callback(data);
            });
        }
    });
}

function createBucket (bucket, callback) {
    bucket = bucket.toLowerCase();

    var s3 = new AWS.S3();
    var params = { Bucket: bucket,
        CreateBucketConfiguration: {
            LocationConstraint: 'us-west-2'
        }
    };

    s3.createBucket(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else  console.log(data);           // successful response
        callback(data);
    });

}

function listBuckets(callback) {
    var s3 = new AWS.S3();
    s3.listBuckets(function(err, data) {
        if (err) { console.log("Error:", err); }
        callback(data.Buckets);
    });
};

function getSignedUrlForBucketAndKey(bucket, key, callback) {
    bucket = bucket.toLowerCase();

    var s3 = new AWS.S3();
    var params = {Bucket: bucket, Key: key};
    s3.getSignedUrl('getObject', params, function (err, url) {
        console.log("created a pre-signed URL", url);
        callback(url);
    });
}

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
