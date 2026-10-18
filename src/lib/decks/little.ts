/**
 * Little Inventors (Grades 1–2), "Meet the Robots": the classroom deck for the JOVE Day session (75 minutes).
 * Follows OPERATIONS/02_CURRICULUM/G01-02_Little_Inventors/01_JOVE_Day_Session_Plan.md. Few words, big pictures:
 * children of 6 and 7 read little, so the slide shows the idea and the trainer says the rest (notes).
 */
import type { Deck } from "./types";

export const littleDeck: Deck = {
  id: "little-inventors",
  group: "classroom",
  title: "Meet the Robots",
  audience: "Grades 1–2 · Little Inventors · 75 minutes",
  blurb: "Robot or Not, the Human Robot game, building a glowing Robot Buddy with a spinning fan hat, and the Show & Glow parade.",
  minutes: 75,
  theme: { accent: "#e08a1e", tint: "#fbefdc", level: 1, palette: ["#e08a1e", "#1f8a7a", "#2d5fb3", "#d6336c", "#7048e8"] },
  sources: ["02_CURRICULUM/G01-02_Little_Inventors/01_JOVE_Day_Session_Plan.md", "05_STUDENT_MATERIAL/G01-02_Little_Inventors"],
  slides: () => [
    { kind: "cover", kicker: "Little Inventors · Grades 1–2", title: "Meet the Robots!", art: "/images/age/age-1.webp", phase: "Wow", notes: "Children sit on the mat in a semi-circle. Practise the attention cue first: “Eyes on me, hands on your head.”" },
    { kind: "statement", big: "Shh! Something is sleeping…", sub: "Count with me: 1… 2… 3… HELLO!", icon: "Bot", phase: "Wow", minutes: 2, notes: "Robot under the cloth. “Shh! Something is sleeping under this cloth. When I count three, say HELLO together. One… two… three!” Media moment M1: the reveal and the group hello." },
    { kind: "statement", big: "Hello! I'm Jovie.", sub: "I can see light. I can hear a clap. I can wave.", icon: "Smile", phase: "Wow", minutes: 3, notes: "Speak as Jovie: “Hello, children! I'm Jovie. I can see light, I can hear a clap, and I can wave. Who wants to wave back?”" },
    {
      kind: "cards",
      title: "Sense · Think · Act",
      cards: [
        { icon: "Eye", title: "SENSE", text: "Touch your eyes" },
        { icon: "Brain", title: "THINK", text: "Tap your head" },
        { icon: "Hand", title: "ACT", text: "Wave your arms" },
      ],
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
    { kind: "statement", big: "A robot does exactly what we tell it.", sub: "Who wants to be a robot?", icon: "Bot", phase: "Why", minutes: 1, notes: "“A robot needs clear instructions. Who can be a robot next?”" },
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
    { kind: "image", title: "Let's build a Robot Buddy!", src: "/images/kits/kit-spark.webp", points: ["A robot body", "A light that glows", "A fan hat that spins"], phase: "Build", notes: "Trainers insert the AA cells. Children press the switch. One Spark Kit, a tray and a wet wipe per station." },
    {
      kind: "cards",
      title: "Electricity goes round and round",
      cards: [
        { icon: "Battery", title: "Battery", text: "a water tank" },
        { icon: "Zap", title: "Wire", text: "a water pipe" },
        { icon: "Lightbulb", title: "LED", text: "a little bulb" },
      ],
      sub: "A full circle = a circuit!",
      phase: "Why",
      minutes: 3,
      notes: "“A battery is like a water tank. The wire is a pipe. The LED is a little bulb. Water must go round and round and back home. That's a circle: a circuit.” Show the big LED model.",
    },
    {
      kind: "steps",
      title: "Build your Robot Buddy",
      steps: [
        { title: "Pop and decorate", detail: "Give it a name!", icon: "Sparkles" },
        { title: "Make the light glow", detail: "Red clip to red leg", icon: "Lightbulb" },
        { title: "Spinning fan hat", detail: "Watch it spin!", icon: "Fan" },
        { title: "Robot says hello", detail: "Add the buzzer", icon: "Volume2" },
      ],
      phase: "Build",
      minutes: 25,
      notes: "Stage 1 (7 min): pop parts, fold tabs, stickers, googly eyes; trainers hold the scissors. Stage 2 (7 min): battery holder, switch and LED with crocodile clips, red to red (long leg). Stage 3 (6 min): motor and fan; “What if we turn the battery around?” Stage 4 if time: buzzer in a second loop. Media moment M3: “Shout when it lights!”",
    },
    {
      kind: "points",
      title: "No light? Let's check!",
      points: ["Is the switch ON?", "Is it a full circle?", "Red clip to red leg?", "Are clips touching each other?"],
      icon: "Search",
      phase: "Test",
      notes: "Usual faults: LED backwards (flip it), loose clip (squeeze), flat cell (trainer swaps), switch off, clips touching (spread). “Who can help their friend without touching their robot?”",
    },
    { kind: "statement", big: "Switch OFF. Robot buddies nap!", sub: "Until the show…", icon: "Smile", phase: "Build", minutes: 2, notes: "“Everybody switch OFF, robot buddies nap until the show.” Line up the robots." },
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
    { kind: "closing", title: "A robot senses, thinks and acts!", sub: "Say “ROBO-JOVE!”", points: ["Show it with your hands: eyes · head · arms", "Take your parent note home"], phase: "Show", minutes: 4, notes: "Reflection: three volunteers say what they learned, with actions. Group photo and cheer. Collect the cells at the door." },
  ],
};
