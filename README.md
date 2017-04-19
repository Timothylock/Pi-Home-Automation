Tim Pi Home Monitoring
===================

A DIY home monitoring system made of the Raspberry Pi. It currently has the ability to control lights, outlets, and blinds. 

![alt text](screenshot.jpg "Screenshot of main screen")

----------


Setup
-------------

**Hardware**

 1. Raspberry Pi
 2. USB Webcam
 3. Door magnetic sensor
 4. Relay modules
 5. PID Sensor

**Software Setup**

 6. Clone this repository into your Pi by using 
`git clone https://github.com/Timothylock/Tim-Pi-Home-Monitoring.git`

 7. Make sure nodejs is installed onto the pi and everything is updated. You can find a guide of installing nodejs onto your particular model on the internet.
 8. install the node modules by running
 ` npm install `
 

 9. Follow the guide [here](https://github.com/fivdi/pigpio) to install pigpio module for node
 10. You can now run the server
 ` node server.js `
 

 11. You can connect to the server by entering your Pi's IP address into any web browser

**Starting with the Pi**
You can set the server to start up along with the Pi. This is not a watchdog so if the server crashes, it will not be automatically restarted. Please check how to set up a watch dog on the internet. 

To start up with Pi, type

    sudo nano /etc/rc.local

and add

    cd /home/pi/Tim-Pi-Home-Monitoring/
    node server.js &

replacing the directory with your own of course. Don't forget the '&'! It makes the script run in the background rather than hanging the startup.
