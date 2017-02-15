"use strict";

var express = require('express');
var basicAuth = require('express-basic-auth');
var bodyParser = require('body-parser');
var fs = require('fs');
//var Gpio = require('onoff').Gpio;



var app = express();

app.use(express.static(__dirname + '/'));

// User Authentication
app.use(basicAuth({
    users: { 'admin': 'supersecret' }
}));

var Gpio = require('pigpio').Gpio,
  doorSensor = new Gpio(20, {
	mode: Gpio.INPUT,
	pullUpDown: Gpio.PUD_UP,
	edge: Gpio.EITHER_EDGE
  }),
  pirSensor = new Gpio(16, {
	mode: Gpio.INPUT,
	edge: Gpio.EITHER_EDGE
  }),
  br = new Gpio(27, {mode: Gpio.OUTPUT}),
  hf = new Gpio(18, {mode: Gpio.OUTPUT}),
  lrOne = new Gpio(17, {mode: Gpio.OUTPUT}),
  lrTwo = new Gpio(22, {mode: Gpio.OUTPUT}),
  blOpen =  new Gpio(19, {mode: Gpio.OUTPUT}),
  blClose =  new Gpio(26, {mode: Gpio.OUTPUT});

// Turn everything off
hf.digitalWrite(1);
br.digitalWrite(1);
lrOne.digitalWrite(1);
lrTwo.digitalWrite(1);
blOpen.digitalWrite(1);
blClose.digitalWrite(1);


// Shell Functions
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }


// Variables
var blindsMotion = 0;
var blindsStatus = 0; // 0 = closed 1 = open
var door = 0;
var motion = 0;
var lights = [{"name": "Bedroom", "id": "27", "status":"off"}, {"name": "Entrance Floor Light", "id": "18", "status":"off"}, {"name": "Living Room One Light", "id": "17", "status":"off"}, {"name": "Living Room Two Light", "id": "22", "status":"off"}];


// Handle any interrupts on the sensors
doorSensor.on('interrupt', function (level) {
  door = level;
  // Also trigger hallway lights 
  hf.digitalWrite(Math.abs(level-1));
  if(Math.abs(level-1) == 1){
  	lights[1]["status"] = "on";
  }else{
  	lights[1]["status"] = "1";
  }
  
  if (level == 1){
  	// Take picture if the door is open
	  var timestamp = (new Date).getTime();
	  exec("fswebcam -r 1280x960 logs/" + timestamp + ".jpg", puts);
	  var timestamp = (new Date).getTime();
	  exec("fswebcam -r 1280x960 logs/" + timestamp + ".jpg", puts);
	  var timestamp = (new Date).getTime();
	  exec("fswebcam -r 1280x960 logs/" + timestamp + ".jpg", puts);
  }
});

pirSensor.on('interrupt', function (level) {
  motion = level;
});

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
}

// Helper Functions
function toggleLights(req, res){
	if (req.query.onoff == "on"){
		console.log("Turning light on");
		if(req.query.id == "27"){
			br.digitalWrite(0);
		}else if(req.query.id == "18"){
			hf.digitalWrite(0);
		}else if(req.query.id == "17"){
			lrOne.digitalWrite(0);
		}else if(req.query.id == "22"){
			lrTwo.digitalWrite(0);
		}
		for(let i = 0; i < lights.length; i++){
			if(lights[i]["id"] == req.query.id){
				lights[i]["status"] = "on";
				break;
			}
		}
	}else{
		if(req.query.id == "27"){
			br.digitalWrite(1);
		}else if(req.query.id == "18"){
			hf.digitalWrite(1);
		}else if(req.query.id == "17"){
			lrOne.digitalWrite(1);
		}else if(req.query.id == "22"){
			lrTwo.digitalWrite(1);
		}
		console.log("Turning light off");
		for(let i = 0; i < lights.length; i++){
			if(lights[i]["id"] == req.query.id){
				lights[i]["status"] = "off";
				break;
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
				console.log("Opening curtains");
				blOpen.digitalWrite(0);
				blindsStatus = 1;
				blindsMotion = 1;
				setTimeout(stopBlinds, 9200);
				res.send("Success\n");
			}	
		}else{
			if (blindsStatus == 0){
				res.send("Blinds already closed!\n");
			}else{
				console.log("Closing curtains");
				blClose.digitalWrite(0);
				blindsStatus = 0;
				blindsMotion = 1;
				setTimeout(stopBlinds, 9200);
				res.send("Success\n");
			}	
		}
	}else{
		res.send("Blinds already in motion!\n");
	}
}

// Blinds Helper function to stop blinds
function stopBlinds(){
	blClose.digitalWrite(1);
	blOpen.digitalWrite(1);
	blindsMotion = 0;
}

// REST
app.get('/status', getStatus); 
app.get('/lights', getLights); 
app.post('/lights', toggleLights); 
app.post('/blinds', toggleBlinds);  
app.get('/log', getHistory);  

// Express start listening
app.listen(process.env.PORT || 80);
console.log('Listening on port 80');



