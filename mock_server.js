//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MOCK SERVER - This server is only to be used in a dev environment or running on the demo server
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use strict";
console.log("Loading server / modules");

var sys = require('util')
var exec = require('child_process').exec;
var express = require('express');
var basicAuth = require('express-basic-auth');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
app.use(express.static(__dirname + '/'));

// User Authentication
app.use(basicAuth({
    users: { 'testuser': 'testpassword' }
}));

//////////////////////
// Read data files
//////////////////////
console.log("Reading settings and initializing IO objects");

// Import the port numbers and create the associated objects for them
var ioPorts = {};

try {
  ioPorts = JSON.parse(fs.readFileSync('data/configuration.json'));
} catch (err) {
	console.log("\n\n\n\n==================\n=          ERROR          =\n==================\n\n");
	console.log("Configuration file was NOT found. This must be generated before this server starts.");
	console.log("Please run \"sudo python configure.py\" to generate the file first!");
	process.exit(-1);
}

// Read Previous Data
	var status = {"blindsMotion" : 0, "blindsStatus" : 0, "door" : 0, "motion" : 0, "lights" : [], "numLightsOn" : 0};


// Read Previous History Data
	var files = fs.readdirSync("./logs/");
	files.sort(function(a, b) {
	               return fs.statSync("./logs/" + a).mtime.getTime() - 
	                      fs.statSync("./logs/" + b).mtime.getTime();
	           });
	var history = files.slice(Math.max(files.length - 10, 0));
	history.splice(history.indexOf("log.csv"), 1); // Ensure the the log csv does not get included in the history









//////////////////////
// GPIO Setup
//////////////////////

// Create the outlet / lights objects.
status["lights"] = []; // Clear the old light data

for (var key in ioPorts["outletlights"]){
	(function (key) {
		var pin = ioPorts["outletlights"][key];
		status["lights"].push({"name": key, "id": pin, "status":"off"});
  	})(key);
}

//////////////////////
// Sensor interrupts
//////////////////////
console.log("Loading server functions");



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
function getStatus(req, res){ // Get the current status of the system
	var statusObj = {"door": status["door"], "motion": status["motion"], "power": 0, "ftp": 0, "blinds": status["blindsStatus"], "lightsOn": status["numLightsOn"]};
	res.send(statusObj);
}

function getLights(req, res){ // Get the current status of the lights
	var statusObj = {"lights":status["lights"]};
	res.send(statusObj);
}

function getHistory(req, res){ // Get the last 10 pictures
	res.send(history);
}

// Helper Functions
function toggleLightsReciever(req, res){
	toggleLights(req.query.onoff, req.query.id);
	res.send("Success\n");
}

// Blinds function
function toggleBlindsReciever(req, res){
	var result = toggleBlinds(req.query.set);
	res.send(result)
}

// Toggle the lights
function toggleLights(onoff, id) {
	var i;
	if (onoff == "on"){
		for(i = 0; i < status["lights"].length; i++){
			if(status["lights"][i]["id"] == id){
				status["lights"][i]["status"] = "on";
                status["numLightsOn"] ++;
				return ("Success")
			}
		}
	}else{
		for(i = 0; i < status["lights"].length; i++){
			if(status["lights"][i]["id"] == id){
				status["lights"][i]["status"] = "off";
                status["numLightsOn"] --;
				return ("Success")
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
				status["blindsStatus"] = 1;
				status["blindsMotion"] = 1;
				setTimeout(stopBlinds, 9200);
				return("Success");
			}
		}else{
			if (status["blindsStatus"] == 0){
				return("Blinds already closed!");
			}else{
				status["blindsStatus"] = 0;
				status["blindsMotion"] = 1;
				setTimeout(stopBlinds, 9200);
				return("Success");
			}
		}
	}else{
		return("Blinds already in motion!");
	}
}

// Blinds Helper function to stop blinds
function stopBlinds(){
	status["blindsMotion"] = 0;
}

// Shell Functions
function puts(error, stdout, stderr) { sys.puts(stdout) }



//////////////////////
// Express Server
//////////////////////
console.log("Starting the server");

fs.writeFile('data/configuration.json', JSON.stringify(ioPorts));

// REST
app.get('/status', getStatus); 
app.get('/lights', getLights); 
app.post('/lights', toggleLightsReciever); 
app.post('/blinds', toggleBlindsReciever);  
app.get('/log', getHistory);  

// Express start listening
app.listen(process.env.PORT || 8880);
console.log('Listening on port 8880');

console.log("Server startup complete")
