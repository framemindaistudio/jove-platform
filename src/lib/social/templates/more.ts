/**
 * The designs of Social Studio, part 2 (promotion, more announcements, video series, festival days and the
 * founders' own posts). Same rules as part 1: see core.ts.
 *
 * Prices and the Media Pack list are read from the price list the website uses, lab names from the Virtual Labs
 * and the founders' names from the site profile, so a post can never disagree with the website.
 */
import { gradeBands, joveDayRules, mediaPack } from "@/lib/content/business";
import { labs } from "@/lib/content/labs";
import { site } from "@/lib/site";
import { figure, list, photo, poster, thumb, type Fact } from "../layouts";
import type { FieldSpec, FormatId, TemplateDef, Values } from "../types";
import { CTAS, WATCH, bareSite, caption, choice, dateHero, daysBetween, dotDate, hashtags, linesOf, longDate, rupees, shortDate, splitLine, val } from "../words";

const picture = (key: string, label: string, help?: string): FieldSpec => ({ key, label, kind: "image", help });
const ALL_SIZES: FormatId[] = ["post", "square", "story", "wide"];

/** a typed line as a sentence: a full stop is added unless it already ends with one */
const sentence = (s: string) => (s && !/[.?!…]$/.test(s) ? `${s}.` : s);
const CONSENT = "Photos of children need the school's consent. No name, class or crest without approval.";

/* ───────────────────────────── what a JOVE Day costs (from the price list) ───────────────────────────── */

const fromPrice = Math.min(...gradeBands.map((b) => b.pricePerStudent));
const PRICE = `From ${rupees(fromPrice)} per student, ex-GST`;
const MINIMUM = `${joveDayRules.minimumStudents} students`;
const dayFacts: Fact[] = [
  { label: "Price", value: PRICE },
  { label: "Minimum", value: MINIMUM },
  { label: "For", value: "Grades 1 to 10" },
];

/* ───────────────────────────── what is a JOVE Day ───────────────────────────── */

const PROMO_HEADLINE = "A full day of Robotics and AI";

const promoJoveDay: TemplateDef = {
  id: "promo-jove-day",
  name: "What is a JOVE Day",
  group: "Promotion",
  blurb: "The JOVE Day in one post: what it is, three points, and the price from the price list.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite", "photo"],
  fields: [
    { key: "headline", label: "Headline (up to 8 words)", kind: "text", placeholder: PROMO_HEADLINE, max: 40 },
    { key: "line", label: "One line", kind: "textarea", rows: 3, max: 120 },
    { key: "points", label: "Three points (one per line)", kind: "textarea", rows: 3, help: "Only what every JOVE Day includes. The price and the minimum are read from the price list.", max: 48 },
    picture("picture", "Picture (for the Photo look)", `${CONSENT} Until you add one, an illustration is shown and labelled.`),
  ],
  sample: {
    headline: PROMO_HEADLINE,
    line: "On your campus, for Grades 1 to 10. Every kit, trainer and cable is ours. The film is on us.",
    points: "Every grade group builds its own project\nKits, tools and certificates included\nReels and a highlight film by our own studio",
  },
  stock: () => ({ picture: "/images/studio/kids-build.webp" }),
  draw(p, { values: v, pictures, facts }) {
    const base = { tag: "For schools · JOVE Day", foot: bareSite(facts.website) };
    const headline = val(v, "headline") || PROMO_HEADLINE;
    if (p.tone === "photo") {
      photo(p, { ...base, headline, sub: val(v, "line"), chips: [PRICE, `Min. ${MINIMUM}`], picture: pictures.picture });
      return;
    }
    const points = linesOf(v, "points").slice(0, 3);
    poster(p, {
      ...base,
      eyebrow: "What is a JOVE Day?",
      headline,
      // Square and Wide are short sheets: with the points on them, the line stays in the caption
      sub: p.portrait || !points.length ? val(v, "line") : "",
      bullets: points,
      facts: dayFacts,
      cta: "Book a JOVE Day",
      hero: p.wide ? { top: "Grades", main: "1–10", bottom: "One full day" } : null,
    });
  },
  caption(v) {
    const headline = val(v, "headline") || PROMO_HEADLINE;
    const priced = `from ${rupees(fromPrice)} per student (ex-GST, minimum ${MINIMUM}).`;
    return caption({
      hook: /[.?!]$/.test(headline) ? `${headline} F${priced.slice(1)}` : `${headline}, ${priced}`,
      body: [val(v, "line"), ...linesOf(v, "points").slice(0, 3).map((l) => `· ${l}`)],
      cta: CTAS.book,
      tags: hashtags("schools", "robotics"),
    });
  },
};

