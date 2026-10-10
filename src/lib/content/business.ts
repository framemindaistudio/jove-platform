/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  JOVE CATALOGUE — WHAT JOVE OFFERS AND WHAT CUSTOMERS PAY
 * ─────────────────────────────────────────────────────────────────────────────
 *  Programmes, grade bands, the JOVE Day timetable, packages, add-ons and kits,
 *  with their PUBLIC prices. The public website, the HQ portal (proposals,
 *  invoices, calculators) and the brochures all read from here.
 *
 *  The prices are set in HQ → Money → Prices & Costs. The build reads them from
 *  the private data repository (next.config.ts → JOVE_PRICEBOOK); the numbers
 *  typed in this file are only the starting values, used until a price book has
 *  been saved. To change a price, change it in HQ, not here.
 *
 *  Nothing in this file is private. What things cost JOVE (parts, margins, the
 *  cost of a JOVE Day, monthly costs, launch budget, targets) lives only in the
 *  price book and reaches HQ at run time, for the roles that see Finance.
 *
 *  Currency: INR. School workshop prices are EXCLUSIVE of GST. Online kit MRPs
 *  are INCLUSIVE of GST.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { PublicPrices } from "@/lib/pricebook/types";

const live: Partial<PublicPrices> = (() => {
  try {
    return (JSON.parse(process.env.JOVE_PRICEBOOK || "null") as Partial<PublicPrices> | null) ?? {};
  } catch {
    return {};
  }
})();
/** the saved price when there is one, else the starting value */
const pick = (saved: unknown, starting: number) => (typeof saved === "number" && Number.isFinite(saved) && saved >= 0 ? saved : starting);
const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
const range = (values: number[]) => {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return lo === hi ? inr(lo) : `${inr(lo)} – ${inr(hi)}`;
};
const listAnd = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items.join(""));

/** Fingerprint of the saved prices this build was made with ("" = the starting values). HQ compares it with the price book. */
export const priceStamp = typeof live.stamp === "string" ? live.stamp : "";

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

