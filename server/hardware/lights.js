/**
 * Contains functions to control the lights
 */
var fileJson = require('../storage/fileJson');
var database = require('../storage/database');

module.exports = {
    getLights: function (req, res) { // Get the current status of the lights
        res.send({"lights": res.app.get("status")["lights"]});
    },

    toggleLightsReciever: function (req, res) {
        var result = toggleLights(req.query.onoff, req.query.id, req);
        database.addLog(0, "light " + req.query.onoff, req.query.id, {'req': req}); // TODO: Hydrate the id with name
        res.send(result);
    }
};

// toggleLights toggles the light id on or off and stops after a predefined amount of time
function toggleLights(onoff, id, req) {
    var status = req.app.get("status");
    var ioObjects = req.app.get("ioObjects");
    var i;
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
    return ("Failure");
}
