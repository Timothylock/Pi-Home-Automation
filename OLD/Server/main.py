#!/usr/bin/env python

import serial
import threading
import datetime
import pygame
import time
import data_update
import modules.sound.sound as sound
import modules.network.network as network
import modules.twilio.sendTwillio as twilio

#################
#   Constants   #
#################
range = "192.168.0.0/24" # IP range to be scanned
approved = ["F8:A9:D0:4E:5A:BD", "44:D8:84:1F:53:D1"] # Enter the MAC addresses of accepted devices"
keys = ["0004414520"] # Enter the unlock codes of the barcode/card
logname = "\home\pi\log.csv" # Name of the log file
twilio_SID = "AC67ce6ea275a28268eac662c172e7a07d"  # SID for twilio
twilio_AUTH = "dd4f1f140406942c8faa551cbfdcadb4"  # auth for twilio
numbers = ["16479868784"] # Phone numbers that will recieve notifications. Include country code!

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
        st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
        print(st + ",Cannot find Arduino. Please manually enter the address EX: ttyACM0")
        addr = raw_input("Address: ")
        ser = serial.Serial('/dev/' + addr, 9600)

# Sound Files
pygame.mixer.init()
pygame.mixer.music.set_volume(1.0)
    
# Variables
global last_network
last_network = []
global warn
warn = 0

#############
# Functions #
#############

# Appends to the log
def printlog(msg):
    fh = open(logname, 'a')
    fh.write(msg + "\n")
    fh.close()
    for num in numbers:
        twilio.sendSMS(num, msg, twilio_SID, twilio_AUTH)
    print(msg)

# Set warn
def changeWarn():
    global warn
    warn = 0

# Process any serial messages coming from the Arduino
def processInput(input):
    if (input.startswith("DC")):
        st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
        printlog(st + ",door closed")
    elif (input.startswith("DO")):
        st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
        printlog(st + ",door opened")
        #searchDevice()
        
# Find any new devices on the network
def searchDevice():
    global warn
    ls = network.seek(range)
    found = False;
    unlocked = False;
    # Look through list of connected devices on network
    for dev in ls:
        if (dev[1] in approved):
            found = True
    if found:
        st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
        printlog(st + ",STATUS: device found")
        pygame.mixer.music.load("/home/pi/Arduino-Pi-Home-Monitoring/Server/sounds/ding.wav")
        pygame.mixer.music.set_volume(0.6)
        pygame.mixer.music.play()
    else:
        warn = 1
        ser.write("FLINE1       WARNING.FLINE2.FLINE3 Please authenticate.FLINE4     immediately!.")
        ser.write("FLASH.")
        threading.Timer(20, changeWarn).start()
        st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
        printlog(st + ",STATUS: no registered device found")
        # Play beeping sound and get input (key)
        pygame.mixer.music.load("/home/pi/Arduino-Pi-Home-Monitoring/Server/sounds/warn.wav")
        pygame.mixer.music.set_volume(0.1)
        pygame.mixer.music.play()
        while ((unlocked == False) and (warn == 1)):
            i = raw_input("key enter please")
            if i in keys:
                unlocked = True
                pygame.mixer.music.stop()
                pygame.mixer.music.load("/home/pi/Arduino-Pi-Home-Monitoring/Server/sounds/ding.wav")
                pygame.mixer.music.set_volume(0.6)
                pygame.mixer.music.play()
        if unlocked == False:
            st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
            printlog(st + ",WARNING: User did not authenticate")
            #ser.write("FLINE1       WARNING.FLINE2.FLINE3   Authorities have  .FLINE4    been notified    .")
            ser.write("DEFAULT.") #temp code
        else:
            printlog(st + ",Authentication success")
            ser.write("DEFAULT.")
  
# Setup Code
pygame.mixer.music.load("/home/pi/Arduino-Pi-Home-Monitoring/Server/sounds/startup.mp3")
pygame.mixer.music.set_volume(0.2)
pygame.mixer.music.play()
st = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
printlog(st + ",SYSTEM STARTING")
time.sleep(5)
ser.write("FLASH.")
ser.write("DEFAULT.")
data_update.updateArduino(ser)
#mydata = raw_input('Prompt :')
#print (mydata)
#ser.write("LINE1 " + mydata + ".")

# Loop
while True:
    processInput(ser.readline())





