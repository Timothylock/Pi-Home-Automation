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
  });

var app = express();

app.use(express.static(__dirname + '/'));


// Handle any interrupts on the sensors
var door = 0;
var motion = 0;

doorSensor.on('interrupt', function (level) {
  door = level;
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

// Temp
function getStatus(req, res){
    var statusObj = {"door": door, "motion": motion, "power": 0, "ftp": 0};
    res.send(statusObj);
}

// REST
app.get('/status', getStatus);  // signup

// Express start listening
app.listen(process.env.PORT || 80);
console.log('Listening on port 80');