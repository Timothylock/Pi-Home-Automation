/**
 * Contains the controller for the admin router routes
 */

var database = require('./storage/database');
var admin = require('./admin/admin');
var execute = require('./os/execute');
var errors = require('./responses/errors');
var success = require('./responses/success');

module.exports = {
    postShutdown: admin.shutdownReciever,
    postUpdate: execute.gitPull,

    getVersion: execute.getVersionReciever,

    getLogs: function (req, res) {
        if (req.query.max < 1 || req.query.max > 300) {
            errors.Error500(1003, "Please request a max row between 0 and 300");
            return;
        }

        database.retrieveLogs(200, function (logs, err) {
            if (err === null) {
                res.send(logs);
            } else {
                errors.Error500(1003, err, res);
            }
        });
    },

    deleteLog: function (req, res) {
        if (req.query.timestamp === "" || req.query.timestamp == null) {
            errors.Error500(1003, "Missing parameter - timestamp", res);
            return;
        }

        database.deleteLog(req.query.timestamp, function () {
            success.Success200(res);
        });
    }
};
