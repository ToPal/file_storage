'use strict';

var async = require('async');
var Timeout = require('node-timeout');

var test = require('./testCases');

var funcKeys = Object.keys(test);
var currentKey = '';
async.mapSeries(funcKeys, function (key, cb) {
    
    currentKey = key;
    var func = test[key];
    var timeLimit = 2000;
    
    if (typeof(func) == 'object') {
        timeLimit = func.timeout || timeLimit;
        func = func.func;
    }
    
    var limit = new Timeout(timeLimit, {err: new Error('timeout')});
    
    console.log('started test: %s', key);
    func(limit(cb));
    
}, function (err, res) {
    if (err) {
        throw new Error('[' + currentKey + '] ' + err.message);
    }
    
    console.log('tests is ok');
});