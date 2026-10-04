/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  JOVE BUSINESS MODEL — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every price, kit, package, cost assumption and revenue stream used by the
 *  public website, the HQ portal (calculators, proposals, invoices) and the
 *  OPERATIONS documents comes from this file. Change a number here and the
 *  whole company updates.
 *
 *  Currency: INR. School workshop prices are EXCLUSIVE of GST (18% added on
 *  invoice once registered). Online kit MRPs are INCLUSIVE of GST.
 *  Component prices are 2026 market estimates (Robu.in / Robocraze / local
 *  electronics markets) — verify with vendors before each purchase order.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type GradeBandId = "g1-2" | "g3-5" | "g6-8" | "g9-10";

export interface GradeBand {
  id: GradeBandId;
  grades: string;
  name: string;
  theme: string;
  tagline: string;
  durationMin: number;
  pricePerStudent: number; // JOVE Day, ex-GST
  quarterPricePerStudent: number; // JOVE Quarter (3 sessions), ex-GST
  yearPricePerStudent: number; // JOVE Year (8 sessions), ex-GST
  studentsPerStation: number;
  maxPerSession: number;
  image: string;
  kitId: KitId;
  outcomes: string[];
  activities: { title: string; minutes: number; detail: string }[];
  skills: string[];
}

export const gradeBands: GradeBand[] = [
  {
    id: "g1-2",
    grades: "Grades 1–2",
    name: "Little Inventors",
    theme: "Meet the Robots",
    tagline: "Wonder first. Wires later.",
    durationMin: 75,
    pricePerStudent: 249,
    quarterPricePerStudent: 649,
    yearPricePerStudent: 1599,
    studentsPerStation: 4,
    maxPerSession: 120,
    image: "/images/age/age-1.webp",
    kitId: "spark",
    outcomes: [
      "Tell the difference between a robot, a machine and a living thing",
      "Make an LED light up and a motor spin using a simple circuit",
      "Give step-by-step instructions (algorithms) through an unplugged coding game",
      "Build and decorate a light-up cardboard robot buddy",
    ],
    activities: [
      { title: "Robot or Not? (story + live robot show)", minutes: 15, detail: "A live robot demo and a picture game: which of these can sense, think and act?" },
      { title: "Human Robot unplugged coding", minutes: 15, detail: "Children program a classmate with arrow cards to reach the treasure." },
      { title: "Light-up Robot Buddy build", minutes: 30, detail: "Snap a battery, switch and LED into a die-cut cardboard robot. Add a spinning fan hat." },
      { title: "Show & Glow parade", minutes: 15, detail: "Every team switches on its robot together — the moment is filmed for the school reel." },
    ],
    skills: ["Curiosity", "Sequencing", "Fine motor skills", "Teamwork", "Basic circuits"],
  },
  {
    id: "g3-5",
    grades: "Grades 3–5",
    name: "Young Makers",
    theme: "Circuits & Smart Machines",
    tagline: "If it moves, they can build it.",
    durationMin: 105,
    pricePerStudent: 349,
    quarterPricePerStudent: 899,
    yearPricePerStudent: 2199,
    studentsPerStation: 5,
    maxPerSession: 125,
    image: "/images/age/age-2.webp",
    kitId: "explorer",
    outcomes: [
      "Explain how electricity flows in a closed circuit and what a switch, sensor and motor do",
      "Build a light-seeking robot car that follows a torch",
      "Write a block-based program to guide a rover through a maze",
      "Spot AI in daily life — from face unlock to recommendations",
    ],
    activities: [
      { title: "Sense–Think–Act warm-up", minutes: 15, detail: "Every robot has eyes, a brain and muscles. We find them on a real robot." },
      { title: "Circuit challenge", minutes: 20, detail: "Teams complete circuits on a breadboard to light LEDs and run a motor." },
      { title: "Light-seeking robot car build", minutes: 45, detail: "Assemble the chassis, motors and light sensors — then race the cars with torches." },
      { title: "Code the Rover", minutes: 15, detail: "Block-coding mission on the big screen (also available free on JOVE Virtual Labs)." },
      { title: "AI around us quiz + certificates", minutes: 10, detail: "A fast quiz, team awards and the group photo for the film." },
    ],
    skills: ["Circuits", "Logical thinking", "Block coding", "Problem solving", "Collaboration"],
  },
  {
    id: "g6-8",
    grades: "Grades 6–8",
    name: "Robo Engineers",
    theme: "Sense · Think · Act",
    tagline: "Real sensors. Real code. Real robots.",
    durationMin: 150,
    pricePerStudent: 449,
    quarterPricePerStudent: 1149,
    yearPricePerStudent: 2799,
    studentsPerStation: 5,
    maxPerSession: 125,
    image: "/images/age/age-3.webp",
    kitId: "builder",
    outcomes: [
      "Wire and program a microcontroller (Arduino) to read sensors and drive motors",
      "Build an obstacle-avoiding robot car using an ultrasonic sensor",
      "Understand distance = speed × time through the echo principle",
      "Train a simple machine-learning model (image or sound) and test it live",
    ],
    activities: [
      { title: "Inside a robot: sensors, controllers, actuators", minutes: 20, detail: "Live teardown of a JOVE robot with the parts projected on screen." },
      { title: "Arduino first program", minutes: 25, detail: "Blink, beep and read the ultrasonic sensor — first lines of real code." },
      { title: "Obstacle-avoiding robot build", minutes: 60, detail: "Team build + code + test on the JOVE arena. Fastest clean run wins." },
      { title: "Teach the Machine (ML)", minutes: 30, detail: "Train an image classifier with a webcam and see how data changes predictions." },
      { title: "Showcase & certificates", minutes: 15, detail: "Teams demo, explain, and receive certificates — filmed for the reels." },
    ],
    skills: ["Arduino & electronics", "C++ basics", "Sensors", "Machine learning intuition", "Engineering design"],
  },
  {
    id: "g9-10",
    grades: "Grades 9–10",
    name: "AI Innovators",
    theme: "Build an AI that Sees",
    tagline: "From data to decisions — and the ethics in between.",
    durationMin: 180,
    pricePerStudent: 549,
    quarterPricePerStudent: 1399,
    yearPricePerStudent: 3399,
    studentsPerStation: 5,
    maxPerSession: 120,
    image: "/images/age/age-4.webp",
    kitId: "innovator",
    outcomes: [
      "Explain how machine learning differs from traditional programming",
      "Collect data, train, test and improve an image-recognition model",
      "Connect an AI model to a robot so it reacts to what it sees",
      "Debate bias, privacy and responsible AI with real examples",
      "Pitch an AI-for-good idea in a 3-minute team presentation",
    ],
    activities: [
      { title: "How machines learn", minutes: 25, detail: "Data, features, models, training and testing — with live demos and the Teach-the-Machine simulator." },
      { title: "Robot arm commander", minutes: 25, detail: "Control a 6-axis arm; understand joints, angles and kinematics." },
      { title: "AI vision build", minutes: 70, detail: "Train a vision model and connect it to a pan-tilt camera robot that tracks objects." },
      { title: "Responsible AI debate", minutes: 20, detail: "Bias, deepfakes, privacy — teams take sides and argue with evidence." },
      { title: "Mini-hackathon pitch", minutes: 40, detail: "Teams pitch an AI-for-good idea for their school or city. Winners featured in the film." },
    ],
    skills: ["Machine learning", "Computer vision", "Python/no-code AI tools", "Ethics & critical thinking", "Pitching"],
  },
];

