exports.upsertAccess = function (access) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {

        var sql = 'INSERT INTO sforg (id, instanceurl, access_token, refresh_token, userid, orgid) VALUES (DEFAULT, \''+access.instanceUrl+'\', \''+access.access_token+'\', \''+access.refresh_token+'\', \''+access.userid+'\', \''+access.orgid+'\') ON CONFLICT (orgid) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token';


        //var sql = 'INSERT INTO sforg VALUES (DEFAULT, \''+access.instanceUrl+'\', \''+access.access_token+'\', \''+access.refresh_token+'\', \''+access.userid+'\', \''+access.orgid+'\')';
        console.log(sql);
        client.query(sql, function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log('row inserted with id: ' + JSON.stringify(result));
            }
        });
    });
};
