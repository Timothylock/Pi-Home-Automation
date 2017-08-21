/**
 * Initializes the gpio pins
 */
var database = require('../storage/database');
var fs = require('fs');
var FauxMo = require('fauxmojs');

module.exports = {
    initialize: function (app, Gpio) {
        // Import the port numbers and create the associated objects for them
        var ioPorts = {};
        var ioObjects = {};

        try {
            ioPorts = JSON.parse(fs.readFileSync('data/configuration.json'));
        } catch (err) {
            console.log("\n\n\n\n==================\n=       ERROR       =\n==================\n\n");
            console.log("Configuration file was NOT found. This must be generated before this server starts.");
            console.log("Please run \"python configure.py\" to generate the file first!");
            process.exit(-1);
        }

        // Read Previous Data
        try {
            var status = JSON.parse(fs.readFileSync('data/status.json'));
            app.set('status', status);
            status["blindsMotion"] = 0; // Bug when server shutdown when blinds moving
        } catch (err) {
            console.log("No previous status file found. Generating new one");
            var status = {"blindsMotion": 0, "blindsStatus": 0, "door": 0, "motion": 0, "lights": [], "numLightsOn": 0};
            app.set('status', status);
        }


        // Create the outlet / lights objects.
        var wemoFakes = [];
        var wemoPort = 10100;

        ioObjects["outletlights"] = {};
        status["lights"] = []; // Clear the old light data

        for (var key in ioPorts["outletlights"]) {
            (function (key) {
                var pin = ioPorts["outletlights"][key];
                ioObjects["outletlights"][pin] = new Gpio(pin, {mode: Gpio.OUTPUT});
                ioObjects["outletlights"][pin].digitalWrite(1); // Off
                status["lights"].push({"name": key, "id": pin, "status": "off"});

                // Create Fake WeMo object
                wemoFakes.push({
                        name: key,
                        port: wemoPort,
                        handler: (action) => {
                        if (toggleLights(action, pin) == "Success")
                {
                    database.addLog(2, "light " + action, pin + " triggered from Alexa", {}); // TODO: Hydrate the id with name
                }
            }
            })
                ;
            })(key);
            wemoPort++;
        }
        status["numLightsOn"] = 0;

        // Fake WeMo emulation
        var fauxMo = new FauxMo(
            {
                ipAddress: '192.168.1.142',
                devices: wemoFakes
            });

// Create the blinds object
        ioObjects["blinds"] = {};
        ioObjects["blinds"]["open"] = new Gpio(ioPorts["blinds"]["open"], {mode: Gpio.OUTPUT});
        ioObjects["blinds"]["close"] = new Gpio(ioPorts["blinds"]["close"], {mode: Gpio.OUTPUT});

// Create Fake WeMo object for blinds
        wemoFakes.push({
                name: "blinds",
                port: wemoPort,
                handler: (action) => {
                if (action == "on")
        {
            action = "0";
        }
        else
        {
            action = "1";
        }
        if (toggleBlinds(action) == "Success") {
            database.addLog(2, "opening curtains", "triggered from Alexa", {});
        }
    }
    })
        ;

// Create the sensor objects
        ioObjects["doorSensor"] = new Gpio(ioPorts["doorSensor"], {
            mode: Gpio.INPUT,
            pullUpDown: Gpio.PUD_UP,
            edge: Gpio.EITHER_EDGE
        });

        ioObjects["pirSensor"] = new Gpio(ioPorts["pirSensor"], {
            mode: Gpio.INPUT,
            edge: Gpio.EITHER_EDGE
        });

// Turn everything off
        ioObjects["blinds"]["open"].digitalWrite(1);
        ioObjects["blinds"]["close"].digitalWrite(1);

        app.set("ioObjects", ioObjects);
        app.set("ioPorts", ioPorts);

        // Add Logs
        try {
            var data = JSON.parse(fs.readFileSync('data/lastonline.json'));
            database.addLog(1, "Server Unexpected Shutdown Detected", data, {});
        } catch (err) {
            console.log("No previous online log file found. Ignoring");
        }
    }
};
