/**
 * The school meeting deck: what a principal or the management sees when a founder visits.
 * Follows OPERATIONS/07_SCHOOL_PROPOSALS/07_Pitch_Deck_Script_10_Slides.md (15 minutes plus questions).
 * Every price and number comes from the price book; nothing claims schools, results or testimonials JOVE does not have.
 */
import { gradeBands, joveDayRules, joveDaySchedule, kits, mediaPack, packages } from "@/lib/content/business";
import { formatINR } from "@/lib/utils";
import type { Deck } from "./types";

const hours = (min: number) => (min < 60 ? `${min} min` : min % 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min / 60} h`);
const BUILDS = ["A light-up robot with a spinning fan hat", "A light-seeking robot car", "An obstacle-avoiding Arduino car", "An AI vision robot that follows what it sees"];
const pkg = (id: string) => packages.find((p) => p.id === id);

export const schoolDeck: Deck = {
  id: "school-meeting",
  group: "school",
  title: "JOVE for your school",
  audience: "Principals, correspondents and management",
  blurb: "The meeting deck: the gap, who we are, the four programmes, the day hour by hour, the Media Pack, safety, prices and next steps. Type the school's name and it appears on the cover.",
  minutes: 15,
  theme: { accent: "#2b2b2b", tint: "#ede7da", level: 4, palette: ["#2b2b2b", "#7a5c2e", "#3d5a80"] },
  sources: ["07_SCHOOL_PROPOSALS/07_Pitch_Deck_Script_10_Slides.md", "08_SALES_CRM (objection guide)"],
  slides: ({ school }) => [
    {
      kind: "cover",
      kicker: school ? `Prepared for ${school}` : "Robotics · AI · Machine Learning",
      title: "Robotics & AI, built by your students. Filmed by our studio.",
      sub: "Full-day, hands-on workshops for Grades 1 to 10",
      art: "/images/hero/hero-arm.webp",
      notes: "Thank you for your time. In 15 minutes I want to show you what a JOVE Day looks like, what your students and your school take away, and what it costs. Then I would love your questions.",
    },
    {
      kind: "cards",
      title: "The gap schools tell us about",
      cards: [
        { icon: "GraduationCap", title: "NEP 2020", text: "asks for experiential, skill-based learning" },
        { icon: "Users", title: "Parents", text: "ask about robotics and AI at admissions time" },
        { icon: "Wrench", title: "Staff and kits", text: "are what most schools are missing for it" },
      ],
      notes: "Ask first: “What are parents asking you about robotics and AI?” Listen. Their answer is the real slide; keep this one short.",
    },
    {
      kind: "cards",
      title: "Who we are",
      cards: [
        { icon: "Bot", title: "JOVE", text: "Full-day Robotics, AI & ML workshops for Grades 1–10, on your campus" },
        { icon: "Users", title: "Founders on the floor", text: "Both founders deliver every JOVE Day themselves" },
        { icon: "Film", title: "FrameMind AI Studio", text: "Our own film studio records the day for your school" },
      ],
      sub: "A new company, launching in October 2026",
      notes: "Be upfront: “We are a new company, launching in October 2026. That is why the founders personally run every day, and why we let you try everything before you commit.” Mention the free Virtual Labs on the website and a teachers' demo at their school.",
    },
    {
      kind: "table",
      title: "One day, four programmes",
      head: ["Grades", "Programme", "Session", "Every child builds"],
      rows: gradeBands.map((b, i) => [b.grades, `${b.name}: ${b.theme}`, hours(b.durationMin), BUILDS[i]]),
      foot: "Every child builds, tests and presents. Kits: " + kits.map((k) => k.name).join(" · "),
      notes: "One line per band on what the child builds. “Every child builds, tests, presents.” Offer the appendix with learning outcomes per band if they want more detail.",
    },
    {
      kind: "agenda",
      title: "The day, hour by hour",
      rows: joveDaySchedule.filter((r) => r.title !== "Overflow batch").map((r) => ({ time: r.time, title: r.title, detail: [r.hall, r.who].filter(Boolean).join(" · ") })),
      notes: "“We bring everything: kits, tools, banners, media gear. You provide halls, tables, a projector and power. Your teachers do not have to prepare.”",
    },
    {
      kind: "points",
      title: "We bring · you provide",
      points: [
        "We bring: every kit, tool and spare, the robots for the opening show, banners, certificates, a projector backup and the film crew",
        "You provide: two rooms for the parallel sessions, an assembly space, tables, a few power points and one coordinator teacher",
        "Your teachers do not need to prepare anything",
      ],
      icon: "Package",
    },
    {
      kind: "cards",
      title: `The ${mediaPack.name.replace(" by FrameMind AI Studio", "")}`,
      cards: mediaPack.items.slice(0, 6).map((m, i) => ({ icon: (["Clapperboard", "Film", "Plane", "Camera", "Mic", "Megaphone"] as const)[i], title: m.title, text: m.delivery })),
      sub: `Market value ${formatINR(mediaPack.marketValue)}. Included with every JOVE Day.`,
      notes: "Pause here. “No other workshop company ships a cinema team with the workshop. This is content for your admissions season and your parents' WhatsApp groups. You own the right to use it.” Show a sample from the studio reel and say clearly that it is a sample, not their school.",
    },
    {
      kind: "cards",
      title: "Safety and child protection",
      cards: [
        { icon: "Battery", title: "Low-voltage kits", text: "Battery power only; no soldering, no mains for children" },
        { icon: "ShieldCheck", title: "Verified trainers", text: "Background checks and child-protection training before any session" },
        { icon: "ClipboardList", title: "Consent first", text: "Parents sign consent; any child can be left out or blurred" },
      ],
      notes: "Answer the media-privacy question before it is asked: “Parents sign consent. If any child should not appear, we remove or blur them.”",
    },
    {
      kind: "table",
      title: "Investment: a JOVE Day",
      head: ["Grades", "Programme", "Per student (before GST)"],
      rows: gradeBands.map((b) => [b.grades, b.name, formatINR(b.pricePerStudent)]),
      foot: `Minimum ${joveDayRules.minimumStudents} students (${formatINR(joveDayRules.minimumBilling)} before GST) · ${joveDayRules.advancePercent}% advance confirms the date · balance within ${joveDayRules.balanceDueDays} days of the workshop · GST ${joveDayRules.gstPercent}% extra`,
      notes: "Do the arithmetic for their school aloud, with their numbers, on a calculator or the estimator at jove.website/packages. “Whether the school absorbs this or shares it with parents is your decision. Many schools run it as part of an annual day or science week.”",
    },
    {
      kind: "cards",
      title: "Beyond one day",
      cards: [
        { icon: "CalendarDays", title: pkg("jove-quarter")?.name ?? "JOVE Quarter", text: pkg("jove-quarter")?.priceNote },
        { icon: "GraduationCap", title: pkg("jove-year")?.name ?? "JOVE Year", text: pkg("jove-year")?.priceNote },
        { icon: "Users", title: pkg("jove-club")?.name ?? "JOVE Club", text: pkg("jove-club")?.priceNote },
      ],
      sub: "Prices before GST",
      notes: "“Most schools start with one day. If it works, we can grow together.” Do not push the bigger packages if the principal is still on the first decision.",
    },
    {
      kind: "steps",
      title: "Next steps",
      steps: [
        { title: "Pick a date", detail: "We hold it for you", icon: "CalendarDays" },
        { title: "Confirm numbers", detail: "Students per grade group", icon: "Users" },
        { title: "Agreement and advance", detail: `${joveDayRules.advancePercent}% confirms the date`, icon: "Handshake" },
        { title: "We plan the day together", detail: "Run sheet, halls, consent", icon: "ClipboardList" },
      ],
      notes: "Ask for the decision: “Which dates are free for you in the next two months?” If they hesitate, offer a pilot demo for teachers. Note every concern and answer with the objection guide in 08_SALES_CRM.",
    },
    {
      kind: "closing",
      title: "Thank you",
      sub: "jove.website",
      points: ["Questions?", "Try a free Virtual Lab: jove.website/labs", "Estimate for your school: jove.website/packages"],
    },
  ],
};
