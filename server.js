"use strict";
console.log("Loading server / modules");

var sys = require('util')
var exec = require('child_process').exec;
var basicAuth = require('express-basic-auth');
var express = require('express');
var bodyParser = require('body-parser');
var FauxMo = require('fauxmojs');
var fs = require('fs');
var app = express();
var sha1 = require('sha1');
var authentication = require('./server/authentication/authentication');

// User Authentication
/*app.use(basicAuth({
 authorizer: authentication.autenticateUser,
 authorizeAsync: true,
 challenge: true,
 realm: 'Level 1+ access required',
 unauthorizedResponse: 'Unauthorized.'
 }))*/

if (process.env.NODE_ENV === "production") {
    var Gpio = require("pigpio").Gpio;
    process.env.PORT = 80;
} else {
    var Gpio = require("pigpio-mock").Gpio;
    process.env.PORT = 8080;
}

//////////////////////
// Read data files
//////////////////////
console.log("Reading settings and initializing IO objects");

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


//////////////////////
// GPIO Setup
//////////////////////

// Create the outlet / lights objects.
var wemoFakes = [];
var wemoPort = 10100;
ioObjects["outletlights"] = {};
status["lights"] = []; // Clear the old light data

for (var key in ioPorts["outletlights"]) {
    (function (key) {
        var pin = ioPorts["outletlights"][key];
        ioObjects["outletlights"][pin] = new Gpio(pin, {mode: Gpio.OUTPUT})
        ioObjects["outletlights"][pin].digitalWrite(1); // Off
        status["lights"].push({"name": key, "id": pin, "status": "off"});

        // Create Fake WeMo object
        wemoFakes.push({
                name: key,
                port: wemoPort,
                handler: (action) => {
                if (toggleLights(action, pin) == "Success")
        {
            addLog(2, "light " + action, pin + " triggered from Alexa", {}); // TODO: Hydrate the id with name
        }
    }
    })
        ;
    })(key);
    wemoPort++;
}
status["numLightsOn"] = 0;

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
    addLog(2, "opening curtains", "triggered from Alexa", {});
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


//////////////////////
// Sensor interrupts
//////////////////////
console.log("Loading server functions");

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
            addLog(1, "door opened", "www/logs/" + timestamp + ".jpg", {});

            // Take picture if the door is open
            exec("fswebcam -r 1280x960 www/logs/" + timestamp + ".jpg", puts);
        } else {
            addLog(1, "door closed", "", {});
        }
    });

    ioObjects["pirSensor"].on('interrupt', function (level) {
        status["motion"] = level;
    });
}


//////////////////////
// Handle Requests
//////////////////////

// The request body is received on GET or POST.
// A middleware that just simplifies things a bit.
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

// Keep log of when the server was last online
function updateLastOnline() {
    fs.writeFile('data/lastonline.json', JSON.stringify(new Date()), 'utf8', function (err, data) {
    });
}

// Shell Functions
function puts(error, stdout, stderr) {
    sys.puts(stdout)
}

//////////////////////
// Express Server
//////////////////////
console.log("Starting the server");

//fs.writeFile('data/configuration.json', JSON.stringify(ioPorts));

// REST
var apiroutes = require('./server/apiRoutes');
app.use('/api', apiroutes);

app.use('/', express.static(__dirname + '/www/'));
app.use('/admin/db/', express.static(__dirname + '/data/'));

// Express start listening
app.listen(process.env.PORT);
console.log('Listening on port ' + process.env.PORT);

// Add Logs
try {
    var data = JSON.parse(fs.readFileSync('data/lastonline.json'));
    addLog(1, "Server Unexpected Shutdown Detected", data, {});
} catch (err) {
    console.log("No previous online log file found. Ignoring");
}
//addLog(1, "Server Starting", "", {});

// Fake WeMo emulation
var fauxMo = new FauxMo(
    {
        ipAddress: '192.168.1.142',
        devices: wemoFakes
    });

// Start Aux functions
updateLastOnline();
setInterval(updateLastOnline, 60000 * 5);

console.log("Server startup complete")


app.set('ioObjects', ioObjects);