/* ───────────────────────────── the Media Pack ───────────────────────────── */

const PACK_TITLE = "The JOVE Media Pack";
const PACK_VALUE = `Market value about ${rupees(mediaPack.marketValue)}`;
const PACK_CTAS: Record<string, { pill?: string; line: string }> = {
  book: { pill: "Book a JOVE Day", line: CTAS.book },
  share: { line: CTAS.share },
};

const mediaPackPost: TemplateDef = {
  id: "media-pack",
  name: "The free Media Pack",
  group: "Promotion",
  blurb: "What every school receives with its JOVE Day, read from the Media Pack list.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "title", label: "Title", kind: "text", placeholder: PACK_TITLE, max: 30 },
    { key: "detail", label: "Under each item", kind: "select", options: [{ value: "", label: "Nothing: the names only" }, { value: "delivery", label: "When the school receives it" }], help: "Post and Story show the most items. Square and Wide show the first four." },
    { key: "value", label: "Market value", kind: "select", options: [{ value: "", label: "Leave it out" }, { value: "show", label: `Show it: ${PACK_VALUE.toLowerCase()}` }], help: "Our own estimate, from the price list. It is always worded as “market value about”." },
    { key: "cta", label: "Call to action", kind: "select", options: [{ value: "book", label: "Book a JOVE Day" }, { value: "share", label: "None on the design (caption: send this to your coordinator)" }] },
  ],
  sample: { title: PACK_TITLE, detail: "", value: "", cta: "book" },
  draw(p, { values: v, facts }) {
    list(p, {
      tag: "For schools · Media Pack",
      index: val(v, "value") === "show" ? PACK_VALUE : undefined,
      foot: bareSite(facts.website),
      eyebrow: "Free with every JOVE Day",
      title: val(v, "title") || PACK_TITLE,
      // a Story has no caption, so the condition on drone shots is printed on the design itself
      items: mediaPack.items.map((i) => ({ title: i.title, text: /drone/i.test(i.title) ? "Where drone rules and the school allow" : val(v, "detail") === "delivery" ? i.delivery : undefined })),
      cta: (choice(PACK_CTAS, val(v, "cta")) ?? PACK_CTAS.book).pill,
    });
  },
  caption(v) {
    return caption({
      hook: "A robotics workshop that comes with a film crew.",
      body: [
        "Every school that books a JOVE Day receives the Media Pack, free:",
        ...mediaPack.items.map((i) => `· ${i.title}`),
        "Made by FrameMind AI Studio, our in-house studio. Drone shots depend on local rules and the school's permission.",
        val(v, "value") === "show" && `${PACK_VALUE}, included.`,
      ],
      cta: (choice(PACK_CTAS, val(v, "cta")) ?? PACK_CTAS.book).line,
      tags: hashtags("studio", "schools"),
    });
  },
};

/* ───────────────────────────── now booking ───────────────────────────── */

const BOOKING_LINE = "A full day of Robotics and AI on your campus. Tell us your dates and we will send a proposal.";

