# Arduino-Pi-Home-Monitoring
A DIY home monitoring system consisted of the Arduino and the Raspberry Pi (that can be substituted with a computer)


----------


**Prerequisites**

*Software*

 - Python 2.7 (For Python 3, read note at bottom)
 - https://bitbucket.org/fmalpartida/new-liquidcrystal/downloads for LCD Display
 - MPlayer to play audio

*Hardware*

 - Arduino + 20x4 LCD (using a backpack)
 - Raspberry Pi / computer
 - Door magnetic sensor

**Notes**

 - If you are using python 3, the strings are unicode by default. When sending data to Arduino, they have to be converted to bytes. This can be done by prefixing the string with b:

```python
ser.write(b'5') # prefix b is required for Python 3.x, optional for Python 2.x
```
