Tim Pi Home Monitoring 
[![Travis build](https://travis-ci.org/Timothylock/Pi-Home-Automation.svg?branch=master)](https://travis-ci.org/Timothylock/Pi-Home-Automation)
[![Coverage Status](https://coveralls.io/repos/github/Timothylock/Pi-Home-Automation/badge.svg?branch=master)](https://coveralls.io/github/Timothylock/Pi-Home-Automation) 
===================

A DIY home monitoring system made of the Raspberry Pi. It currently has the ability to control lights, outlets, and blinds. 

![alt text](www/assets/img/screenshot.jpg "Screenshot of main screen")

----------
Setup
-------------

**Hardware**

 - Raspberry Pi
 - USB Webcam
 - Door magnetic sensor
 - Relay modules
 - PID Sensor

 ![alt text](www/assets/img/general_layout.jpg "My Setup")

**Software Setup**

 6. Clone this repository into your Pi by using 
`git clone https://github.com/Timothylock/Pi-Home-Automation.git`

 7. Make sure nodejs is installed onto the pi and everything is updated. You can find a guide of installing nodejs onto your particular model on the internet.
 
 8. Install sqlite `sudo apt-get install sqlite3`
 
 9. Follow the guide [here](https://github.com/fivdi/pigpio) to install pigpio module for node

 10. install the node modules by running
 ` npm install `
 

 11. Run the configurator to tell the server which pins what sensors/relays are plugged into
 ` python configure.py `

 12. If you are developing locally, skip this step. If this is running on the Pi, create an environmental variable called NODE_ENV and name it `production` into etc/rc.local (refer below)

 13. You can now run the server
 ` node server.js ` if you are running on your local dev environment. ` NODE_ENV=production server.js ` if you are running on your pi (as production will have the real pigpio module load while anything else will have the mock one load up). 

 14. You can connect to the server by entering your Pi's IP address into any web browser
 
 15. Install nodemon if you want it to monitor the folder and if you want the update feature to work ` sudo apt-get install nodemon `

**Starting with the Pi**
You can set the server to start up along with the Pi. This is not a watchdog so if the server crashes, it will not be automatically restarted. Please check how to set up a watch dog on the internet. 

To start up with Pi, type

    sudo nano /etc/rc.local

and add

    cd /home/pi/Pi-Home-Automation/
    NODE_ENV=production nodemon &

replacing the directory with your own of course. Don't forget the '&'! It makes the script run in the background rather than hanging the startup.

Testing
-------------
To run tests, run

    make test

 It will run all of the mocha tests as well as provide you with code covereage. It will automatically back up your database before replacing it with the test database and restore it after the test. In the future, I hope to replace the hard-coded test db with a dynamically generated one from configure.py.


Not-so-frequent FAQ
-------------

## Why node? Why not ____?

The server used to be in Python (Flask), but I remade the server in NodeJS since I was taking a web development course at my university and really love the idea of asynchronousity for the server. 

## Where is feature X?

I always love adding new things, but I tend to add features that affect me more. If you have a great idea, feel free to fork this repo and to make a PR when you are done! 

## How many clients can it support at a time?

Right now the JS makes a GET reqquest every 50ms. I have tested this with 5 devices on a Pi 1 model B and it had no trouble processing all of the requests. If needed, you can go into the JS to increase the polling interval. 

## Can this integrate with my smart home hubs? Echo? 

Yup! This server emulates WeMo devices. That means each light/outlet pin and the blinds will all appear as seperate devices when your hub or Echo scans the network for WeMo devices. 

#### Alexa Instructions
1. Have Alexa scan for devices `Alexa scan for devices`
2. Once added, you can turn on and off pins by saying `Alexa turn bedroom lights on`, `Alexa, turn bedroom lights off`
