"use strict";

module.exports = {
    listBuckets : listBuckets,
    ensureBucket : ensureBucket,
    getSignedUrlForBucketAndKey : getSignedUrlForBucketAndKey,
    uploadObject : uploadObject,
    getVersion : getVersion
}

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var _ = require('underscore');
var fs = require('fs');

awsConfig();
function awsConfig() {
    if (typeof(process.env.AWS_ACCESS_KEY_ID) === 'undefined') {
        require('dotenv').config();
    }
    AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, region: 'us-west-2'});
}


// TODO : sometimes there are new things with no dir yet and S3 just goes down the line and returns stuff we need to make sure the key returned is the key we asked for and if not then we need to return null.
function getVersion (bucket, key, back, callback) {
    bucket = bucket.toLowerCase();
    var s3 = new AWS.S3();
    var version_params = {
        Bucket: bucket, /* required */
        KeyMarker: key,
        MaxKeys: back
    };
    s3.listObjectVersions(version_params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            console.log('bucket: '+bucket+ 'key: '+key+' back: '+back+' lastVersion: '+lastVersion);
        } else {

            if (data.Versions.length <  back-1) {
                console.log('only one version');
                callback(null);
                return;
            }

            if (data.Versions[back-1].Key != key+'/store.json') {
                console.log('only one version, key mismatch: '+key+ ' vs '+data.Versions[back-1].Key);
                callback(null);
                return;
            }
            //console.log(data);
            var lastVersion = data.Versions[back-1].VersionId;
            //console.log('got last version for path: '+key+' id: '+lastVersion);
            //console.log(JSON.stringify(data, null, 4));
            var get_params = {
                Bucket: bucket,
                Key: key+'/store.json',
                VersionId: lastVersion
            }

            s3.getObject(get_params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    console.log('bucket: '+bucket+ 'key: '+key+' back: '+back+' lastVersion: '+lastVersion);
                } else {
                    //console.log(data);
                    callback(data.Body);
                }
            });
        }
    });
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
    // var s3 = new AWS.S3();
    // var params = {
    //     Bucket: bucket, /* required */
    //     KeyMarker: key,
    // };
    // s3.listObjectVersions(params, function(err, data) {
    //     if (err) console.log(err, err.stack); // an error occurred
    //     else {
    //         console.log('----------------------- '+key+' ------------------------');
    //         console.log(data);           // successful response
    //     }
    // });


    var s3bucket = new AWS.S3({params: {Bucket: bucket}});
    s3bucket.createBucket(function() {
      var params = {Key: key, Body: object, ServerSideEncryption: 'AES256'};
      s3bucket.upload(params, function(err, data) {
        if (err) {
            console.log("Error uploading data: ", err);
        } else {
            //console.log("Successfully uploaded data to: "+bucket+" // "+key);
            //console.log(data);
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
