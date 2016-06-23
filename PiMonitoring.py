import xml.etree.ElementTree as ET
import os
import sys
import datetime
import time
from threading import Timer
import RPi.GPIO as io
io.setmode(io.BCM)

# Variables
###########
LCDText = [" Program Starting..", "", "","reading config..."]
temperature = 'N/A'
condition = 'N/A'
alarmCondition = False
remoteDisarm = False

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
# Manages the 20x4LCD during loading of the program
def displayLoading(newline):
	if (LCDEn == 'true'):
		LCDText[1] = LCDText[2]
		LCDText[2] = LCDText[3]
		LCDText[3] = newline
		try:
			disp.display(LCDText[0], LCDText[1], LCDText[2], LCDText[3])
		except:
			print("LCD Disconnected. Restarting program")
			os.execl(sys.executable, sys.executable, *sys.argv)

# Manages the 20x4LCD during the normal operation of the program
def displayFSM(formatLines):
	global temperature
	global LCDText
	if (LCDEn == 'true'):
		if (formatLines):
			# line 1 code
			date = datetime.datetime.now().strftime("%h%d")
			time = datetime.datetime.now().strftime("%H:%M")
			if (len(temperature) == 1):
				temperature = " " + temperature
			LCDText[0] = date + "   " + time + "    " + temperature
		try:
			disp.display(LCDText[0], LCDText[1], LCDText[2], LCDText[3])
		except:
			print("LCD Disconnected. Restarting program")
			os.execl(sys.executable, sys.executable, *sys.argv)

# Updates the weather every 15 minutes
def updateWeather():
	global temperature
	temperature = weather.getTemp(WeatherWoeid, WeatherUnit)
	print("Temperature updated: " + temperature)
	# set a timer to update in 15 minutes
	Timer(900, updateWeather, ()).start()

# Sets remoteDisarm to false
def falseRemoteDisarm():
	global remoteDisarm
	remoteDisarm = False

# Checks if SMS disarm
def isDisarmed():
	return os.path.isfile("DISARM")

# Function handles when the alarm is set off
def alarm():
	global LCDText
	global alarmCondition

	alarmCondition = True

	# Display Message
	LCDText = ["******WARNING*******", "   You are being    ", "      recorded      ", "**DISARM SYSTEM NOW*"]
	disp.clear()
	displayFSM(False)

	# Keep checking for disarm
	while (alarmCondition == True):
		# Disarm command given
		if isDisarmed() == True:
			os.remove("DISARM")
			alarmCondition = False

	# Reset display
	disp.clear()
	LCDText = ["", "  Waiting for door  ", "     to close     ", ""]

	# Once disarmed, wait for door to close
	while io.input(doorMagpin):
		pass # Waiting for door to close

# Setup
#######
# Initiate modules
# LCD
if (LCDEn == 'true'):
	# If the LCD cannot be detected. Keep restarting the program
	try:
		from modules.disp import disp
		displayLoading("LCD initialized...")
	except:
		print("LCD Disconnected. Restarting program")
		os.execl(sys.executable, sys.executable, *sys.argv)

# Weather
if (WeatherEn == 'true'):
	from modules.weather import weather
	try:
		updateWeather()
		displayLoading("weather obtained...")
	except:
		displayLoading("Cannot fetch weather")
		print("ERROR - Cannot fetch weather")
		time.sleep(5)

# Sound (via PyGame)
if (SoundEn == 'true'):
	import pygame
	pygame.mixer.init()
	pygame.mixer.music.load(os.getcwd() + "/sounds/startup.mp3")
	pygame.mixer.music.set_volume(0.2)
	pygame.mixer.music.play()
	displayLoading("sound is ready...")

# SMS (check for unlock file and delete if exist)
if (SMSEn == 'true' and os.path.isfile("DISARM")):
	os.remove("DISARM")

# Set pins
io.setup(PIRpin, io.IN)
io.setup(doorMagpin, io.IN, pull_up_down = io.PUD_UP)

# Prep display (clear)
if (LCDEn == 'true'):
	disp.clear()
LCDText = ["", "", "", ""]
# TODO: SMS


# Main Loop
###########
while True:
	# Temp Test Code
	if io.input(PIRpin):
		LCDText[2] = "PIR Detected        "   # Debug
	else:
		LCDText[2] = "                    "

	if remoteDisarm:
		LCDText[1] = "Remotely disarmed   "   # Debug
	else:
		LCDText[1] = "                    "

	if io.input(doorMagpin):
		# If movement not detected 
		if (io.input(PIRpin) is not 1):
			if (remoteDisarm == False):
				LCDText[2] = "Alarm mode         "   # Debug
				alarm()
			else:
				# Rearm the system as they already entered
				remoteDisarm = False
	else:
		LCDText[3] = "                    "

	# Sets a timer to rearm the system after 10 minutes
	if (os.path.isfile("DISARM")):
		remoteDisarm = True;
		os.remove("DISARM")
		Timer(600, falseRemoteDisarm, ()).start()

	displayFSM(True)
	