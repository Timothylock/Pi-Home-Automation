from twilio.rest import TwilioRestClient 

def sendSMS(recipient, text, ACCOUNT_SID,  AUTH_TOKEN):
  
    client = TwilioRestClient(ACCOUNT_SID, AUTH_TOKEN) 
     
    client.messages.create(
            to = recipient, 
            from_ = "+12018993782", 
            body = text,  
    )
    print("Sent SMS")
