var sys = require('util')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
var express = require('express');
//var basicAuth = require('express-basic-auth');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
app.use(express.static(__dirname + '/'));

var pin = 12

// Set up GPIO
var Gpio = require('pigpio').Gpio;
var light = new Gpio(pin, {mode: Gpio.OUTPUT})

// The request body is received on GET or POST.
// A middleware that just simplifies things a bit.
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

function toggleLights(req, res){
	light.digitalWrite(0);
	res.send("Success\n");
}


// REST
app.get('/lights', toggleLights); 

// Express start listening
app.listen(process.env.PORT || 80);
console.log('Listening on port 80');