/**
 * A JOVE Day = one full day on campus. Two halls run in parallel:
 *  Hall A (founder-led) → senior AI & robotics sessions
 *  Hall B (trainer pair) → junior sessions + an overflow batch
 */
export const joveDaySchedule = [
  { time: "07:30", end: "08:30", hall: "Both", title: "Team arrival & setup", detail: "Stations, arena mats, projector, banners, media rig and drone pre-flight checks.", who: "Full team" },
  { time: "08:30", end: "09:00", hall: "Assembly", title: "Opening robot + drone show", detail: "15-minute live show for the whole school, principal welcome, opening reel shots.", who: "All grades" },
  { time: "09:00", end: "12:00", hall: "Hall A", title: "AI Innovators", detail: "Grades 9–10 · 3 hours · Build an AI that Sees", who: "Grades 9–10" },
  { time: "09:00", end: "10:15", hall: "Hall B", title: "Little Inventors", detail: "Grades 1–2 · 75 minutes · Meet the Robots", who: "Grades 1–2" },
  { time: "10:30", end: "12:15", hall: "Hall B", title: "Young Makers", detail: "Grades 3–5 · 1 h 45 m · Circuits & Smart Machines", who: "Grades 3–5" },
  { time: "12:15", end: "12:45", hall: "Both", title: "Lunch & station reset", detail: "Kits reset, cells swapped, consumables refilled, footage backed up.", who: "Team" },
  { time: "12:45", end: "15:15", hall: "Hall A", title: "Robo Engineers", detail: "Grades 6–8 · 2.5 hours · Sense · Think · Act", who: "Grades 6–8" },
  { time: "12:45", end: "14:30", hall: "Hall B", title: "Overflow batch", detail: "Second batch for the largest grade group (if booked).", who: "As booked" },
  { time: "15:20", end: "15:50", hall: "Assembly", title: "Showcase & certificate ceremony", detail: "Best teams demo on stage, group photos, closing drone shot of the whole school.", who: "All participants" },
  { time: "15:50", end: "16:30", hall: "Office", title: "Principal interview & pack-up", detail: "Testimonial interview, feedback forms, inventory check-out.", who: "Founders + media" },
] as const;

/** Commercial rules for a JOVE Day. */
export const joveDayRules = {
  minimumStudents: 200,
  minimumBilling: 70_000, // ex-GST
  maxStudentsPerDay: 480,
  advancePercent: 50,
  balanceDueDays: 7,
  gstPercent: 18,
  teamSize: { founders: 2, trainers: 2, media: 1 },
  /** Target average realised price per student across a typical grade mix. */
  targetAvgPricePerStudent: 400,
  targetStudentsPerDay: 250,
};

