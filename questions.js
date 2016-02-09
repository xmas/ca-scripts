var commandLineArgs = require('command-line-args');
var querystring = require('querystring');
var moment = require('moment');

var cli = commandLineArgs([
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'server', alias: 's', type: String },
    { name: 'timeout', alias: 't', type: Number },
    { name: 'answer', alias: 'a', type: Number },
    { name: 'question', alias: 'q', type: Number},
    { name: 'eval', alias: 'e', type: Number},
    { name: 'create', alias: 'c', type: String},
    { name: 'tree', type: Boolean},
    { name: 'from', type: String},
    { name: 'to', type: String}

    //{ name: 'src', type: String, multiple: true, defaultOption: true }
])
var clargs = cli.parse();

console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
console.log(moment().subtract(300, 'days').format('YYYY-MM-DD'));


if (clargs.help) {
    console.log(cli.getUsage());
    process.exit(0);
}

var server = 'pushserver.currentactions.com';
if (clargs.server) {
    server = options.server;
}
var options = {
  host: server,
  port: 8080,
};

var parser = function parseQuestions (body) {
    var questions = JSON.parse(body);
    console.log(JSON.stringify(questions, null, 4));
}

var parserA = function parseAnswers (body, caller) {
    var answers = JSON.parse(body);
    console.log(caller);

    datePathCompare(answers);

}

function datePathCompare (answers) {

    console.log(JSON.stringify(answers, null, 4));

    var dataMap = new Map();
    for (var i = 0; i < answers.length; i++ ) {

        var answer = answers[i];
        var date = answer.date;
        var path = answer.path;
        var pathArray = dataMap.get(path);

        if (!pathArray) {
            pathArray = [];
            console.log('new obj for path: '+path);
        } else {
            console.log('EXISTING for path: '+path);
        }

        pathArray.push(answer);
        dataMap.set(path, pathArray);
    }

    for (var key of dataMap.keys()) {
      console.log('KEY   '+key);
      getDateStores(dataMap.get(key));
    }

}
//
function getDateStores (pathArray) {

    var Promise = require("bluebird");

    var promises = [];
    var stores = [];
    var elements = [];
    var http = require('http');


    var callFile = function(URLIndex){
        var element = pathArray[URLIndex];
        console.log('promising: '+element);
        promises.push(new Promise(function (resolve, reject) {
            //dataDir/date/path/store.json
            options.path = '/push/questions/data/'+element.dataDir+'/'+element.date+'/'+element.path+'/store.json';
            options.method = 'GET';

            getRequest (options, function(body) {
                elements.push(element);
                stores.push(JSON.parse(body));
                resolve();
            });
        }));
    };

    for (var i=0; i < pathArray.length; i++){
        callFile(i);
    }

    Promise.all(promises).then(function() {

        ///console.log('---------PROMISES DONE for  '+pathArray[0].path);

        // compare the returned files in storeMap
        compare (stores, elements);

    });

}

function compare (stores, elements) {

    var last;
    for (var i = 0 ; i < stores.length; i++) {

        if (last) {
            var current = stores[i];

            var diff = require('deep-diff');

            // current.data.aggregates[0].value = '6777';
            // last.data.aggregates[0].value = '56';

            var differences = diff(current, last);

            // var stack = new Error().stack
            // console.log( stack )

             //console.log(JSON.stringify(current));
            // console.log(JSON.stringify(last));


            console.log('Diff for date: '+elements[i].date +' VS '+elements[i-1].date);
            console.log(JSON.stringify(differences));

        } else {
            last = stores[i];
        }

    }
}

// console.log('STORE KEY: '+key+'  element: '+JSON.stringify(element));
// console.log(JSON.stringify(storeMap.get(key), null, 4));



function getRequest (http_options, callback, caller) {

    //console.log(http_options);

    var http = require('http');
    http.request(http_options, function(res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            // body is my JSON file
            callback(body, caller);
        });
    }).end();

}


function getFile (url) {

    var rest = require('rest');

    console.log('get: '+url);
    var val = rest(url).then(JSON.parse);
    console.log(val);

    return val;

}

var treeParser = function parseTree (body) {
    var questions = JSON.parse(body);
    //console.log(JSON.stringify(questions, null, 4));

    for (var i=0; i < questions.length; i++){
        var question = questions[i];

        //console.log('+++++++++'+JSON.stringify(question));
        var tags = question.tags;
        var tag_string = '';
        for (var tag_i=0; tag_i < tags.length; tag_i++){
            var tag = tags[tag_i];
            tag_string = tag_string + tag.name + ' ';
        }
        var ques = '--------Question: '+question.id+ '  Tags: '+tag_string;

        options.path = '/push/questions/'+question.id+'/answers';

        if (clargs.from || clargs.to) {
            options.path = options.path + '?';
        }

        if (clargs.from) {
            options.path = options.path + '&FROM='+clargs.from;
        }
        if (clargs.to) {
            options.path = options.path + '&TO='+clargs.to;
        }
        options.method = 'GET';
        getRequest(options, parserA, ques);

    }

}

if (clargs.question) {
    options.path = '/push/questions/'+clargs.question;
    options.method = 'GET';
    getRequest(options, parser);
} else if (clargs.answer) {
    options.path = '/push/questions/'+clargs.answer+'/answers';
    options.method = 'GET';

    if (clargs.from || clargs.to) {
        options.path = options.path + '?';
    }

    if (clargs.from) {
        options.path = options.path + '&FROM='+clargs.from;
    }
    if (clargs.to) {
        options.path = options.path + '&TO='+clargs.to;
    }

    getRequest(options, parser);
} else if (clargs.eval) {

    var post_options = {
        method: 'POST',
        host: server,
        port: 8080,
        path: '/push/questions/'+clargs.eval,
        headers: {
            'content-type': 'multipart/form-data; boundary=---011000010111000001101001'
        },
        formData: { data: undefined } };


    postRequest(post_options, parser);


} else if (clargs.create) {

    //console.log('create: '+clargs.create);


    // uploading a file is hard w/ node
    var fs = require("fs");
    var request = require("request");

    var options = { method: 'POST',
      url: 'http://pushserver.currentactions.com:8080/push/questions',
      headers: { 'postman-token': 'eba44f6f-bc86-bb6e-d121-15be852d8d51',
         'cache-control': 'no-cache',
         'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
     };

    var r = request.post(options, function (error, response, body) {
      if (error) throw new Error(error);

      console.log(body);
    });
    var form = r.form();

    form.append( 'dataSourceType', 'NONE');
    form.append( 'scriptType', 'NODE');
    form.append( 'dataType', 'FILE');
    form.append( 'tags', 'three');
    form.append( 'tags', 'four');

    form.append( 'script', fs.createReadStream( clargs.create ) );

} else if (clargs.tree) {

    options.path = '/push/questions/';
    options.method = 'GET';
    getRequest(options, treeParser);

}
else {
    options.path = '/push/questions';
    options.method = 'GET';
    getRequest(options, parser);
}


function postRequest (http_options, callback) {

    //console.log(http_options);

    var http = require('http');
    var req = http.request(http_options, function(res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            callback(body);
        });
    })

    //req.write(data);
    req.end();
}
