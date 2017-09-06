import json
import hashlib
import os
import os.path
import sqlite3

#==============================================
# Import DB
#==============================================

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
uname = 'testuser'
pword = 'testpassword'
hash_object = hashlib.sha1(pword)
hex_dig = hash_object.hexdigest()
conn.execute("INSERT INTO Users (username, password, real_name, access_level) VALUES (\"" + uname + "\", \"" + hex_dig + "\", \"Admin\", 3)")
conn.commit()

#Close DB
curs.close()
conn.close()

print("Generated test DB")