/** The differentiator — included free with every JOVE Day (produced by FrameMind AI Studio). */
export const mediaPack = {
  name: "JOVE Media Pack by FrameMind AI Studio",
  marketValue: 60_000,
  items: [
    { title: "3–4 cinematic reels", detail: "Vertical 9:16, 30–60 s, music-synced, ready for Instagram, YouTube Shorts & WhatsApp status.", delivery: "Within 5 working days" },
    { title: "Full-day highlight film", detail: "3–5 minute 4K film of the entire JOVE Day — opening show to certificate ceremony.", delivery: "Within 10 working days" },
    { title: "Drone aerial shots", detail: "Campus establishing shots + whole-school formation shot (subject to local drone rules & school permission).", delivery: "In the film + raw selects" },
    { title: "30+ edited photos", detail: "Colour-graded stills of students building, testing and celebrating.", delivery: "Within 5 working days" },
    { title: "Principal testimonial clip", detail: "60–90 s interview the school can use for admissions marketing.", delivery: "Within 10 working days" },
    { title: "Captions & posting kit", detail: "Ready-to-post captions, hashtags and a posting schedule for the school's handles.", delivery: "With the reels" },
  ],
  rights: "The school may use all delivered media for its own marketing and admissions. JOVE may use the media for its portfolio (students' faces blurred on request; consent forms collected).",
};

export type PackageId = "jove-day" | "jove-quarter" | "jove-year" | "jove-club";

export interface Package {
  id: PackageId;
  name: string;
  cadence: string;
  headline: string;
  priceNote: string;
  highlight?: boolean;
  includes: string[];
  idealFor: string;
}

export const packages: Package[] = [
  {
    id: "jove-day",
    name: "JOVE Day",
    cadence: "One full day",
    headline: "The full-day Robotics & AI festival for your whole school.",
    priceNote: "₹249 – ₹549 per student by grade · min. 200 students",
    includes: [
      "Age-specific sessions for Grades 1–10 in one day",
      "Opening robot + drone show for the whole school",
      "All kits, tools and consumables provided",
      "Certificates for every student",
      "FREE Media Pack: 3–4 reels, full-day film, drone shots, photos",
      "Post-workshop report for the school management",
    ],
    idealFor: "Schools trying JOVE for the first time, annual days, science weeks.",
  },
  {
    id: "jove-quarter",
    name: "JOVE Quarter",
    cadence: "3 months · 3 JOVE Days",
    headline: "A progressive 3-level journey, one JOVE Day every month.",
    priceNote: "₹649 – ₹1,399 per student per quarter (≈15% saving)",
    highlight: true,
    includes: [
      "3 JOVE Days — Level 1 → 2 → 3 curriculum that builds month on month",
      "Media Pack every month (9–12 reels + 3 films per quarter)",
      "Teacher orientation session (2 hours)",
      "Student progress report + skill badges",
      "End-of-quarter mini-showcase for parents",
      "Priority booking dates",
    ],
    idealFor: "Schools that want visible, recurring STEM momentum and content for social media.",
  },
  {
    id: "jove-year",
    name: "JOVE Year",
    cadence: "Academic year · 8 sessions",
    headline: "Your school's Robotics & AI department — run by JOVE.",
    priceNote: "₹1,599 – ₹3,399 per student per year",
    includes: [
      "8 sessions across the academic year + annual Innovation Showcase",
      "JOVE Robotics Corner set up on campus (kits stay at school)",
      "Training & certification for 2 school teachers",
      "Entry to the inter-school JOVE Robo League",
      "Annual showcase film + monthly reels",
      "30% off Social Media Management add-on",
    ],
    idealFor: "Schools building a long-term STEM identity and admissions advantage.",
  },
  {
    id: "jove-club",
    name: "JOVE Club",
    cadence: "Monthly · after school",
    headline: "Weekly after-school Robotics & AI club on your campus.",
    priceNote: "₹799 per student per month · min. 25 students",
    includes: [
      "4 × 60-minute sessions per month",
      "Project-based curriculum (build something every month)",
      "Kits provided during sessions",
      "Monthly parent update + project video",
    ],
    idealFor: "Schools with motivated students who want more than one day a term.",
  },
];

export interface AddOn {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  unit: string;
  detail: string;
  owner: "JOVE" | "FrameMind AI Studio";
}