const nowBooking: TemplateDef = {
  id: "now-booking",
  name: "Now booking",
  group: "Promotion",
  blurb: "Bookings are open for a month or a term, with the price from the price list.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "when", label: "Month or term", kind: "text", placeholder: "January 2027", help: "Say only what is true. No “last few dates” unless it is so.", max: 24 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for the standard line", max: 120 },
  ],
  sample: { when: "the coming term", line: "" },
  draw(p, { values: v, facts }) {
    poster(p, {
      tag: "For schools · Bookings",
      foot: bareSite(facts.website),
      eyebrow: "JOVE Days",
      headline: `Now booking for ${val(v, "when") || "the coming term"}`,
      sub: val(v, "line") || BOOKING_LINE,
      facts: dayFacts,
      cta: "Book a JOVE Day",
      hero: p.wide ? { top: "Grades", main: "1–10", bottom: "One full day" } : null,
    });
  },
  caption(v) {
    return caption({
      hook: `Now booking JOVE Days for ${val(v, "when") || "the coming term"}.`,
      body: [val(v, "line") || "A full day of Robotics and AI for Grades 1 to 10, on your campus.", `${PRICE}. Minimum ${MINIMUM}.`, "Every kit, trainer and cable is ours. The film is on us."],
      cta: CTAS.book,
      tags: hashtags("schools", "robotics"),
    });
  },
};

/* ───────────────────────────── Virtual Lab ───────────────────────────── */

const labOf = (v: Values) => labs.find((l) => l.slug === val(v, "lab"));
/** the first sentence of a lab's summary, in plain punctuation */
const labLine = (summary: string) => (/^.*?[.?!](?=\s|$)/.exec(summary)?.[0] ?? summary).replace(/\s*—\s*/g, ", ");
const gradesOf = (grades: string) => grades.replace("–", " to ");

const virtualLab: TemplateDef = {
  id: "virtual-lab",
  name: "Try the free Virtual Lab",
  group: "Promotion",
  blurb: "One Virtual Lab: what you do in it, who it is for, and that it is free.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "lab", label: "Lab", kind: "select", options: [...labs.map((l) => ({ value: l.slug, label: l.title })), { value: "other", label: "Another lab (type it below)" }] },
    { key: "title", label: "Lab name (only for another lab)", kind: "text", placeholder: "Name of the lab", max: 28 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for the lab's own line", max: 120 },
    picture("picture", "Your screenshot of the lab (optional)", "Without one, the lab's drawing is used and labelled as an illustration."),
  ],
  sample: { lab: labs[0].slug, title: "", line: "" },
  stock: (v): Record<string, string> => {
    const lab = labOf(v);
    return lab?.image ? { picture: lab.image } : {};
  },
  draw(p, { values: v, pictures, facts }) {
    const lab = labOf(v);
    poster(p, {
      tag: "Learn with JOVE · Virtual Lab",
      index: lab?.topic,
      foot: `${bareSite(facts.website)}/labs`,
      eyebrow: "Free Virtual Lab",
      headline: lab?.title ?? (val(v, "title") || "Name of the lab"),
      sub: val(v, "line") || (lab ? labLine(lab.summary) : ""),
      picture: pictures.picture,
      facts: lab
        ? [
            { label: "For", value: gradesOf(lab.grades) },
            { label: "Time", value: `${lab.minutes} minutes` },
            { label: "Cost", value: "Free, no sign-up" },
          ]
        : [
            { label: "Where", value: "In your browser" },
            { label: "Cost", value: "Free, no sign-up" },
          ],
      cta: "Try it free",
    });
  },
  caption(v) {
    const lab = labOf(v);
    const title = lab?.title ?? (val(v, "title") || "[Lab name]");
    return caption({
      hook: sentence(val(v, "line") || (lab ? labLine(lab.summary) : `Try ${title} in your browser`)),
      body: [lab ? `${title} is a free Virtual Lab for ${gradesOf(lab.grades)}. It takes about ${lab.minutes} minutes.` : `${title} is a free Virtual Lab.`, "It runs in the browser, with no sign-up."],
      cta: CTAS.learn,
      tags: hashtags("robotics", "ai"),
    });
  },
};

