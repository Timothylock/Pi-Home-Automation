import serial
import threading
from time import sleep, time
import modules.weather.weather as weather
import modules.sound.sound as sound

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
        print("Cannot find Arduino. Please manually enter the address EX: ttyACM0")
        addr = raw_input("Address: ")
        ser = serial.Serial('/dev/' + addr, 9600)

# Write the constants here.
dingSound = "/home/pi/Arduino-Pi-Home-Monitoring/Server/sounds/ding.wav"

# Functions
def clearMessages():
    # Clears the middle two lines used for messages on the Arduino
    ser.write("LINE1                     .")
    ser.write("LINE2                     .")

def updateTemp():
    # Sends the current temperature to the Arduino
    try:
        ser.write("TEMP " + weather.getTemp() + ".")
        try:
            cond = weather.getCondition()
            if (len(cond) > 21):
                cond = cond[0:20]
            print(cond)
            ser.write("LINE1 " + cond + ".")
        except:
            pass
    except:
        ser.write("LINE1 cannot fetch weather.")
        ser.write("TEMP N/A.")
    print("Updating Temps");

def updateArduino():
    threading.Timer(300, updateArduino).start()
    clearMessages()
    updateTemp()
    updateClock()

def updateClock():
    # Updates the clock on the Arduino
    ser.write("SETTIME " + str(int(time()-18000)) + ".") # The (-) is to offset to EST
    print("Updating Arduino Clock")

def processInput(input):
    if (input.startswith("DC")):
        print("door reported closed")
    elif (input.startswith("DO")):
        print("door reported opened")
        sound.play(dingSound)

# Setup Code
print("Waiting for Arduino to reset...")
sleep(5)
updateArduino()

# Loop
while True:
    processInput(ser.readline())
