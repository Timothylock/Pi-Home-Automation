"use strict";
console.log("Loading server / modules");

var sys = require('util')
var exec = require('child_process').exec;
var express = require('express');
var basicAuth = require('express-basic-auth');
var bodyParser = require('body-parser');
var FauxMo = require('fauxmojs');
var fs = require('fs');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var sha1 = require('sha1');

// User Authentication
app.use(basicAuth( { authorizer: autenticateUser,
						authorizeAsync: true,
					    challenge: true,
                        realm: 'Level 1+ access required',
					    unauthorizedResponse: 'Unauthorized.' } ))

var Gpio = require('pigpio').Gpio;

//////////////////////
// DB Connection
//////////////////////

var db = new sqlite3.Database('data/home_monitor.db');

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
	console.log("Please run \"sudo python configure.py\" to generate the file first!");
	process.exit(-1);
}

// Read Previous Data
try {
	var status = JSON.parse(fs.readFileSync('data/status.json'));
	status["blindsMotion"] = 0; // Bug when server shutdown when blinds moving
} catch (err) {
	console.log("No previous status file found. Generating new one");
	var status = {"blindsMotion" : 0, "blindsStatus" : 0, "door" : 0, "motion" : 0, "lights" : [], "numLightsOn" : 0};
}




//////////////////////
// GPIO Setup
//////////////////////

// Create the outlet / lights objects.
var wemoFakes = [];
var wemoPort = 10100;
ioObjects["outletlights"] = {};
status["lights"] = []; // Clear the old light data

for (var key in ioPorts["outletlights"]){
	(function (key) {
		var pin = ioPorts["outletlights"][key];
		ioObjects["outletlights"][pin] = new Gpio(pin, {mode: Gpio.OUTPUT})
		ioObjects["outletlights"][pin].digitalWrite(1); // Off
		status["lights"].push({"name": key, "id": pin, "status":"off"});

		// Create Fake WeMo object
		wemoFakes.push({
			name : key,
			port : wemoPort,
			handler: (action) => {
				if (toggleLights(action, pin) == "Success") {
					addLog(2, "light " + action, pin + " triggered from Alexa", {}); // TODO: Hydrate the id with name
				}
			}
		});
  	})(key);
	wemoPort ++;
}
status["numLightsOn"] = 0;

// Create the blinds object
ioObjects["blinds"] = {};
ioObjects["blinds"]["open"] = new Gpio(ioPorts["blinds"]["open"], {mode: Gpio.OUTPUT});
ioObjects["blinds"]["close"] = new Gpio(ioPorts["blinds"]["close"], {mode: Gpio.OUTPUT});

// Create Fake WeMo object for blinds
wemoFakes.push({
	name : "blinds",
	port : wemoPort,
	handler: (action) => {
		if (action == "on"){
			action = "0";
		}else{
			action = "1";
		}
		if (toggleBlinds(action) == "Success") {
			addLog(2, "opening curtains", "triggered from Alexa", {});
		}
	}
});

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

// Handle any interrupts on the sensors
ioObjects["doorSensor"].on('interrupt', function (level) {
  status["door"] = level;
  // Also trigger hallway lights 
  ioObjects["outletlights"][ioPorts["outletlights"]["Hallway Floor Lights"]].digitalWrite(Math.abs(level-1));

  if(Math.abs(level-1) == 1){  // TODO: Figure out why there are more "on"s then off before adding light counter code
  	status["lights"][1]["status"] = "on";
  }else{
  	status["lights"][1]["status"] = "off";
  }
  
  if (level == 1){
  	var timestamp = (new Date).getTime();
  	addLog(1, "door opened", "www/logs/" + timestamp + ".jpg", {});
  	
  	// Take picture if the door is open
	exec("fswebcam -r 1280x960 www/logs/" + timestamp + ".jpg", puts);
  }else{
  	addLog(1, "door closed", "", {});
  }
});

ioObjects["pirSensor"].on('interrupt', function (level) {
	status["motion"] = level;
});










