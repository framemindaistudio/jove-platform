/**
 * Grades 6–8 · Builder Kit: Blink on the Uno, then the obstacle-avoiding car, wired with the pin map of the
 * Robo Engineers deck (src/lib/decks/robo.ts): motors on M1/M2, servo on SERVO1 (D10), HC-SR04 TRIG A0 · ECHO A1,
 * buzzer on A4.
 */
import type { BenchProject, PlacedPart } from "../types";
import { inBoard } from "./place";

const bb: PlacedPart = { id: "bb", type: "breadboard", at: [4.5, 0, 0.5] };

export const BLINK_CODE = `void setup() {
  pinMode(13, OUTPUT);     // runs once
}

void loop() {              // runs forever
  digitalWrite(13, HIGH);  // LED on
  delay(500);              // wait half a second
  digitalWrite(13, LOW);   // LED off
  delay(500);
}`;

export const blinkProject: BenchProject = {
  id: "blink",
  title: "Blink: your first Arduino program",
  audience: "Grades 6–8 · Builder Kit",
  kit: "Builder",
  summary: "Wire an LED to pin 13 of the Arduino Uno, upload Blink, then change the code and watch the timing change.",
  public: true,
  behaviour: "blink",
  code: BLINK_CODE,
  parts: [
    { id: "uno", type: "uno", at: [-3.5, 0, 0] },
    bb,
    inBoard(bb, "b3", { id: "r", type: "resistor", props: { value: "220 Ω", label: "220 Ω resistor" } }),
    inBoard(bb, "d7", { id: "led", type: "led", props: { color: "#40c057", label: "Green LED" } }),
  ],
  camera: { at: [0, 13, 13], look: [0.5, 0.5, 0] },
  steps: [
    { title: "Meet the Uno", text: "The Arduino Uno is the brain. The row of holes on top are its digital pins, 0 to 13. GND is the way back.", place: ["uno", "bb"], tip: "Hover over the Uno's pins to read their names." },
    { title: "Resistor in", text: "220 Ω resistor from B3 to B7.", place: ["r"] },
    { title: "LED in", text: "LED long leg (+) in D7, the resistor's line. Short leg (−) in D8.", place: ["led"] },
    { title: "Pin 13 to the resistor", text: "Yellow jumper from the Uno's pin 13 to A3.", wires: [{ from: "uno.D13", to: "bb.a3", color: "yellow" }] },
    { title: "Back to GND", text: "Black jumper from A8 to the GND pin next to pin 13.", wires: [{ from: "bb.a8", to: "uno.GND.1", color: "black" }] },
    { title: "Upload and run", text: "Press Run: the code goes to the Uno and the LED blinks every half second.", run: true },
    { title: "Change ONE thing", text: "Open Code, change both delay(500) to delay(100), and run again. Faster! Try 1000.", run: true, tip: "One change, one test: that is how engineers find out what each line does." },
  ],
};

/* ── The obstacle-avoiding car ── */

export const AVOIDER_CODE = `#include <AFMotor.h>
#include <Servo.h>
AF_DCMotor leftMotor(1);    // port M1
AF_DCMotor rightMotor(2);   // port M2
Servo scanner;

const uint8_t TRIG_PIN = A0;
const uint8_t ECHO_PIN = A1;
const uint8_t BUZZER_PIN = A4;

const int STOP_DISTANCE_CM = 20;   // react when closer than this
const int DRIVE_SPEED      = 160;  // 0 to 255
const int TURN_SPEED       = 170;
const int BACKUP_MS        = 300;
const int TURN_MS          = 450;  // about 90 degrees
const int LEFT_ANGLE       = 150;
const int RIGHT_ANGLE      = 30;

void drive(int l, int r) {  // -255..255
  leftMotor.setSpeed(abs(l));
  leftMotor.run(l > 0 ? FORWARD : l < 0 ? BACKWARD : RELEASE);
  rightMotor.setSpeed(abs(r));
  rightMotor.run(r > 0 ? FORWARD : r < 0 ? BACKWARD : RELEASE);
}
void stopCar() { drive(0, 0); }

int distanceCm() {
  digitalWrite(TRIG_PIN, HIGH);         // send a sound pulse
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long us = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return us * 0.0343 / 2;               // time to distance
}

int lookAt(int angle) {
  scanner.write(angle); delay(400);
  int cm = distanceCm();
  scanner.write(90); delay(200);
  return cm;
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  scanner.attach(10);                   // SERVO1
  scanner.write(90);
}

void loop() {
  int ahead = distanceCm();
  if (ahead > STOP_DISTANCE_CM) {          // clear: keep going
    drive(DRIVE_SPEED, DRIVE_SPEED); return;
  }
  stopCar(); tone(BUZZER_PIN, 1500, 150);  // stop and warn
  drive(-DRIVE_SPEED, -DRIVE_SPEED); delay(BACKUP_MS);
  int leftCm  = lookAt(LEFT_ANGLE);
  int rightCm = lookAt(RIGHT_ANGLE);
  if (leftCm >= rightCm) drive(-TURN_SPEED, TURN_SPEED);
  else                   drive(TURN_SPEED, -TURN_SPEED);
  delay(TURN_MS); stopCar();
}`;

