/**
 * Robo Engineers (Grades 6–8), "Sense · Think · Act": the JOVE Day session (150 minutes) as a story in six chapters,
 * with the obstacle-avoiding Arduino car as a step-by-step tutorial: every connection drawn, every sketch shown.
 * Follows OPERATIONS/02_CURRICULUM/G06-08_Robo_Engineers/01_JOVE_Day_Session_Plan.md, the pin map and Sketches 1–5 of
 * its 08_Code_Library.md (shortened to what fits a slide), and 06_ROBOTICS_KITS/05_Assembly_Instructions_Builder.md.
 */
import { builderCircuit } from "./circuits";
import type { Deck } from "./types";

const OF = 9;

export const roboDeck: Deck = {
  id: "robo-engineers",
  group: "classroom",
  title: "Sense · Think · Act",
  audience: "Grades 6–8 · Robo Engineers · 2 h 30 min",
  blurb: "Inside a robot, how ultrasonic and servos work, the first Arduino program, then the obstacle-avoiding car built and wired step by step with the code for each stage, tuning on the arena, and Teach the Machine.",
  minutes: 150,
  theme: { accent: "#2d5fb3", tint: "#e1eaf8", level: 3, palette: ["#2d5fb3", "#1f8a7a", "#e8590c", "#7048e8", "#2b8a3e"] },
  sources: ["02_CURRICULUM/G06-08_Robo_Engineers/01_JOVE_Day_Session_Plan.md", "02_CURRICULUM/G06-08_Robo_Engineers/08_Code_Library.md", "06_ROBOTICS_KITS/05_Assembly_Instructions_Builder.md", "05_STUDENT_MATERIAL/G06-08_Robo_Engineers"],
  slides: () => [
    { kind: "cover", kicker: "Robo Engineers · Grades 6–8", title: "Sense · Think · Act", sub: "Build an Arduino car that decides for itself", art: "/images/age/age-3.webp", phase: "Wow" },

    /* ── Chapter 1: nobody is steering ─────────────────────── */
    { kind: "chapter", n: 1, title: "Nobody is steering", sub: "So who is making the decision?", icon: "Car", phase: "Wow", minutes: 3, notes: "The demo car drives at a wall and turns away; no remote. Let them guess." },
    {
      kind: "flow",
      title: "Every robot has three jobs",
      nodes: [
        { icon: "Radar", title: "Sense", text: "HC-SR04 ultrasonic: the eyes" },
        { icon: "Cpu", title: "Think", text: "Arduino Uno: the brain" },
        { icon: "Gauge", title: "Act", text: "Motors and the SG90 servo: the muscles" },
      ],
      loop: "the loop() runs thousands of times a second",
      phase: "Why",
      minutes: 7,
      notes: "Pass the HC-SR04, the IR module and the SG90 around. “Which of these senses? Which acts? Where is the thinking?” Teams add their car's parts on sticky notes.",
    },
    { kind: "quiz", question: "A servo motor is a sensor.", options: ["True", "False"], answer: 1, explain: "It moves: it is an actuator.", phase: "Why", minutes: 2, notes: "Thumbs up or down. Cold-call: “Name one sensor and one actuator on the car.”" },

    /* ── Chapter 2: meet the parts ─────────────────────────── */
    { kind: "chapter", n: 2, title: "Meet the parts", sub: "What each part does, before we join them", icon: "Package", phase: "Why" },
    {
      kind: "parts",
      title: "Your Builder Kit",
      parts: [
        { name: "Arduino Uno", qty: "1", job: "The brain: runs your code", draw: { type: "board", w: 260, h: 180, color: "#0b6b8a", title: "UNO", usb: true } },
        { name: "L293D shield", qty: "1", job: "Gives the motors power", draw: { type: "board", w: 260, h: 180, color: "#0b6b8a", title: "L293D", chip: true } },
        { name: "BO motors", qty: "2", job: "Drive the wheels", draw: { type: "motor", variant: "geared" } },
        { name: "HC-SR04", qty: "1", job: "Measures distance", draw: { type: "ultrasonic" } },
        { name: "SG90 servo", qty: "1", job: "Turns the sensor's head", draw: { type: "servo" } },
        { name: "IR line sensors", qty: "2", job: "See a black line", draw: { type: "board", w: 160, h: 110, color: "#1f1f1f", title: "IR", chip: false } },
        { name: "6 × AA box", qty: "1", job: "9 V for the car", draw: { type: "battery", cells: 6 } },
        { name: "Buzzer, LEDs", job: "Beeps and lights", draw: { type: "buzzer" } },
        { name: "Chassis kit", job: "Plate, wheels, castor", icon: "Car" },
        { name: "Jumpers + tools", job: "Wires, screwdriver", icon: "Cable" },
      ],
      phase: "Why",
      minutes: 5,
      notes: "Count aloud with your partner; missing parts are reported now, not later. One kit per station.",
    },
    {
      kind: "flow",
      title: "How the ultrasonic sensor sees",
      nodes: [
        { icon: "Zap", title: "TRIG", text: "a 10 µs pulse from the Uno" },
        { icon: "Volume2", title: "Ping!", text: "a sound too high to hear" },
        { icon: "Waves", title: "Bounce", text: "off the wall and back" },
        { icon: "Clock", title: "ECHO", text: "how long it took" },
        { icon: "Ruler", title: "Distance", text: "time × 0.0343 ÷ 2" },
      ],
      phase: "Why",
      notes: "Bats do the same. “The sensor sends a sound pulse and times the echo.”",
    },
    { kind: "big-number", number: "time × 0.0343 ÷ 2", label: "= distance in cm", sub: "Sound travels about 0.0343 cm every microsecond. Why ÷ 2?", phase: "Why", notes: "Answer: out and back. If they print 0: loose wire, object closer than 2 cm, or a soft surface." },
    { kind: "quiz", question: "The echo takes 580 µs. How far is the wall?", options: ["About 5 cm", "About 10 cm", "About 20 cm"], answer: 1, explain: "580 × 0.0343 ÷ 2 ≈ 9.9 cm", phase: "Test", minutes: 3 },
    {
      kind: "cards",
      title: "Servo and motor shield",
      cards: [
        { icon: "RotateCw", title: "Servo", text: "Turns to an exact angle: 0° to 180°. write(90) points it straight ahead." },
        { icon: "Cpu", title: "Uno pins", text: "Give tiny currents: enough for an LED, never a motor" },
        { icon: "Zap", title: "L293D shield", text: "A power switch the Uno controls: forward, back, speed" },
      ],
      phase: "Why",
      notes: "Why the shield: a motor needs far more current than an Uno pin can give. The shield takes battery power and switches it to the motors when the Uno says so.",
    },

    /* ── Chapter 3: first code ─────────────────────────────── */
    { kind: "chapter", n: 3, title: "Talk to the brain", sub: "Your first Arduino program", icon: "Code", phase: "Why" },
    {
      kind: "build",
      step: 1,
      of: OF,
      title: "Set up the laptop",
      need: ["Laptop", "USB cable", "Arduino IDE 2"],
      do: ["Tools → Board → Arduino Uno", "Plug in: Tools → Port → the new COM port", "Library Manager: Adafruit Motor Shield (v1)"],
      check: "The IDE shows Arduino Uno on COMx",
      tip: "No port? Use the data cable from the kit; install the CH340 driver",
      icon: "Laptop",
      phase: "Build",
      notes: "Trainers set the laptops up the day before; this slide is for checking. Serial Monitor baud rate: 9600.",
    },
    {
      kind: "code",
      title: "Your first program: Blink",
      code: "void setup() {\n  pinMode(13, OUTPUT);     // runs once\n}\n\nvoid loop() {              // runs forever\n  digitalWrite(13, HIGH);  // LED on\n  delay(500);              // wait half a second\n  digitalWrite(13, LOW);   // LED off\n  delay(500);\n}",
      highlight: [7],
      bullets: ["setup() runs once", "loop() runs forever", "Change 500 to 100: predict first!"],
      phase: "Why",
      minutes: 10,
      notes: "Live-code Blink on the projector: show compile (✓) and upload (→). Common errors: wrong board or port, missing semicolon.",
    },
    {
      kind: "code",
      title: "Add a beep: your team's pattern",
      code: "const uint8_t BUZZER_PIN = A4;\n\nvoid beep(int times, int onMs, int offMs) {\n  for (int i = 0; i < times; i++) {\n    tone(BUZZER_PIN, 1000);   // 1000 Hz\n    delay(onMs);\n    noTone(BUZZER_PIN);\n    delay(offMs);\n  }\n}\n\nvoid loop() { beep(3, 120, 120); delay(1000); }",
      highlight: [5],
      bullets: ["for repeats a block", "tone() makes a sound", "Make your own pattern!"],
      phase: "Test",
      minutes: 5,
      notes: "Sketch 1 in the Code Library. The buzzer goes on A4 (wired in step 9; for now use the one on the trainer's demo board or the built-in LED only).",
    },

    /* ── Chapter 4: build the car ──────────────────────────── */
    { kind: "chapter", n: 4, title: "Build the car", sub: "One connection at a time. Test as you go.", icon: "Wrench", phase: "Build", notes: "Roles rotate: Builder, Reader (the build guide), Tester, Recorder (change → prediction → result), Captain (talks to the trainer)." },
    { kind: "build", step: 2, of: OF, title: "Chassis, motors and wheels", need: ["Chassis plate", "2 BO motors", "Wheels", "Castor"], do: ["Screw a motor on each side", "Push on the wheels", "Fix the castor at the front", "Battery box underneath"], check: "Wheels spin freely; the car sits level", icon: "Wrench", phase: "Build", minutes: 10 },
    { kind: "build", step: 3, of: OF, title: "Stack the shield on the Uno", need: ["Uno", "L293D shield"], do: ["Line up every shield pin with its socket", "Press down evenly", "Fix the Uno on the chassis"], warn: "A bent pin = a dead connection. Check before you press.", icon: "Layers", phase: "Build", minutes: 5 },
    { kind: "build", step: 4, of: OF, title: "Motors to M1 and M2", do: ["Left motor's two wires → M1", "Right motor's two wires → M2", "Tighten the screw terminals"], tip: "A wheel spins the wrong way later? Swap its two wires.", diagram: builderCircuit("motors"), phase: "Build", minutes: 5, notes: "In code: AF_DCMotor leftMotor(1); AF_DCMotor rightMotor(2);" },
    { kind: "build", step: 5, of: OF, title: "Battery power to the shield", do: ["Red → EXT_PWR +, black → EXT_PWR −", "Set the power jumper as the kit guide shows", "Fresh alkaline cells, switch OFF"], warn: "USB alone runs the code, not the motors", diagram: builderCircuit("power"), phase: "Build", minutes: 3, notes: "The 6×AA holder powers the shield (motors) and the Uno through the shield, per the kit guide's jumper. Check polarity at every station." },
    {
      kind: "code",
      title: "Test drive: wheels OFF the ground",
      code: "#include <AFMotor.h>\nAF_DCMotor leftMotor(1);    // port M1\nAF_DCMotor rightMotor(2);   // port M2\n\nvoid drive(int l, int r) {  // -255..255\n  leftMotor.setSpeed(abs(l));\n  leftMotor.run(l > 0 ? FORWARD : l < 0 ? BACKWARD : RELEASE);\n  rightMotor.setSpeed(abs(r));\n  rightMotor.run(r > 0 ? FORWARD : r < 0 ? BACKWARD : RELEASE);\n}\nvoid loop() { drive(170, 170); delay(1000); drive(0, 0); delay(1000); }",
      highlight: [11],
      bullets: ["Both wheels forward?", "One backwards: swap its wires", "Keep speed below 200 on 6 × AA"],
      phase: "Test",
      minutes: 10,
      notes: "Sketch 4 (drive patterns), shortened. Stretch: drive a square (forward, turnRight90, four times) and calibrate TURN_MS for your floor.",
    },
    { kind: "build", step: 6, of: OF, title: "Servo: centre it first", need: ["SG90", "Sensor bracket"], do: ["Servo cable → SERVO1 (orange = signal)", "Upload Sketch 3: it moves to 90°", "Now screw the bracket on, facing forward"], check: "At 90° the sensor looks straight ahead", diagram: builderCircuit("servo"), phase: "Build", minutes: 10, notes: "SERVO1 on the shield is pin D10. Centring before mounting saves a car that looks sideways when it thinks it is looking ahead." },
    { kind: "build", step: 7, of: OF, title: "Wire the ultrasonic sensor", need: ["HC-SR04", "4 jumpers"], do: ["VCC → 5V,  GND → GND", "TRIG → A0", "ECHO → A1", "Mount it on the servo bracket"], tip: "A0–A5 work as ordinary digital pins", diagram: builderCircuit("ultrasonic"), phase: "Build", minutes: 7 },
    {
      kind: "code",
      title: "Step 8: read the distance",
      code: "digitalWrite(TRIG_PIN, HIGH);         // send a sound pulse\ndelayMicroseconds(10);\ndigitalWrite(TRIG_PIN, LOW);\n\nunsigned long us = pulseIn(ECHO_PIN, HIGH, 30000UL);\nfloat cm = us * 0.0343 / 2;           // time to distance\n\nSerial.print(\"Distance: \");\nSerial.println(cm);",
      highlight: [6],
      bullets: ["Open the Serial Monitor (9600)", "Hand closer: the number shrinks", "Sketch 2 in the Code Library"],
      phase: "Test",
      minutes: 7,
      notes: "Each team shows its serial monitor with a changed distance; one student explains the number without looking at the code.",
    },
    { kind: "build", step: 9, of: OF, title: "Buzzer for warnings", need: ["Buzzer", "2 jumpers"], do: ["Buzzer + → A4", "Buzzer − → GND", "Upload Sketch 1: does it beep?"], check: "Three short beeps", diagram: builderCircuit("buzzer"), phase: "Build", minutes: 3 },
    {
      kind: "table",
      title: "The whole car: the pin map",
      head: ["Part", "Connects to", "In the code"],
      rows: [
        ["Left motor", "Shield M1", "AF_DCMotor(1)"],
        ["Right motor", "Shield M2", "AF_DCMotor(2)"],
        ["HC-SR04 TRIG · ECHO", "A0 · A1", "TRIG_PIN · ECHO_PIN"],
        ["Servo signal", "SERVO1 (D10)", "scanner.attach(10)"],
        ["Buzzer +", "A4", "BUZZER_PIN"],
        ["IR left · right (Level 2)", "A2 · A3", "IR_LEFT_PIN · IR_RIGHT_PIN"],
        ["6 × AA", "EXT_PWR", "—"],
      ],
      foot: "If your kit's wiring card differs, the card wins: change the constants at the top of the sketch.",
      phase: "Build",
    },
    { kind: "circuit", title: "Everything connected", diagram: builderCircuit("all"), phase: "Build", notes: "Final check before the first run: every wire on the right pin, battery switch OFF until the car is on the floor." },

    /* ── Chapter 5: make it think ──────────────────────────── */
    { kind: "chapter", n: 5, title: "Make it think", sub: "Turn the parts into a robot that decides", icon: "Brain", phase: "Build" },
    {
      kind: "flow",
      title: "The obstacle-avoider's plan",
      nodes: [
        { icon: "Radar", title: "Look ahead", text: "read the distance" },
        { icon: "Search", title: "Closer than 20 cm?", text: "no: keep driving" },
        { icon: "Volume2", title: "Stop and beep", text: "then back up a little" },
        { icon: "Eye", title: "Look left, look right", text: "servo to 150° and 30°" },
        { icon: "Navigation", title: "Turn", text: "toward the clearer side" },
      ],
      loop: "back to the start, forever",
      phase: "Why",
      notes: "Draw this on the board before showing the code. Ask: what should it do if both sides are blocked?",
    },
    {
      kind: "code",
      title: "Sketch 5: the decision in code",
      code: "void loop() {\n  int ahead = distanceCm();\n  if (ahead > STOP_DISTANCE_CM) {          // clear: keep going\n    drive(DRIVE_SPEED, DRIVE_SPEED); return;\n  }\n  stopCar(); tone(BUZZER_PIN, 1500, 150);  // stop and warn\n  drive(-DRIVE_SPEED, -DRIVE_SPEED); delay(BACKUP_MS);\n  int leftCm  = lookAt(LEFT_ANGLE);\n  int rightCm = lookAt(RIGHT_ANGLE);\n  if (leftCm >= rightCm) drive(-TURN_SPEED, TURN_SPEED);\n  else                   drive(TURN_SPEED, -TURN_SPEED);\n  delay(TURN_MS); stopCar();\n}",
      highlight: [3, 10],
      bullets: ["if … else = a decision", "lookAt() turns the servo, then measures", "Full sketch: Code Library, Sketch 5"],
      phase: "Build",
      minutes: 15,
      notes: "distanceCm() takes the middle of three readings, which removes single wrong readings. Upload with the car held up, then put it down.",
    },
    {
      kind: "code",
      title: "Tune your car: change ONE thing",
      code: "const int STOP_DISTANCE_CM = 20;   // react when closer than this\nconst int DRIVE_SPEED      = 160;  // 0 to 255\nconst int TURN_MS          = 450;  // about 90 degrees\nconst int LEFT_ANGLE       = 150;  // swap if the servo is mounted\nconst int RIGHT_ANGLE      = 30;   // the other way",
      highlight: [1, 2, 3],
      bullets: ["Change one number at a time", "Write: change → prediction → result", "Faster is not always better"],
      phase: "Test",
      minutes: 10,
      notes: "Arena run: 3 walls, no touch. The Recorder writes three test rows.",
    },
    {
      kind: "table",
      title: "Troubleshooting ladder",
      head: ["Symptom", "Likely cause", "Fix"],
      rows: [
        ["Nothing powers up", "Switch off · polarity · shield jumper", "Check switch, polarity, power jumper"],
        ["Motors twitch or stall", "Weak or mixed cells · loose terminal", "Fresh cells · re-seat wires"],
        ["Wheel spins backwards", "Motor wires swapped", "Swap the two wires"],
        ["Servo jitters, Uno resets", "Weak batteries", "Fresh cells · lower DRIVE_SPEED"],
        ["Distance always 0", "TRIG/ECHO on the wrong pins", "Check pins · face a flat wall"],
        ["Turns the wrong way", "Left and right ports swapped", "Swap LEFT_PORT and RIGHT_PORT"],
      ],
      phase: "Test",
      notes: "“Your car hits the wall. Is that a sensor problem, a code problem or a power problem? How would you test each?”",
    },

    /* ── Chapter 6: a machine that learns ──────────────────── */
    { kind: "chapter", n: 6, title: "A machine that learns", sub: "What if we cannot write the rule?", icon: "Brain", phase: "Why" },
    { kind: "compare", title: "Two ways to make a decision", left: { title: "A rule we write", items: ["if distance < 20 then turn", "We decide the rule", "Easy for pen vs ruler?"] }, right: { title: "A model that learns", items: ["We show labelled examples", "It finds the pattern", "Needed for faces, voices, pictures"] }, phase: "Why", minutes: 8, notes: "Water and stretch first (2 min). Show a cat and a dog photo: “How do you know?” Then write a rule to tell a pen from a ruler; where does it break? “Now imagine writing the rule for a face.”" },
    {
      kind: "steps",
      title: "Teach the Machine",
      steps: [
        { title: "Two classes", detail: "Open hand vs fist · or pen vs ruler", icon: "Layers" },
        { title: "About 30 images each", detail: "Different angles and distances", icon: "Camera" },
        { title: "Train and watch", detail: "The confidence bars move live", icon: "Gauge" },
        { title: "Break it!", detail: "New lighting: what fails?", icon: "Bug" },
      ],
      phase: "Build",
      minutes: 22,
      notes: "Google Teachable Machine (Image Project) or jove.website/labs/teach-the-machine. Paper fallback in the plan if there is no internet. Privacy: hands and objects, not faces; delete the projects after the session.",
    },
    { kind: "statement", big: "The machine never learned what a pen is.", sub: "It learned patterns in your pictures.", icon: "Brain", phase: "Why", notes: "“If the data is unfair, is the model fair?” Each team states one way its model failed and one way to improve it." },
    { kind: "points", title: "Showcase: your 30-second demo", points: ["One student operates, one explains", "Show one decision your code makes", "Top 5 arena teams on stage"], icon: "Trophy", phase: "Show", minutes: 15, notes: "Others do a walk-around gallery. Every student receives a participation certificate; Merit and Winner per the Assessment Framework. Film only students whose consent is collected." },
    { kind: "closing", title: "Exit ticket", sub: "One thing a sensor does. One thing our code decides.", points: ["Keep going: jove.website/labs/echo-sensor", "and jove.website/labs/line-follower"], phase: "Show", notes: "Sticky note in the last 2 minutes. Station reset: count parts, remove cells, clear the laptops (no student data stays)." },
  ],
};
