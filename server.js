"use strict";
console.log("Loading server / modules");

var basicAuth = require('express-basic-auth');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var crypto = require('crypto');

var authentication = require('./server/authentication/authentication');
var db = require('./server/storage/database');
var apiroutes = require('./server/apiRoutes');
var init = require('./server/init/init');
var interrupts = require('./server/init/sensorInterrupts');

// User Authentication
app.use(basicAuth({
 authorizer: authentication.authenticateUser,
 authorizeAsync: true,
 challenge: true,
    realm: 'PiHomeMonitoringSystem',
    unauthorizedResponse: 'Unauthorized. Please ensure your browser supports BASIC authentication and the username/password is correct'
}));

if (process.env.NODE_ENV === "production") {
    var Gpio = require("pigpio").Gpio;
    process.env.PORT = 80;
} else {
    var Gpio = require("pigpio-mock").Gpio;
    process.env.PORT = 8880;
}

//////////////////////
// Sensor interrupts
//////////////////////
console.log("Loading server functions");
db.changeWemoPassword(crypto.randomBytes(20).toString('hex'), function () {
    init.initialize(app, Gpio);
    interrupts.setupInterrupts(app);
});

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

db.addLog("system", "Server Starting", "", {});
console.log("Server startup complete");
