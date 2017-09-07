/**
 * Functions for the blinds
 */
var fileJson = require('../storage/fileJson');
var database = require('../storage/database');

module.exports = {
    // toggleBlinds toggles the blinds to either be open or closed
    toggleBlinds: function (openclose, req) {
        var status = req.app.get("status");
        var ioObjects = req.app.get("ioObjects");

        // Only change if blinds not currently in motion
        if (status["blindsMotion"] == 0) {
            if (openclose == "1") {
                if (status["blindsStatus"] == 1) {
                    return ("Blinds already closed!");
                } else {
                    ioObjects["blinds"]["open"].digitalWrite(0);
                    status["blindsStatus"] = 1;
                    status["blindsMotion"] = 1;
                    setTimeout(function () {
                        stopBlinds(req);
                    }, 9900);
                    fileJson.writeStatus(status);
                    req.app.set('status', status);
                    return ("Success");
                }
            } else {
                if (status["blindsStatus"] == 0) {
                    return ("Blinds already closed!");
                } else {
                    ioObjects["blinds"]["close"].digitalWrite(0);
                    status["blindsStatus"] = 0;
                    status["blindsMotion"] = 1;
                    setTimeout(function () {
                        stopBlinds(req);
                    }, 9100);
                    fileJson.writeStatus(status);
                    req.app.set('status', status);
                    return ("Success");
                }
            }
        } else {
            return ("Blinds already in motion!");
        }
    }
};

// stopBlinds stops all the pins for the blinds thus stopping the blinds
function stopBlinds(req) {
    var status = req.app.get("status");
    var ioObjects = req.app.get("ioObjects");

    ioObjects["blinds"]["close"].digitalWrite(1);
    ioObjects["blinds"]["open"].digitalWrite(1);
    status["blindsMotion"] = 0;
    req.app.set('status', status);
    fileJson.writeStatus(status);
}
