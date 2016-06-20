import os

def play(file):
    os.system('omxplayer -o local ' + file)

print("Sound module initialized")