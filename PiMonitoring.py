import xml.etree.ElementTree as ET
import os
import sys
import datetime

# Variables
###########
LCDText = [" Program Starting..", "", "","reading config..."]
temperature = 'N/A'
condition = 'N/A'

# Parse the config file
os.chdir(os.path.dirname(sys.argv[0]))
# Modules Enable
conf = ET.parse("configuration.xml").getroot()
LCDEn = (conf.findall(".//module[@name='20x4LCD']"))[0].get("enable")
SMSEn = (conf.findall(".//module[@name='SMS']"))[0].get("enable")
SoundEn = (conf.findall(".//module[@name='Sound']"))[0].get("enable")
WeatherEn = (conf.findall(".//module[@name='Weather']"))[0].get("enable")

# Modules Data
SMSNumbers = conf.findall(".//number[@name='num']")
WeatherWoeid = (conf.findall(".//weather/woeid"))[0].get("loc")
WeatherUnit = (conf.findall(".//weather/unit"))[0].get("value")

print("configuration file read")

# Functions
###########
# Manages the 20x4LCD during loading of the program
def displayLoading(newline):
	if (LCDEn == 'true'):
		LCDText[1] = LCDText[2]
		LCDText[2] = LCDText[3]
		LCDText[3] = newline
		disp.display(LCDText[0], LCDText[1], LCDText[2], LCDText[3])

# Manages the 20x4LCD during the normal operation of the program
def displayFSM(formatLines):
	global temperature
	global LCDText
	if (LCDEn == 'true'):
		if (formatLines == 'true'):
			# line 1 code
			date = datetime.datetime.now().strftime("%h%d")
			time = datetime.datetime.now().strftime("%H:%M")
			if (len(temperature) == 1):
				temperature = " " + temperature
			LCDText[0] = date + "   " + time + "    " + temperature
		disp.display(LCDText[0], LCDText[1], LCDText[2], LCDText[3])

# Setup
#######
if (LCDEn == 'true'):
	from modules.disp import disp
	displayLoading("LCD initialized...")
if (WeatherEn == 'true'):
	from modules.weather import weather
	try:
		temperature = weather.getTemp(WeatherWoeid, WeatherUnit)
		print(temperature)
		displayLoading("weather obtained...")
	except:
		displayLoading("Cannot fetch weather!")
		print("ERROR - Cannot fetch weather")
if (SoundEn == 'true'):
	import pygame
	pygame.mixer.init()
	pygame.mixer.music.load(os.getcwd() + "/sounds/startup.mp3")
	pygame.mixer.music.set_volume(0.2)
	pygame.mixer.music.play()
	displayLoading("sound is ready...")

disp.clear()
LCDText = ["", "", "", ""]
# TODO: SMS


# Main Loop
###########
while True:
	displayFSM('true')
