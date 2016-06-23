# Tim-Pi-Home-Monitoring
A DIY home monitoring system


----------


**Prerequisites**

*Software*

 - Python 2.7 (For Python 3, read note at bottom)
 - sudo apt-get install python-smbus
 - sudo apt-get install i2c-tools
 - Enable I2C support from raspi-config
 - Pygame - Install by "pip install pygame"
  - For RPi, you might want to add "disable_audio_dither=1" to "/boot/config.txt" if there is static noise
 - Flask - pip install flask
 - (OPTIONAL) Twilio-python library - pip install twilio

*Hardware*

 - 20x4 LCD (using a YWRobot backpack)
 - 
 - Raspberry Pi / computer
 - Door magnetic sensor

**Notes**

*Python 3*

Several features do not work in Python 3. I'm not even sure if it will run. Create an issue if there are problems!

*Startup With Pi*

To start up with Pi, type 
```
sudo nano /etc/rc.local
```
and add 
```
cd /home/pi/Tim-Pi-Home-Monitoring
python PiMonitoring.py &
```
replacing the directory with your own of course. Don't forget the '&'! It makes the script run in the background rather than hanging the startup.