export const addOns: AddOn[] = [
  { id: "smm-starter", name: "Social Media Management — Starter", price: "₹14,999 / month", priceValue: 14999, unit: "month", detail: "8 posts + 4 reels per month, captions, scheduling, monthly report.", owner: "FrameMind AI Studio" },
  { id: "smm-growth", name: "Social Media Management — Growth", price: "₹24,999 / month", priceValue: 24999, unit: "month", detail: "12 posts + 8 reels, stories, community replies, admissions ad campaign management (ad spend extra).", owner: "FrameMind AI Studio" },
  { id: "smm-premium", name: "Social Media Management — Premium", price: "₹39,999 / month", priceValue: 39999, unit: "month", detail: "Everything in Growth + monthly campus shoot day, YouTube management, quarterly brand film.", owner: "FrameMind AI Studio" },
  { id: "film-admissions", name: "Admissions / Commercial Film", price: "₹45,000", priceValue: 45000, unit: "project", detail: "1-day shoot, 2-minute school film + 3 reels, drone shots, colour grade.", owner: "FrameMind AI Studio" },
  { id: "film-premium", name: "Premium Brand Film", price: "₹95,000", priceValue: 95000, unit: "project", detail: "2-day shoot, 5-minute documentary-style film, interviews, 6 reels, drone, licensed music.", owner: "FrameMind AI Studio" },
  { id: "teacher-training", name: "Teacher Training & Certification", price: "₹1,499 / teacher", priceValue: 1499, unit: "teacher", detail: "4-hour hands-on robotics & AI training with JOVE certificate (min. 10 teachers).", owner: "JOVE" },
  { id: "take-home-kits", name: "Take-home Kits for Students", price: "10% off MRP", priceValue: 0, unit: "kit", detail: "Each student takes their own kit home — bulk school price on any JOVE kit (min. 30 kits).", owner: "JOVE" },
  { id: "lab-setup", name: "Robotics & AI Lab Setup (turnkey)", price: "from ₹3,50,000", priceValue: 350000, unit: "project", detail: "Design, furniture layout, kits, tools, curriculum and teacher training for a permanent campus lab (ATL-style).", owner: "JOVE" },
];

export type KitId = "spark" | "explorer" | "builder" | "innovator";

export interface BomItem {
  item: string;
  qty: number;
  unitCost: number;
  vendorHint: string;
}

export interface Kit {
  id: KitId;
  sku: string;
  name: string;
  grades: string;
  project: string;
  description: string;
  mrp: number; // online, incl. GST
  schoolPrice: number; // bulk (>= 30 kits), incl. GST
  image: string;
  highlights: string[];
  inTheBox: string[];
  bom: BomItem[];
  weightGrams: number;
}

