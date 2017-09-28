/**
 * Any external OS calls will happen here
 */
var database = require('../storage/database');
var errors = require('../responses/errors');
var child_process = require('child_process');

module.exports = {
    getVersionReciever: function (req, res) {
        getCommitHash(function (out, err) {
            if (err !== "") {
                errors.Error500(1004, err, res);
            } else {
                res.send({"version": out.replace(/[\n\r]/g, '')});
            }
        })
    },

    gitPull: function (req, res) {
        pullLatestServer(function (out, err) {
            res.send({"log": out + " " + err});
            shutdownHandler("reboot", function () {
                database.addLog(0, "Shutdown/Reboot Initiated", "", {'req': req});
            })
        })
    },

    shutdownRecieverInternal: function (op) {
        database.addLog(0, "Shutdown/Reboot Initiated", "", {'req': req});
        shutdownHandler(req.query.op, function (msg) {
        });
    }
};

function shutdownHandler(op, callback) {
    if (op == "shutdown") {
        child_process.execFile('shutdown', ['now'], function (error, stdout, stderr) {
            callback(stdout);
        });
    } else if (op == "reboot") {
        child_process.execFile('shutdown', ['-r', 'now'], function (error, stdout, stderr) {
            callback(stdout);
        });
    }
}

function getCommitHash(callback) {
    child_process.execFile('git', ['rev-parse', 'HEAD'], function (error, stdout, stderr) {
        callback(stdout, stderr);
    });
}

function pullLatestServer(callback) {
    child_process.execFile('git', ['pull'], function (error, stdout, stderr) {
        callback(stdout, stderr);
    });
}
