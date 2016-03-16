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
uploadPie('current-actions');
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

function uploadPie (bucket, key, object, callback) {
    var fs = require('fs');
    var zlib = require('zlib');

    var chart = [88,15,60,72,23,14,71,59,71,99,28,16,71,28,94,80,25,76,58,69,8,68,59,65,30,83,44,80,82,94,16,14,22,78,82,89,32,88,12,49,55,70,23,26,92,39,22,41,51,74,76,51,78,69,57,32,72,48,25,51,65,91,23,93,52,89,96,10,6,7,62,46,86,17,82,72,93,22,42,53,72,6,35,89,68,57,36,36,85,7,34,18,39,93,53,47,86,87,66,87,75,73,22,10,42,26,87,80,69,94,44,63,41,42,19,63,92,59,16,77,89,29,92,28,96,5,71,38,91,41,89,23,37,70,6,66,36,27,88,95,71,5,25,61,75,80,33,74,62,21,42,65,92,61,18,55,77,81,39,72,86,25,50,67,95,63,33,89,62,99,15,93,92,30,69,92,46,51,44,47,35,23,66,25,14,67,55,11,56,87,7,41,71,66,34,43,12,71,62,36,31,44,42,33,96,95,90,11,20,9,40,72,75,6,60,12,19,56,81,53,43,20,22,38,71,55,68,8,5,46,97,35,17,32,99,33,41,32,90,41,60,81,31,30,78,70,12,8,27,77,65,95,14,47,68,38,7,60,61,35,39,92,94,85,80,28,55,77,18,73,47,7,45,59,30,40,62,93,67,71,85,63,23,27,10,72,36,75,77,39,82,93,83,42,80,19,15,38,76,47,39,71,91,52,76,86,79,44,16,85,7,46,36,68,64,56,19,80,90,16,13,42,23,92,31,86,84,46,23,53,98,38,33,74,25,14,78,51,69,52,25,66,39,31,80,61,55,27,12,33,65,89,12,46,38,64,99,47,61,90,38,80,34,55,62,56,82,31,38,12,13,93,8,11,21,63,49,94,73,29,21,83,84,95,23,61,81,85,7,41,91,31,92,71,31,96,25,21,35,42,50,68,35,47,72,61,92,11,15,57,37,32,69,27,37,25,68,49,47,97,87,66,80,80,81,78,33,80,66,32,11,23,92,16,66,40,16,71,87,63,40,41,56,27,67,34,9,95,18,40,82,13,83,80,27,89,72,39,97,62,94,14,95,93,91,90,33,16,69,6,45,26,45,33,71,53,69,11,91,53,81,53,16,63,83,43,49,40,25,98,63,6,29,13,22,59,83,17,84,76,65,16,8,23,78,19,84,13,64,36,17,8,54,19,54,34,44,70,60,42,61,7,71,70,9,32,39,20,39,41,51,78,64,30,67,97,46,26,62,95,41,80,31,94,62,44,59,84,64,91,12,85,8,26,16,25,46,34,32,73,38,16,96,51,24,15,42,79,55,33,71,50,44,58,60,98,64,11,39,29,50,42,61,73,63,92,64,18,36,64,95,51,16,57,74,9,42,79,64,61,92,82,12,80,49,67,9,35,94,34,6,21,98,5,82,73,43,24,37,61,87,79,13,59,66,51,93,27,32,54,57,31,93,37,36,17,6,54,16,81,26,66,47,11,41,67,63,28,78,39,5,60,39,42,32,40,40,67,86,79,95,92,20,91,62,58,52,30,48,82,21,7,92,12,74,40,99,88,13,90,15,44,61,5,55,47,10,68,54,48,93,43,85,87,62,21,50,67,99,41,91,22,37,87,34,27,21,24,27,96,38,19,72,31,84,24,36,29,37,81,88,29,10,5,72,98,66,66,13,99,77,23,83,7,53,22,6,16,76,78,99,37,95,17,22,91,18,6,13,54,27,64,18,97,17,67,98,49,45,77,8,40,97,80,28,13,83,17,50,75,55,50,83,12,98,26,8,37,43,94,38,87,86,24,71,33,83,33,41,92,33,41,27,55,38,25,76,66,10,33,85,67,93,38,19,32,47,15,53,14,57,54,66,48,10,61,11,66,91,10,68,35,90,53,11,30,93,14,84,60,47,32,42,53,40,36,48,47,51,77,60,69,13,22,79,61,28,69,62,57,39,78,17,51,71,27,76,23,47,82,54,31,76,7,66,73,28,84,88,80,55,15,47,81,82,63,15,26,92,29,60,41,7,36,30,86,67,50,31,48,35,38,86,39,31,71,30,11,6,46,96,32,52,39,77,34,93,19,15,98,33,34,63,78,51,31,15,23,6,97,25,41,82,44,82,90,32,66,96,23,88,54,62,24,69,34,51,81,43,46,88,44,62,45,84,56,90,56,26,6,96,34,29,50,71,45,75,21,21,51,88,32,80,24,74,60,72,78,78,89,52,48,56,5,84,16,44,72,82,89,24,61,95,36,81,49,53,11,57,5,86,33,66,48,78,78,88,87,8,32,23,8,40,12,36,47,41,77,61,11,13,96,86,41,21,81,46,24,46,42,35,16,84,56,49,78,23,18,17,95,32,79,60,57,57,9,61,26,13,93,13,64,53,75,35,42,48,69,7,34,12,90,75,72,70,57,21,53,68,78,17,84,92,8,51,75,80,66,92,8,27,21,76,91,10,52,33,6,45,25,36,90,37,58,61,69,82,32,89,78,56,96,44,60,89,31,11,77,26,99,18,76,5,20,61,27,56,63,56,37,58,52,66,42,97,22,76,99,87,55,79,27,66,92,92,15,55,55,71,3];

    var Canvas = require('canvas')
      , canvas = new Canvas(800, 800)
      , ctx = canvas.getContext('2d')
      , Chart = require('nchart')
      , fs = require('fs');

    // new Chart(ctx).Pie(
    //     [
    //         {
    //             "value": 50
    //           , "color": "#E2EAE9"
    //         }
    //       , {
    //             "value": 100
    //           , "color": "#D4CCC5"
    //         }
    //       , {
    //             "value": 40
    //           , "color": "#949FB1"
    //         }
    //     ]
    //   , {
    //         scaleShowValues: true
    //       , scaleFontSize: 24
    //     }
    // );

    var data = {
          labels: chart,
          datasets: [
          {
              label: "My First dataset",
              fillColor: "rgba(220,220,220,0.2)",
              strokeColor: "rgba(220,220,220,1)",
              pointColor: "rgba(220,220,220,1)",
              pointStrokeColor: "#fff",
              pointHighlightFill: "#fff",
              pointHighlightStroke: "rgba(220,220,220,1)",
              data: chart
          }

          ]
      };

      new Chart(ctx).Line(data);

    canvas.toBuffer(function (err, buf) {
      if (err) throw err;
      fs.writeFile(__dirname + '/line.png', buf);
    });



    var body = fs.createReadStream(__dirname + '/pie.png').pipe(zlib.createGzip());
    var s3obj = new AWS.S3({params: {Bucket: bucket, Key: 'test.png'}});
    s3obj.upload({Body: body}).
    on('httpUploadProgress', function(evt) {
        console.log(evt);
    }).
    send(function(err, data) {
        console.log(err, data)
    });
}

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