/* ───────────────────────────── any event ───────────────────────────── */

const EVENTS: Record<string, { label: string; eyebrow: string }> = {
  demo: { label: "Demo day", eyebrow: "You are invited" },
  webinar: { label: "Webinar", eyebrow: "Join us online" },
  parents: { label: "Parents' session", eyebrow: "For parents" },
  stall: { label: "Stall at an exhibition", eyebrow: "Meet us at our stall" },
  open: { label: "Open day", eyebrow: "You are invited" },
  other: { label: "Another event", eyebrow: "Coming up" },
};

const eventPost: TemplateDef = {
  id: "event",
  name: "Event",
  group: "Announcements",
  blurb: "A demo day, a webinar, a parents' session or a stall: what, when and where.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "kind", label: "What kind of event?", kind: "select", options: Object.entries(EVENTS).map(([value, e]) => ({ value, label: e.label })) },
    { key: "title", label: "Name of the event", kind: "text", placeholder: "Robotics demo day", max: 40 },
    { key: "date", label: "Date", kind: "date" },
    { key: "time", label: "Time", kind: "text", placeholder: "10:00 am to 12:00 noon", max: 24 },
    { key: "place", label: "Place", kind: "text", placeholder: "Hall or stall number, city", help: "For a webinar, write where it runs: Zoom, YouTube Live.", max: 32 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "What people will see and do there", max: 120 },
    { key: "cta", label: "Button text (optional)", kind: "text", placeholder: "Register: link in bio", max: 28 },
  ],
  sample: { kind: "demo", title: "Your event's name", date: "2026-11-14", time: "10:00 am", place: "Venue, city", line: "One line about what people will see and do there.", cta: "Save the date" },
  draw(p, { values: v, facts }) {
    const kind = choice(EVENTS, val(v, "kind")) ?? EVENTS.other;
    const date = val(v, "date");
    poster(p, {
      tag: `JOVE · ${kind.label}`,
      index: dotDate(date),
      foot: bareSite(facts.website),
      eyebrow: kind.eyebrow,
      headline: val(v, "title") || "Name of the event",
      sub: val(v, "line"),
      hero: dateHero(date),
      facts: [
        { label: "Date", value: longDate(date) },
        { label: "Time", value: val(v, "time") },
        { label: "Where", value: val(v, "place") },
      ],
      cta: val(v, "cta") || undefined,
    });
  },
  caption(v) {
    const when = [longDate(val(v, "date")), val(v, "time")].filter(Boolean).join(", ");
    return caption({
      hook: `${val(v, "title") || "[Event]"}${when ? `: ${when}` : ""}.`,
      body: [val(v, "line"), val(v, "place") && `Where: ${val(v, "place")}.`],
      cta: sentence(val(v, "cta")) || CTAS.follow,
      tags: hashtags("robotics", "schools"),
    });
  },
};

/* ───────────────────────────── countdown ───────────────────────────── */

/** The number typed, or the days from today to the date when the box is left empty ("" when the date has passed). */
const daysToGo = (v: Values) => {
  if (val(v, "days")) return val(v, "days");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const n = daysBetween(today, val(v, "date"));
  return n !== null && n >= 0 ? String(n) : "";
};

