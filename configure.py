import json
import hashlib
import os

def clear():
    os.system('cls')  # For Windows
    os.system('clear')  # For Linux/OS X

def getPin(msg):
    ready = False
    while not ready:
        print(msg)
        try:
            pin = int(raw_input())
            if (pin < 0 or pin > 100):
                clear()
                print("pin is out of range. Try again!")
            else:
                clear()
                return pin
        except:
            clear()
            print("Cannot understand that input. Enter an integer")

#==============================================
# Import DB
import sqlite3

DB_NAME = "data/home_monitor.db"
SQL_File_Name = "data/tables.sql"

#Read Table Schema into a Variable and remove all New Line Chars
TableSchema=""
with open(SQL_File_Name, 'r') as SchemaFile:
 TableSchema=SchemaFile.read().replace('\n', '')

#Connect or Create DB File
conn = sqlite3.connect(DB_NAME)
curs = conn.cursor()

#Create Tables
sqlite3.complete_statement(TableSchema)
curs.executescript(TableSchema)

#Add admin user
print("= Database setup =\nPlease enter the details of the admin account that will be created")
uname = raw_input('Enter a username: ')
pword = raw_input('Enter a password: ')
hash_object = hashlib.sha1(pword)
hex_dig = hash_object.hexdigest()
conn.execute("INSERT INTO Users (userid, username, password, real_name, access_level) VALUES (3, \"" + uname + "\", \"" + hex_dig + "\", \"Admin\", 99)")
conn.commit()

#Close DB
curs.close()
conn.close()

#==============================================

conf = {}

# Configure door sensor
conf["doorSensor"] = getPin("= Step 1 - Door sensor =\n\nPlease enter the pin for the door sensor")

# Configure PIR sensor
conf["pirSensor"] = getPin("= Step 2 - PIR sensor =\n\nPlease enter the pin for the PIR sensor")

# Configure Blinds
conf["blinds"] = {}
conf["blinds"]["open"] = getPin("= Step 3a - Blinds Open =\n\nPlease enter the pin to OPEN the blinds")
conf["blinds"]["close"] = getPin("= Step 3b - Blinds Close =\n\nPlease enter the pin to CLOSE the blinds")

# Get light/outlet pins
ready = False
conf["outletlights"] = {}
while not ready:
    print("= Step 4 - Lights and Outlets =\n\nPlease enter the pin that will turn on and off outlet/lights\n\nHere are the current entries:\n")
    print(conf["outletlights"])
    print("\n\n\nEnter a name for this pin. Enter \"Done\" when you are finished")
    name = raw_input()
    if name == "done" or name == "Done":
        break
    conf["outletlights"][name] = getPin("Please enter the pin number")
    ready = False
    
# Write it out
with open('data/configuration.json', 'w+') as outfile:
    json.dump(conf, outfile)

print("The file has been writen to data/configuration.json. You may start the program now")
