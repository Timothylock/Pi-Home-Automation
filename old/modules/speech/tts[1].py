import os

def speak(line):
    # Say the requesting thing
    os.system("bash tts.sh " + line)

