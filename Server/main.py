import serial
import threading
import datetime
import time
import modules.weather.weather as weather
import modules.sound.sound as sound
#import modules.network.scan as scan   FOR THE FUTURE

# Set your Arduino device here. To find the
# address, enter ls /dev/tty* into the terminal
# with the Arduino unplugged and then do it
# again with it plugged in. Note the extra
# device is the address.

# By Default, this program will try all the common
# ones
try:
    ser = serial.Serial('/dev/ttyACM0', 9600)
except:
    try:
        ser = serial.Serial('/dev/ttyACM1', 9600)
    except:
	st = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
        print(st + ",Cannot find Arduino. Please manually enter the address EX: ttyACM0")
        addr = raw_input("Address: ")
        ser = serial.Serial('/dev/' + addr, 9600)

# Write the constants here.
dingSound = "/home/pi/Arduino-Pi-Home-Monitoring/Server/sounds/ding.wav"

# Functions
# Clear any messages on the Arduino
def clearMessages():
    # Clears the middle two lines used for messages on the Arduino
    ser.write("LINE1                     .")
    ser.write("LINE2                     .")

# Update the temperature on the Arduino
def updateTemp():
    # Sends the current temperature to the Arduino
    try:
        ser.write("TEMP " + weather.getTemp() + ".")
        try:
            cond = weather.getCondition()
            if (len(cond) > 21):
                cond = cond[0:20]
            ser.write("LINE1 " + cond + ".")
        except:
            pass
    except:
	st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
	print(st + ",INTERNET LOST")
        ser.write("LINE1 cannot fetch weather.")
        ser.write("TEMP N/A.")

# Updates the Arduino with the latest information
def updateArduino():
    threading.Timer(300, updateArduino).start()
    clearMessages()
    updateTemp()
    updateClock()

# Updates the internal clock on the Arduino since it does not have a RTC
def updateClock():
    # Updates the clock on the Arduino
    ser.write("SETTIME " + str(int(time.time()-18000)) + ".") # The (-) is to offset to EST

# Process any serial messages coming from the Arduino
def processInput(input):
    if (input.startswith("DC")):
        st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
        print(st + ",door closed")
    elif (input.startswith("DO")):
        st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
        print(st + ",door opened")
        stat = searchDevice()
        if (stat != "none"):
            pass

# Find any new devices on the network
def searchDevice():
    #latest_network = scan.listDevices()
    latest_network = [] #temporary
    global last_network
    if (latest_network != last_network):
        for t in latest_network:
            if t not in last_network:
                return t
    last_network = latest_network
    return "none"
	
# Variables
global last_network
last_network = []

# Setup Code
st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
print(st + ",SYSTEM STARTING")
time.sleep(5)
ser.write("FLASH.")
ser.write("DEFAULT.")
updateArduino()
#mydata = raw_input('Prompt :')
#print (mydata)
#ser.write("LINE1 " + mydata + ".")


# Loop
while True:
    processInput(ser.readline())
