/*-----( Import needed libraries )-----*/
#include <Wire.h>  // Comes with Arduino IDE
#include <Time.h>
// Get the LCD I2C Library here: 
// https://bitbucket.org/fmalpartida/new-liquidcrystal/downloads
// Move any other LCD libraries to another folder or delete them
// See Library "Docs" folder for possible commands etc.
#include <LiquidCrystal_I2C.h>

/*-----( Declare Constants )-----*/
int doorPin = A1;   // choose the input pin (for a pushbutton)
/*-----( Declare objects )-----*/
// set the LCD address to 0x27 for a 20 chars 4 line display
// Set the pins on the I2C chip used for LCD connections:
//                    addr, en,rw,rs,d4,d5,d6,d7,bl,blpol
LiquidCrystal_I2C lcd(0x27, 2, 1, 0, 4, 5, 6, 7, 3, POSITIVE);  // Set the LCD I2C address


/*-----( Declare Variables )-----*/
int val = 0; 
int doorLastState = -1;
int lastDoorLockState = -10;
int doorLockState = -1;
String serialIn = "";
String line1 = "      WARNING";
String line2 = "  No conn to host";
String oldLine1 = "";
String oldLine2 = "";
String hours = "";
String minutes = "";
String currentTime = "N/A";
String currentDate = "N/A";
String temp = "N/A";
String oldTemp = "0C";


/*-----( Communication Protocol )-----*/
//           DOU
// Door Status, Lock Status 

void setup()   /*----( SETUP: RUNS ONCE )----*/
{
  Serial.begin(9600);  // Used to type in characters
  Serial.setTimeout(500); // Set the timeout shorter for faster communication
  lcd.begin(20,4);         // initialize the lcd for 20 chars 4 lines, turn on backlight

// ------- Quick 3 blinks of backlight  -------------
  for(int i = 0; i< 3; i++)
  {
    lcd.backlight();
    delay(250);
    lcd.noBacklight();
    delay(250);
  }
  lcd.backlight(); // finish with backlight on  

//-------- Write characters on the display ------------------
  // NOTE: Cursor Position: Lines and Characters start at 0  
  lcd.setCursor(0,0); //Start at character 4 on line 0
  //lcd.print("Tim Home Monitoring");
  //lcd.clear();


}/*--(end setup )---*/


void loop()   /*----( LOOP: RUNS CONSTANTLY )----*/
{
  {
    // when characters arrive over the serial port...
    if (Serial.available()) {
      serialIn = Serial.readStringUntil('.'); // Will stop when sees period and leave rest as next input
      // Serial.println(serialIn);
      if (serialIn.equals("UNLOCK")){
        doorLockState = 0;
      }else if (serialIn.equals("LOCKED")){
        doorLockState = 1;
      }else if (serialIn.substring(0,4).equals("TEMP")){
        temp = serialIn.substring(5);
      }else if (serialIn.substring(0,7).equals("SETTIME")){
        setTime(serialIn.substring(8).toInt());
      }else if (serialIn.substring(0,5).equals("LINE1")){
        line1 = serialIn.substring(6);
      }else if (serialIn.substring(0,5).equals("LINE2")){
        line2 = serialIn.substring(6);
      }
      serialIn = "";
    }

    // Print top line
    if (!(String(monthShortStr(month())) + " " + String(day())).equals(currentDate)){
      lcd.setCursor(0,0);
      currentDate = (String(monthShortStr(month())) + " " + String(day()));
      lcd.print(currentDate);
    }
    if ((!(String(hour()) + "/" + String(minute())).equals(currentTime))){
      lcd.setCursor(8,0);
      if (String(hour()).length() == 1){
        hours = "0" + String(hour());
      }else{
        hours = String(hour());
      }
      if (String(minute()).length() == 1){
        minutes = "0" + String(minute());
      }else{
        minutes = String(minute());
      }
      currentTime = (hours + ":" + minutes);
      lcd.print(currentTime);
    }
    if (!(oldTemp.equals(temp))){
      if (temp.length() == 3){
        temp = " " + temp;
      }else if (temp.length() == 2){
        temp = "  " + temp;
      }else if (temp.length() == 1){
        temp = "   " + temp;
      }
      lcd.setCursor(20- temp.length(),0);
      lcd.print(temp);
      oldTemp = temp;
    }
    
    // Check door status
    val = analogRead(doorPin);
    if (val > 500){
      // Avoids refreshing the screen for no reason
      if (doorLastState != 0){
        lcd.setCursor(0,3);
        lcd.print("Door: CLOSED");
        doorLastState = 0;
      }
    }else{
      // Avoids refreshing the screen for no reason
      if (doorLastState != 1){
        lcd.setCursor(0,3);
        lcd.print("Door: OPENED  UNLOCK");
        Serial.println("DOU"); // Send serial out to computer
        doorLastState = 1;
      }
    }

    // Door lock state
    if (!(lastDoorLockState == doorLockState)){
      lcd.setCursor(14,3);
        if (doorLockState == -1){
          lcd.print(" ERROR");
          Serial.println("DCE"); // Send serial out to computer
        }else if (doorLockState == 1){
          lcd.print("LOCKED");
          Serial.println("DCL"); // Send serial out to computer
        }else if (doorLockState == 0){
          lcd.print("UNLOCK");
          Serial.println("DCU"); // Send serial out to computer
        }
        lastDoorLockState = doorLockState;
    }
    

    // Print any system messages
    if (!(line1.equals(oldLine1))){
      lcd.setCursor(0,1);
      lcd.print(line1);
      oldLine1 = line1;
    }
    if (!(line2.equals(oldLine2))){
      lcd.setCursor(0,2);
      lcd.print(line2);
      oldLine2 = line2;
    }
  }

}/* --(end main loop )-- */


/* ( THE END ) */