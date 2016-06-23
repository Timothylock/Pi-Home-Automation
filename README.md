# Tim-Pi-Home-Monitoring
A DIY home monitoring system


----------


***Setup***

*Hardware*

 - 20x4 LCD (using a YWRobot backpack)
 - PID sensor
 - Raspberry Pi / computer
 - Door magnetic sensor

*Software*

 1. Python 2.7 (For Python 3, read note at bottom)
 2. sudo apt-get install python-smbus
 3. sudo apt-get install i2c-tools
 4. Enable I2C support from raspi-config
 5. Pygame - Install by "pip install pygame"
  - For RPi, you might want to add "disable_audio_dither=1" to "/boot/config.txt" if there is static noise
 6. Flask - pip install flask
 7. (OPTIONAL) Twilio-python library - pip install twilio
 8. Go to your Twilio and have the number URL point to your public server


***Notes***

**Python 3**

Several features do not work in Python 3. I'm not even sure if it will run. Create an issue if there are problems!

**Startup With Pi**

To start up with Pi, type 
```
sudo nano /etc/rc.local
```
and add 
```
cd /home/pi/Tim-Pi-Home-Monitoring/
python flaskServer.py &
python PiMonitoring.py &
```
replacing the directory with your own of course. Don't forget the '&'! It makes the script run in the background rather than hanging the startup. 

You may also want to have the pi wait for network (via raspi-config)

