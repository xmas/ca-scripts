var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var jsforce = require('jsforce');
var fs = require('fs');
var appId = process.env.APP_ID;

var oauth2 = new jsforce.OAuth2({
  // you can change loginUrl to connect to sandbox or prerelease env.
  // loginUrl : 'https://test.salesforce.com',
  clientId : process.env.SFORCE_CLIENT_ID,
  clientSecret : process.env.SFORCE_SECRET,
  redirectUri : process.env.SFORCE_CALLBACK
  // clientId : '3MVG9KI2HHAq33RyVzf6P3tANy00h7i_UBLIzaRsTYhGAmWCY032QIFO7HUs8xgR7xamOsLlVoDp_RljlKMyk',
  // clientSecret : '836401246198509582',
  // redirectUri : 'http://localhost:5000/auth/salesforce/callback'
});
//cact-server.herokuapp.com/aura/salesforce/callback

console.log(appId);

//app.use(bodyParser.json());
//app.use(express.static(__dirname + '/client'));


app.get('/appid', function(req, res) {
    res.send({appId: appId});
});

app.get('/auth/salesforce/callback' , function(req, res) {
    var conn = new jsforce.Connection({ oauth2 : oauth2 });
    var code = req.param('code');
    conn.authorize(code, function(err, userInfo) {
        if (err) { return console.error(err); }
        // Now you can get the access token, refresh token, and instance URL information.
        // Save them to establish connection next time.
        console.log('-------------');
        console.log('access token: '+conn.accessToken);
        console.log('refresh token: :'+conn.refreshToken);
        console.log('instance url: '+conn.instanceUrl);
        console.log("User ID: " + userInfo.id);
        console.log("Org ID: " + userInfo.organizationId);
        // ...

        var access = {
        access_token : conn.accessToken,
        refresh_token : conn.refreshToken,
        instanceUrl : conn.instanceUrl,
        userid : userInfo.id,
        orgid : userInfo.organizationId};

        console.log(JSON.stringify(access));
        saveOutput('access.json', JSON.stringify(access), '.');

        res.send('SUCCESS');
    });
});

app.get('/oauth2/auth', function(req, res) {
  res.redirect(oauth2.getAuthorizationUrl({ scope : 'api id web refresh_token' }));
});

app.get('/', function(req, res) {
  res.redirect(oauth2.getAuthorizationUrl({ scope : 'api id web refresh_token' }));
});

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function () {
    console.log('Proxy server listening on port ' + app.get('port'));
});

function saveOutput (filename, output, dir) {


    if (dir && !fs.existsSync(dir)){
        fs.mkdirSync(dir);
        filename = dir+'/'+filename;
    }

    fs.writeFile(filename, output, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}