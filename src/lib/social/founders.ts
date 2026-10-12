/**
 * The founders' personal-brand plans for Social Studio: what each profile is for, who reads it, what to post,
 * when, the lines to start a post from, and what never to post.
 * Source: OPERATIONS/11_CONTENT/01_Content_Strategy.md (pillar 5 "Founders and craft", the audiences, LinkedIn at
 * three posts a week in the founder voice), 05_90_Day_Launch_Content_Calendar.md (the Monday founder post, Sunday
 * planning, the honesty reminder) and 01_BRAND/02_Voice_and_Tone.md.
 *
 * JOVE is new. No line here assumes a workshop, a school, a number or a quote that does not exist yet; the few
 * that need something to have happened first say so in `after`. Names and roles are read from site.founders.
 */

export type FounderId = "shivaprasad" | "chinmay";
/** the "Posted from" value of the content plan for a founder's own profile */
export type FounderAccount = "Shivaprasad (personal)" | "Chinmay (personal)";

export interface Pillar {
  id: string;
  name: string;
  about: string;
  /** what to post under it */
  posts: string[];
}

export interface Slot {
  day: string;
  where: string;
  what: string;
}

export interface Prompt {
  /** a pillar id */
  pillar: string;
  /** the line a post starts from; the dots are where the founder carries on */
  text: string;
  /** set when the line may be used only once something has really happened */
  after?: string;
  /** a caution for this line */
  tip?: string;
}

export interface FounderPlan {
  id: FounderId;
  account: FounderAccount;
  /** what follows the role in the profile headline */
  headline: string;
  /** what the profile is for */
  purpose: string;
  readers: { who: string; wants: string }[];
  /** how it sounds */
  voice: string[];
  pillars: Pillar[];
  rhythm: Slot[];
  rhythmNote: string;
  prompts: Prompt[];
  /** what not to post */
  avoid: string[];
}

