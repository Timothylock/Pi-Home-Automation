"use strict";
console.log("Loading server / modules");

var sys = require('util')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
var express = require('express');
var basicAuth = require('express-basic-auth');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
app.use(express.static(__dirname + '/'));

// User Authentication
app.use(basicAuth({
    users: { 'admin': 'supersecret' }
}));

var Gpio = require('pigpio').Gpio;

//////////////////////
// GPIO Setup
//////////////////////
console.log("Reading settings and initializing IO objects");

// Import the port numbers and create the associated objects for them
var ioPorts = {};
try {
  ioPorts = JSON.parse(fs.readFileSync('data/configuration.json'));
} catch (err) {
	console.log("\n\n\n\n===========================\n=          ERROR          =\n===========================\n\n");
	console.log("Configuration file was NOT found. This must be generated before this server starts.");
	console.log("Please run \"python configure.py\" to generate the file first!");
	process.exit(-1);
}

console.log(ioPorts);
//var ioPorts = {"doorSensor" : 20, "pirSensor" : 16, "blinds" : {"open" : 19, "close" : 26}, "outletlights" : {"Bedroom Lights" : 27, "Hallway Floor Lights" : 18, "Living Room Lights" : 17, "Living Room Outlets" : 22}};
var ioObjects = {};

// Create the outlet / lights objects. Lights array kept to retain compatibility
var lights = [];
ioObjects["outletlights"] = {};

for (let key in ioPorts["outletlights"]){
	let pin = ioPorts["outletlights"][key];
	ioObjects["outletlights"][pin] = new Gpio(pin, {mode: Gpio.OUTPUT})
	lights.push({"name": key, "id": pin, "status":"off"});
}

// Create the blinds object
ioObjects["blinds"] = {};
ioObjects["blinds"]["open"] = new Gpio(ioPorts["blinds"]["open"], {mode: Gpio.OUTPUT});
ioObjects["blinds"]["close"] = new Gpio(ioPorts["blinds"]["close"], {mode: Gpio.OUTPUT});

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

// Variables
var blindsMotion = 0;
var blindsStatus = 0; // 0 = closed 1 = open
var door = 0;
var motion = 0;

//////////////////////
// Sensor interrupts
//////////////////////
console.log("Loading server functions");

// Handle any interrupts on the sensors
ioObjects["doorSensor"].on('interrupt', function (level) {
  door = level;
  // Also trigger hallway lights 
  ioObjects["outletlights"][ioPorts["outletlights"]["Hallway Floor Lights"]].digitalWrite(Math.abs(level-1));

  if(Math.abs(level-1) == 1){
  	lights[1]["status"] = "on";
  }else{
  	lights[1]["status"] = "1";
  }
  
  if (level == 1){
  	var timestamp = (new Date).getTime();
  	addLog("door opened", "logs/" + timestamp + ".jpg", {});
  	
  	// Take picture if the door is open
	exec("fswebcam -r 1280x960 logs/" + timestamp + ".jpg", puts);
	var timestamp = (new Date).getTime();
	exec("fswebcam -r 1280x960 logs/" + timestamp + ".jpg", puts);
	var timestamp = (new Date).getTime();
	exec("fswebcam -r 1280x960 logs/" + timestamp + ".jpg", puts);
  }else{
  	addLog("door closed", "", {});
  }
});