export const kits: Kit[] = [
  {
    id: "spark",
    sku: "JOVE-KIT-SPK",
    name: "JOVE Spark Kit",
    grades: "Grades 1–2 · Ages 6–8",
    project: "Light-up Cardboard Robot + Spinning Fan Hat",
    description:
      "A first robot for little hands. No soldering, no screens — just a battery, a switch, lights, a buzzer and a motor that turn a die-cut cardboard robot into a glowing, buzzing, spinning buddy.",
    mrp: 599,
    schoolPrice: 539,
    image: "/images/kits/kit-spark.webp",
    highlights: ["Zero soldering, child-safe", "Learn circuits by playing", "8-page illustrated activity book", "Free online lab: Code the Rover"],
    inTheBox: ["Die-cut cardboard robot sheet", "Battery holder with switch + 2 AA cells", "4 LEDs, buzzer, mini motor + fan", "Crocodile-clip wires & copper tape", "Stickers & googly eyes", "Activity booklet"],
    bom: [
      { item: "Die-cut cardboard robot sheet (A4, 300 gsm, printed)", qty: 1, unitCost: 18, vendorHint: "Local printer / die-cutter" },
      { item: "2×AA battery holder with switch", qty: 1, unitCost: 22, vendorHint: "Robu.in / local market" },
      { item: "AA alkaline cells", qty: 2, unitCost: 12, vendorHint: "Wholesale (box of 40)" },
      { item: "5 mm LEDs (2 white, 2 red)", qty: 4, unitCost: 1.5, vendorHint: "Bulk pack of 100" },
      { item: "3V mini buzzer", qty: 1, unitCost: 12, vendorHint: "Robu.in" },
      { item: "3V mini DC motor", qty: 1, unitCost: 18, vendorHint: "Robu.in" },
      { item: "Fan propeller", qty: 1, unitCost: 6, vendorHint: "Robu.in" },
      { item: "Crocodile-clip wires", qty: 4, unitCost: 7, vendorHint: "Bulk pack" },
      { item: "Copper tape (1 m)", qty: 1, unitCost: 15, vendorHint: "Amazon / Robu.in" },
      { item: "Stickers + googly eyes", qty: 1, unitCost: 10, vendorHint: "Stationery wholesale" },
      { item: "Activity booklet (8 pp, colour)", qty: 1, unitCost: 25, vendorHint: "Digital press, 500+ run" },
      { item: "Printed kit box (small)", qty: 1, unitCost: 35, vendorHint: "Box printer, MOQ 500" },
      { item: "Zip bags & packing", qty: 1, unitCost: 6, vendorHint: "Packaging wholesale" },
    ],
    weightGrams: 280,
  },
  {
    id: "explorer",
    sku: "JOVE-KIT-EXP",
    name: "JOVE Explorer Kit",
    grades: "Grades 3–5 · Ages 8–11",
    project: "Light-Seeking Robot Car",
    description:
      "Build a two-motor robot car with real light sensors that chases a torch around the room. Breadboard circuits, transistors and screws — a genuine engineering build sized for young makers.",
    mrp: 1299,
    schoolPrice: 1169,
    image: "/images/kits/kit-explorer.webp",
    highlights: ["Real sensors & transistor logic", "Solder-free breadboard build", "16-page colour build guide", "Free online labs: Logic Gates & Echo"],
    inTheBox: ["Laser-cut chassis + castor", "2 geared BO motors + wheels", "4×AA holder + cells", "Mini breadboard, 2 light sensors, transistors", "LEDs, resistors, jumper wires", "Mini screwdriver & hardware", "Build guide"],
    bom: [
      { item: "Laser-cut chassis plate (acrylic/MDF)", qty: 1, unitCost: 55, vendorHint: "Local laser-cutting shop" },
      { item: "BO geared motor (3–6V)", qty: 2, unitCost: 35, vendorHint: "Robu.in / Robocraze" },
      { item: "Wheel for BO motor", qty: 2, unitCost: 20, vendorHint: "Robu.in" },
      { item: "Castor ball", qty: 1, unitCost: 15, vendorHint: "Robu.in" },
      { item: "4×AA battery holder with switch", qty: 1, unitCost: 30, vendorHint: "Robu.in" },
      { item: "AA alkaline cells", qty: 4, unitCost: 12, vendorHint: "Wholesale" },
      { item: "Mini breadboard (170 pt)", qty: 1, unitCost: 35, vendorHint: "Robu.in" },
      { item: "LDR light sensor", qty: 2, unitCost: 4, vendorHint: "Bulk" },
      { item: "BC547 transistors + resistor pack", qty: 1, unitCost: 20, vendorHint: "Bulk" },
      { item: "5 mm LEDs", qty: 4, unitCost: 1.5, vendorHint: "Bulk" },
      { item: "Jumper wires (20, M-M)", qty: 1, unitCost: 30, vendorHint: "Robu.in" },
      { item: "Screws, nuts & standoffs", qty: 1, unitCost: 20, vendorHint: "Hardware wholesale" },
      { item: "Mini screwdriver", qty: 1, unitCost: 20, vendorHint: "Tools wholesale" },
      { item: "Build guide (16 pp, colour)", qty: 1, unitCost: 40, vendorHint: "Digital press" },
      { item: "Printed kit box", qty: 1, unitCost: 45, vendorHint: "Box printer, MOQ 500" },
      { item: "Packaging", qty: 1, unitCost: 8, vendorHint: "Packaging wholesale" },
    ],
    weightGrams: 520,
  },
  {
    id: "builder",
    sku: "JOVE-KIT-BLD",
    name: "JOVE Builder Kit",
    grades: "Grades 6–8 · Ages 11–14",
    project: "Smart Obstacle-Avoiding Robot Car (Arduino)",
    description:
      "An Arduino-powered smart car with an ultrasonic 'eye' on a servo, line-following IR sensors and a motor driver. Program it to dodge walls, follow lines and play tunes — 10 projects in one box.",
    mrp: 2999,
    schoolPrice: 2699,
    image: "/images/kits/kit-builder.webp",
    highlights: ["Arduino-compatible board + USB", "10 guided projects", "32-page guide + video lessons", "Free online labs: Line Follower & Echo"],
    inTheBox: ["Arduino Uno-compatible board + cable", "Motor driver shield", "2WD chassis with motors & wheels", "Ultrasonic sensor + servo mount", "2 IR line sensors", "6×AA battery holder", "Breadboard, buzzer, LEDs, wires", "Screwdriver & hardware", "Project guide"],
    bom: [
      { item: "Arduino Uno-compatible board (CH340) + USB cable", qty: 1, unitCost: 420, vendorHint: "Robu.in / Robocraze" },
      { item: "L293D motor driver shield", qty: 1, unitCost: 160, vendorHint: "Robu.in" },
      { item: "2WD acrylic chassis kit (motors, wheels, castor)", qty: 1, unitCost: 350, vendorHint: "Robu.in" },
      { item: "HC-SR04 ultrasonic sensor + holder", qty: 1, unitCost: 85, vendorHint: "Robu.in" },
      { item: "SG90 micro servo", qty: 1, unitCost: 110, vendorHint: "Robu.in" },
      { item: "IR line sensor module", qty: 2, unitCost: 40, vendorHint: "Robu.in" },
      { item: "6×AA battery holder + cells", qty: 1, unitCost: 112, vendorHint: "Wholesale" },
      { item: "Jumper wire set (M-M, M-F)", qty: 1, unitCost: 60, vendorHint: "Robu.in" },
      { item: "Mini breadboard", qty: 1, unitCost: 35, vendorHint: "Robu.in" },
      { item: "Buzzer, LEDs, resistors", qty: 1, unitCost: 25, vendorHint: "Bulk" },
      { item: "Screwdriver + hardware", qty: 1, unitCost: 35, vendorHint: "Tools wholesale" },
      { item: "Project guide (32 pp) with QR video lessons", qty: 1, unitCost: 60, vendorHint: "Digital press" },
      { item: "Rigid printed kit box", qty: 1, unitCost: 70, vendorHint: "Box printer, MOQ 300" },
      { item: "Packaging", qty: 1, unitCost: 10, vendorHint: "Packaging wholesale" },
    ],
    weightGrams: 900,
  },
  {
    id: "innovator",
    sku: "JOVE-KIT-INV",
    name: "JOVE Innovator AI Kit",
    grades: "Grades 9–10 · Ages 14–16",
    project: "AI Vision Pan-Tilt Robot",
    description:
      "A camera robot that sees. Train your own image-recognition model, run it with an ESP32 camera and make a pan-tilt head track faces and objects. Includes IoT sensors and a mini display for 15+ AI & IoT projects.",
    mrp: 4499,
    schoolPrice: 4049,
    image: "/images/kits/kit-innovator.webp",
    highlights: ["ESP32 camera + Wi-Fi", "Train real AI models", "15+ AI & IoT projects", "48-page guide + online AI course"],
    inTheBox: ["ESP32-CAM + programmer board", "ESP32 DevKit", "Pan-tilt bracket + 2 servos", "0.96\" OLED display", "IMU, ultrasonic, PIR & temperature sensors", "830-point breadboard + wires", "Power module + cables", "Acrylic base & hardware", "AI project guide"],
    bom: [
      { item: "ESP32-CAM + ESP32-CAM-MB programmer", qty: 1, unitCost: 520, vendorHint: "Robu.in / Robocraze" },
      { item: "ESP32 DevKit V1 (WROOM-32)", qty: 1, unitCost: 380, vendorHint: "Robu.in" },
      { item: "Pan-tilt bracket + 2× SG90 servos", qty: 1, unitCost: 300, vendorHint: "Robu.in" },
      { item: "0.96\" I2C OLED display", qty: 1, unitCost: 170, vendorHint: "Robu.in" },
      { item: "MPU6050 IMU", qty: 1, unitCost: 130, vendorHint: "Robu.in" },
      { item: "HC-SR04 ultrasonic sensor", qty: 1, unitCost: 70, vendorHint: "Robu.in" },
      { item: "PIR motion sensor", qty: 1, unitCost: 70, vendorHint: "Robu.in" },
      { item: "DHT11 temperature & humidity", qty: 1, unitCost: 85, vendorHint: "Robu.in" },
      { item: "830-point breadboard", qty: 1, unitCost: 90, vendorHint: "Robu.in" },
      { item: "Jumper wire set", qty: 1, unitCost: 70, vendorHint: "Robu.in" },
      { item: "5V power module / battery holder", qty: 1, unitCost: 180, vendorHint: "Robu.in" },
      { item: "USB cables", qty: 2, unitCost: 30, vendorHint: "Wholesale" },
      { item: "Acrylic base + hardware", qty: 1, unitCost: 90, vendorHint: "Laser-cutting shop" },
      { item: "AI project guide (48 pp) + online course access", qty: 1, unitCost: 80, vendorHint: "Digital press" },
      { item: "Rigid premium kit box", qty: 1, unitCost: 90, vendorHint: "Box printer, MOQ 300" },
      { item: "Packaging", qty: 1, unitCost: 12, vendorHint: "Packaging wholesale" },
    ],
    weightGrams: 1100,
  },
];