const shivaprasad: FounderPlan = {
  id: "shivaprasad",
  account: "Shivaprasad (personal)",
  headline: "Full-day Robotics and AI workshops for schools, Grades 1 to 10",
  purpose:
    "This is where a principal looks you up before agreeing to a meeting. It should show the person who answers the phone, plans the day and stands in the hall: how you think, how you run things, and that you tell the truth about a company that is new.",
  readers: [
    { who: "Principals, trustees and coordinators", wants: "A day that is safe, no trouble for their staff and visible to parents." },
    { who: "Teachers and lab in-charges", wants: "Something easy to host, with no extra load on them." },
    { who: "Partners and CSR teams", wants: "To know who runs this, and that the numbers are honest." },
    { who: "Future trainers", wants: "What the work is really like." },
  ],
  voice: [
    "First person, plain words, short sentences. One idea in each.",
    "Exact with numbers, and only real ones. A target is written as a target.",
    "Respectful of a principal's time: what the school gets first, then how.",
  ],
  pillars: [
    {
      id: "why",
      name: "Why JOVE, why now",
      about: "The reason the company exists, and where it honestly stands today.",
      posts: ["Why you started, told through one story from your own school years", "What a JOVE Day is, for someone who has never seen one", "What is ready today and what is still being built"],
    },
    {
      id: "schools",
      name: "What a school actually gets",
      about: "Plain answers to what principals ask before they book.",
      posts: ["The day, hour by hour", "The price list explained, with GST stated", "What the school arranges and what JOVE brings", "Safety and consent, step by step"],
    },
    {
      id: "running",
      name: "Running the day",
      about: "Operations in the open: the planning that makes a school day run on time.",
      posts: ["Packing, transport and set-up", "A checklist, and why it exists", "Finding and training trainers", "What went wrong, and the fix"],
    },
    {
      id: "honest",
      name: "Building it honestly",
      about: "Your own ledger: lessons, thanks, and numbers only when they are real.",
      posts: ["A lesson from this week", "A target, and where you stand against it", "A thank-you, with the person's permission"],
    },
  ],
  rhythm: [
    { day: "Mon", where: "LinkedIn", what: "Founder post: this week's Monday topic from the launch calendar." },
    { day: "Fri", where: "LinkedIn", what: "Founder post: the week in the open. What you ran, learned or got wrong." },
    { day: "Daily", where: "LinkedIn", what: "Ten minutes: answer every comment and message within 24 hours." },
    { day: "Sun", where: "HQ", what: "Choose next week's two posts and put them in the plan." },
  ],
  rhythmNote: "The Content Strategy sets LinkedIn at three posts a week in the founder voice. Two are yours, Monday and Friday. Wednesday is Chinmay's. Share each other's posts.",
  prompts: [
    { pillar: "why", text: "The school day I wish I had looked like this: ..." },
    { pillar: "why", text: "Why we are starting JOVE now and not later: ..." },
    { pillar: "why", text: "JOVE is new. Here is what is ready, and what is not yet: ..." },
    { pillar: "why", text: "One thing every child should leave a workshop able to do: ..." },
    { pillar: "why", text: "NEP 2020 asks for learning by doing. In one hall, that looks like: ..." },
    { pillar: "schools", text: "What a school actually gets on a JOVE Day: ..." },
    { pillar: "schools", text: "Our prices, in plain numbers: ...", tip: "Copy the numbers from the price list and say ex-GST." },
    { pillar: "schools", text: "What we ask a school to arrange, and nothing more: ..." },
    { pillar: "schools", text: "The first time a principal asked us ..." },
    { pillar: "schools", text: "A question I could not answer well this week: ..." },
    { pillar: "schools", text: "Why the film is part of the day, not an extra: ..." },
    { pillar: "schools", text: "What a principal told us after the day: ...", after: "Only with a real quote that the principal has approved." },
    { pillar: "running", text: "What it takes to turn an empty hall into a robotics lab before the first bell: ..." },
    { pillar: "running", text: "Packing day. What goes in the van, and why: ..." },
    { pillar: "running", text: "What we got wrong this week: ..." },
    { pillar: "running", text: "A checklist we rewrote this week, and why: ..." },
    { pillar: "running", text: "What I look for when we meet a trainer: ..." },
    { pillar: "running", text: "Our first JOVE Day. What we learned: ...", after: "Only once the day has been held." },
    { pillar: "honest", text: "Our target for year one, and where we stand today: ...", tip: "Write the target as a target. Count only what is real." },
    { pillar: "honest", text: "A number we will not publish until it is real: ..." },
    { pillar: "honest", text: "What I changed my mind about this month: ..." },
    { pillar: "honest", text: "Thank you to someone who helped us this week: ...", tip: "Name a person only with their permission." },
  ],
  avoid: [
    "A count of schools or students before it is real. A target is always written as a target.",
    "A school's name, a principal's words or a school logo before the school has approved it.",
    "A testimonial, an award, press or a rating that does not exist.",
    "A child's face or name without the school's consent process. No uniform crests.",
    "A price that is not on the current price list, or one without “ex-GST” or “incl. GST”.",
    "What things cost us, margins and planning numbers. They stay in HQ.",
    "A competitor's name, a comparison, or a superlative such as “best” or “number 1”.",
    "Anything from a talk with a school that the school would not want made public.",
  ],
};

