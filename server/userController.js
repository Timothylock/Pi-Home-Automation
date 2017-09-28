/**
 * Contains the controller for the router routes
 */

var database = require('./storage/database');
var lights = require('./hardware/lights');
var blinds = require('./hardware/blinds');
var success = require('./responses/success');
var errors = require('./responses/errors');
var execute = require('./os/execute');
var authentication = require('./authentication/authentication');

const disabled = "Your account has been disabled. Please contact the owner.";

module.exports = {
    // getStatus returns the overall status of the system
    getStatus: function (req, res) {
        authentication.requiredLevel(req, 0, function (allow, err) {
            if (err !== null) {
                errors.Error500(1003, err, res);
                return;
            }

            if (!allow) {
                errors.Error403(1007, disabled, res);
                return;
            }

            var status = res.app.get('status');
            var statusObj = {
                "door": status["door"],
                "motion": status["motion"],
                "blinds": status["blindsStatus"],
                "lightsOn": status["numLightsOn"]
            };
            res.send(statusObj);
        });
    },

    getHistory: function (req, res) { // Get the last 10 pictures
        authentication.requiredLevel(req, -1, function (allow, err, user) {
            if (err !== null) {
                errors.Error500(1003, err, res);
                return;
            }

            if (!allow) {
                errors.Error403(1007, disabled, res);
                return;
            }

            database.retrieveHistory(function (history, err) {
                if (err === "") {
                    res.send(history);
                } else {
                    errors.Error500(1003, err, res);
                }
                database.addLog(user["username"], "history view", "", {'req': req});
            });
        });
    },

    getLights: function (req, res) {
        authentication.requiredLevel(req, 0, function (allow, err) {
            if (err !== null) {
                errors.Error500(1003, err, res);
                return;
            }

            if (!allow) {
                errors.Error403(1007, disabled, res);
                return;
            }

            res.send(lights.getLights(res));
        });
    },

    postLights: function (req, res) {
        authentication.requiredLevel(req, 1, function (allow, err, user) {
            if (err !== null) {
                errors.Error500(1003, err, res);
                return;
            }

            if (!allow) {
                errors.Error403(1007, "Your account does not have permissions to control lights", res);
                return;
            }

            var result = lights.toggleLights(req.query.onoff, req.query.id, req);

            database.addLog(user["username"], "light " + req.query.onoff, req.query.id, {'req': req}); // TODO: Hydrate the id with name

            if (result === "Success") {
                success.Success200(res)
            } else {
                errors.Error500(1002, result, res);
            }
        });
    },

    postBlinds: function (req, res) {
        authentication.requiredLevel(req, 1, function (allow, err, user) {
            if (err !== null) {
                errors.Error500(1003, err, res);
                return;
            }

            if (!allow) {
                errors.Error403(1007, "Your account does not have permissions to control blinds", res);
                return;
            }

            var result = blinds.toggleBlinds(req.query.set, req);

            if (result === "Success" && req.query.set === "1") {
                success.Success200(res);
                database.addLog(user["username"], "opening curtains", "", {'req': req});
            } else if (result === "Success" && req.query.set === "0") {
                success.Success200(res);
                database.addLog(user["username"], "closing curtains", "", {'req': req});
            } else {
                errors.Error500("1024", result, res);
            }
        });
    }
};