export function kitCost(kit: Kit) {
  return Math.round(kit.bom.reduce((s, b) => s + b.qty * b.unitCost, 0));
}

/** MRP incl. GST → net revenue ex-GST → gross margin. */
export function kitMargin(kit: Kit, price = kit.mrp, gstPercent = 18) {
  const net = price / (1 + gstPercent / 100);
  const cost = kitCost(kit);
  return { net: Math.round(net), cost, margin: Math.round(net - cost), marginPct: Math.round(((net - cost) / net) * 100) };
}

/** Branding, print & merchandise — typical 2026 rates for a small run. */
export const printCatalog = [
  { item: "Participation certificate (A4, 300 gsm, colour)", unitCost: 8, unit: "piece", note: "Digital print, 300+ run" },
  { item: "Worksheet (A4, B/W, double-sided)", unitCost: 3, unit: "sheet", note: "Per student per session" },
  { item: "Roll-up standee (6×3 ft) with stand", unitCost: 2200, unit: "piece", note: "Reusable ~50 events" },
  { item: "Backdrop flex banner (10×8 ft)", unitCost: 1600, unit: "piece", note: "₹18–20 / sq ft star flex" },
  { item: "Team T-shirt (printed, cotton)", unitCost: 380, unit: "piece", note: "Front + back print" },
  { item: "PVC ID card + lanyard", unitCost: 60, unit: "piece", note: "Team & trainers" },
  { item: "Visiting cards (premium matte)", unitCost: 2, unit: "piece", note: "Box of 500" },
  { item: "Tri-fold brochure (A4, 170 gsm)", unitCost: 9, unit: "piece", note: "1,000 run" },
  { item: "Kit box printing", unitCost: 45, unit: "piece", note: "MOQ 300–500, varies by size" },
  { item: "Stickers (die-cut logo)", unitCost: 4, unit: "piece", note: "500 run" },
  { item: "Letterhead (A4, 100 gsm)", unitCost: 3, unit: "sheet", note: "500 run" },
  { item: "Proposal folder (printed)", unitCost: 35, unit: "piece", note: "100 run" },
];