const countdown: TemplateDef = {
  id: "countdown",
  name: "Countdown",
  group: "Announcements",
  blurb: "Days to go to a launch, a JOVE Day or an event.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "what", label: "To what?", kind: "text", placeholder: "Our first JOVE Day", max: 36 },
    { key: "date", label: "Its date", kind: "date" },
    { key: "days", label: "Days to go (leave empty to count from today)", kind: "text", placeholder: "Counted from today", help: "Left empty, the design counts from today to the date above: download it on the day you post. Type a number only for a post you are making ahead.", max: 3 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, max: 90 },
  ],
  sample: { days: "", what: "National Science Day", date: "2027-02-28", line: "Pick one thing to build that day." },
  draw(p, { values: v, facts }) {
    const days = daysToGo(v) || "00";
    figure(p, {
      tag: "Countdown",
      index: dotDate(val(v, "date")),
      foot: bareSite(facts.website),
      figure: days,
      unit: Number(days) === 1 ? "Day to go" : "Days to go",
      label: val(v, "what") || "What is coming",
      // the date on a line of its own, so the sentence after it is never broken in an odd place
      sub: [longDate(val(v, "date")), val(v, "line")].filter(Boolean).join("\n"),
    });
  },
  caption(v) {
    const days = daysToGo(v) || "[00]";
    return caption({
      hook: `${days} ${Number(days) === 1 ? "day" : "days"} to go: ${val(v, "what") || "[what is coming]"}.`,
      body: [val(v, "line"), longDate(val(v, "date")) && `${longDate(val(v, "date"))}.`],
      cta: CTAS.follow,
      tags: hashtags("robotics", "schools"),
    });
  },
};

/* ───────────────────────────── festival and special days ───────────────────────────── */

/** `on` is month-day. The lines are about building, curiosity and teachers: nothing political or religious. */
const FESTIVALS: Record<string, { label: string; on: string; headline: string; message: string; hashtag: string }> = {
  children: { label: "Children's Day (14 Nov)", on: "11-14", headline: "Happy Children's Day", message: "To every child who asks how it works, and then builds one to find out.", hashtag: "#ChildrensDay" },
  teachers: { label: "Teachers' Day (5 Sep)", on: "09-05", headline: "Happy Teachers' Day", message: "Thank you to the teachers who let us take things apart, and helped us put them back together.", hashtag: "#TeachersDay" },
  science: { label: "National Science Day (28 Feb)", on: "02-28", headline: "National Science Day", message: "Ask a question. Build a test. See what happens. That is science, and it starts in school.", hashtag: "#NationalScienceDay" },
  engineers: { label: "Engineers' Day (15 Sep)", on: "09-15", headline: "Happy Engineers' Day", message: "Every robot starts as a drawing. Here is to the people who draw it, build it, test it and fix it.", hashtag: "#EngineersDay" },
  rajyotsava: { label: "Kannada Rajyotsava (1 Nov)", on: "11-01", headline: "Kannada Rajyotsava", message: "Greetings from our home state. We are proud to build in Karnataka, for its classrooms.", hashtag: "#KannadaRajyotsava" },
  republic: { label: "Republic Day (26 Jan)", on: "01-26", headline: "Happy Republic Day", message: "Here is to the students who will design and build what comes next.", hashtag: "#RepublicDay" },
  independence: { label: "Independence Day (15 Aug)", on: "08-15", headline: "Happy Independence Day", message: "The freedom to ask, to try, to fail and to build again.", hashtag: "#IndependenceDay" },
  other: { label: "Another day (type it below)", on: "", headline: "", message: "", hashtag: "" },
};
const festivalOf = (v: Values) => choice(FESTIVALS, val(v, "day")) ?? FESTIVALS.children;

/** The figure in the circle and the note under it: "14" and "SAT · NOV 2026" (the year only when one is typed). */
function festivalDate(v: Values) {
  const day = festivalOf(v);
  const year = /^\d{4}$/.test(val(v, "year")) ? val(v, "year") : "";
  const hero = dateHero(day.on ? `${year || "2000"}-${day.on}` : val(v, "date"));
  if (!hero) return { main: "00", note: "Date" };
  return { main: hero.main, note: day.on && !year ? hero.bottom.split(" ")[0] : `${hero.top} · ${hero.bottom}` };
}

