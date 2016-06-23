from flask import Flask, request, redirect
import twilio.twiml

app = Flask(__name__)

# Try adding your own number to this list!
callers = {
    "+14158675309": "Curious George",
    "+14158675310": "Boots",
    "+14158675311": "Virgil",
}

@app.route("/sms/", methods=['GET', 'POST'])
def incomingSMS():
    """Respond and greet the caller by name."""

    from_number = request.values.get('From', None)
    if from_number in callers:
        message = callers[from_number] + ", thanks for the message!"
    else:
        message = "Monkey, thanks for the message!"

    resp = twilio.twiml.Response()
    resp.message(message)

    return str(resp)

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