/** Default per-JOVE-Day variable cost model (250 students). Editable in HQ → Planner. */
export const workshopCostModel = {
  students: 250,
  avgPricePerStudent: 400,
  lines: [
    { id: "trainers", label: "Freelance trainers (2 × ₹2,000)", type: "fixed", amount: 4000 },
    { id: "travel", label: "Travel — vehicle & fuel (~120 km round trip)", type: "fixed", amount: 4500 },
    { id: "food", label: "Team food & refreshments (5 people)", type: "fixed", amount: 1500 },
    { id: "stay", label: "Accommodation (amortised, outstation only)", type: "fixed", amount: 1000 },
    { id: "consumables", label: "Consumables (cells, LEDs, cardboard, tape)", type: "perStudent", amount: 12 },
    { id: "worksheets", label: "Worksheets (₹3 per student)", type: "perStudent", amount: 3 },
    { id: "certificates", label: "Certificates (₹8 per student)", type: "perStudent", amount: 8 },
    { id: "fleet", label: "Kit fleet depreciation", type: "fixed", amount: 4000 },
    { id: "media", label: "Media production direct cost (editor, storage, drone batteries)", type: "fixed", amount: 5000 },
    { id: "branding", label: "Branding wear & tear (standee, badges, stickers)", type: "fixed", amount: 1000 },
    { id: "contingency", label: "Contingency (3% of revenue)", type: "percentRevenue", amount: 3 },
  ] as { id: string; label: string; type: "fixed" | "perStudent" | "percentRevenue"; amount: number }[],
};

export function workshopEconomics(students = workshopCostModel.students, avgPrice = workshopCostModel.avgPricePerStudent, lines = workshopCostModel.lines) {
  const revenue = Math.max(students * avgPrice, joveDayRules.minimumBilling);
  const costs = lines.map((l) => ({
    ...l,
    total: Math.round(l.type === "fixed" ? l.amount : l.type === "perStudent" ? l.amount * students : (l.amount / 100) * revenue),
  }));
  const variable = costs.reduce((s, c) => s + c.total, 0);
  return { revenue, costs, variable, contribution: revenue - variable, marginPct: Math.round(((revenue - variable) / revenue) * 100) };
}

/** Monthly fixed costs at launch (lean). */
export const monthlyFixedCosts = [
  { id: "founder-shiva", label: "Founder stipend — Shivaprasad", amount: 25000 },
  { id: "founder-chinmay", label: "Co-founder stipend — Chinmay", amount: 25000 },
  { id: "storage", label: "Storage / workspace", amount: 8000 },
  { id: "software", label: "Phone, internet & software", amount: 4000 },
  { id: "marketing", label: "Marketing (ads, brochures, school visits)", amount: 15000 },
  { id: "accounting", label: "Accountant / CA & compliance", amount: 3000 },
  { id: "vehicle", label: "Vehicle maintenance & insurance", amount: 4000 },
  { id: "misc", label: "Miscellaneous", amount: 4000 },
];

/** One-time launch investment. */
export const launchCapex = [
  { id: "fleet-primary", label: "Primary station sets × 30 (Spark/Explorer reusable parts)", amount: 10500 },
  { id: "fleet-builder", label: "Builder stations × 25 (Arduino cars)", amount: 40000 },
  { id: "fleet-innovator", label: "Innovator AI stations × 12", amount: 28800 },
  { id: "spares", label: "Spare parts & consumables buffer (15%)", amount: 12000 },
  { id: "demo", label: "Showpieces: 6-axis arm, robot dog, AI camera, arena mats", amount: 51000 },
  { id: "av", label: "Portable projector, speaker & wireless mic", amount: 35000 },
  { id: "tools", label: "Tools, multimeters, glue guns, extension boards, crates", amount: 23000 },
  { id: "laptops", label: "6 refurbished laptops for AI sessions (optional)", amount: 108000 },
  { id: "branding", label: "Launch branding: standees, backdrop, T-shirts, ID cards, brochures, cards", amount: 35000 },
  { id: "legal", label: "Company registration, GST, trademark, current account", amount: 25000 },
  { id: "buffer", label: "Working-capital buffer (≈3 months fixed costs)", amount: 250000 },
];

export const targets = {
  workshopsPerMonth: 4,
  monthlyRevenue: 4_00_000,
  revenuePerWorkshop: 1_00_000,
  yearOneSchools: 40,
};

