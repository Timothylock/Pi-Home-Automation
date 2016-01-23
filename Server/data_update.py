###############################################
#           Data Update Script                #
#                                             #
# Updates the temp, date, etc. to the arduino #
###############################################

import modules.weather.weather as weather
import time
import datetime
import threading
import serial

# Updates the Arduino with the latest information
def updateArduino():
    threading.Timer(300, updateArduino).start()
    clearMessages()
    updateTemp()
    updateClock()

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
        printlog(st + ",INTERNET LOST")
        ser.write("LINE1 cannot fetch weather.")
        ser.write("TEMP N/A.")

# Updates the internal clock on the Arduino since it does not have a RTC
def updateClock():
    # Updates the clock on the Arduino
    ser.write("SETTIME " + str(int(time.time()-18000)) + ".") # The (-) is to offset to EST
