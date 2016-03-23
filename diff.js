"use strict";

module.exports = {
    evaldiff : evaldiff
}

var s3 = require('./s3.js');
var _ = require('underscore');

function evaldiff(current, prev, callback) {

    var new_count = 0;
    var changed_count = 0;
    var deleted_count = 0;

    //console.log('DIFF');
    var delta = _.clone(current);

    // aggregates
    var p_agg = prev.data.aggregates[0];
    var c_agg = current.data.aggregates[0];
    var delta_agg = c_agg.value - p_agg.value;
    if (delta_agg != 0) {
            delta.data.aggregates[0].delta = delta_agg;
            //console.log('Aggegate diff found: '+delta_agg);
    }
    // map each row to the first data cell value

    var objs = [];

    var p_row_map = mappifyRows(prev.data.rows, prev.headers, objs);
    var c_row_map = mappifyRows(current.data.rows, current.headers, objs);

    // console.log('prev: '+JSON.stringify(p_row_map, null, 4));
    // console.log('current: '+JSON.stringify(c_row_map, null, 4));


    var sobjs = _.union(_.keys(p_row_map), _.keys(c_row_map));

    //console.log(sobjs);
    for (var i = 0; i < sobjs.length; i++ ) {
        var sobj = sobjs[i];
        //console.log('eval: '+sobj);
        var p = p_row_map[sobj];
        var c = c_row_map[sobj];

        var delta_found = false;

        if (c && p) {
            for (var h = 0; h < current.headers.length; h++) {
                var header = current.headers[h].label;
                var pval = p[header];
                var cval = c[header];

                if (pval && !cval) {
                    //console.log(header+' previous entry was deleted: '+pval);
                } else if (cval && !pval) {
                    //console.log(header+' previous entry not present '+cval);
                } else {

                    if (_.isNumber(cval) && _.isNumber(pval)) {
                        var delta_val = cval - pval;
                        if (delta_val != 0) {
                            console.log('DELTA: obj: '+sobj+' header: '+header+ ' delta: '+delta_val);
                            addDelta(delta, sobj, header, delta_val);
                            delta_found = true;
                        }
                    } else if (cval != pval) {
                        console.log('DELTA: obj: '+sobj+' header: '+header+ ' new: '+cval+ ' old: '+pval);
                        addDelta(delta, sobj, header, {"old":pval});
                        delta_found = true;
                    }
                }

            }
        }

        if (delta_found) {
            changed_count++
        }
        if (p && !c) {
            //console.log('p has value, not c: '+p);
            deleted_count++;
        }
        if (c && !p) {
            //console.log('c has value, not p: '+c);
            new_count++;
        }


    }

    // console.log('++++++++++++++++++++++++++');
    // console.log(JSON.stringify(delta, null, 4));

    callback(delta, new_count, deleted_count, changed_count);
}

// known to be super slow
function addDelta (delta, sobj, header, change) {
    var header_index = indexOfHeader(delta.headers, header);
    for (var row_i = 0; row_i < delta.data.rows.length; row_i++ ) {
        var value = delta.data.rows[row_i].dataCells[0].value;
        if (value === sobj) {
            delta.data.rows[row_i].dataCells[header_index].delta = change;
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

                //console.log('header: '+h+' row: '+JSON.stringify(row, null, 4));
                if (row[h].value) {
                    value = row[h].value.amount;
                }
            }
            rowmap[header] = value;
        }
        row_map[firstVal] = rowmap;
    }
    return row_map;
}
