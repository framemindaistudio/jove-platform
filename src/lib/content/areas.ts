/**
 * Where JOVE runs workshops: the districts around the base in Bagalkot, one page each (/areas/<slug>).
 *
 * The library's rule (OPERATIONS/21_MARKETING/03): a town page only for a real service area, with its own words,
 * never a template with the name swapped. So every district below is written for itself, and nothing on these pages
 * claims schools, numbers or results that do not exist yet. Distances are described, not measured: the written
 * proposal carries the travel plan for each school.
 */

export const BASE = { town: "Bagalkot", state: "Karnataka" };

export type Reach = "home" | "day" | "early";

export const REACH: Record<Reach, { label: string; line: string }> = {
  home: { label: "Home district", line: "Our base. The team drives over on the morning of the workshop." },
  day: { label: "Day trip", line: "A day trip from Bagalkot. The team sets off early and is on campus before the first session." },
  early: { label: "Early start or the evening before", line: "For the nearer towns the team leaves at dawn; for the farther ones it travels the evening before." },
};

export interface Area {
  slug: string;
  /** "Vijayapura" */
  name: string;
  /** "Vijayapura district" */
  title: string;
  /** the search-result description, written for this district (under 160 characters) */
  description: string;
  reach: Reach;
  /** towns and taluk headquarters the team goes to */
  towns: string[];
  /** the opening paragraph, written for this district */
  intro: string;
  /** a second paragraph: how a JOVE Day works from here */
  plan: string;
  faqs: { q: string; a: string }[];
}

