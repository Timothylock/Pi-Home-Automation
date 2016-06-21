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

*Hardware*

 - 20x4 LCD (using a YWRobot backpack)
 - 
 - Raspberry Pi / computer
 - Door magnetic sensor

**Notes**
*Startup With Pi*
To start up with Pi, type 
```
sudo nano /etc/rc.local
```
and add 
```
python /home/pi/Tim-Pi-Home-Monitoring/PiMonitoring.py &
```
replacing the directory with your own of course. Don't forget the '&'! It makes the script run in the background rather than hanging the startup.

