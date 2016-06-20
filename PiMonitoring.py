import xml.etree.ElementTree as ET

# Variables
###########
LCDText = [" Program Starting..", "", "","reading config..."]
temperature = 'N/A'
condition = 'N/A'

# Parse the config file
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
# Manages the 20x4LCD during loadingof the program
def displayLoading(newline):
	if (LCDEn == 'true'):
		LCDText[1] = LCDText[2]
		LCDText[2] = LCDText[3]
		LCDText[3] = newline
		disp.display(LCDText[0], LCDText[1], LCDText[2], LCDText[3])


# Setup
#######
if (LCDEn == 'true'):
	from modules.disp import disp
	displayLoading("LCD initialized...")
if (WeatherEn == 'true'):
	from modules.weather import weather
	displayLoading("weather enabled...")



