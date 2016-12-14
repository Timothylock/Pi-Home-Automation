import xml.etree.ElementTree as ET
import os
import sys
import datetime
import time
from threading import Timer
import RPi.GPIO as io
import json

io.setmode(io.BCM)

# Variables
###########
data = {'door': 0, 'motion': 0, 'power': 0, 'ftp': 0} # 0 - OK, 1 - Problem

# Parse the config file
# Modules Enable
conf = ET.parse("configuration.xml").getroot()
LCDEn = (conf.findall(".//module[@name='20x4LCD']"))[0].get("enable")
SMSEn = (conf.findall(".//module[@name='SMS']"))[0].get("enable")
SoundEn = (conf.findall(".//module[@name='Sound']"))[0].get("enable")
WeatherEn = (conf.findall(".//module[@name='Weather']"))[0].get("enable")

# Modules Data
WeatherWoeid = (conf.findall(".//weather/woeid"))[0].get("loc")
WeatherUnit = (conf.findall(".//weather/unit"))[0].get("value")

# Pins
PIRpin = int((conf.findall(".//pins/PIR"))[0].get("pin"))
doorMagpin = int((conf.findall(".//pins/doorMagnetic"))[0].get("pin"))

print("configuration file read")

# Functions
###########


# Setup
#######
# Set pins
io.setup(PIRpin, io.IN)
io.setup(doorMagpin, io.IN, pull_up_down = io.PUD_UP)


# Main Loop
###########
# Keep reading sensor data
while True:
	# Temp Test Code
	if io.input(PIRpin):
		data['motion'] = 1;
	else:
		data['motion'] = 0;

	# Foor opened
	if io.input(doorMagpin):
		data['door'] = 1;
	else:
		data['door'] = 0;

	# Wait 500ms
	time.sleep(0.2);

	# Write to JSON file
	with open('data.json', 'w') as fp:
	    json.dump(data, fp)