const chinmay: FounderPlan = {
  id: "chinmay",
  account: "Chinmay (personal)",
  headline: "Founder, FrameMind AI Studio · Film, brand and curriculum for school Robotics and AI",
  purpose:
    "This is where people see the craft behind JOVE: the film, the brand and the way a session is designed. A principal sees how the school will look on film. A film-maker or a teacher sees how the work is really done.",
  readers: [
    { who: "Principals and admissions heads", wants: "To see how their school will look on film, and that children are filmed with care." },
    { who: "Film-makers and editors", wants: "How the studio works, and whether they would want to join it." },
    { who: "Teachers and curriculum people", wants: "How a session is designed for each grade group." },
    { who: "Students and young makers", wants: "Something they can try themselves." },
  ],
  voice: [
    "First person, from the desk or the shoot. Show the work, then say one thing about it.",
    "Precise about craft and proud of it, without superlatives.",
    "A picture that is drawn or generated says so: “illustration”.",
  ],
  pillars: [
    {
      id: "lens",
      name: "Behind the lens",
      about: "How FrameMind AI Studio films and edits a school day.",
      posts: ["The shot list and how coverage is planned", "One frame, and why it was kept", "Before and after the grade", "The rig, the drone and the rules they follow"],
    },
    {
      id: "brand",
      name: "Brand and craft",
      about: "Why JOVE looks like a drafting sheet, and the decisions behind it.",
      posts: ["The logo and what it means", "Paper, graphite and pencil lines: why there is no brand colour", "A design that was thrown away, and why"],
    },
    {
      id: "build",
      name: "Curriculum and technology",
      about: "How a session, a kit and a Virtual Lab are designed.",
      posts: ["One session for one grade group, step by step", "A Virtual Lab anyone can try free", "A kit, from sketch to box", "A bug, and its fix"],
    },
    {
      id: "studio",
      name: "Building the studio honestly",
      about: "Running a small studio inside a new company, told as it is.",
      posts: ["Why a workshop company has its own film crew", "What you got wrong, and what you changed", "The tools on your desk, the AI ones named plainly"],
    },
  ],
  rhythm: [
    { day: "Wed", where: "LinkedIn", what: "Founder post: craft. How something was filmed, designed or built." },
    { day: "Thu", where: "Instagram", what: "One frame or short clip from this week's shoot or edit, with one line on how it was made." },
    { day: "Monthly", where: "YouTube", what: "One craft breakdown, cut from footage you already have." },
    { day: "Daily", where: "All three", what: "Ten minutes: answer every comment and message within 24 hours." },
    { day: "Sun", where: "HQ", what: "Choose next week's posts and put them in the plan." },
  ],
  rhythmNote:
    "The Content Strategy sets LinkedIn at three posts a week in the founder voice. Wednesday is yours. Monday and Friday are Shivaprasad's. Instagram and YouTube here are your own profile for the studio side, kept light: JOVE's channels keep their own cadence in the Plan tab.",
  prompts: [
    { pillar: "lens", text: "How we plan to film a school day without getting in its way: ..." },
    { pillar: "lens", text: "One frame, and why I kept it: ..." },
    { pillar: "lens", text: "What the shot list says before we reach the school: ..." },
    { pillar: "lens", text: "Before and after the grade. What changed, and why: ..." },
    { pillar: "lens", text: "Why no child is filmed before consent is in place: ..." },
    { pillar: "lens", text: "The shot I missed on the day, and what I changed: ...", after: "Only after a real shoot at a school." },
    { pillar: "brand", text: "Why the O in JOVE is a robotic arm: ..." },
    { pillar: "brand", text: "Why JOVE has no brand colour: ..." },
    { pillar: "brand", text: "A design I threw away this week, and why: ..." },
    { pillar: "brand", text: "Every robot starts as a drawing. Here is one of ours: ..." },
    { pillar: "brand", text: "One rule in our brand guide I would not give up: ..." },
    { pillar: "build", text: "How we design one session for one grade group: ..." },
    { pillar: "build", text: "Inside a Virtual Lab you can try free today: ..." },
    { pillar: "build", text: "From sketch to box: how one kit came together: ..." },
    { pillar: "build", text: "A bug I chased this week: ..." },
    { pillar: "build", text: "What a Grade 1 build and a Grade 10 build have in common: ..." },
    { pillar: "studio", text: "Why a workshop company has its own film studio: ..." },
    { pillar: "studio", text: "This picture is an illustration, and it says so. Here is why: ..." },
    { pillar: "studio", text: "What I got wrong this week: ..." },
    { pillar: "studio", text: "The tools on my desk this month, AI ones included: ..." },
    { pillar: "studio", text: "What I am learning to do better as an editor: ..." },
    { pillar: "studio", text: "Our first highlight film is out. What I would do differently: ...", after: "Only once the film is published and the school has approved it." },
  ],
  avoid: [
    "Footage or photos of a child without consent, or a school's film before the school has approved the cut.",
    "A generated or drawn picture shown as a real JOVE event. It carries the word “illustration”.",
    "A count of schools, students or views before it is real.",
    "A testimonial, an award or press that does not exist.",
    "Drone footage flown outside the drone rules or without the school's permission.",
    "Someone else's work as ours, or a client's work without their permission.",
    "A competitor's name, a comparison, or a superlative such as “best” or “number 1”.",
    "The word “viral”. Say “in-house film studio”.",
  ],
};

export const FOUNDER_PLANS: Record<FounderId, FounderPlan> = { shivaprasad, chinmay };
export const FOUNDER_ORDER: FounderId[] = ["shivaprasad", "chinmay"];