const festival: TemplateDef = {
  id: "festival",
  name: "Festival and special days",
  group: "Announcements",
  blurb: "A greeting for Children's Day, Teachers' Day, Science Day and others, in our own voice.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "day", label: "Which day?", kind: "select", options: Object.entries(FESTIVALS).map(([value, f]) => ({ value, label: f.label })) },
    { key: "year", label: "Year", kind: "text", placeholder: "2026", max: 4 },
    { key: "name", label: "Name of the day (only for another day)", kind: "text", placeholder: "World Environment Day", max: 30 },
    { key: "date", label: "Its date (only for another day)", kind: "date" },
    { key: "message", label: "Message (optional)", kind: "textarea", rows: 3, placeholder: "Leave empty for our standard line for the day", help: "Keep it about building, curiosity and teachers. Nothing political or religious. A Kannada line needs a native speaker's review first.", max: 110 },
  ],
  sample: { day: "children", year: "2026", name: "", date: "", message: "" },
  draw(p, { values: v, facts }) {
    const day = festivalOf(v);
    const when = festivalDate(v);
    figure(p, {
      tag: "From all of us at JOVE",
      foot: bareSite(facts.website),
      figure: when.main,
      unit: when.note,
      label: day.headline || val(v, "name") || "Name of the day",
      sub: val(v, "message") || day.message,
    });
  },
  caption(v) {
    const day = festivalOf(v);
    const tags = hashtags("robotics", "schools");
    return caption({
      hook: sentence(day.headline || val(v, "name") || "[Name of the day]"),
      body: [val(v, "message") || day.message],
      cta: val(v, "day") === "children" || val(v, "day") === "science" ? CTAS.learn : CTAS.follow,
      tags: day.hashtag ? [...tags.slice(0, 2), day.hashtag, ...tags.slice(2, 7)] : tags,
    });
  },
};

/* ───────────────────────────── after a JOVE Day ───────────────────────────── */

/** "248 | Students" → a number with its label */
const countsOf = (v: Values) =>
  linesOf(v, "numbers")
    .map(splitLine)
    .filter((n) => n.title)
    .slice(0, 3);

const dayRecap: TemplateDef = {
  id: "day-recap",
  name: "JOVE Day recap",
  group: "Milestones",
  blurb: "After a JOVE Day: the school, the date and up to three real numbers.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite", "photo"],
  fields: [
    { key: "school", label: "School", kind: "text", placeholder: "School name, as the school writes it", help: "Name a school only after it has approved the post.", max: 48 },
    { key: "date", label: "Date of the JOVE Day", kind: "date" },
    { key: "numbers", label: "Up to three numbers, one per line: the number, a | sign, what it counts", kind: "textarea", rows: 3, placeholder: "248 | Students", help: "Only real numbers, counted on the day. Leave a line out if you do not have the number.", max: 26 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "What the students built", max: 130 },
    picture("picture", "Photo of the day (optional)", `${CONSENT} With the Photo look it fills the frame.`),
  ],
  sample: { school: "Your school's name", date: "2026-11-14", numbers: "000 | Students\n00 | Projects built\n00 | Grades", line: "A full day of building, testing and showing what was built." },
  draw(p, { values: v, pictures }) {
    const date = val(v, "date");
    const school = val(v, "school") || "School name";
    const counts = countsOf(v);
    const base = { tag: "JOVE Day · Recap", index: dotDate(date), foot: "Film by FrameMind AI Studio" };
    if (p.tone === "photo") {
      photo(p, { ...base, headline: school, sub: val(v, "line"), chips: counts.map((n) => `${n.title} ${n.text}`.trim()), picture: pictures.picture });
      return;
    }
    const pic = pictures.picture;
    const square = !p.portrait && !p.wide;
    const asFact = (n: { title: string; text: string }): Fact => ({ label: n.text || "Count", value: n.title });
    // Without a photo the first number sits in the circle (when it is short enough to fit there) and the date
    // joins the row below. Otherwise the circle shows the date and the row holds the numbers.
    const [first, ...rest] = counts;
    const lead = !pic && first && first.title.length <= 6 && first.text.length <= 12 ? first : null;
    poster(p, {
      ...base,
      eyebrow: "A JOVE Day at",
      headline: school,
      // a square sheet keeps its room for the school's name
      sub: square && pic ? "" : val(v, "line"),
      hero: lead ? { main: lead.title, bottom: lead.text } : dateHero(date),
      picture: pic,
      facts: lead || !counts.length ? [{ label: "Date", value: longDate(date) }, ...rest.map(asFact)] : counts.map(asFact),
      cta: square ? undefined : "Book a JOVE Day",
    });
  },
  caption(v) {
    const school = val(v, "school") || "[School]";
    const when = shortDate(val(v, "date"));
    return caption({
      hook: `A full day of building at ${school}${when ? `, ${when}` : ""}.`,
      body: [val(v, "line"), countsOf(v).map((n) => `${n.title} ${n.text.toLowerCase()}`.trim()).join(" · ")],
      credit: true,
      cta: CTAS.book,
      tags: hashtags("robotics", "schools", "studio"),
    });
  },
};

