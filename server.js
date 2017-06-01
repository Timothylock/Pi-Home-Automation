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
app.use(express.static(__dirname + '/'));

// User Authentication
app.use(basicAuth({
    users: { 'admin': 'supersecret' }
}));

var Gpio = require('pigpio').Gpio;







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
	console.log("\n\n\n\n==================\n=          ERROR          =\n==================\n\n");
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

// Read Previous History Data
try {
	var history = JSON.parse(fs.readFileSync('data/latestHistory.json'));
} catch (err) {
	console.log("No history file found. Generating new one. This may take a while depending on the number of files in ./logs");
	var files = fs.readdirSync("./logs/");
	files.sort(function(a, b) {
	               return fs.statSync("./logs/" + a).mtime.getTime() - 
	                      fs.statSync("./logs/" + b).mtime.getTime();
	           });
	var history = files.slice(Math.max(files.length - 10, 0));
	history.splice(history.indexOf("log.csv"), 1); // Ensure the the log csv does not get included in the history
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
					addLog("light " + action, pin + " triggered from Alexa", {}); // TODO: Hydrate the id with name
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
			addLog("opening curtains", "triggered from Alexa", {});
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
  	addLog("door opened", "logs/" + timestamp + ".jpg", {});
  	
  	// Take picture if the door is open
	exec("fswebcam -r 1280x960 logs/" + timestamp + ".jpg", puts);
	writeHistory(timestamp)
  }else{
  	addLog("door closed", "", {});
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
	res.send(history);
	addLog("history view", "", {'req':req});
}

// Helper Functions
function toggleLightsReciever(req, res){
	toggleLights(req.query.onoff, req.query.id);
	addLog("light " + req.query.onoff, req.query.id, {'req':req}); // TODO: Hydrate the id with name
	res.send("Success\n");
}

// Blinds function
function toggleBlindsReciever(req, res){
	var result = toggleBlinds(req.query.set);
	if (result == "Success" && req.query.set == "1") {
		addLog("opening curtains", "", {'req':req});
	} else if (result == "Success" && req.query.set == "0") {
		addLog("closing curtains", "", {'req':req});
	}
	res.send(result)
}

// Shutdown reciever
function shutdownReciever(req, res){
	if (res.query.pw == ADMINISTRATOR_SECRET) {
        res.send("success");
        addLog(res.query.op + " initiated", "SUCCESS", {'req':req});
        shutdownHandler(req.query.op);
	} else {
        res.status(403);
        res.send("Incorrect administrator secret");
        addLog(res.query.op + " attempted", "UNAUTHENTICATED", {'req':req});
	}
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
					return ("Success")
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
					return ("Success")
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
				setTimeout(stopBlinds, 9200);
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
				setTimeout(stopBlinds, 9200);
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
function addLog(action, details, opt){
    var ip, ua;
    if ('req' in opt){
		ip = opt['req'].headers['x-forwarded-for'] || opt['req'].connection.remoteAddress;
		ua = opt['req'].headers['user-agent'];
	}else{
		ip = "::ffff:127.0.0.1";
		ua = "localhost";
	}
	fs.appendFile('logs/log.csv', new Date() + ',' + action + ',' + details + "," + ip + "," + ua.replace(/,/g , "---") + "\n", function (err) {
	  if (err) throw err;
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

// Update the latest history and write it to file
function writeHistory(name){
	if (history.length == 10){
		history.shift()
	}
	history.push(name + ".jpg");
	fs.writeFile('data/latestHistory.json', JSON.stringify(history), 'utf8', function (err, data){});
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
app.post('/admin/shutdown', shutdownReciever);

// Express start listening
app.listen(process.env.PORT || 80);
console.log('Listening on port 80');

// Add Logs
try {
	var data = JSON.parse(fs.readFileSync('data/lastonline.json'));
	addLog("Server Unexpected Shutdown Detected", data, {});
} catch (err) {
	console.log("No previous online log file found. Ignoring");
}
addLog("Server Starting", "", {});

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