export const avoiderProject: BenchProject = {
  id: "obstacle-avoider",
  title: "Obstacle-avoiding Car",
  audience: "Grades 6–8 · Builder Kit",
  kit: "Builder",
  summary: "Arduino Uno, L293D shield, ultrasonic sensor on a servo: a car that sees a wall, stops, looks both ways and turns.",
  behaviour: "avoider",
  code: AVOIDER_CODE,
  parts: [
    { id: "chassis", type: "chassis", at: [0, 0, 0] },
    { id: "mR", type: "bomotor", at: [-3.5, 0, 4.4], props: { label: "Right motor" } },
    { id: "mL", type: "bomotor", at: [-1.5, 0, -4.4], turn: 180, props: { label: "Left motor" } },
    { id: "bat", type: "battery6", at: [-1.2, 0.35, 0], turn: 180 },
    { id: "sh", type: "unoShield", at: [-0.6, 3.75, 0] },
    { id: "servo", type: "sg90", at: [5.6, 3.75, 0], props: { label: "Servo (scanner)" } },
    { id: "hc", type: "hcsr04", at: [6.15, 6.45, 0], turn: 90, props: { label: "Ultrasonic sensor" } },
    { id: "bz", type: "buzzer", at: [3.2, 3.75, 3.6] },
  ],
  camera: { at: [16, 20, 20], look: [0, 3.5, 0] },
  steps: [
    { title: "Chassis, motors and wheels", text: "A motor on each side, wheels on, castor at the front, the 6 × AA box underneath.", place: ["chassis", "mL", "mR", "bat"] },
    { title: "Stack the shield on the Uno", text: "Line up every shield pin with its socket and press down evenly. Fix the Uno on the chassis.", place: ["sh"], tip: "A bent pin = a dead connection. Check before you press." },
    { title: "Motors to M1 and M2", text: "Left motor's two wires into M1, right motor's into M2. Tighten the screws.", wires: [{ from: "mL.a", to: "sh.M1a", color: "red" }, { from: "mL.b", to: "sh.M1b", color: "black" }, { from: "mR.a", to: "sh.M2a", color: "red" }, { from: "mR.b", to: "sh.M2b", color: "black" }], tip: "A wheel spins the wrong way later? Swap its two wires." },
    { title: "Battery power to the shield", text: "Red to EXT_PWR +, black to EXT_PWR −. Switch OFF.", wires: [{ from: "bat.+", to: "sh.EXT+", color: "red" }, { from: "bat.-", to: "sh.EXT-", color: "black" }], tip: "USB alone runs the code, not the motors." },
    { title: "Servo: centre it first", text: "Servo cable into SERVO1: orange = signal. The code turns it to 90° before the bracket goes on.", place: ["servo"], wires: [{ from: "servo.S", to: "sh.SERVO1.S", color: "orange" }, { from: "servo.+", to: "sh.SERVO1.+", color: "red" }, { from: "servo.-", to: "sh.SERVO1.-", color: "brown" }] },
    { title: "Wire the ultrasonic sensor", text: "VCC → 5V, GND → GND, TRIG → A0, ECHO → A1. Mount it on the servo bracket.", place: ["hc"], wires: [{ from: "hc.VCC", to: "sh.5V", color: "red" }, { from: "hc.GND", to: "sh.GND", color: "black" }, { from: "hc.TRIG", to: "sh.A0", color: "yellow" }, { from: "hc.ECHO", to: "sh.A1", color: "green" }], tip: "A0–A5 work as ordinary digital pins." },
    { title: "Buzzer for warnings", text: "Buzzer + → A4, − → GND.", place: ["bz"], wires: [{ from: "bz.+", to: "sh.A4", color: "purple" }, { from: "bz.-", to: "sh.GND", color: "black" }] },
    { title: "Upload Sketch 5 and drive", text: "Press Drive: the car runs the obstacle-avoider code in the arena. Watch it stop, look left, look right and turn.", run: true, tip: "Change STOP_DISTANCE_CM in Code and drive again." },
  ],
};