/* ───────────────────────────── series cover ───────────────────────────── */

/** "3" → "03", as an episode number is written on a cover */
const episodeOf = (v: Values) => {
  const n = val(v, "episode");
  return /^\d$/.test(n) ? `0${n}` : n;
};

const seriesCover: TemplateDef = {
  id: "series-cover",
  name: "Series cover",
  group: "Video",
  blurb: "The cover of one episode in a series: the same look every time, only the number and title change.",
  formats: ["wide", "story", "post", "square"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "series", label: "Name of the series", kind: "text", placeholder: "Build with JOVE", max: 26 },
    { key: "episode", label: "Episode number", kind: "text", placeholder: "03", max: 3 },
    { key: "title", label: "Title of the episode (two words on YouTube, up to six on a Reel cover)", kind: "text", placeholder: "The line follower", max: 30 },
    picture("picture", "Frame from the episode (optional)", `With a picture, it fills the cover and the words sit on it. Without one, the number sits in the circle. ${CONSENT}`),
  ],
  sample: { series: "Build with JOVE", episode: "01", title: "First circuit" },
  draw(p, { values: v, pictures, facts }) {
    const series = val(v, "series") || "Name of the series";
    const episode = episodeOf(v);
    const title = val(v, "title") || "Title of the episode";
    if (pictures.picture) {
      thumb(p, { words: title, series, badge: episode ? `EP ${episode}` : "", picture: pictures.picture });
      return;
    }
    figure(p, { tag: "JOVE · Video series", index: episode ? `EP ${episode}` : undefined, foot: bareSite(facts.website), figure: episode || "00", unit: "Episode", label: title, sub: series });
  },
  caption(v) {
    const episode = episodeOf(v);
    return caption({
      hook: sentence(val(v, "title") || "[Title of the episode]"),
      body: [`${val(v, "series") || "[Series]"}${episode ? `, episode ${episode}` : ""}.`],
      cta: WATCH,
      tags: hashtags("studio", "robotics"),
    });
  },
};

/* ───────────────────────────── the founders' own posts ───────────────────────────── */

const FOUNDERS = site.founders;
const founderOf = (v: Values) => FOUNDERS.find((f) => f.id === val(v, "who")) ?? FOUNDERS[0];
const firstName = (name: string) => name.split(" ")[0];
const WHO: FieldSpec = { key: "who", label: "Whose post is it?", kind: "select", options: FOUNDERS.map((f) => ({ value: f.id, label: `${f.name} (${f.role})` })) };
const OWN_WORDS = "Your own words, in the first person. Plans are written as plans, and no number is rounded up.";