const BANDS: GradeBand[] = [
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

export const gradeBands: GradeBand[] = BANDS.map((b) => {
  const saved = live.bands?.[b.id];
  return {
    ...b,
    pricePerStudent: pick(saved?.day, b.pricePerStudent),
    quarterPricePerStudent: pick(saved?.quarter, b.quarterPricePerStudent),
    yearPricePerStudent: pick(saved?.year, b.yearPricePerStudent),
  };
});

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

const RULES = {
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

/** Commercial rules for a JOVE Day. */
export const joveDayRules = {
  ...RULES,
  minimumStudents: pick(live.rules?.minimumStudents, RULES.minimumStudents),
  minimumBilling: pick(live.rules?.minimumBilling, RULES.minimumBilling),
  maxStudentsPerDay: pick(live.rules?.maxStudentsPerDay, RULES.maxStudentsPerDay),
  advancePercent: pick(live.rules?.advancePercent, RULES.advancePercent),
  balanceDueDays: pick(live.rules?.balanceDueDays, RULES.balanceDueDays),
  gstPercent: pick(live.rules?.gstPercent, RULES.gstPercent),
};

/** The differentiator — included free with every JOVE Day (produced by FrameMind AI Studio). */
export const mediaPack = {
  name: "JOVE Media Pack by FrameMind AI Studio",
  marketValue: pick(live.mediaPackValue, 60_000),
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

/** After-school JOVE Club: price per student per month, and the smallest batch. */
export const clubRules = {
  pricePerMonth: pick(live.club?.pricePerMonth, 799),
  minimumStudents: pick(live.club?.minimumStudents, 25),
};

/** The most a school saves per student on JOVE Quarter against three separate JOVE Days, in percent. */
const quarterSaving = Math.max(0, ...gradeBands.map((b) => (b.pricePerStudent > 0 ? Math.round((1 - b.quarterPricePerStudent / (3 * b.pricePerStudent)) * 100) : 0)));

export const packages: Package[] = [
  {
    id: "jove-day",
    name: "JOVE Day",
    cadence: "One full day",
    headline: "The full-day Robotics & AI festival for your whole school.",
    priceNote: `${range(gradeBands.map((b) => b.pricePerStudent))} per student by grade · min. ${joveDayRules.minimumStudents} students`,
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
    priceNote: `${range(gradeBands.map((b) => b.quarterPricePerStudent))} per student per quarter${quarterSaving > 0 ? ` (up to ${quarterSaving}% saving)` : ""}`,
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
    priceNote: `${range(gradeBands.map((b) => b.yearPricePerStudent))} per student per year`,
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
    priceNote: `${inr(clubRules.pricePerMonth)} per student per month · min. ${clubRules.minimumStudents} students`,
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

/** How an add-on's price is worded: a plain price, "from …" for a quote that starts there, or the bulk discount on kits. */
const ADD_ONS: (Omit<AddOn, "price"> & { priceKind?: "from" | "discount" })[] = [
  { id: "smm-starter", name: "Social Media Management — Starter", priceValue: 14999, unit: "month", detail: "8 posts + 4 reels per month, captions, scheduling, monthly report.", owner: "FrameMind AI Studio" },
  { id: "smm-growth", name: "Social Media Management — Growth", priceValue: 24999, unit: "month", detail: "12 posts + 8 reels, stories, community replies, admissions ad campaign management (ad spend extra).", owner: "FrameMind AI Studio" },
  { id: "smm-premium", name: "Social Media Management — Premium", priceValue: 39999, unit: "month", detail: "Everything in Growth + monthly campus shoot day, YouTube management, quarterly brand film.", owner: "FrameMind AI Studio" },
  { id: "film-admissions", name: "Admissions / Commercial Film", priceValue: 45000, unit: "project", detail: "1-day shoot, 2-minute school film + 3 reels, drone shots, colour grade.", owner: "FrameMind AI Studio" },
  { id: "film-premium", name: "Premium Brand Film", priceValue: 95000, unit: "project", detail: "2-day shoot, 5-minute documentary-style film, interviews, 6 reels, drone, licensed music.", owner: "FrameMind AI Studio" },
  { id: "teacher-training", name: "Teacher Training & Certification", priceValue: 1499, unit: "teacher", detail: "4-hour hands-on robotics & AI training with JOVE certificate (min. 10 teachers).", owner: "JOVE" },
  { id: "take-home-kits", name: "Take-home Kits for Students", priceValue: 0, unit: "kit", detail: "Each student takes their own kit home — bulk school price on any JOVE kit (min. 30 kits).", owner: "JOVE", priceKind: "discount" },
  { id: "lab-setup", name: "Robotics & AI Lab Setup (turnkey)", priceValue: 350000, unit: "project", detail: "Design, furniture layout, kits, tools, curriculum and teacher training for a permanent campus lab (ATL-style).", owner: "JOVE", priceKind: "from" },
];

/** A school buying kits in bulk pays the MRP less this, in percent. */
export const schoolDiscountPercent = pick(live.schoolDiscountPercent, 10);

export const addOns: AddOn[] = ADD_ONS.map(({ priceKind, ...a }) => {
  const priceValue = priceKind === "discount" ? 0 : pick(live.addOns?.[a.id], a.priceValue);
  const price = priceKind === "discount" ? `${schoolDiscountPercent}% off MRP` : priceKind === "from" ? `from ${inr(priceValue)}` : a.unit === "project" ? inr(priceValue) : `${inr(priceValue)} / ${a.unit}`;
  return { ...a, priceValue, price };
});

export type KitId = "spark" | "explorer" | "builder" | "innovator";

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
  weightGrams: number;
  /** AA cells one station uses in a session (null = the kit runs from USB or a power module) */
  aaCells: number | null;
  /** The plain mailer box the kit is sold in: inside size in mm (length × width × height). The box stickers are sized from it. */
  box: { label: string; length: number; width: number; height: number };
}

const KITS: Kit[] = [
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
    weightGrams: 280,
    aaCells: 2,
    box: { label: "7 × 7 × 2 in", length: 178, width: 178, height: 51 },
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
    weightGrams: 520,
    aaCells: 4,
    box: { label: "7 × 5 × 2.5 in", length: 178, width: 127, height: 64 },
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
    weightGrams: 900,
    aaCells: 6,
    box: { label: "8 × 6 × 3 in", length: 203, width: 152, height: 76 },
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
    weightGrams: 1100,
    aaCells: null,
    box: { label: "9 × 8 × 2.5 in", length: 229, width: 203, height: 64 },
  },
];

export const kits: Kit[] = KITS.map((k) => {
  const saved = live.kits?.[k.id];
  return { ...k, mrp: pick(saved?.mrp, k.mrp), schoolPrice: pick(saved?.schoolPrice, k.schoolPrice) };
});

/** What the founders say in public about the first year. Everything else they plan with stays in HQ. */
export const targets = {
  workshopsPerMonth: pick(live.targets?.workshopsPerMonth, 4),
  yearOneSchools: pick(live.targets?.yearOneSchools, 40),
};

/** The robots and props that travel to every JOVE Day for the opening show and the stations. */
export const showpieces = "6-axis arm, robot dog, AI camera, arena mats";

export const faqs = [
  { q: "What exactly happens on a JOVE Day?", a: "Our team arrives at 7:30 am, opens with a live robot and drone show for the whole school, then runs age-specific hands-on sessions for each grade group through the day, and closes with a showcase and certificate ceremony. Every student builds and tests something real." },
  { q: "How is pricing calculated?", a: `Per student, by grade group: ${listAnd(gradeBands.map((b) => `${inr(b.pricePerStudent)} (${b.grades})`))}, plus GST. The minimum for a JOVE Day is ${joveDayRules.minimumStudents} students. Kits, certificates and the Media Pack are included.` },
  { q: "Do students take the kits home?", a: "Workshop kits are reused by JOVE (so the price stays low). Schools can add take-home kits for every student at a bulk price — or parents can order them from our online store." },
  { q: "What is the free Media Pack?", a: "Our in-house film studio, FrameMind AI Studio, shoots your JOVE Day and delivers 3–4 cinematic reels, a full-day highlight film, drone aerial shots, 30+ edited photos and a principal testimonial clip — ready for your school's social media and admissions campaigns." },
  { q: "What do you need from the school?", a: "A hall or classrooms for each session, a projector or screen, power points, tables for team stations, and permission for photography and drone shots. We bring everything else." },
  { q: "Are your trainers safe and verified?", a: "Every JOVE trainer is background-verified, trained on our safety SOP and child-protection policy, and works under a founder's supervision. All kits are low-voltage and child-safe." },
  { q: "Can we try it before booking?", a: "Yes — explore our free Virtual Labs online with your students. They're the same journeys we run offline, from theory to a hands-on simulation." },
  { q: "Which boards and syllabi do you align to?", a: "JOVE sessions support CBSE, ICSE and State Board science and computer-science outcomes, NEP 2020's emphasis on experiential learning and coding, and the Atal Tinkering Lab framework." },
];
