/**
 * Contains the controller for the router routes
 */

var database = require('./storage/database');
var lights = require('./hardware/lights');
var blinds = require('./hardware/blinds');
var errors = require('./responses/errors');

module.exports = {
    // Handle incoming requests
    getStatus: function (req, res) { // Get the current status of the system    Kept for legacy reasons
        var status = res.app.get('status')
        var statusObj = {
            "door": status["door"],
            "motion": status["motion"],
            "power": 0,
            "ftp": 0,
            "blinds": status["blindsStatus"],
            "lightsOn": status["numLightsOn"]
        };
        res.send(statusObj);
    },

    getHistory: function (req, res) { // Get the last 10 pictures
        database.retrieveHistory(function (history, err) {
            if (err === "") {
                res.send(history);
            } else {
                errors.Error500(1003, err, res);
            }
            database.addLog(0, "history view", "", {'req': req}); // TODO: Lookup userID
        });
    },

    getLights: lights.getLights,
    postLights: lights.toggleLightsReciever,
    postBlinds: blinds.toggleBlindsReciever
};
