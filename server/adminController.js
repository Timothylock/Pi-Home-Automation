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
            errors.Error400(1003, "Please request a max row between 0 and 300");
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
        if (req.query.timestamp === undefined) {
            errors.Error400(1003, "Missing parameter - timestamp", res);
            return;
        }

        database.deleteLog(req.query.timestamp, function () {
            success.Success200(res);
        });
    },

    getUsers: function (req, res) {
        database.getUsers(function (rows, err) {
            if (err === null) {
                res.send(rows);
            } else {
                errors.Error500(1003, err, res);
            }
        });
    },

    addUser: function (req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var realname = req.body.realName;
        var accesslevel = req.body.accessLevel;

        if (username === undefined) {
            errors.Error400(1003, "Missing parameter - username", res);
            return;
        }

        if (password === undefined) {
            errors.Error400(1003, "Missing parameter - password", res);
            return;
        }

        if (accesslevel === undefined) {
            accesslevel = 1;
        }

        database.addUser(username, password, realname, accesslevel, function () {
            success.Success200(res);
        });
    },

    deleteUser: function (req, res) {
        var username = req.query.username;

        if (username === "") {
            errors.Error400(1003, "Missing parameter - username");
        }

        database.deleteUser(username, function () {
            success.Success200(res);
        });
    }
};
