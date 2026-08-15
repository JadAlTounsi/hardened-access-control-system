/**
 * @file pin-entry-v2.ino
 * @brief 1.8 inch TFT display is now implemented into this access control system.
 *        Keypad input is validated, TFT screen displays feedback, servo opens/closes,
 *        and passive buzzer tones respond to access granted/denied and key presses. 
 *        Instead of auto submitting pin on the 4th digit, it requires the user to manually
 *        press the '#' key to allow the user to correct the 4th digit if it was entered wrong.
 * @date 2026-08-15
 */

#include <Keypad.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>

#define SERVO_PIN 21  // define the pwm pin
#define PWM_CHN 0   // define the pwm channel
#define SERVO_FRQ 50  // define the pwm frequency
#define SERVO_BIT 12  // define the pwm precision
#define BUZZER_PIN 18 // define the buzzer pin

#define TFT_SCK 41 // define SCK pin for TFT
#define TFT_SDA 42 // define SDA pin for TFT
#define TFT_A0 15 // define A0 pin for TFT
#define TFT_RST 16 // define RESET pin for TFT
#define TFT_CS 17 // define CS pin for TFT

#define BLACK 0x0000
#define NAVY 0x000F
#define WHITE 0xFFFF
#define GREEN 0x07E0
#define RED 0xF800

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

// initialize an instance of class tft
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_A0, TFT_RST);

void setup() {
  servo_set_pin(SERVO_PIN);
  servo_set_angle(0);
  pinMode(BUZZER_PIN, OUTPUT);

  SPI.begin(TFT_SCK, -1, TFT_SDA, TFT_CS);

  tft.initR(INITR_BLACKTAB);
  tft.setRotation(3); // tft display becomes horizontal
  tft.fillScreen(BLACK);
  
  drawPinScreen(); // prompt with the user to enter pin
}

void loop() {
  static char keyIn[4]; // save the input character
  static byte keyInNum = 0; // save the the number of input characters
  char keyPressed = myKeypad.getKey();  // get the character input

  if (keyPressed) {
    if (keyPressed < '0' || keyPressed > '9') {
      if (keyPressed == '*' && keyInNum > 0) { // clear last input with asterisk
        buzzKeyPress();
        keyInNum--;
        eraseAsterisk(keyInNum);
      }
      if (keyPressed == '#' && keyInNum == 4) { // when '#' is pressed and 4 digits have been entered
        bool isRight = true;

        // check each character of the password if its correct
        for (int i = 0; i < 4; i++) {
          if (keyIn[i] != password[i])
            isRight = false;
        }

        if (isRight) {
          drawAccessGranted();
        } else {
          drawAccessDenied();
        }
        
        keyInNum = 0;
      }
      return;
    }
    if (keyInNum < 4) { // allows a max of 4 digits
      buzzKeyPress();
      drawAsterisk(keyInNum);
      keyIn[keyInNum++] = keyPressed; // save the input characters
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

void drawHeader(const String title, uint16_t bgColor) {
  tft.fillRect(0, 0, 160, 22, bgColor);
  drawCenterText(title, 80, 7, 1);
  tft.drawFastHLine(0, 22, 160, WHITE);
}

void drawPinScreen() {
  tft.fillScreen(BLACK);

  drawHeader("ACCESS CONTROL", NAVY);

  drawCenterText("ENTER YOUR 4 DIGIT PIN", 80, 40, 1);

}

void drawAccessGranted() {
  tft.fillScreen(BLACK);

  drawHeader("ACCESS CONTROL", NAVY);

  // draw a white checkmark in a green circle
  tft.fillCircle(80, 85, 24, GREEN);
  tft.drawLine(68, 85, 76, 93, WHITE);
  tft.drawLine(69, 85, 77, 93, WHITE);
  tft.drawLine(76, 93, 92, 75, WHITE);
  tft.drawLine(77, 93, 93, 75, WHITE);

  drawCenterText("ACCESS GRANTED", 80, 40, 1);
  
  buzzGranted();
  servo_set_angle(90);  // servo opens
  delay(2000);
  servo_set_angle(0); // servo closes
  drawPinScreen();
}

void drawAccessDenied() {
  tft.fillScreen(BLACK);

  drawHeader("ACCESS CONTROL", NAVY);

  // draw a white X in a red circle
  tft.fillCircle(80, 85, 24, RED);
  tft.drawLine(68, 73, 92, 97, WHITE);
  tft.drawLine(69, 73, 93, 97, WHITE);
  tft.drawLine(92, 73, 68, 97, WHITE);
  tft.drawLine(93, 73, 69, 97, WHITE);

  drawCenterText("ACCESS DENIED", 80, 40, 1);
  
  buzzDenied();

  delay(2000);
  drawPinScreen();
}

void drawCenterText(const String &text, int x, int y, int textSize) {
  int16_t x1, y1;
  uint16_t w, h;

  tft.setTextSize(textSize);
  tft.getTextBounds(text, 0, 0, &x1, &y1, &w, &h); // calculate dimensions at (0,0) by storing offset in x1 and y1, width and height in w and h
  tft.setCursor(x - w / 2, y); // center the text horizontally
  tft.print(text);
}

void drawAsterisk(int index) {
  int x = 68 + (index * 6); // middle of screen is 80px, 4 digits takes up 24px, divide to both sides of the middle will give us the 'x' at an index
  tft.setTextSize(1);
  tft.setCursor(x, 80);
  tft.print("*");
}

void eraseAsterisk(int index) {
  int x = 68 + (index * 6);
  tft.fillRect(x, 80, 6, 8, BLACK);
}