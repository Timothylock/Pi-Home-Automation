"use strict";
console.log("Loading server / modules");

var sys = require('util')
var exec = require('child_process').exec;
var basicAuth = require('express-basic-auth');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var sha1 = require('sha1');
var authentication = require('./server/authentication/authentication');
var db = require('./server/storage/database');
var apiroutes = require('./server/apiRoutes');
var init = require('./server/init/init');

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

// Read configs and set up gpio
init.initialize(app, Gpio);

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

// Shell Functions
function puts(error, stdout, stderr) {
    sys.puts(stdout)
}

//////////////////////
// Express Server
//////////////////////
console.log("Starting the server");

// REST
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies

app.use('/api', apiroutes);
app.use('/', express.static(__dirname + '/www/'));
app.use('/admin/db/', express.static(__dirname + '/data/'));

// Express start listening
app.listen(process.env.PORT);
console.log('Listening on port ' + process.env.PORT);

// Start Aux functions
require('./server/scheduled/scheduled');

db.addLog(1, "Server Starting", "", {});
console.log("Server startup complete");
