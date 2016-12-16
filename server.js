"use strict";

var express = require('express');
var bodyParser = require('body-parser');
//var Gpio = require('onoff').Gpio;

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
  hf = new Gpio(18, {mode: Gpio.OUTPUT});

var app = express();

app.use(express.static(__dirname + '/'));

// Variables
var door = 0;
var motion = 0;
var lights = [{"name": "Bedroom", "id": "27", "status":"off"}, {"name": "Entrance Floor Light", "id": "18", "status":"off"}];


// Handle any interrupts on the sensors
doorSensor.on('interrupt', function (level) {
  door = level;
  // Also trigger hallway lights 
  hf.digitalWrite(Math.abs(level-1));
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
function getStatus(req, res){
	let statusObj = {"door": door, "motion": motion, "power": 0, "ftp": 0};
	res.send(statusObj);
}

function getLights(req, res){
	let statusObj = {"lights":lights};
	res.send(statusObj);
}

function toggleLights(req, res){
	if (req.query.onoff == "on"){
		console.log("Turning light on");
		if(req.query.id == "27"){
			br.digitalWrite(0);
		}else if(req.query.id == "18"){
			hf.digitalWrite(0);
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

// REST
app.get('/status', getStatus); 
app.get('/lights', getLights);  
app.post('/lights', toggleLights);  

// Express start listening
app.listen(process.env.PORT || 80);
console.log('Listening on port 80');