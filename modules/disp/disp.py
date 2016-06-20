# loading the class
import lcddriver
from time import *

# lcd start
lcd = lcddriver.lcd()

# Init the LCD driver
def start():
    global lcd
    lcd = lcddriver.lcd()

# Clear the LCD screen
def clear():    
    lcd.lcd_clear()

# Replaces screen with message
def display(line1,line2,line3,line4):
    lcd.lcd_display_string(line1, 1)
    lcd.lcd_display_string(line2, 2)
    lcd.lcd_display_string(line3, 3)
    lcd.lcd_display_string(line4, 4)

# Replaces line with message
def display(line, linenumber):
    lcd.lcd_display_string(line, linenumber)

'''
lcd.lcd_display_string("    Test Counter     ", 1)
lcd.lcd_display_string("Hello world from Tim ",4)

for i in range(999999):
    lcd.lcd_display_string(str(i), 2)
'''

start()
print ("LCD Initialized")
