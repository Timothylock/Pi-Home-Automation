/**
 * Contains functions to control the lights
 */
var fileJson = require('../storage/fileJson');
var database = require('../storage/database');
var errors = require('../responses/errors');
var success = require('../responses/success');

module.exports = {
    // getLights gets the status of the lights
    getLights: function (res) {
        return ({"lights": res.app.get("status")["lights"]});
    },

    // toggleLights toggles the light id on or off and stops after a predefined amount of time
    toggleLights: function (onoff, id, req) {
        var status = req.app.get("status");
        var ioObjects = req.app.get("ioObjects");
        var i;

        if (id === undefined) {
            return ("Missing parameter - id");
        }

        if (onoff !== "on" && onoff !== "off" && onoff !== undefined) {
            return ("Missing parameter - onoff. Expects an 'on' or 'off'");
        }

        if (onoff == "on") {
            if (id in ioObjects["outletlights"]) {
                ioObjects["outletlights"][id].digitalWrite(0);
                for (i = 0; i < status["lights"].length; i++) {
                    if (status["lights"][i]["id"] == id) {
                        status["lights"][i]["status"] = "on";
                        status["numLightsOn"]++;
                        fileJson.writeStatus(status);
                        req.app.set('status', status);
                        return ("Success");
                    }
                }
            }
        } else {
            if (id in ioObjects["outletlights"]) {
                ioObjects["outletlights"][id].digitalWrite(1);
                for (i = 0; i < status["lights"].length; i++) {
                    if (status["lights"][i]["id"] == id) {
                        status["lights"][i]["status"] = "off";
                        status["numLightsOn"]--;
                        fileJson.writeStatus(status);
                        req.app.set('status', status);
                        return ("Success");
                    }
                }
            }
        }

        return ("Light ID of " + id + " not found");

    }
};

