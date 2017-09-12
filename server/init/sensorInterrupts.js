/**
 * Handles interrupts for sensors
 */
var database = require('../storage/database');

exports.setupInterrupts = function (app) {
    ioObjects = app.get("ioObjects");
    ioPorts = app.get("ioPorts");
    status = app.get("status");

    if (process.env.NODE_ENV === "production") {
        // Handle any interrupts on the sensors
        ioObjects["doorSensor"].on('interrupt', function (level) {
            status["door"] = level;
            // Also trigger hallway lights
            ioObjects["outletlights"][ioPorts["outletlights"]["Hallway Floor Lights"]].digitalWrite(Math.abs(level - 1));

            if (Math.abs(level - 1) == 1) {  // TODO: Figure out why there are more "on"s then off before adding light counter code
                status["lights"][1]["status"] = "on";
            } else {
                status["lights"][1]["status"] = "off";
            }

            if (level == 1) {
                var timestamp = (new Date).getTime();
                database.addLog("system", "door opened", "www/logs/" + timestamp + ".jpg", {});

                // Take picture if the door is open
                database.takePicture("www/logs/" + timestamp + ".jpg");
            } else {
                database.addLog("system", "door closed", "", {});
            }
        });

        ioObjects["pirSensor"].on('interrupt', function (level) {
            status["motion"] = level;
        });
    }
    app.set("status", status);
};

