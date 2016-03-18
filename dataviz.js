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
