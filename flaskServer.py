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
		print(from_number)
		print(number.get("num"))
		if from_number in number.get("num"):
			message = "System disarmed for 10 minutes"
			resp.message(message)

	return str(resp)

# Incoming Call
@app.route("/call/", methods=['GET', 'POST'])
def incomingCall():
	"""Respond and greet the caller by name."""

	from_number = request.values.get('From', None)
	if from_number in callers:
		message = callers[from_number] + ", thanks for the message!"
	else:
		message = "Monkey, thanks for the message! through CALL"

	resp = twilio.twiml.Response()
	resp.say("System has been disarmed for 10 minutes. Goodbye")

	return str(resp)



if __name__ == "__main__":
	app.run(host="0.0.0.0")



