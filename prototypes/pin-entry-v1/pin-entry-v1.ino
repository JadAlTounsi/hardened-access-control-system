/**
 * @file pin-entry-v1.ino
 * @brief LCD1602 is in place instead of the TFT temporarily. No RFID yet, no lockout.
 *        Keypad input is validated, LCD displays feedback, servo opens/closes,
 *        and passive buzzer tones respond to access granted/denied
 * @date 2026-08-09
 */

#include <Keypad.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

#define SERVO_PIN 21  // define the pwm pin
#define PWM_CHN 0   // define the pwm channel
#define SERVO_FRQ 50  // define the pwm frequency
#define SERVO_BIT 12  // define the pwm precision
#define BUZZER_PIN 18 // define the buzzer pin
#define LCD_SDA 41  // define the SDA pin for LCD1602
#define LCD_SCL 42  // define  SCL pin for LCD1602

void servo_set_pin(int pin);
void servo_set_angle(int angle);
void buzzKeyPress();
void buzzGranted();
void buzzDenied();

byte rowPins[4] = {11, 12, 13, 14}; // connect to the row pins of the keypad
byte colPins[3] = {8, 9, 10}; // connect to the column pins of the keypad

char keys[4][3] = {
  {'1', '2', '3'},
  {'4', '5', '6'},
  {'7', '8', '9'},
  {'*', '0', '#'}
};

// initialize an instance of class NewKeypad
Keypad myKeypad = Keypad(makeKeymap(keys), rowPins, colPins, 4, 3);

char password[] = {"1234"}; // save the correct password

LiquidCrystal_I2C lcd(0x27,16,2);
void setup() {
  servo_set_pin(SERVO_PIN);
  pinMode(BUZZER_PIN, OUTPUT);

  Wire.begin(LCD_SDA, LCD_SCL); // attach the IIC pin
  if (!i2CAddrTest(0x27)) {
    lcd = LiquidCrystal_I2C(0x3F, 16, 2);
  }
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0,0);
  lcd.print("Enter your pin:");
  lcd.setCursor(0,1);
}

void loop() {
  static char keyIn[4]; // save the input character
  static byte keyInNum = 0; // save the the number of input characters
  char keyPressed = myKeypad.getKey();  // Get the character input
  
  if (keyPressed) {
    if (keyPressed < '0' || keyPressed > '9') {
      if (keyPressed == '*' && keyInNum > 0) { // clear last input with asterisk
        buzzKeyPress();
        
        keyInNum--;
        lcd.setCursor(keyInNum, 1);
        lcd.print(" ");
        lcd.setCursor(keyInNum, 1);
      }
      return;
    }
    buzzKeyPress(); // short tick on every key press
    keyIn[keyInNum++] = keyPressed; // save the input characters

    lcd.print("*");
    
    if (keyInNum == 4) {
      bool isRight = true;  // saved password is correct or not

      // check each character of the password if its correct
      for (int i = 0; i < 4; i++) {
        if (keyIn[i] != password[i])
          isRight = false;
      }
      if (isRight) {  // if the input password is right
        lcd.clear();
        lcd.setCursor(0,0);
        lcd.print("Access Granted");

        buzzGranted();

        servo_set_angle(90);  // servo opens
        delay(2000);
        servo_set_angle(0); // servo closes

        lcd.clear();
        lcd.print("Enter your pin:");
        lcd.setCursor(0,1);
      }
      else {  // If the input password is wrong
        lcd.clear();
        lcd.setCursor(0,0);
        lcd.print("Access Denied");
        buzzDenied();

        delay(2000);
        lcd.clear();
        lcd.print("Enter your pin:");
        lcd.setCursor(0,1);
      }
      keyInNum = 0; // reset the number of the input characters to 0
    }
  }
}

void servo_set_pin(int pin) {
  ledcAttachChannel(pin, SERVO_FRQ, SERVO_BIT, PWM_CHN);
}

void servo_set_angle(int angle) {
  if (angle > 180 || angle < 0)
    return;
  long pwm_value = map(angle, 0, 180, 103, 512);
  ledcWrite(SERVO_PIN, pwm_value);
}

bool i2CAddrTest(uint8_t addr) {
  Wire.beginTransmission(addr);
  if (Wire.endTransmission() == 0) {
    return true;
  }
  return false;
}

void buzzKeyPress() {
  tone(BUZZER_PIN, 1800, 30);
}

void buzzGranted() {
  tone(BUZZER_PIN, 1046, 100);
  delay(100);
  tone(BUZZER_PIN, 1318, 100); 
  delay(100);
  tone(BUZZER_PIN, 1568, 150);
  delay(150);
}

void buzzDenied() {
  tone(BUZZER_PIN, 400, 200);
  delay(200);
  tone(BUZZER_PIN, 300, 250);
  delay(250);
}