"use strict";

// declare public exports
module.exports = {
  upsertAccess: upsertAccess,
  orgAccessList: orgAccessList,
  setupDatabase : setupDatabase
}

var pg = require('pg');

function upsertAccess (access, done) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {

        var sql = 'INSERT INTO sforg (id, instanceurl, access_token, refresh_token, userid, orgid) VALUES (DEFAULT, \''+access.instanceUrl+'\', \''+access.access_token+'\', \''+access.refresh_token+'\', \''+access.userid+'\', \''+access.orgid+'\') ON CONFLICT (orgid) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token';

        console.log(sql);
        client.query(sql, function(err, result) {
            if (err) {
                console.log(err);
                done(err);
            } else {
                console.log('row inserted with id: ' + JSON.stringify(result));
                done(result);
            }

        });
    });
};

function orgAccessList(cb) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        var sql = 'SELECT * FROM sforg';
        client.query(sql, function(err, result) {
            if (err) {
                console.log('ERROR FROM POSTGRES: '+err);
            } else {
                cb(result); // callback with the results
                done(); // indicate that this pg client is done
            }
        });
    });
    pg.end(); // close the pg.connect session
};

function setupDatabase (cb) {

    pg.connect(process.env.DATABASE_URL, function(err, client, done) {

        var sql = 'CREATE TABLE "sforg-test" (id serial primary key, instanceurl text, access_token text, refresh_token text, userid text, orgid text, UNIQUE ("orgid") )';
        client.query(sql, function(err, result) {
            if (err) {
                console.log('ERROR FROM POSTGRES: '+err);
            } else {
                cb(result); // callback with the results
                done(); // indicate that this pg client is done
            }
        });
    });
    pg.end(); // close the pg.connect session

}
