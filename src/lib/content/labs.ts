/**
 * JOVE Virtual Labs — free online journeys that mirror the offline workshops.
 * Every lab is a 4-stage journey:  01 Theory → 02 Demo → 03 Hands-on → 04 Challenge
 * Progress is stored per-browser (localStorage key `jove-labs-progress`).
 */
export type LabStage = "theory" | "demo" | "hands-on" | "challenge";

export const labStages: { id: LabStage; index: string; label: string; blurb: string }[] = [
  { id: "theory", index: "01", label: "Theory", blurb: "The idea, explained with blueprint sketches." },
  { id: "demo", index: "02", label: "Demo", blurb: "Watch it work, step by step." },
  { id: "hands-on", index: "03", label: "Hands-on", blurb: "Your turn — drive the simulation." },
  { id: "challenge", index: "04", label: "Challenge", blurb: "Missions & quiz. Earn your certificate." },
];

export interface LabMeta {
  slug: string;
  title: string;
  subtitle: string;
  grades: string;
  minutes: number;
  topic: "Robotics" | "AI & ML" | "Electronics" | "Coding";
  level: "Beginner" | "Intermediate" | "Advanced";
  image: string;
  summary: string;
  concepts: string[];
  free: boolean;
  offlineLink: string; // which offline session it previews
}

export const labs: LabMeta[] = [
  {
    slug: "code-the-rover",
    title: "Code the Rover",
    subtitle: "Algorithms & sequencing",
    grades: "Grades 1–5",
    minutes: 15,
    topic: "Coding",
    level: "Beginner",
    image: "/images/labs/lab-rover.webp",
    summary: "Guide a planetary rover across a grid with arrow blocks. Learn sequences, debugging and loops — the first steps of every programmer.",
    concepts: ["Algorithm", "Sequence", "Debugging", "Loops"],
    free: true,
    offlineLink: "Little Inventors & Young Makers",
  },
  {
    slug: "logic-gates",
    title: "Light the Lamp",
    subtitle: "Logic gates & circuits",
    grades: "Grades 4–8",
    minutes: 15,
    topic: "Electronics",
    level: "Beginner",
    image: "/images/labs/lab-logic.webp",
    summary: "Flip switches, wire AND, OR and NOT gates and light the lamp. Discover how every computer decides — one gate at a time.",
    concepts: ["Binary", "AND / OR / NOT", "Truth tables", "Circuits"],
    free: true,
    offlineLink: "Young Makers",
  },
  {
    slug: "echo-sensor",
    title: "Echo",
    subtitle: "How an ultrasonic sensor sees",
    grades: "Grades 5–8",
    minutes: 15,
    topic: "Robotics",
    level: "Beginner",
    image: "/images/labs/lab-sensor.webp",
    summary: "Send a sound pulse, time the echo and calculate distance like a bat. Then program a robot car to stop before it hits the wall.",
    concepts: ["Sound waves", "Speed × time", "Sensors", "Thresholds"],
    free: true,
    offlineLink: "Robo Engineers",
  },
  {
    slug: "line-follower",
    title: "Line Follower Bot",
    subtitle: "Sensors → decisions → motors",
    grades: "Grades 5–9",
    minutes: 20,
    topic: "Robotics",
    level: "Intermediate",
    image: "/images/labs/lab-line.webp",
    summary: "Tune two infrared sensors and motor speeds so a robot races around a track without leaving the line. Feel how feedback control works.",
    concepts: ["IR sensors", "Feedback loop", "Motor control", "Tuning"],
    free: true,
    offlineLink: "Robo Engineers",
  },
  {
    slug: "robot-arm",
    title: "Robot Arm Commander",
    subtitle: "Joints, angles & kinematics",
    grades: "Grades 7–10",
    minutes: 20,
    topic: "Robotics",
    level: "Intermediate",
    image: "/images/labs/lab-arm.webp",
    summary: "Command a two-joint robotic arm with angles, pick up blocks and drop them on targets. Discover forward and inverse kinematics.",
    concepts: ["Degrees of freedom", "Angles", "Forward kinematics", "Inverse kinematics"],
    free: true,
    offlineLink: "AI Innovators",
  },
  {
    slug: "teach-the-machine",
    title: "Teach the Machine",
    subtitle: "Machine learning from scratch",
    grades: "Grades 6–10",
    minutes: 20,
    topic: "AI & ML",
    level: "Intermediate",
    image: "/images/labs/lab-ml.webp",
    summary: "Give the machine examples, train a classifier and watch its decision boundary move. Learn why data quality and bias matter.",
    concepts: ["Training data", "Classification", "Decision boundary", "Bias"],
    free: true,
    offlineLink: "Robo Engineers & AI Innovators",
  },
];

/** Coming soon — paid Pro journeys (shown locked on the hub). */
export const proLabs = [
  { title: "Neural Networks Deep Dive", grades: "Grades 9–12", price: "₹999" },
  { title: "Computer Vision with Your Webcam", grades: "Grades 8–12", price: "₹1,499" },
  { title: "Build Your Own Chatbot", grades: "Grades 8–12", price: "₹999" },
  { title: "Arduino Simulator: 20 Projects", grades: "Grades 6–10", price: "₹1,999" },
  { title: "Drone Physics & Flight", grades: "Grades 8–12", price: "₹1,499" },
  { title: "Python for Robotics", grades: "Grades 7–12", price: "₹2,999" },
];

export function getLab(slug: string) {
  return labs.find((l) => l.slug === slug);
}