export const AREAS: Area[] = [
  {
    slug: "bagalkot",
    name: "Bagalkot",
    title: "Bagalkot district",
    description: "Full-day Robotics & AI workshops for schools across Bagalkot district, from Grade 1 to 10, filmed by our in-house studio. JOVE is based in Bagalkot.",
    reach: "home",
    towns: ["Bagalkot", "Navanagar", "Jamkhandi", "Mudhol", "Rabkavi-Banahatti", "Badami", "Guledgudda", "Ilkal", "Hungund", "Bilagi"],
    intro:
      "JOVE is based in Bagalkot, so schools in the district are the closest we work with. A JOVE Day brings the robots, kits, trainers and our film crew to your campus for one full day of hands-on Robotics, AI and Machine Learning, from Grade 1 to Grade 10.",
    plan:
      "Because there is no long drive, the team arrives early, sets up the stations and the opening show before the first bell, and stays until the last kit is counted back. Planning meetings can happen on your campus, in person, before the day.",
    faqs: [
      { q: "Can we meet you at our school before we decide?", a: "Yes. We are based in Bagalkot, so a founder can visit, look at the halls and power points, and answer the principal's questions in person." },
      { q: "Is travel charged for schools in Bagalkot district?", a: "Travel and logistics are worked out for each school and written into your proposal, so the full amount is clear before you confirm." },
      { q: "Do you work with CBSE, ICSE and State Board schools?", a: "Yes. The sessions are planned by grade group, not by board, so the same JOVE Day works for CBSE, ICSE and Karnataka State Board schools." },
    ],
  },
  {
    slug: "vijayapura",
    name: "Vijayapura",
    title: "Vijayapura district",
    description: "Full-day Robotics & AI workshops for schools in Vijayapura district, a day trip from our Bagalkot base. Grades 1 to 10, filmed by our in-house studio.",
    reach: "day",
    towns: ["Vijayapura", "Basavana Bagewadi", "Muddebihal", "Talikota", "Sindagi", "Indi"],
    intro:
      "Schools in Vijayapura district are a day trip from our base in Bagalkot. We bring a complete JOVE Day to your campus: age-specific build sessions for every grade group, the robots for the opening show, and our in-house film studio recording the day for your school.",
    plan:
      "On the day the team leaves Bagalkot early with the kits packed by hall, so stations are ready before students arrive. We agree the reporting time with your coordinator a day before, and the run sheet is shared with you in advance.",
    faqs: [
      { q: "Can a school in Vijayapura have a full day, or only a short session?", a: "A full JOVE Day. The team reaches your campus before the first session, so the schedule is the same as for a school next door to us." },
      { q: "How is travel to Vijayapura district handled?", a: "Travel and logistics are part of your written proposal, so the total is clear before you confirm a date." },
      { q: "What do we need to arrange at our end?", a: "Two rooms for the parallel sessions, an assembly space, tables, a few power points and a coordinator teacher for the day. We bring everything else, including a projector if you have none." },
    ],
  },
  {
    slug: "gadag",
    name: "Gadag",
    title: "Gadag district",
    description: "Hands-on Robotics & AI workshops for schools in Gadag, Ron, Gajendragad and across Gadag district. One full day for Grades 1 to 10, with reels and a film.",
    reach: "day",
    towns: ["Gadag-Betageri", "Ron", "Naragund", "Gajendragad", "Mundargi", "Shirahatti", "Lakshmeshwar"],
    intro:
      "Gadag district is a day trip from Bagalkot, and the towns on the Ron and Gajendragad side are among the nearest. A JOVE Day gives every student from Grade 1 to Grade 10 a session built for their age, from meeting the robots in Grades 1 and 2 to building an AI that sees in Grades 9 and 10.",
    plan:
      "We plan the day with your coordinator: halls, timings, student counts per grade group and the consent list for filming. The team sets off early on the day and brings the kits, the opening-show robots and the film crew.",
    faqs: [
      { q: "Which grades can take part?", a: "Grades 1 to 10, in four age groups. Each group has its own session length, kit and project, planned to the minute." },
      { q: "How is travel to Gadag district handled?", a: "It is included in your written proposal, worked out for your town, so there are no surprises later." },
      { q: "Will students be filmed?", a: "Only with consent. The school shares the consent list, children without consent are not filmed or are blurred, and the school receives the reels and the film." },
    ],
  },
  {
    slug: "koppal",
    name: "Koppal",
    title: "Koppal district",
    description: "Robotics & AI workshops for schools in Koppal, Kushtagi, Gangavathi and across Koppal district. A full JOVE Day for Grades 1 to 10, filmed for your school.",
    reach: "day",
    towns: ["Koppal", "Kushtagi", "Yelburga", "Kukanoor", "Gangavathi", "Karatagi", "Kanakagiri"],
    intro:
      "Koppal district borders Bagalkot, and towns like Kushtagi are a short drive from Ilkal. Schools here can book the same full JOVE Day as any other: hands-on robotics and AI for every grade group, with our studio filming the day for the school.",
    plan:
      "For towns on the far side of the district, such as Gangavathi, the team allows extra time and agrees an early reporting time with your coordinator. The run sheet, the kit plan and the consent list are all settled before the day.",
    faqs: [
      { q: "Do you come to schools in Gangavathi and Karatagi as well?", a: "Yes. The farther towns need an earlier start, which we plan with your coordinator; the day itself is the same." },
      { q: "How is travel to Koppal district handled?", a: "Travel and logistics are written into your proposal before you confirm, so the full amount is known up front." },
      { q: "How many students can join in one day?", a: "A JOVE Day is planned around the number of students in each grade group; larger groups are split into batches on the run sheet." },
    ],
  },
  {
    slug: "dharwad",
    name: "Hubballi-Dharwad",
    title: "Dharwad district (Hubballi-Dharwad)",
    description: "Full-day Robotics & AI workshops for schools in Hubballi, Dharwad and nearby towns. Grades 1 to 10, with our film crew; we plan the travel from Bagalkot.",
    reach: "early",
    towns: ["Hubballi", "Dharwad", "Navalgund", "Annigeri", "Kundgol", "Kalghatgi", "Alnavar"],
    intro:
      "Schools in Hubballi, Dharwad and the towns around them can book a JOVE Day too. It is a longer drive from Bagalkot, so we plan the travel with care, and the day on your campus is exactly the same: every grade group builds, tests and presents, and our studio films it for your school.",
    plan:
      "Depending on your town and your first session, the team either leaves at dawn or travels the evening before, so it is set up and rested before students arrive. Your proposal shows the travel plan and its cost.",
    faqs: [
      { q: "Is Hubballi-Dharwad too far for a full day?", a: "No. The team either starts at dawn or arrives the evening before, so your students get the full schedule." },
      { q: "How is the travel cost worked out?", a: "It depends on your town and whether the team needs to stay the night before. It is shown in your written proposal before you confirm." },
      { q: "Can several schools in the twin cities book back-to-back days?", a: "Yes, and it makes the travel go further. Tell us when you enquire and we will plan the dates together." },
    ],
  },
  {
    slug: "belagavi",
    name: "Belagavi",
    title: "Belagavi district",
    description: "Robotics & AI workshops for schools in Belagavi district, from Ramdurg and Gokak to Belagavi city and Chikkodi. A full JOVE Day for Grades 1 to 10.",
    reach: "early",
    towns: ["Ramdurg", "Saundatti", "Gokak", "Mudalagi", "Bailhongal", "Athani", "Belagavi", "Chikkodi"],
    intro:
      "Belagavi is a large district, and how we reach you depends on where your school is. Towns on our side, such as Ramdurg, Saundatti and Mudalagi, are close to Bagalkot district; Belagavi city, Athani and Chikkodi are farther. Wherever you are, the JOVE Day on your campus is the same full day of robotics, AI and filming.",
    plan:
      "For the nearer towns the team sets off early on the day. For Belagavi city and the north-western taluks it usually travels the evening before. We confirm the plan, the reporting time and the run sheet with your coordinator in advance.",
    faqs: [
      { q: "We are in Belagavi city. Will the day be shorter because of the travel?", a: "No. For the farther towns the team arrives the evening before, so the day starts on time." },
      { q: "How is travel to Belagavi district handled?", a: "Travel and logistics are worked out for your town and written into your proposal before you confirm." },
      { q: "Do you also train our teachers?", a: "Yes, as an add-on: a hands-on robotics and AI session for teachers, with a JOVE certificate. It can follow the JOVE Day." },
    ],
  },
];

export const areaBySlug = (slug: string) => AREAS.find((a) => a.slug === slug);
