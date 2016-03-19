"use strict";

module.exports = {
    calculateDiff : calculateDiff
}

var s3 = require('./s3.js');

function calculateDiff (orgid, path, current, callback) {
    console.log('CALC DIFF');

    s3.getVersion(orgid, path, 6, function (data) {

        console.log('got version');

        var prev = JSON.parse(data.toString());
        getdiff(current, prev),
        callback(current);
    });

}

function getdiff(current, prev) {

    console.log('DIFF');

    // aggregates
    var p_agg = prev.data.aggregates[0];
    var c_agg = current.data.aggregates[0];
    var delta_agg = c_agg.value - p_agg.value;
    if (delta_agg != 0) {
            current.data.aggregates[0].delta = delta_agg;
            console.log('Aggegate diff found: '+delta_agg);
    }
    // map each row to the first data cell value

    var objs = [];

    var p_row_map = mappifyRows(prev.data.rows, prev.headers, objs);
    var c_row_map = mappifyRows(current.data.rows, current.headers, objs);

    console.log('prev: '+JSON.stringify(p_row_map, null, 4));
    console.log('current: '+JSON.stringify(c_row_map, null, 4));


    var sobjs = _.union(_.keys(p_row_map), _.keys(c_row_map));

    console.log(sobjs);
    for (var i = 0; i < sobjs.length; i++ ) {
        var sobj = sobjs[i];
        console.log('eval: '+sobj);
        var p = p_row_map[sobj];
        var c = c_row_map[sobj];

        if (p && !c) {
            console.log('p has value, not c: '+p);
        }
        if (c && !p) {
            console.log('c has value, not p: '+c);
        }

        if (c && p) {
            for (var h = 0; h < current.headers.length; h++) {
                var header = current.headers[h].label;
                var pval = p[header];
                var cval = c[header];

                if (pval && !cval) {
                    console.log(header+' previous entry was deleted: '+pval);
                } else if (cval && !pval) {
                    console.log(header+' previous entry not present '+cval);
                } else {

                    if (_.isNumber(cval) && _.isNumber(pval)) {
                        var delta_val = cval - pval;
                        if (delta_val != 0) {
                            console.log('obj: '+sobj+' header: '+header+ ' delta: '+delta_val);
                            addDelta(current, sobj, header, delta_val);
                        }
                    } else if (cval != pval) {
                        console.log('obj: '+sobj+' header: '+header+ ' new: '+cval+ ' old: '+pval);
                        addDelta(current, sobj, header, {"old":pval});
                    }
                }

            }
        }

    }

    console.log('++++++++++++++++++++++++++');
    console.log(JSON.stringify(current, null, 4));

}

// known to be super slow
function addDelta (current, sobj, header, delta) {
    var header_index = indexOfHeader(current.headers, header);
    for (var row_i = 0; row_i < current.data.rows.length; row_i++ ) {
        var value = current.data.rows[row_i].dataCells[0].value;
        if (value === sobj) {
            current.data.rows[row_i].dataCells[header_index].delta = delta;
            return;
        }
    }
}

function indexOfHeader (headers, header) {
    for (var h = 0; h < headers.length; h++) {
        var label = headers[h].label;
        if (label === header) {
            return h;
        }
    }
}

function mappifyRows(rows, headers) {
    var row_map = {};
    for (var i = 0; i < rows.length; i++) {
        var rowmap = {};
        var row = rows[i].dataCells;
        var firstVal = row[0].value;

        for (var h = 0; h < headers.length; h++) {
            var header = headers[h].label;
            var value = row[h].value;

            // currency is stored w/ the currency type, we're ignoring that for now
            if (headers[h].dataType === 'currency') {
                value = row[h].value.amount;
            }
            rowmap[header] = value;
        }
        row_map[firstVal] = rowmap;
    }
    return row_map;
}
