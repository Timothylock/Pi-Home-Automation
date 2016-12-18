# Tim-Pi-Home-Monitoring
A DIY home monitoring system


----------


***Setup***

*Hardware*

 - PID sensor
 - Raspberry Pi
 - Door magnetic sensor

*Software*

1. Download this repository into your Pi
2. Make sure nodejs is installed onto the pi and everything is updated. You can find a guide of installing nodejs onto your particular model on the internet
3. install the node modules by running
```
npm install
```
3b. Follow the install guide at https://github.com/fivdi/pigpio
4. To run the server
```
node server.js
```
5. You can connect to the screen via the Pi's IP address in your browser

**Startup With Pi**

To start up with Pi, type 
```
sudo nano /etc/rc.local
```
and add 
```
cd /home/pi/Tim-Pi-Home-Monitoring/
node server.js &
```
replacing the directory with your own of course. Don't forget the '&'! It makes the script run in the background rather than hanging the startup. 

You may also want to have the pi wait for network (via raspi-config)