/** Every way JOVE earns. Used on HQ → Planner and in the business plan. */
export const revenueStreams = [
  { id: "jove-day", name: "JOVE Day workshops", model: "Per student (₹249–₹549)", potential: "₹1L per school day · 4/month = ₹4L", stage: "Now" },
  { id: "quarter", name: "JOVE Quarter programs", model: "Per student per quarter", potential: "₹2–3L per school per quarter", stage: "Now" },
  { id: "year", name: "JOVE Year partnerships", model: "Per student per year + lab", potential: "₹5–12L per school per year", stage: "Month 3+" },
  { id: "club", name: "After-school JOVE Clubs", model: "₹799 / student / month", potential: "₹20K–40K per school per month, recurring", stage: "Month 2+" },
  { id: "kits-school", name: "Take-home kits (school bulk)", model: "10% off MRP, min. 30", potential: "35–55% gross margin", stage: "Now" },
  { id: "kits-online", name: "Online kit store", model: "MRP ₹599–₹4,499", potential: "D2C parents & hobbyists", stage: "Now" },
  { id: "smm", name: "Social media management for schools", model: "₹14,999–₹39,999 / month", potential: "High-margin retainer via FrameMind", stage: "Now" },
  { id: "films", name: "Admissions & commercial films", model: "₹45K–₹95K per project", potential: "Peak season Dec–Mar", stage: "Now" },
  { id: "courses", name: "Paid online courses (Pro Virtual Labs)", model: "₹499–₹2,999 per course", potential: "Scales without travel", stage: "Month 6+" },
  { id: "teacher", name: "Teacher training & certification", model: "₹1,499 / teacher", potential: "Clusters of 10–40 teachers", stage: "Month 3+" },
  { id: "camps", name: "Summer & winter camps", model: "₹2,999–₹4,999 / student (5 days)", potential: "April–May & Oct–Dec holidays", stage: "Seasonal" },
  { id: "league", name: "JOVE Robo League (inter-school)", model: "Team registration + sponsors", potential: "Brand + ₹2–5L per event", stage: "Year 1 end" },
  { id: "lab", name: "Robotics & AI lab setup (turnkey)", model: "₹3.5L–₹10L per lab", potential: "High-ticket, includes AMC", stage: "Month 6+" },
  { id: "atl", name: "Atal Tinkering Lab mentoring & AMC", model: "Annual contract per ATL school", potential: "Thousands of ATL schools nationwide", stage: "Month 6+" },
  { id: "csr", name: "CSR-funded workshops in government schools", model: "Corporate pays per school/student", potential: "Large volumes, Schedule VII education", stage: "Month 6+" },
  { id: "parties", name: "Robot birthday parties & weekend maker sessions", model: "₹8K–₹20K per event", potential: "Weekend utilisation of team & kits", stage: "Opportunistic" },
  { id: "corporate", name: "Corporate family days & STEM fairs", model: "₹40K–₹1.5L per event", potential: "Employee engagement budgets", stage: "Opportunistic" },
  { id: "license", name: "Curriculum licensing / franchise", model: "Fee + royalty per partner", potential: "Expand to new cities without travel", stage: "Year 2" },
  { id: "sponsor", name: "Brand sponsorships of JOVE Days", model: "Sponsor logo on films & kits", potential: "₹10K–₹50K per event", stage: "Year 1 end" },
  { id: "content", name: "YouTube & content licensing", model: "Ad revenue + licensing", potential: "Compounding long-term", stage: "Ongoing" },
];

export const faqs = [
  { q: "What exactly happens on a JOVE Day?", a: "Our team arrives at 7:30 am, opens with a live robot and drone show for the whole school, then runs age-specific hands-on sessions for each grade group through the day, and closes with a showcase and certificate ceremony. Every student builds and tests something real." },
  { q: "How is pricing calculated?", a: "Per student, by grade group: ₹249 (Grades 1–2), ₹349 (Grades 3–5), ₹449 (Grades 6–8) and ₹549 (Grades 9–10), plus GST. The minimum for a JOVE Day is 200 students. Kits, certificates and the Media Pack are included." },
  { q: "Do students take the kits home?", a: "Workshop kits are reused by JOVE (so the price stays low). Schools can add take-home kits for every student at a bulk price — or parents can order them from our online store." },
  { q: "What is the free Media Pack?", a: "Our in-house film studio, FrameMind AI Studio, shoots your JOVE Day and delivers 3–4 cinematic reels, a full-day highlight film, drone aerial shots, 30+ edited photos and a principal testimonial clip — ready for your school's social media and admissions campaigns." },
  { q: "What do you need from the school?", a: "A hall or classrooms for each session, a projector or screen, power points, tables for team stations, and permission for photography and drone shots. We bring everything else." },
  { q: "Are your trainers safe and verified?", a: "Every JOVE trainer is background-verified, trained on our safety SOP and child-protection policy, and works under a founder's supervision. All kits are low-voltage and child-safe." },
  { q: "Can we try it before booking?", a: "Yes — explore our free Virtual Labs online with your students. They're the same journeys we run offline, from theory to a hands-on simulation." },
  { q: "Which boards and syllabi do you align to?", a: "JOVE sessions support CBSE, ICSE and State Board science and computer-science outcomes, NEP 2020's emphasis on experiential learning and coding, and the Atal Tinkering Lab framework." },
];
