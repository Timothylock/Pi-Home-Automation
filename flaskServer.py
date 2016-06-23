from flask import Flask, request, redirect
import twilio.twiml
import xml.etree.ElementTree as ET




app = Flask(__name__)

# Incoming SMS. Creates a file called "DISARM" if request 
# coming from valid number
@app.route("/sms/", methods=['GET', 'POST'])
def incomingSMS():
	from_number = request.values.get('From', None)

	# Create response
	resp = twilio.twiml.Response()

	# Parse the config file and see if approved number
	conf = ET.parse("configuration.xml").getroot()
	for number in conf.findall(".//number"):
		if from_number in number.get("num"):
			resp.message("System disarmed for 10 minutes or until the door is opened")
			print("disarmed")
			file = open("DISARM", "w")
			file.close()

	return str(resp)

# Incoming Call
@app.route("/call/", methods=['GET', 'POST'])
def incomingCall():
	from_number = request.values.get('From', None)

	# Create response
	resp = twilio.twiml.Response()

	# Parse the config file and see if approved number
	conf = ET.parse("configuration.xml").getroot()
	for number in conf.findall(".//number"):
		if from_number in number.get("num"):
			resp.say("System has been disarmed for 10 minutes or until the door is opened. Goodbye")
			resp.say("Goodbye")
			print("disarmed")
			file = open("DISARM", "w")
			file.close()

	return str(resp)



if __name__ == "__main__":
	app.run(host="0.0.0.0")



