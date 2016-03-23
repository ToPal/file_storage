var Storage = require('./file_storage');

var fs = require('fs');
var async = require('async');

var testDir = './test';
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
var mainfn = testDir + '/test.json';
var repairfn = testDir + '/test.json_temp';

function createFileWithData(fileName, fileData) {
    var fileText = JSON.stringify(fileData);
    var filename = fileName;
    
    fs.writeFileSync(filename, fileText);
}

function clearTestFiles() {
    if (fs.existsSync(mainfn)) fs.unlinkSync(mainfn);
    if (fs.existsSync(repairfn)) fs.unlinkSync(repairfn);
}

module.exports = {
    
    testMainFileReading: function (cb) {
        clearTestFiles();
        
        createFileWithData(mainfn, {
            timeStamp: 1234567,
            data: {
                testIsOk: true
            }
        });
        
        var storage = new Storage(mainfn, {}, function (err, data) {
            if (err) return cb(err);
            if (data.testIsOk !== true) return cb(new Error('read bad data: ' + JSON.stringify(data)));
            
            storage.stop();
            cb(null);
        });
    },
    
    testRepairFileReading: function (cb) {
        clearTestFiles();
        
        createFileWithData(repairfn, {
            timeStamp: 1234567,
            data: {
                testIsOk: true
            }
        });
        
        var storage = new Storage(mainfn, {}, function (err, data) {
            if (err) return cb(err);
            if (data.testIsOk !== true) return cb(new Error('readed bad data: ' + JSON.stringify(data)));
            
            storage.stop();
            cb(null);
        });
    },
    
    testFileSaving: {
        timeout: 3000,
        func: function (cb) {
            clearTestFiles();
            
            var storage;
            async.waterfall([
                function (callback) {
                    storage = new Storage(mainfn, { savePeriod: 1 }, callback);
                },
                function (data, callback) {
                    data.testData = 12345;
                    setTimeout(() => callback(null), 1500);
                },
                function (callback) {
                    storage.stop();
                    storage = new Storage(mainfn, {}, callback);
                },
                function (data, callback) {
                    if (data.testData !== 12345) return callback(new Error('IncorrectData: ' + JSON.stringify(data)));
                    callback(null);
                }
            ], function (err) {
                if (!err) storage.stop();
                setTimeout(() => cb(err), 600);
            });
        }
    },
    
    testRepairFileRemoving: {
        timeout: 3000,
        func: function (cb) {
            clearTestFiles();
            var storage;
            async.waterfall([
                function (callback) {
                    storage = new Storage(mainfn, { savePeriod: 1 }, callback);
                },
                function (data, callback) {
                    data.testData = 'abcdefg';
                    setTimeout(() => callback(null), 1200);
                },
                function (callback) {
                    storage.stop();
                    setTimeout(() => callback(null), 1200);
                },
                function (callback) {
                    if (fs.existsSync(repairfn)) return callback(new Error('Repair file is not removed'));
                    callback(null);
                }
            ], function (err) {
                cb(err);
            });
        }
    }
    
};