//////////////////////
// Handle Requests
//////////////////////

// The request body is received on GET or POST.
// A middleware that just simplifies things a bit.
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

// Handle incoming requests
function getStatus(req, res){ // Get the current status of the system    Kept for legacy reasons
	var statusObj = {"door": status["door"], "motion": status["motion"], "power": 0, "ftp": 0, "blinds": status["blindsStatus"], "lightsOn": status["numLightsOn"]};
	res.send(statusObj);
}

function getLights(req, res){ // Get the current status of the lights
	var statusObj = {"lights":status["lights"]};
	res.send(statusObj);
}

function getHistory(req, res){ // Get the last 10 pictures
	retrieveHistory(function(history) {
		res.send(history);
		addLog(0, "history view", "", {'req':req}); // TODO: Lookup userID
	});
}

function getTimer(req, res){ // Get the timer
    res.send(history);
    addLog("0, history view", "", {'req':req}); // TODO: Lookup userID
}

// Helper Functions
function toggleLightsReciever(req, res){
	toggleLights(req.query.onoff, req.query.id);
	addLog(0, "light " + req.query.onoff, req.query.id, {'req':req}); // TODO: Hydrate the id with name
	res.send("Success\n");
}

// Blinds function
function toggleBlindsReciever(req, res){
	var result = toggleBlinds(req.query.set);
	if (result == "Success" && req.query.set == "1") {
		addLog(0, "opening curtains", "", {'req':req}); // TODO: Lookup userID
	} else if (result == "Success" && req.query.set == "0") {
		addLog(0, "closing curtains", "", {'req':req}); // TODO: Lookup userID
	}
	res.send(result)
}

// Shutdown reciever
function shutdownReciever(req, res){
	if (res.query.pw == "pass") {
        res.send("success");
        addLog(0, res.query.op + " initiated", "SUCCESS", {'req':req}); // TODO: Lookup userID
        shutdownHandler(req.query.op);
	} else {
        res.status(403);
        res.send("Incorrect administrator secret");
        addLog(0, res.query.op + " attempted", "UNAUTHENTICATED", {'req':req}); // TODO: Lookup userID
	}
}

// Clear Cache Reciever
function clearCacheReciever(req, res){
	var files = fs.readdirSync("./www/logs/");
	files.sort(function(a, b) {
	               return fs.statSync("./www/logs/" + a).mtime.getTime() - 
	                      fs.statSync("./www/logs/" + b).mtime.getTime();
	           });
	history = files.slice(Math.max(files.length - 10, 0));
	history.splice(history.indexOf("log.csv"), 1); // Ensure the the log csv does not get included in the history
	res.send("success");
}

// Toggle the lights
function toggleLights(onoff, id) {
	var i;
	if (onoff == "on"){
		if(id in ioObjects["outletlights"]){
			ioObjects["outletlights"][id].digitalWrite(0);
			for(i = 0; i < status["lights"].length; i++){
				if(status["lights"][i]["id"] == id){
					status["lights"][i]["status"] = "on";
					status["numLightsOn"] ++;
					writeStatus();
					return("Success");
				}
			}
		}
	}else{
		if(id in ioObjects["outletlights"]){
			ioObjects["outletlights"][id].digitalWrite(1);
			for(i = 0; i < status["lights"].length; i++){
				if(status["lights"][i]["id"] == id){
					status["lights"][i]["status"] = "off";
                    status["numLightsOn"] --;
					writeStatus();
					return("Success");
				}
			}
		}
	}
}