ioObjects["pirSensor"].on('interrupt', function (level) {
  motion = level;
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
function getStatus(req, res){ // Get the current status of the system
	let statusObj = {"door": door, "motion": motion, "power": 0, "ftp": 0, "blinds": blindsStatus};
	res.send(statusObj);
}

function getLights(req, res){ // Get the current status of the lights
	let statusObj = {"lights":lights};
	res.send(statusObj);
}

function getHistory(req, res){ // Get the last 10 pictures
	var files = fs.readdirSync("./logs/");
	files.sort(function(a, b) {
	               return fs.statSync("./logs/" + a).mtime.getTime() - 
	                      fs.statSync("./logs/" + b).mtime.getTime();
	           });
	res.send(files.slice(Math.max(files.length - 10, 0)));
	addLog("history view", "", {'req':req});
}

// Helper Functions
function toggleLights(req, res){
	if (req.query.onoff == "on"){
		if(req.query.id in ioObjects["outletlights"]){
			ioObjects["outletlights"][req.query.id].digitalWrite(0);
			for(let i = 0; i < lights.length; i++){
				if(lights[i]["id"] == req.query.id){
					addLog("light on", lights[i]["name"], {'req':req});
					lights[i]["status"] = "on";
					break;
				}
			}
		}
	}else{
		if(req.query.id in ioObjects["outletlights"]){
			ioObjects["outletlights"][req.query.id].digitalWrite(1);
			for(let i = 0; i < lights.length; i++){
				if(lights[i]["id"] == req.query.id){
					addLog("light off", lights[i]["name"], {'req':req});
					lights[i]["status"] = "off";
					break;
				}
			}
		}
	}
	res.send("Success\n");
}

// Blinds function
function toggleBlinds(req, res){
	// Only change if blinds not currently in motion
	if (blindsMotion == 0){
		if (req.query.set == "1"){
			if (blindsStatus == 1){
				res.send("Blinds already closed!\n");
			}else{
				ioObjects["blinds"]["open"].digitalWrite(0);
				blindsStatus = 1;
				blindsMotion = 1;
				setTimeout(stopBlinds, 9200);
				res.send("Success\n");
				addLog("opening curtains", "", {'req':req});
			}	
		}else{
			if (blindsStatus == 0){
				res.send("Blinds already closed!\n");
			}else{
				ioObjects["blinds"]["close"].digitalWrite(0);
				blindsStatus = 0;
				blindsMotion = 1;
				setTimeout(stopBlinds, 9200);
				res.send("Success\n");
				addLog("closing curtains", "", {'req':req});
			}	
		}
	}else{
		res.send("Blinds already in motion!\n");
	}
}

// Blinds Helper function to stop blinds
function stopBlinds(){
	ioObjects["blinds"]["close"].digitalWrite(1);
	ioObjects["blinds"]["open"].digitalWrite(1);
	blindsMotion = 0;
}

// Add a specific data to the log (for remote connections)
function addLog(action, details, opt){
	if ('req' in opt){
		var ip = opt['req'].headers['x-forwarded-for'] || opt['req'].connection.remoteAddress;
		var ua = opt['req'].headers['user-agent'];
	}else{
		var ip = "::ffff:127.0.0.1";
		var ua = "localhost";
	}
	fs.appendFile('logs/log.csv', new Date() + ',' + action + ',' + details + "," + ip + "," + ua.replace(/,/g , "---") + "\n", function (err) {
	  if (err) throw err;
	});
}

// Keep log of when the server was last online
function updateLastOnline(){
	fs.writeFile('data/lastonline.json', JSON.stringify(new Date()), 'utf8', function (err, data){});
}


// Shell Functions
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }

//////////////////////
// Express Server
//////////////////////
console.log("Starting the server");

fs.writeFile('data/configuration.json', JSON.stringify(ioPorts));

// REST
app.get('/status', getStatus); 
app.get('/lights', getLights); 
app.post('/lights', toggleLights); 
app.post('/blinds', toggleBlinds);  
app.get('/log', getHistory);  

// Express start listening
app.listen(process.env.PORT || 80);
console.log('Listening on port 80');

// Add Logs
fs.readFile('data/lastonline.json', function read(err, data) {
    if (err) {
        console.log("No previous online log file found. Ignoring")
    }else{
    	addLog("Server Unexpected Shutdown Detected", data, {});
    }
});
addLog("Server Starting", "", {});

// Start Aux functions
updateLastOnline();
setInterval(updateLastOnline, 60000*5);