const founderNote: TemplateDef = {
  id: "founder-note",
  name: "Founder's note",
  group: "Founders",
  blurb: "A short note in your own voice for your personal profile. LinkedIn first.",
  formats: ["post", "square", "wide"],
  tones: ["paper", "graphite", "photo"],
  fields: [
    WHO,
    { key: "headline", label: "Headline (up to 8 words)", kind: "text", placeholder: "Why we film every workshop", max: 46 },
    { key: "lines", label: "Two or three short lines", kind: "textarea", rows: 4, help: `${OWN_WORDS} The full note goes in the caption.`, max: 70 },
    picture("portrait", "Your photo (optional)", "With the Photo look it fills the frame, which suits a portrait. On Paper and Graphite it sits in a wide box: use Up · down to keep your face in view."),
  ],
  sample: {
    who: FOUNDERS[0].id,
    headline: "The Robotics day we wish our school had",
    lines: "Real kits, real code and a real film crew.\nWe are new, and we will show our work as we go.",
  },
  draw(p, { values: v, pictures, facts }) {
    const who = founderOf(v);
    const base = { tag: "Founders and craft", foot: bareSite(facts.website) };
    const headline = val(v, "headline") || "Headline";
    const lines = linesOf(v, "lines").join(" ");
    const role = `${who.role}, JOVE`;
    if (p.tone === "photo") {
      photo(p, { ...base, headline, sub: lines, chips: [who.name, role], picture: pictures.portrait });
      return;
    }
    poster(p, {
      ...base,
      eyebrow: `A note from ${firstName(who.name)}`,
      headline,
      // a square sheet with a photo on it has room for the headline only: the lines stay in the caption
      sub: pictures.portrait && !p.portrait && !p.wide ? "" : lines,
      picture: pictures.portrait,
      // the founder's initials in the circle, where a wide sheet would otherwise be empty
      hero: p.wide ? { main: who.initials } : null,
      facts: [{ label: role, value: who.name }],
    });
  },
  caption(v) {
    return caption({
      hook: sentence(val(v, "headline") || "[Headline]"),
      body: [...linesOf(v, "lines"), "I am building JOVE: full-day Robotics and AI workshops for schools, filmed by our own studio."],
      cta: CTAS.follow,
      tags: hashtags("founders", "robotics"),
    });
  },
};

const COUNT_WORDS = ["", "One thing", "Two things", "Three things", "Four things", "Five things"];
const logPoints = (v: Values) => linesOf(v, "points").map(splitLine).slice(0, 5);

const buildLog: TemplateDef = {
  id: "build-log",
  name: "Build log",
  group: "Founders",
  blurb: "“What I learned this week”: a title and three to five points, signed with your name.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    WHO,
    { key: "title", label: "Title", kind: "text", placeholder: "What I learned this week", max: 36 },
    { key: "points", label: "Three to five points, one per line. Add a line about it after a | sign.", kind: "textarea", rows: 5, placeholder: "The point | A line about it", help: `${OWN_WORDS} Square and Wide show the first four points.`, max: 86 },
    { key: "date", label: "Week of (optional)", kind: "date" },
  ],
  sample: {
    who: FOUNDERS[0].id,
    title: "What I learned this week",
    points: "One thing that worked | Say what you tried and what happened.\nOne thing that broke | Be honest about it. That is the point.\nOne thing to try next | A plan, written as a plan.",
    date: "",
  },
  draw(p, { values: v }) {
    const who = founderOf(v);
    list(p, { tag: "Build log", index: dotDate(val(v, "date")), foot: who.name, eyebrow: `${who.role}, JOVE`, title: val(v, "title") || "What I learned this week", items: logPoints(v) });
  },
  caption(v) {
    const items = logPoints(v);
    return caption({
      hook: `${sentence(val(v, "title") || "What I learned this week")}${COUNT_WORDS[items.length] ? ` ${COUNT_WORDS[items.length]} from building JOVE.` : ""}`,
      body: items.map((i, n) => `${n + 1}. ${i.title}${i.text ? `: ${i.text}` : ""}`),
      cta: CTAS.follow,
      tags: hashtags("founders", "robotics"),
    });
  },
};

export const MORE_TEMPLATES: TemplateDef[] = [promoJoveDay, mediaPackPost, nowBooking, virtualLab, eventPost, countdown, festival, dayRecap, seriesCover, founderNote, buildLog];