function toggleBlinds(openclose) {
	// Only change if blinds not currently in motion
	if (status["blindsMotion"] == 0){
		if (openclose == "1"){
			if (status["blindsStatus"] == 1){
				return("Blinds already closed!");
			}else{
				ioObjects["blinds"]["open"].digitalWrite(0);
				status["blindsStatus"] = 1;
				status["blindsMotion"] = 1;
				setTimeout(stopBlinds, 9900);
				writeStatus();
				return("Success");
			}	
		}else{
			if (status["blindsStatus"] == 0){
				return("Blinds already closed!");
			}else{
				ioObjects["blinds"]["close"].digitalWrite(0);
				status["blindsStatus"] = 0;
				status["blindsMotion"] = 1;
				setTimeout(stopBlinds, 9100);
				writeStatus();
				return("Success");
			}	
		}
	}else{
		return("Blinds already in motion!");
	}
}

// Blinds Helper function to stop blinds
function stopBlinds(){
	ioObjects["blinds"]["close"].digitalWrite(1);
	ioObjects["blinds"]["open"].digitalWrite(1);
	status["blindsMotion"] = 0;
}

// Handles shutting down system
function shutdownHandler(op) {
	if (op == "shutdown") {
        exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
	} else if (op == "reboot") {
        exec('shutdown -r now', function(error, stdout, stderr){ callback(stdout); });
	}
}

// Add a specific data to the log (for remote connections)
function addLog(userid, action, details, opt){
	var ip, ua;
	if ('req' in opt){
		ip = opt['req'].headers['x-forwarded-for'] || opt['req'].connection.remoteAddress;
		ua = opt['req'].headers['user-agent'];
	}else{
		ip = "::ffff:127.0.0.1";
		ua = "localhost";
	}

	db.serialize(function() {
		db.run("INSERT INTO Log (userid, type, details, origin) VALUES (" + userid + ",\"" + action + "\",\"" + details + "\",\"" + ip + ua.replace(/,/g , "---") + "\")");
	});
}

// Keep log of when the server was last online
function updateLastOnline(){
	fs.writeFile('data/lastonline.json', JSON.stringify(new Date()), 'utf8', function (err, data){});
}

// Write status to a file
function writeStatus(){
	fs.writeFile('data/status.json', JSON.stringify(status), 'utf8', function (err, data){});
}

// Shell Functions
function puts(error, stdout, stderr) { sys.puts(stdout) }

function retrieveHistory(callback) {
    db.all("SELECT type, details FROM (SELECT type, details FROM 'Log' ORDER BY timestamp DESC) WHERE type like '%door opened%' AND type != '' LIMIT 10", function(err, rows) {
		var history = [];
		var d = [];

		rows.forEach(function (row) {
			try{
				d = row.details.split("/");
				history.push(d[d.length - 1]);
			} catch(err) {
				console.log(err);
			}
		});
		callback(history);
    });
}

function autenticateUser(username, password, callback) {
	db.get("SELECT password FROM Users WHERE username = \"" + username + "\"", function(err, row) {
		try{
			callback(null, row.password == sha1(password));
		} catch(err) {
			callback(null, false);
		}
		
    });
}





//////////////////////
// Express Server
//////////////////////
console.log("Starting the server");

fs.writeFile('data/configuration.json', JSON.stringify(ioPorts));

// REST
app.use(express.static(__dirname + '/www/'));
app.get('/status', getStatus); 
app.get('/lights', getLights); 
app.post('/lights', toggleLightsReciever);
app.post('/blinds', toggleBlindsReciever);
app.get('/log', getHistory);
app.get('/admin/timer', getTimer);
app.post('/admin/shutdown', shutdownReciever);
app.post('/admin/clear/cache', clearCacheReciever);

// Express start listening
app.listen(process.env.PORT || 80);
console.log('Listening on port 80');

// Add Logs
try {
	var data = JSON.parse(fs.readFileSync('data/lastonline.json'));
	addLog(1, "Server Unexpected Shutdown Detected", data, {});
} catch (err) {
	console.log("No previous online log file found. Ignoring");
}
addLog(1, "Server Starting", "", {});

// Fake WeMo emulation
var fauxMo = new FauxMo(
    {
        ipAddress: '192.168.1.142',
        devices: wemoFakes
});

// Start Aux functions
updateLastOnline();
setInterval(updateLastOnline, 60000*5);

console.log("Server startup complete")
