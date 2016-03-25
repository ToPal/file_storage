'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');

var Storage = function (filename, params, cb) {
    if (!filename) throw new Error('filename must be specified');

    var _params = (typeof(params) === 'object') ? params : {};
    var _cb = (arguments.length === 3) ? cb : (typeof(params) === 'function') ? params : null;

    this.filename = filename;
    this.repairfilename = filename + '_temp';
    if (!fs.existsSync(path.dirname(filename))) {
        fs.mkdirSync(path.dirname(filename));
    }

    var savePeriod = parseInt(_params.savePeriod, 10);
    this.savePeriod = (!isNaN(savePeriod)) ? savePeriod : 10;
    this.log = (_params.log === undefined) ? console.log : _params.log;
    this.pretty = (_params.pretty === true);

    var self = this;
    this.loadData(function (err) {
        _cb(err, self.data);
        if (!err) self.demon();
    });
};

Storage.prototype = {
    fileAction: function (filename, openFlag, cb, action) {
        var fileHandle = 0;
        async.waterfall([
            function (callback) {
                fs.open(filename, openFlag, callback);
            },
            function (fh, callback) {
                fileHandle = fh;
                action(fileHandle, callback);
            }
        ], function (err) {
            if (fileHandle === 0) return cb(err);
            fs.close(fileHandle, function (closingErr) {
                if (closingErr) console.log('Error while closing file %s: %s', filename, err.message);
                return cb(err);
            });
        });
    },
    
    getTextToSave: function () {
        var objectToSave = {
            timeStamp: (new Date()).getTime(),
            data: this.data
        };
        
        if (this.pretty) {
            return JSON.stringify(objectToSave, null, '  ');
        } else {
            return JSON.stringify(objectToSave);
        }
    },

    saveData: function (cb) {
        var strData = JSON.stringify(this.data);
        if (strData === this.strData)
            return cb(null);

        var self = this;
        async.waterfall([
            function asyncSaveToRepairFile (callback) {
                self.fileAction(self.repairfilename, 'w', callback, function (fileHandle, faCallback) {
                    fs.writeFile(fileHandle, self.getTextToSave(), faCallback);
                });
            },
            function asyncRenameFile (callback) {
                if (!fs.existsSync(self.repairfilename)) {
                    console.log('repair file is not exists');
                    console.log('we wrote ', self.getTextToSave());
                }
                fs.rename(self.repairfilename, self.filename, callback);
            }
        ], cb);
    },
    
    loadDataFromOnlyFile: function (fileName, cb) {
        if (!fs.existsSync(fileName)) return cb(null, null);
        
        var resultObject = {};
        this.fileAction(fileName, 'r', function (err) {
            cb(err, resultObject);
        }, function (fileHandle, callback) {
            fs.readFile(fileHandle, 'utf8', function (err, content) {
                if (err) return callback(err);
                if (content == '') {
                    resultObject = { timeStamp: 0, data: {} };
                    return callback(null);
                }
                
                try {
                    resultObject = JSON.parse(content);
                } catch (e) {
                    return callback(new Error('Incorrect file format'));
                }
                if (
                    (resultObject.timeStamp === undefined) ||
                    (resultObject.data      === undefined)
                   ) {
                    return callback(new Error('Incorrect file format'));
                }
                
                return callback(null);
            });
        });
    },

    loadData: function (cb) {
        var self = this;
        async.waterfall([
            function (callback) {
                self.loadDataFromOnlyFile(self.filename, callback);
            },
            function (mainData, callback) {
                self.loadDataFromOnlyFile(self.repairfilename, 
                    (err, repairData) => callback(err, mainData, repairData));
            },
            function (mainData, repairData, callback) {
                if ((!mainData) && (!repairData)) return callback(null, {});
                if (!mainData) return callback(null, repairData);
                if (!repairData) return callback(null, mainData);
                
                callback(null, 
                    ((mainData || {}).timeStamp > (repairData || {}).timeStamp) ? 
                        mainData : repairData);
            }
        ], function (err, timedData) {
            if (err) return cb(err);
            self.data = timedData.data;
            if (!self.data) self.data = {};
            cb(null, self.data);
        });
    },

    demon: function () {
        if (this.timer === false) return null;
        
        var self = this;
        self.saveData(function (err) {
            if (err) self.log('Error while saving data: %s', err.message);
            
            if (self.timer !== false) {
                self.timer = setTimeout(self.demon.bind(self), self.savePeriod*1000);
            }
        });
    },
    
    stop: function () {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = false;
    }
};

module.exports = Storage;