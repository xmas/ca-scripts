var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var jsforce = require('jsforce');
var fs = require('fs');
var pg = require('pg');
var _ = require('underscore');
var pgutil = require('./pgutil.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var oauth2 = new jsforce.OAuth2({
  clientId : process.env.SFORCE_CLIENT_ID,
  clientSecret : process.env.SFORCE_SECRET,
  redirectUri : process.env.SFORCE_CALLBACK
});

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'rowan_is_great') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
})

app.post('/webhook/', function (req, res) {
    console.log('GOT REQUEST: '+req);
    console.log('BODY: '+req.body);

  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));    }
  }
  res.sendStatus(200);
});

var token = "CAANxaSNrKBYBAG2ybGaZCLtgS8Mk1TWmfduCyuPxWLiVXnLnIwZBEawWcQ9ZA31zw6NnsJLt1tZAtiHixNqogs54k2FR28YEZBTtRce2kNXpTqXWibPIyLkMhYL2rkuKQ4sWmalXgQZAAsW7hn7n9fZB5TnRl2wdh25IF9dyyLp5JsQN9ZBGbGFhZC7iNptgwLr4ZD";

function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

// token:
// CAANxaSNrKBYBAG2ybGaZCLtgS8Mk1TWmfduCyuPxWLiVXnLnIwZBEawWcQ9ZA31zw6NnsJLt1tZAtiHixNqogs54k2FR28YEZBTtRce2kNXpTqXWibPIyLkMhYL2rkuKQ4sWmalXgQZAAsW7hn7n9fZB5TnRl2wdh25IF9dyyLp5JsQN9ZBGbGFhZC7iNptgwLr4ZD

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


        pgutil.upsertAccess(access);
        res.send(fs.readFileSync('html/auth_success.html', 'utf8'));
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
