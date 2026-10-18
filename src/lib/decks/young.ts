/**
 * Young Makers (Grades 3–5), "Circuits & Smart Machines": the JOVE Day session (105 minutes) as a story in five
 * chapters, with the circuit missions and the light-seeking car as step-by-step tutorials, each with its wiring
 * picture. Follows OPERATIONS/02_CURRICULUM/G03-05_Young_Makers/01_JOVE_Day_Session_Plan.md and
 * OPERATIONS/06_ROBOTICS_KITS/04_Assembly_Instructions_Explorer.md. Short sentences, an analogy for every idea,
 * a prediction before every reveal.
 */
import { missionCircuit, seekerCircuit } from "./circuits";
import type { Deck } from "./types";

const OF = 8;

export const youngDeck: Deck = {
  id: "young-makers",
  group: "classroom",
  title: "Circuits & Smart Machines",
  audience: "Grades 3–5 · Young Makers · 1 h 45 min",
  blurb: "The mystery car, four circuit missions on the breadboard, then the light-seeking robot car built step by step with its wiring, the torch race, Code the Rover and the AI-around-us quiz.",
  minutes: 105,
  theme: { accent: "#1f8a7a", tint: "#dff1ee", level: 2, palette: ["#1f8a7a", "#e08a1e", "#7048e8", "#2d5fb3", "#d6336c", "#2b8a3e"] },
  sources: ["02_CURRICULUM/G03-05_Young_Makers/01_JOVE_Day_Session_Plan.md", "06_ROBOTICS_KITS/04_Assembly_Instructions_Explorer.md", "05_STUDENT_MATERIAL/G03-05_Young_Makers"],
  slides: () => [
    { kind: "cover", kicker: "Young Makers · Grades 3–5", title: "Circuits & Smart Machines", sub: "Today you build a robot car that chases light", art: "/images/age/age-2.webp", phase: "Wow" },

    /* ── Chapter 1: the mystery car ────────────────────────── */
    { kind: "chapter", n: 1, title: "The mystery car", sub: "Nobody is touching it. So how does it move?", icon: "Car", phase: "Wow" },
    { kind: "statement", big: "Watch this car.", sub: "Nobody is touching it. What is happening?", icon: "Car", phase: "Wow", minutes: 3, notes: "The demo car chases the torch around the room. Take three guesses. Media moment M1: the car chasing the torch with children alongside." },
    {
      kind: "flow",
      title: "Every robot has eyes, a brain and muscles",
      nodes: [
        { icon: "Eye", title: "Light sensor", text: "the eyes: SENSE" },
        { icon: "Cpu", title: "Transistor", text: "the brain: THINK" },
        { icon: "Gauge", title: "Motor", text: "the muscles: ACT" },
      ],
      loop: "many times every second",
      phase: "Why",
      minutes: 5,
      notes: "“This tiny part is a light sensor. Bright light, small resistance; dark, large. The brain listens to the sensor and tells the muscles to spin.” Ask: What if I cover one eye? What if there are two lights?",
    },
    { kind: "quiz", question: "A buzzer is…", options: ["SENSE", "THINK", "ACT"], answer: 2, explain: "It makes a sound: it acts.", phase: "Why", notes: "Team card sort: LDR, motor, transistor, buzzer, switch, camera. “Which team can sort fastest, and also explain why?”" },
    { kind: "quiz", question: "A camera is…", options: ["SENSE", "THINK", "ACT"], answer: 0, explain: "It takes in light: it senses.", phase: "Why", minutes: 3 },

    /* ── Chapter 2: circuit school ─────────────────────────── */
    { kind: "chapter", n: 2, title: "Circuit school", sub: "Four missions. Predict first, then build.", icon: "Zap", phase: "Why", notes: "Roles at each station rotate every mission: Builder, Reader, Tester, Reporter, Helper." },
    {
      kind: "parts",
      title: "Your Explorer Kit",
      parts: [
        { name: "Battery box", qty: "4 AA", job: "6 volts of push", draw: { type: "battery", cells: 4 } },
        { name: "Breadboard", qty: "1", job: "Joins parts, no glue", draw: { type: "breadboard", cols: 8, highlight: [3] } },
        { name: "LEDs", qty: "4", job: "Light up", draw: { type: "led", color: "#2f9e44", on: true } },
        { name: "Resistors", job: "Slow the current", draw: { type: "resistor" } },
        { name: "Light sensors", qty: "2", job: "The eyes (LDR)", draw: { type: "ldr" } },
        { name: "Transistors", job: "The brain (BC547)", draw: { type: "transistor" } },
        { name: "BO motors", qty: "2", job: "The muscles", draw: { type: "motor", variant: "geared" } },
        { name: "Chassis + wheels", job: "The body", icon: "Car" },
        { name: "Jumper wires", qty: "20", job: "Join it all", icon: "Cable" },
        { name: "Screwdriver", qty: "1", job: "Build the body", icon: "Wrench" },
      ],
      phase: "Why",
      notes: "Hold up each part. Bags A–E in the box: chassis, drive, power (cells in their own bag), electronics, wiring. Count the small parts into the tray.",
    },
    {
      kind: "circuit",
      title: "These 5 holes are secretly joined",
      diagram: { w: 800, h: 360, parts: [{ id: "bb", type: "breadboard", x: 0, y: 0, cols: 14, highlight: [3, 7] }], wires: [], notes: [{ x: 540, y: -10, text: "A metal strip hides\nunder each green row" }] },
      points: ["Each short row of 5 holes is joined underneath", "Two legs in the same row = connected", "The long red and blue lines are + and −"],
      phase: "Why",
      minutes: 3,
      notes: "Show the breadboard on the projector with the rows highlighted. “Anything you push into the same row is joined, like friends holding hands. Put a part's two legs in different rows, or it is joined to itself!”",
    },
    {
      kind: "build",
      step: 1,
      of: 4,
      title: "Mission 1: light one LED",
      need: ["Battery box", "Resistor", "LED"],
      do: ["Red jumper: battery + to the resistor", "Resistor to the LED's long leg", "LED's short leg back to battery −"],
      check: "The LED glows",
      tip: "Resistor = a speed-breaker for the LED",
      diagram: missionCircuit(),
      phase: "Build",
      minutes: 5,
      notes: "Predict before switching on. Without the resistor, too much current flows and the LED can burn out. Media moment M2: hands on the breadboard as the LED lights.",
    },
    {
      kind: "build",
      step: 2,
      of: 4,
      title: "Mission 2: add a switch",
      need: ["Switch"],
      do: ["Put the switch in the black wire's path", "Slide it ON, then OFF", "Pull out one wire: what happens?"],
      check: "ON: glow. OFF: dark. Open circuit = no glow!",
      diagram: missionCircuit({ sw: true }),
      phase: "Build",
      minutes: 5,
      notes: "A switch just opens and closes the loop. Any broken link does the same: that is how we find faults later.",
    },
    { kind: "circuit", title: "Mission 3a: two LEDs in a line (series)", diagram: missionCircuit({ two: "series" }), points: ["One path through both LEDs", "They share the push", "Both are dimmer"], phase: "Build", minutes: 2, notes: "Ask first: “Two LEDs in a line, or side by side: which is brighter?” Let them predict, then build this one." },
    { kind: "circuit", title: "Mission 3b: side by side (parallel)", diagram: missionCircuit({ two: "parallel" }), points: ["Two paths, one for each LED", "Each gets the full push", "Both are brighter"], phase: "Test", minutes: 2, notes: "Compare with 3a. Series: one path, shared push. Parallel: two paths. “In Level 2 we explore this further.”" },
    { kind: "build", step: 4, of: 4, title: "Mission 4: spin the motor", need: ["BO motor"], do: ["Join the motor to + and −", "Watch which way it spins", "Swap the two wires"], check: "Swapped wires = it spins backwards!", diagram: missionCircuit({ motor: true }), phase: "Build", minutes: 3, notes: "A motor spins either way, set by which side gets +. This is how a robot car drives backwards." },
    { kind: "circuit", title: "Swap the wires: it turns the other way", diagram: missionCircuit({ motor: true, reversed: true }), points: ["+ and − swapped", "Current flows the other way", "The motor spins backwards"], phase: "Test" },
    { kind: "statement", big: "Electricity is like a bicycle chain.", sub: "The chain keeps moving round. The energy does the work.", icon: "RotateCw", phase: "Why", notes: "Fix the idea that current is “used up”: the chain is not used up, the energy is. And batteries store energy that pushes charges around." },

    /* ── Chapter 3: the light-seeking car ──────────────────── */
    { kind: "chapter", n: 3, title: "Build a light-seeking car", sub: "Two eyes, two brains, two muscles", icon: "Flashlight", phase: "Build", notes: "One Explorer Kit car per station of 5." },
    {
      kind: "flow",
      title: "How one eye drives one wheel",
      nodes: [
        { icon: "Sun", title: "Light", text: "shines on the eye" },
        { icon: "Eye", title: "Light sensor", text: "lets more current through" },
        { icon: "Cpu", title: "Transistor", text: "switches ON" },
        { icon: "Gauge", title: "Motor", text: "spins faster" },
      ],
      sub: "Dark: the sensor blocks the current, so the transistor switches OFF and the wheel stops.",
      phase: "Why",
      notes: "The transistor is a tap: a small current into its base opens the big flow from collector to emitter through the motor.",
    },
    { kind: "statement", big: "The eye on the left tells the right wheel to push.", sub: "So the car turns toward the light.", icon: "Flashlight", phase: "Why", notes: "Trainer level: each light sensor switches the motor on the opposite side (a Braitenberg vehicle). More light on the left makes the right motor spin faster, so the car turns left toward the light." },
    { kind: "build", step: 1, of: OF, title: "Motors and wheels", need: ["Chassis plate", "2 BO motors", "2 wheels", "Screws"], do: ["Screw a motor on each side, shafts out", "Push a wheel onto each shaft", "Spin each wheel by hand"], check: "Both wheels spin freely", icon: "Wrench", phase: "Build", minutes: 6, notes: "Checkpoint: call the trainer. Wires from the motors point toward the middle of the chassis." },
    { kind: "build", step: 2, of: OF, title: "The castor wheel", need: ["Castor ball", "Standoffs"], do: ["Fix the castor at the front", "Use the standoffs to make it level"], check: "The car sits flat and rolls straight", icon: "Car", phase: "Build", minutes: 3 },
    { kind: "build", step: 3, of: OF, title: "Battery box and breadboard", need: ["4 × AA box", "Breadboard"], do: ["Fix the battery box at the back", "Stick the breadboard on top", "Cells in, switch OFF"], warn: "Check the + and − marks before the cells go in", icon: "Battery", phase: "Build", minutes: 4, notes: "Trainer checks battery polarity at every station before the first switch-on." },
    {
      kind: "build",
      step: 4,
      of: OF,
      title: "Wire the left eye",
      need: ["Light sensor", "1 kΩ resistor", "Transistor"],
      do: ["Sensor: one leg to +, the other to the resistor", "Resistor to the transistor's middle leg (base)", "Transistor's E leg to −"],
      tip: "Flat face of the transistor toward you: C · B · E",
      diagram: seekerCircuit(),
      phase: "Build",
      minutes: 8,
      notes: "The transistor's flat face is the main cause of faults: check every one. If the kit's wiring card shows a different layout, the card wins.",
    },
    { kind: "build", step: 5, of: OF, title: "Join the right motor", do: ["Right motor: one wire to +", "The other wire to the transistor's C leg", "Shine a torch on the left eye"], check: "The right wheel spins in the torch light", diagram: seekerCircuit(), phase: "Test", minutes: 4, notes: "Test one side before building the other: much easier to find a fault in half a circuit." },
    {
      kind: "circuit",
      title: "Step 6: mirror it for the other side",
      diagram: seekerCircuit({ both: true }),
      points: ["Right eye → transistor → left motor", "Same wiring, the other way round", "The eyes cross over to the wheels"],
      phase: "Build",
      minutes: 8,
      notes: "Checkpoint: both motors spin forward; every transistor's flat face the right way; sensor wires not touching. The prototype check for the shipped chassis decides which crossing makes it turn toward the light: follow the kit's wiring card.",
    },
    { kind: "build", step: 7, of: OF, title: "Point the eyes", do: ["Put both sensors at the front", "Angle them out, like a V", "Keep their legs from touching"], check: "Each eye looks a little to its own side", icon: "Eye", phase: "Build", minutes: 3, notes: "Wider angle: the car turns more sharply. Narrower: it goes straighter." },
    { kind: "build", step: 8, of: OF, title: "First test", do: ["Find a dim spot", "Switch ON", "Shine the torch from the left, then the right"], check: "The car turns toward the torch!", tip: "Runs away? Swap the left and right motor wires", icon: "Flashlight", phase: "Test", minutes: 4, notes: "Fast teams: “Add an LED that glows when the car turns left.” “Make the car run away from the light.” (Swap the sensors.)" },
    {
      kind: "table",
      title: "Car not working? Try this",
      head: ["What happens", "Why", "Fix"],
      rows: [
        ["Motors spin all the time", "Too bright here", "Shade the sensors · move to a dimmer spot"],
        ["Car runs away from the torch", "Motors on the wrong sides", "Swap the left and right motor wires"],
        ["One motor never spins", "Transistor backwards or a loose wire", "Check the flat face · push the wire in"],
        ["Nothing works", "Switch off or flat cells", "Switch on · ask the trainer for cells"],
      ],
      phase: "Test",
    },

    /* ── Chapter 4: the torch race ─────────────────────────── */
    { kind: "chapter", n: 4, title: "The torch race", sub: "3 metres. Lead your car with the light.", icon: "Trophy", phase: "Test" },
    {
      kind: "cards",
      title: "How we score",
      cards: [
        { icon: "Target", title: "Reach the line", text: "Accuracy" },
        { icon: "Clock", title: "Time", text: "Fast and steady" },
        { icon: "Users", title: "Teamwork", text: "Everyone helps" },
      ],
      phase: "Test",
      minutes: 8,
      notes: "Heats of 5 stations on a 3 m course. Count “3, 2, 1, JOVE!” and cheer the slowest car as loudly as the fastest. Media moment M3: the race, low angle; the star pattern of cars chasing torches.",
    },

    /* ── Chapter 5: code and AI ────────────────────────────── */
    { kind: "chapter", n: 5, title: "Code the Rover", sub: "Our rover only knows: forward · turn left · turn right.", icon: "Code", phase: "Why", minutes: 3, notes: "Open jove.website/labs/code-the-rover on the projector. “What should we say first?”" },
    {
      kind: "points",
      title: "An algorithm is steps in the right order",
      points: ["Raise a hand: first block? Next block?", "Same block four times? Use repeat 4", "Draw the path before you run it"],
      icon: "ListChecks",
      phase: "Build",
      minutes: 12,
      notes: "Whole class solves levels 1–3, calling out blocks. Then a level with a loop. Teams draw a paper mission's path before it runs. Ask: Why does the order matter? What if the loop is in the wrong place?",
    },
    { kind: "quiz", question: "Face unlock on a phone uses AI?", options: ["AI", "Not AI"], answer: 0, phase: "Show", notes: "Teams answer with hand signals. Six questions in the plan's quiz bank." },
    { kind: "quiz", question: "A calculator uses AI?", options: ["AI", "Not AI"], answer: 1, explain: "It follows fixed rules.", phase: "Show" },
    { kind: "quiz", question: "A map app that finds the fastest route?", options: ["AI", "Not AI"], answer: 0, phase: "Show", minutes: 4 },
    { kind: "closing", title: "Everyone built a robot today!", sub: "Say “JOVE Makers!”", points: ["Race winners · Best Teamwork · Best Improver", "Try at home: jove.website/labs"], phase: "Show", minutes: 6, notes: "Awards and participation certificates for all; applaud every team. Group photo with the cars in front. Collect cells, screwdrivers and small parts." },
  ],
};
