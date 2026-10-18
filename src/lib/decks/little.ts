/**
 * Little Inventors (Grades 1–2), "Meet the Robots": the JOVE Day session (75 minutes) told as a story, with the
 * Robot Buddy build as a step-by-step tutorial: a wiring picture for every clip, from an empty battery holder to a
 * glowing, spinning, beeping robot. Follows OPERATIONS/02_CURRICULUM/G01-02_Little_Inventors/01_JOVE_Day_Session_Plan.md
 * and OPERATIONS/06_ROBOTICS_KITS/03_Assembly_Instructions_Spark.md. Children of 6 and 7 read little: the slide shows
 * the idea, the trainer says the rest (notes).
 */
import { sparkCircuit } from "./circuits";
import type { Deck } from "./types";

const OF = 10;

export const littleDeck: Deck = {
  id: "little-inventors",
  group: "classroom",
  title: "Meet the Robots",
  audience: "Grades 1–2 · Little Inventors · 75 minutes",
  blurb: "A story in four chapters: meet Jovie, be a robot, build a glowing Robot Buddy clip by clip (with a wiring picture for every step), and the Show & Glow parade.",
  minutes: 75,
  theme: { accent: "#e08a1e", tint: "#fbefdc", level: 1, palette: ["#e08a1e", "#1f8a7a", "#2d5fb3", "#d6336c", "#7048e8"] },
  sources: ["02_CURRICULUM/G01-02_Little_Inventors/01_JOVE_Day_Session_Plan.md", "06_ROBOTICS_KITS/03_Assembly_Instructions_Spark.md", "05_STUDENT_MATERIAL/G01-02_Little_Inventors"],
  slides: () => [
    { kind: "cover", kicker: "Little Inventors · Grades 1–2", title: "Meet the Robots!", sub: "Today you build your own Robot Buddy that glows, spins and beeps", art: "/images/age/age-1.webp", phase: "Wow", notes: "Children sit on the mat in a semi-circle. Practise the attention cue first: “Eyes on me, hands on your head.”" },

    /* ── Chapter 1: meet Jovie ─────────────────────────────── */
    { kind: "chapter", n: 1, title: "Meet Jovie", sub: "A robot has come to visit", icon: "Bot", phase: "Wow" },
    { kind: "statement", big: "Shh! Something is sleeping…", sub: "Count with me: 1… 2… 3… HELLO!", icon: "Bot", phase: "Wow", minutes: 2, notes: "Robot under the cloth. “Shh! Something is sleeping under this cloth. When I count three, say HELLO together. One… two… three!” Media moment M1: the reveal and the group hello." },
    { kind: "statement", big: "Hello! I'm Jovie.", sub: "I can see light. I can hear a clap. I can wave.", icon: "Smile", phase: "Wow", minutes: 3, notes: "Speak as Jovie: “Hello, children! I'm Jovie. I can see light, I can hear a clap, and I can wave. Who wants to wave back?”" },
    {
      kind: "flow",
      title: "How Jovie works",
      nodes: [
        { icon: "Eye", title: "SENSE", text: "Touch your eyes" },
        { icon: "Brain", title: "THINK", text: "Tap your head" },
        { icon: "Hand", title: "ACT", text: "Wave your arms" },
      ],
      loop: "again and again!",
      phase: "Why",
      minutes: 3,
      notes: "Do the actions with them: “Touch your eyes: that is SENSE. Tap your head: that is THINK. Wave your arms: that is ACT. Sense, think, act!” Repeat twice, faster each time.",
    },
    {
      kind: "cards",
      title: "Robot or Not?",
      cards: [
        { icon: "Bot", title: "Robot", text: "JUMP!" },
        { icon: "Fan", title: "Machine", text: "CLAP!" },
        { icon: "Heart", title: "Alive", text: "WAVE!" },
      ],
      phase: "Why",
      notes: "“If it is a robot, jump! If it is only a machine, clap! If it is alive, wave!” Then the picture cards on the next slides.",
    },
    { kind: "quiz", question: "A robot vacuum cleaner", options: ["Robot", "Machine", "Alive"], answer: 0, explain: "It senses the wall, thinks, and moves away!", phase: "Why", notes: "Let them jump, clap or wave first, then reveal. Ask: Does it sense? Does it think? Does it act?" },
    { kind: "quiz", question: "A ceiling fan", options: ["Robot", "Machine", "Alive"], answer: 1, explain: "It only spins. It does not sense or think.", phase: "Why" },
    { kind: "quiz", question: "A dog", options: ["Robot", "Machine", "Alive"], answer: 2, explain: "A dog is alive! Nobody made it with a program.", phase: "Why", minutes: 6, notes: "Do not argue about tricky ones (a lift: “It only does one thing”; a chatbot: “a robot brain made by people”). Ask: What did Jovie see? How did Jovie know to wave? Is Jovie alive? Who made Jovie?" },

    /* ── Chapter 2: be a robot ─────────────────────────────── */
    { kind: "chapter", n: 2, title: "Be a robot!", sub: "A robot does exactly what we tell it. Not more, not less.", icon: "Map", phase: "Why", minutes: 1, notes: "“A robot needs clear instructions. Who can be a robot next?”" },
    {
      kind: "cards",
      title: "The robot cards",
      cards: [
        { icon: "ArrowUp", title: "Forward", text: "One step" },
        { icon: "RotateCcw", title: "Turn left", text: "Turn, do not walk" },
        { icon: "RotateCw", title: "Turn right", text: "Turn, do not walk" },
      ],
      phase: "Why",
      minutes: 3,
      notes: "Trainer is the robot: “I am a robot. I only do what the cards say. Not more, not less. Who will give me the first card?”",
    },
    { kind: "statement", big: "Oops! A bug!", sub: "Was it the robot, or the cards? We fix bugs together.", icon: "Bug", phase: "Test", minutes: 2, notes: "Make a silly mistake on purpose. “Oh no! I went the wrong way! Was it the robot's fault, or the cards' fault? That is called a bug. We fix bugs together.”" },
    {
      kind: "steps",
      title: "Find the treasure!",
      steps: [
        { title: "Programmer", detail: "picks the cards", icon: "ClipboardList" },
        { title: "Robot", detail: "walks the cards", icon: "Bot" },
        { title: "Checker", detail: "says “stop!”", icon: "Search" },
        { title: "Cheerer", detail: "cheers the team", icon: "Megaphone" },
      ],
      sub: "Cards in a row first. Then press GO!",
      phase: "Build",
      minutes: 10,
      notes: "Teams of 4 on the floor grid; rotate roles every treasure. Levels: 3 cards, then 4, then 5. “Who found a shorter way? Clap for them.” Media moment M2: a child walking as the robot, the team shouting “bug!”.",
    },

    /* ── Chapter 3: build a Robot Buddy ─────────────────────── */
    { kind: "chapter", n: 3, title: "Build a Robot Buddy", sub: "A robot that glows, spins and says hello", icon: "Sparkles", phase: "Build", notes: "Trainers insert the AA cells. Children press the switch. One Spark Kit, a tray and a wet wipe per station of 4." },
    {
      kind: "parts",
      title: "What is in the box?",
      parts: [
        { name: "Battery box", qty: "1", job: "The power", draw: { type: "battery", cells: 2 } },
        { name: "Switch", qty: "1", job: "ON and OFF", draw: { type: "switch", on: true } },
        { name: "LED lights", qty: "4", job: "Little bulbs", draw: { type: "led", color: "#e03131", on: true } },
        { name: "Motor + fan", qty: "1", job: "Spins the hat", draw: { type: "motor", fan: true, color: "#e08a1e" } },
        { name: "Buzzer", qty: "1", job: "Says hello", draw: { type: "buzzer" } },
        { name: "Clip wires", qty: "4", job: "Join the parts", icon: "Cable" },
        { name: "Robot body", qty: "1", job: "Pop and fold", icon: "Bot" },
        { name: "Stickers + eyes", job: "Make it yours", icon: "Smile" },
      ],
      phase: "Build",
      notes: "Hold up each part as you name it. Parts stay in the tray. The 2 AA cells are in a separate small bag: trainers keep them until the circuit step. The kit also has copper tape for the circuit track, used after the first try with clips.",
    },
    {
      kind: "cards",
      title: "Electricity goes round and round",
      cards: [
        { icon: "Battery", title: "Battery", text: "a water tank" },
        { icon: "Cable", title: "Wire", text: "a water pipe" },
        { icon: "Lightbulb", title: "LED", text: "a little bulb" },
      ],
      sub: "Round and round, back home = a circuit!",
      phase: "Why",
      minutes: 3,
      notes: "“A battery is like a water tank. The wire is a pipe. The LED is a little bulb. Water must go round and round and back home. That's a circle: a circuit.” Draw a circle in the air with your finger; they copy.",
    },
    {
      kind: "circuit",
      title: "The magic circle",
      diagram: sparkCircuit("glow"),
      points: ["Out of the + side", "Through the switch", "Through the LED", "Back home to the − side"],
      phase: "Why",
      notes: "Trace the path with your finger on the screen: the little dots are the electricity going round. “Out of the battery, through the switch, through the light, and back home. If the circle breaks anywhere, the light goes off.”",
    },
    { kind: "statement", big: "An LED has a long leg and a short leg.", sub: "Long leg = red clip. Short leg = black clip.", icon: "Lightbulb", phase: "Why", notes: "Hold up an LED. “The long leg is the plus leg: it wants the red clip. The short leg goes back home with the black clip. Show me: long leg, short leg!”" },

    { kind: "build", step: 1, of: OF, title: "Pop and fold your robot", need: ["Robot body sheet"], do: ["Pop the pieces out", "Fold on the lines", "Give your robot a name!"], check: "Your robot stands up!", icon: "Bot", phase: "Build", minutes: 4, notes: "Trainers hold the scissors for die-cut parts; pre-fold tabs for children who find it hard. “Give your robot a name! Say it to your neighbour.”" },
    { kind: "build", step: 2, of: OF, title: "Decorate it", need: ["Stickers", "Googly eyes"], do: ["Stick on the eyes", "Add stickers", "Leave a space for the light"], check: "Your robot has a face!", icon: "Smile", phase: "Build", minutes: 3, notes: "Leave the front panel clear where the LED will poke through." },
    { kind: "build", step: 3, of: OF, title: "Batteries in (trainer)", need: ["Battery box", "2 cells"], do: ["Trainer puts in the cells", "Flat end on the spring", "Switch stays OFF"], warn: "Only trainers handle the cells.", diagram: sparkCircuit("battery"), phase: "Build", notes: "Check polarity at every station before the first switch-on. Count the cells out; they are counted back in at the end." },
    { kind: "build", step: 4, of: OF, title: "Red clip from the battery", need: ["Red clip wire"], do: ["Clip the red wire to the battery's red lead", "Clip the other end to the switch"], check: "Red goes from the battery to the switch", diagram: sparkCircuit("red1"), phase: "Build", minutes: 2, notes: "“Red to red.” Squeeze the clip open like a crocodile's mouth." },
    { kind: "build", step: 5, of: OF, title: "Red clip to the long leg", need: ["LED", "Red clip wire"], do: ["Find the LED's long leg", "Clip red from the switch to the long leg"], tip: "Long leg = plus = red!", diagram: sparkCircuit("red2"), phase: "Build", minutes: 2, notes: "Ask each child to show you the long leg before they clip it." },
    { kind: "build", step: 6, of: OF, title: "Black clip back home", need: ["Black clip wire"], do: ["Clip black to the short leg", "Clip the other end to the battery's black lead"], check: "The circle is closed!", diagram: sparkCircuit("closed"), phase: "Build", minutes: 2, notes: "“Now the electricity has a way back home. The circle is complete. Fingers ready on the switch…”" },
    { kind: "build", step: 7, of: OF, title: "Switch ON. It glows!", do: ["Press the switch", "Shout when it lights!"], check: "Your Robot Buddy's light glows!", tip: "No light? Is the switch on? Long leg to red?", diagram: sparkCircuit("glow"), phase: "Test", minutes: 1, notes: "Media moment M3: close-up of a child's face the second the LED glows. “Shout when it lights!” If it does not: switch on? LED backwards (flip it)? Loose clip? Clips touching each other?" },
    { kind: "quiz", question: "Will this light glow?", options: ["Yes", "No"], answer: 1, explain: "No! The black clip is missing. The circle is open.", phase: "Test", notes: "Show the next slide's picture first if you like. “Who can see what is missing?”" },
    { kind: "circuit", title: "What is missing?", diagram: sparkCircuit("open"), points: ["The black clip is missing", "Electricity cannot get home", "Fix it: close the circle!"], phase: "Test", notes: "Misconception to fix: “Electricity comes out of the battery and stays in the bulb.” Take one clip off a working robot: the light goes out. Put it back: it glows. The circle must be complete." },
    { kind: "build", step: 8, of: OF, title: "Spinning fan hat", need: ["Motor", "Fan"], do: ["Push the fan onto the motor", "Clip the motor where the LED was", "Switch ON: it spins!"], check: "The fan hat spins!", diagram: sparkCircuit("fan"), phase: "Build", minutes: 6, notes: "“Watch the fan! What if we turn the battery around?” A motor does not mind which way round: it just spins the other way. (An LED does mind: backwards, it stays dark.)" },
    { kind: "statement", big: "Swap the clips: the fan spins the other way!", sub: "A motor works both ways. An LED only works one way.", icon: "RotateCw", phase: "Test", notes: "Let one station swap the red and black clips on the motor and show the class." },
    { kind: "build", step: 9, of: OF, title: "Robot says hello!", need: ["Buzzer", "2 clip wires"], do: ["Clip the buzzer next to the LED", "Red to red, black to black", "Switch ON: beep and glow!"], check: "Your robot glows and beeps", tip: "Two parts can share one battery", diagram: sparkCircuit("buzzer"), phase: "Build", minutes: 5, notes: "Only if time. The buzzer goes in a second loop beside the LED. Keep buzzers low: hand over the switch to quiet them. Stretch for fast children: light two LEDs; which is brighter? Fan and lights together?" },
    { kind: "build", step: 10, of: OF, title: "Switch OFF. Robots nap!", do: ["Switch OFF", "Line up your robots", "Hands on your head!"], check: "All robots are asleep… until the show", icon: "Smile", phase: "Build", minutes: 2, notes: "“Everybody switch OFF, robot buddies nap until the show.” Children who did not finish: a trainer finishes the last clip with them now." },
    {
      kind: "points",
      title: "No light? Let's check!",
      points: ["Is the switch ON?", "Is it a full circle?", "Red clip to the long leg?", "Are clips touching each other?"],
      icon: "Search",
      phase: "Test",
      notes: "Usual faults: LED backwards (flip it), loose clip (squeeze), flat cell (trainer swaps), switch off, clips touching (spread them). “Who can help their friend without touching their robot?”",
    },

    /* ── Chapter 4: Show & Glow ────────────────────────────── */
    { kind: "chapter", n: 4, title: "Show & Glow!", sub: "Lights off. Every robot switches on together.", icon: "Star", phase: "Show" },
    { kind: "big-number", number: "5 · 4 · 3 · 2 · 1", label: "GLOW!", sub: "Lights off. Everyone switches ON together!", phase: "Show", minutes: 3, notes: "Hold your robot like a trophy. Lights off, countdown from 5, everyone presses the switch. Media moment M4, the signature shot: all robots glowing together." },
    {
      kind: "cards",
      title: "The parade",
      cards: [
        { icon: "Bot", title: "Robot name?" },
        { icon: "Star", title: "Superpower?" },
        { icon: "Users", title: "Who made it?" },
      ],
      phase: "Show",
      minutes: 5,
      notes: "Parade around the hall with music; each team announces its robot's name and one superpower.",
    },
    { kind: "closing", title: "A robot senses, thinks and acts!", sub: "Say “ROBO-JOVE!”", points: ["Show it with your hands: eyes · head · arms", "Take your parent note home"], phase: "Show", minutes: 4, notes: "Reflection: three volunteers say what they learned, with actions. Group photo and cheer. Collect the cells at the door; count small parts per tray." },
  ],
};
