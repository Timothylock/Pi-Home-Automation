import RPi.GPIO as GPIO
import time

# Pin declaration based on relays
one = 21
two = 20
three = 16
four = 26
five = 19
six = 13
seven = 6
eight = 5

# Init GPIO
GPIO.setmode(GPIO.BCM)

print("GPIO Initialized")

def on(pin):
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin,False)

def off(pin):
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin,True)
