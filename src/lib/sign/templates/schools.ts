/**
 * What a school signs for a workshop: the service agreement with its three schedules, the booking confirmation, the
 * filming and venue permission, the school's confirmation of parent consent, the completion certificate signed at the
 * end of the day, the Media Pack receipt and the testimonial release. (The drone permission letter is in drone.ts.)
 *
 * The wording follows the Operations Library:
 *   service agreement       18_LEGAL_CONSENT/02, clause by clause, with the same clause numbers; Schedule C is 18_LEGAL_CONSENT/06
 *   booking confirmation    03_SOP/05 section 3, with the cancellation terms of 18_LEGAL_CONSENT/06
 *   filming and venue       26_TEMPLATES/03 letter 4 and 03_SOP/13 section 5
 *   consent confirmation    18_LEGAL_CONSENT/02 clauses 8.1 and 9.1, 18_LEGAL_CONSENT/01, 03_SOP/06 and 03_SOP/13
 *   completion certificate  03_SOP/08
 *   Media Pack receipt      03_SOP/09 and 18_LEGAL_CONSENT/02 clause 8
 *   testimonial release     14_TESTIMONIALS/01
 * Prices, the minimum, the advance, the balance days, the capacity and the Media Pack items are read from the price book
 * (src/lib/content/business.ts) and are never typed here. Where the library leaves a point open there is a box, and the
 * open point is in the template's "lawyer" list.
 */
import { clubRules, gradeBands, joveDayRules, mediaPack, type GradeBandId } from "@/lib/content/business";
import { addressee, b, companyIntro, dateOf, docDate, fill, inr, jove, joveSign, line, listAnd, money, num, or, partySign, plain, signedBy, val } from "../text";
import type { Block, DocContext, SignBlock, SignField, SignTemplate } from "../types";

/* ───────────────────────────── shared pieces ───────────────────────────── */

/** Text from the price book made fit for paper: "3–4" reads "3 to 4", "&" reads "and", and the brand is the one in Settings. */
const paper = (text: string, J = "JOVE") =>
  text
    .replace(/(\d)\s*–\s*(\d)/g, "$1 to $2")
    .replace(/\s*[—–]\s*/g, ": ")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s\+\s/g, " and ")
    .replace(/\bJOVE\b/g, J);

/** What was typed in a box without the full stop some people end with, or a line to write on. */
const tidy = (ctx: DocContext, key: string, mm = 60) => val(ctx, key).replace(/[\s.;,:]+$/, "") || line(mm);

/** A box filled in one point per line, as the points. */
const points = (ctx: DocContext, key: string) =>
  val(ctx, key)
    .split("\n")
    .map((s) => s.trim().replace(/[\s.;,]+$/, ""))
    .filter(Boolean);

const flat = (text: string) => text.replace(/\s*\n\s*/g, ", ");
const count = (n: number) => Math.round(n).toLocaleString("en-IN");
/** The first letter as a capital, for words from a box that open a sentence or a table cell. */
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "07:30" as "7:30 am"; anything else as it was typed; a line to write on when the box is empty. */
function clock(ctx: DocContext, key: string, mm = 20) {
  const raw = val(ctx, key);
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!m) return raw || line(mm);
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "am" : "pm"}`;
}

/** The school as an agreement names it: the name, where it is, and who signs for it. */
function schoolIntro(ctx: DocContext) {
  const p = ctx.party;
  const signer = p.person ? `${p.person}${p.role ? `, ${p.role}` : ""}` : line(60);
  return `${b(or(p.name, 60))}, of ${or(flat(p.address) || p.city, 80)}, represented by ${signer}`;
}

/** The school's name in a sentence, or a line to write it on. */
const schoolName = (ctx: DocContext) => b(or(ctx.party.name, 70));

/** The school's signature: who signs for it, a line for the designation when HQ does not have one, and the seal. */
function schoolSign(ctx: DocContext, heading = "For the School"): SignBlock {
  const p = ctx.party;
  return partySign(ctx, heading, { seal: true, lines: p.person && !p.role ? ["Designation", "Date"] : ["Date"] });
}

/** GST as every school paper words it (no full stop: the caller ends the sentence). */
const gstLine = (ctx: DocContext) => (ctx.company.gstin ? "GST at the rate in force is added on the invoice" : `GST is added at the rate in force once ${jove(ctx)} is registered for GST`);

/** "a tax invoice" once the company is registered for GST, "an invoice" until then. */
const invoiceWord = (ctx: DocContext) => (ctx.company.gstin ? "a tax invoice" : "an invoice");

/* the four programmes, in the words of the library's agreement (clause 1.1) */
const PROGRAMMES = [
  { id: "jove-day", name: "Day", what: "one full day" },
  { id: "jove-quarter", name: "Quarter", what: "3 days over 3 months" },
  { id: "jove-year", name: "Year", what: "8 sessions" },
  { id: "jove-club", name: "Club", what: `monthly, minimum ${clubRules.minimumStudents} students` },
];

/** The programme chosen in the box, or null when none is: the paper then has the four to tick. */
function programmeOf(ctx: DocContext): { id: string; title: string; what: string } | null {
  const raw = val(ctx, "programme");
  if (!raw) return null;
  const known = PROGRAMMES.find((p) => p.id === raw);
  if (known) return { id: raw, title: `${jove(ctx)} ${known.name}`, what: known.what };
  return { id: raw, title: raw === "custom" ? "A programme made for the School" : raw, what: "" };
}

/* the grade groups of the price book, each with its boxes: students expected, price per student, students who attended */
const BAND_KEYS: Record<GradeBandId, { n: string; p: string; a: string; field: string }> = {
  "g1-2": { n: "g12", p: "p12", a: "a12", field: "studentsG12" },
  "g3-5": { n: "g35", p: "p35", a: "a35", field: "studentsG35" },
  "g6-8": { n: "g68", p: "p68", a: "a68", field: "studentsG68" },
  "g9-10": { n: "g910", p: "p910", a: "a910", field: "studentsG910" },
};
const BANDS = gradeBands.map((band) => ({ band, grades: paper(band.grades), label: `${paper(band.grades)}: ${band.name}`, ...BAND_KEYS[band.id] }));

/* boxes that several papers share */
const PROGRAMME: SignField = { key: "programme", label: "Programme", kind: "select", from: "workshop.package|proposal.packageId", default: "jove-day", half: true, options: PROGRAMMES.map((p) => ({ value: p.id, label: `JOVE ${p.name}` })) };
const DAY: SignField = { key: "day", label: "Workshop date", kind: "date", from: "workshop.date", required: true, half: true };
const STUDENTS: SignField[] = BANDS.map((x) => ({ key: x.n, label: `Students, ${x.grades}`, kind: "number", from: `workshop.${x.field}|proposal.${x.field}|school.${x.field}`, half: true }));
const PRICES: SignField[] = BANDS.map((x) => ({ key: x.p, label: `Price per student, ${x.grades} (before GST)`, kind: "money", default: String(x.band.pricePerStudent), half: true, help: "The JOVE Day price from the price book. For a Quarter, Year or Club, type the price agreed in the proposal." }));
const DISCOUNT: SignField = { key: "discount", label: "Discount (%, optional)", kind: "number", from: "proposal.discountPercent", half: true };
const TOTAL: SignField = { key: "total", label: "Agreed total before GST (optional)", kind: "money", from: "workshop.agreedAmount|proposal.total", half: true, help: "Left empty, the paper shows the sum that the students and prices give." };
const PROPOSAL_NO: SignField = { key: "proposalNo", label: "Proposal number (optional)", kind: "text", from: "proposal.number", half: true };
const PROPOSAL_DATE: SignField = { key: "proposalDate", label: "Proposal date (optional)", kind: "date", from: "proposal.date", half: true };
const CANCELLATION: SignField[] = [
  { key: "adminPercent", label: "Cancelled more than 21 days before: charge kept (%)", kind: "number", default: "5", half: true, help: "The figure proposed in the Workshop Terms. Your advocate confirms it." },
  { key: "keepPercent", label: "Cancelled 8 to 21 days before: advance kept (%)", kind: "number", default: "50", half: true, help: "The figure proposed in the Workshop Terms. Your advocate confirms it." },
  { key: "rescheduleFee", label: "Fee to change the date with under 14 days' notice", kind: "money", default: "5000", half: true, help: "The figure proposed in the Workshop Terms. Keep it the same on the booking confirmation and the agreement." },
];

/**
 * The fee table: one row for each grade group, the total, the minimum billing when the sum falls below it, the discount,
 * and the agreed total. A number that is not known prints as a line to write on.
 */
function feeTable(ctx: DocContext, o: { floor: boolean; extras: boolean }): { rows: string[][]; total: number | null } {
  const counts = BANDS.map((x) => num(ctx, x.n));
  const some = counts.some((n) => n !== null);
  const rows: string[][] = [];
  let students: number | null = 0;
  let sum: number | null = 0;
  for (let i = 0; i < BANDS.length; i++) {
    const x = BANDS[i];
    // a group left empty beside groups that are filled in has no students; with nothing filled in, every number is a line
    const n = counts[i] ?? (some && !ctx.blank ? 0 : null);
    const price = num(ctx, x.p);
    const amount = n === 0 ? 0 : n !== null && price !== null ? n * price : null;
    students = students === null || n === null ? null : students + n;
    sum = sum === null || amount === null ? null : sum + amount;
    rows.push([x.label, n === null ? line(14) : count(n), price === null ? `₹ ${line(14)}` : inr(price), amount === null ? `₹ ${line(20)}` : inr(amount)]);
  }
  rows.push(["Total", students === null ? line(14) : count(students), "", sum === null ? `₹ ${line(20)}` : inr(sum)]);

  const minimum = joveDayRules.minimumBilling;
  const floored = o.floor && sum !== null && sum > 0 && sum < minimum;
  if (floored) rows.push([`Minimum billing for a ${jove(ctx)} Day`, "", "", inr(minimum)]);
  const fee = sum === null ? null : floored ? minimum : sum;

  const percent = Math.min(100, Math.max(0, num(ctx, "discount") ?? 0));
  const less = fee !== null && percent > 0 ? Math.round((fee * percent) / 100) : null;
  if (percent > 0 || ctx.blank) rows.push([`Discount of ${fill(ctx, "discount", 10)}%`, "", "", less === null ? `less ₹ ${line(20)}` : `less ${inr(less)}`]);
  const net = fee === null ? null : fee - (less ?? 0);

  // the amount typed as agreed wins; add-ons written in words cannot be added up, so the total is then written by hand
  const total = num(ctx, "total") ?? (o.extras ? null : net);
  rows.push([b("Agreed total before GST"), "", "", b(total === null ? `₹ ${line(24)}` : inr(total))]);
  return { rows, total };
}

/** "50% of the agreed total, that is ₹43,250, plus GST" (no full stop). */
function advanceOf(ctx: DocContext, total: number | null) {
  const share = joveDayRules.advancePercent;
  return `${share}% of the agreed total${total === null ? "" : `, that is ${inr(Math.round((total * share) / 100))}`}${ctx.company.gstin ? ", plus GST" : ""}`;
}

/** The minimum for a JOVE Day, in the library's words (no full stop). */
const minimumLine = (ctx: DocContext) => `each ${jove(ctx)} Day is billed for at least ${count(joveDayRules.minimumStudents)} students or ${inr(joveDayRules.minimumBilling)} before GST, whichever is higher`;

/** Days to move a date after an event outside anyone's control: one box, the same on the agreement and the booking confirmation. */
const FM_DAYS: SignField = { key: "fmDays", label: "Days to move the date after an event outside anyone's control", kind: "number", default: "90", half: true };

/** Force majeure in the words of the Workshop Terms (18_LEGAL_CONSENT/06 section 6), no full stop at the end. */
const fmRule = (ctx: DocContext) =>
  `the date is moved within ${fill(ctx, "fmDays", 10)} days and the amounts paid are carried forward. If a new date is not possible, the amounts paid are refunded, less only the costs that ${jove(ctx)} has already paid to third parties and can document`;

/** What happens to the advance when the school cancels (18_LEGAL_CONSENT/06 section 3), one row for each period of notice. */
const cancellationRows = (ctx: DocContext): string[][] => [
  ["More than 21 days", `Refunded within 14 days, less an administration charge of ${fill(ctx, "adminPercent", 10)}%`, "Or carried forward, free of charge, to a new date within 6 months"],
  ["8 to 21 days", `${fill(ctx, "keepPercent", 10)}% of the advance is kept`, "The rest is refunded or carried forward"],
  ["7 days or less, or on the day", "The advance is kept in full", `${jove(ctx)} may, at its discretion, credit it to a new date within 90 days`],
];

/** The same terms as whole sentences, for a letter, where there is no table head to lean on. */
const cancellationLines = (ctx: DocContext): string[] => [
  `More than 21 days before the date: the advance is refunded within 14 days, less an administration charge of ${fill(ctx, "adminPercent", 10)}%, or carried forward, free of charge, to a new date within 6 months.`,
  `8 to 21 days before the date: ${fill(ctx, "keepPercent", 10)}% of the advance is kept, and the rest is refunded or carried forward.`,
  `7 days or less before the date, or on the day: the advance is kept in full. ${jove(ctx)} may, at its discretion, credit it to a new date within 90 days.`,
];

/* ───────────────────────────── 1 · school service agreement ───────────────────────────── */

export const schoolServiceAgreement: SignTemplate = {
  id: "school-service-agreement",
  version: "1.0",
  title: "School Service Agreement",
  name: "Service agreement",
  group: "school",
  kind: "agreement",
  parties: ["school"],
  signs: "both",
  blurb: "The contract with a school for a workshop programme: scope, dates, fees and payment, safety, media and consent, data protection and liability, with the fee table, the Media Pack and the Workshop Terms and Cancellation Policy as its three schedules.",
  when: "Sent once the school says yes; signed with the advance, before the workshop",
  series: "SCH",
  source: "18_LEGAL_CONSENT/02_School_Service_Agreement.md",
  keep: "Contract term + 8 years",
  initials: true,
  requiredForSchools: true,
  lawyer: [
    "Stamp duty in Karnataka, and whether the Agreement should be on stamp paper. It is signed in two originals.",
    "Clause 11.2 limits liability to the fees for the affected workshop and clause 11.3 excludes indirect loss. Have both reviewed, above all for an injury to a child. The limit can be switched off in its box.",
    "Schedule C: the 5% charge, the 50% kept and the ₹5,000 reschedule fee are the library's proposed figures, not confirmed terms. An advance that is kept must be a fair estimate of loss and not a penalty (section 74 of the Indian Contract Act).",
    "Three years of confidentiality, 15 days to put a breach right, 90 days to move a date and 30 days of discussion are the draft's bracketed figures. Bengaluru is the draft's seat while the company is in Bagalkot. A court can usually be chosen only among courts that already have jurisdiction, such as where a party is or where the workshop is held, so the courts named in clause 14.2 may need to change; an arbitration seat can be chosen more freely. Confirm the seat and the courts.",
    "Late-payment interest: the library gives no rate. The sentence prints only when the box is filled.",
    "Insurance: the library says a public liability policy is still to be bought. The Agreement mentions insurance only when the box is filled.",
    "Clause 9.1 makes the School responsible for verifiable parental consent. Confirm this against the rules in force under the Digital Personal Data Protection Act, 2023.",
    "The minimum, '200 students or ₹70,000 before GST, whichever is higher', does not say at what price the missing students are billed when the grade groups are mixed. The fee table and HQ's invoices apply only the ₹70,000 floor. Decide one rule and word it the same way on every paper.",
    "Which number is billed: the library's agreement is silent, SOP-05 says the higher of the confirmed and the attended number, and the sales summary says confirmed enrolment. Clause 3.8 follows SOP-05. Settle one rule.",
    // only while the price book and the library's Workshop Terms (250) disagree
    ...(joveDayRules.maxStudentsPerDay !== 250 ? [`Most students in one day: the library's Workshop Terms and its proposal template say 250, while the price book and the website say ${joveDayRules.maxStudentsPerDay}. Schedule C prints the price book's figure. Bring the two in line.`] : []),
    "Holding back media: the library's Workshop Terms (section 9) deliver the media only after full payment, while the Agreement (clause 3.5) and the delivery SOP hold it back only when a payment is overdue, and send the reels at 5 working days although the balance is due at 7 days. The paper follows clause 3.5 everywhere, Schedule C included. Decide which rule applies.",
    "For a Quarter, Year or Club the library does not say how the fee is spread over the dates or what media is included. Write both in the add-ons box, or have a payment schedule added.",
    "Who owns the copyright in the films and photographs is not stated. The School and the company each get a right to use them (clause 8.3). Confirm.",
    "Check the School's legal name (the school, or its trust or society) and that the person signing is authorised: principal, correspondent or secretary.",
    "Clause 5.2 states that every trainer is background-verified. Make sure that is true of everyone on site before the Agreement is signed.",
  ],
  fields: [
    PROGRAMME,
    DAY,
    { key: "moreDates", label: "Further dates (Quarter, Year or Club)", kind: "text", placeholder: "12 December 2026 and 9 January 2027", help: "Only for a programme with more than one day." },
    ...STUDENTS,
    ...PRICES,
    DISCOUNT,
    TOTAL,
    { key: "addOns", label: "Add-ons agreed (optional)", kind: "textarea", placeholder: "One per line, with its price before GST. Left empty, the paper says there are none.", help: "Teacher training, take-home kits, social media management, films, lab setup. When you list add-ons, also fill in the agreed total." },
    PROPOSAL_NO,
    PROPOSAL_DATE,
    { key: "interest", label: "Interest on late payment (% each month, optional)", kind: "number", half: true, help: "Left empty, the Agreement charges no interest." },
    { key: "liabilityCap", label: "Limit on liability (clause 11.2)", kind: "select", default: "yes", half: true, options: [{ value: "yes", label: "Limited to the fees for the affected workshop" }, { value: "no", label: "No limit stated" }], help: "The draft's wording. Your advocate confirms it." },
    { key: "insurance", label: "Public liability insurance (optional)", kind: "text", placeholder: "Insurer, policy number and cover amount", help: "Left empty, the Agreement does not mention insurance." },
    { key: "confidentialYears", label: "Confidentiality lasts (years after the end)", kind: "number", default: "3", half: true },
    { key: "cureDays", label: "Days to put a breach right", kind: "number", default: "15", half: true },
    FM_DAYS,
    { key: "talkDays", label: "Days of discussion before arbitration", kind: "number", default: "30", half: true },
    { key: "seat", label: "Arbitration and courts at", kind: "text", default: "Bengaluru", half: true, help: "Your advocate confirms this choice." },
    { key: "noticeEmail", label: "School's email for notices", kind: "text", from: "school.email", half: true },
    ...CANCELLATION,
  ],
  build(ctx) {
    const J = jove(ctx);
    const c = ctx.company;
    const rules = joveDayRules;
    const prog = programmeOf(ctx);
    const more = val(ctx, "moreDates");
    const proposal = val(ctx, "proposalNo") || ctx.blank;
    const proposalRef = `no. ${fill(ctx, "proposalNo", 30)}${val(ctx, "proposalDate") || ctx.blank ? ` dated ${dateOf(ctx, "proposalDate")}` : ""}`;
    const interest = val(ctx, "interest") || ctx.blank;
    const insurance = tidy(ctx, "insurance");
    const addOns = points(ctx, "addOns");
    const fees = feeTable(ctx, { floor: prog?.id === "jove-day", extras: addOns.length > 0 });
    const dates = ctx.blank ? `Workshop date or dates: ${line(90)}` : `${more ? "Workshop dates" : "Workshop date"}: ${b(dateOf(ctx, "day"))}${more ? `; further dates: ${tidy(ctx, "moreDates")}` : ""}`;
    const schoolEmail = val(ctx, "noticeEmail") || ctx.party.email;

    const agreement: Block[] = [
      { t: "title", text: "School Service Agreement" },
      {
        t: "p",
        text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)}, represented by ${signedBy(ctx)} ("${b(J)}"), and ${schoolIntro(ctx)} (the "${b("School")}").`,
      },
      {
        t: "clause",
        title: "Scope of services",
        items: [
          `${J} will deliver on the School's campus ${prog ? `the following programme: ${b(prog.title)}${prog.what ? ` (${prog.what})` : ""}` : "the programme ticked in Schedule A"}.`,
          `The grade groups, the number of students and the agreed price per student are set out in Schedule A.${proposal ? ` Schedule A is taken from the proposal of ${J}, ${proposalRef}. Where the two differ, Schedule A applies.` : ""}`,
          "Add-ons, such as teacher training, take-home kits, social media management, films or a lab setup, apply only if they are listed in Schedule A.",
          `${J} provides the team, kits, tools, consumables, worksheets and certificates. With each ${J} Day, ${J} also supplies the Media Pack described in Schedule B at no extra charge, subject to clause 8.`,
        ],
      },
      {
        t: "clause",
        title: "Dates and schedule",
        items: [`${dates}. A typical day starts with the arrival of the team at about 7:30 am and follows the run sheet in the proposal.`, "A change of date is governed by clause 6 and by the Workshop Terms and Cancellation Policy in Schedule C."],
      },
      {
        t: "clause",
        title: "Fees, GST and payment",
        items: [
          "The fee is the number of students in each grade group multiplied by the price per student for that group, as stated in Schedule A. All prices are before GST.",
          `Minimum: ${minimumLine(ctx)}.`,
          `${gstLine(ctx)}.`,
          `Payment: an advance of ${rules.advancePercent}% on signing, which confirms the date, and the balance within ${rules.balanceDueDays} days of the workshop date, against ${invoiceWord(ctx)}.`,
          `Late payment: ${interest ? `interest of ${fill(ctx, "interest", 10)}% each month is charged on an overdue amount, after notice. ` : ""}${J} may hold back the highlight film and any media not yet delivered until the dues are cleared.`,
          "The fee does not include any local permission or fee that the School must obtain or pay.",
          "Final count: the School confirms the final number of students in each grade group, in writing, 7 days before the workshop.",
          `${J} bills the confirmed number or the number of students who attend, whichever is higher. A number below the minimum is billed at the minimum.`,
          "A larger number than Schedule A states is accepted as far as the capacity for one day and for one session, set out in Schedule C, allows.",
        ],
      },
      {
        t: "clause",
        title: "The School's responsibilities",
        items: [
          "The School will provide a hall or classrooms for each session, a projector or screen, enough power points and tables, a staff coordinator who is present throughout, drinking water, parking access, and class lists by grade.",
          `The School remains responsible for the supervision of its students at all times. The staff of ${J} lead the instruction.`,
          `The School will tell ${J} in advance of students with medical conditions, allergies or special needs.`,
        ],
      },
      {
        t: "clause",
        title: "Safety",
        items: [
          `All kits are low-voltage and child-safe. Hot tools, such as glue guns and soldering irons, are operated only by the staff of ${J}.`,
          `The trainers of ${J} are background-verified, trained on its safety SOP and bound by its Child Protection and Safeguarding Policy, which the School may inspect.`,
          `${J} may pause or stop an activity that it reasonably considers unsafe.`,
        ],
      },
      {
        t: "clause",
        title: "Cancellation and rescheduling",
        items: ["Cancellation and rescheduling follow the Workshop Terms and Cancellation Policy in Schedule C, including its rules on when the advance is kept and when it is refunded."],
      },
      {
        t: "clause",
        title: "Intellectual property",
        items: [
          `The curriculum, worksheets, designs, code, kit designs, brands and logos of ${J} remain the property of ${J}. The School receives a limited licence, which it cannot pass on, to use the handouts for its own students.`,
          `Students own what they build and learn. Workshop kits are reusable and stay with ${J} unless they are bought as take-home kits.`,
          "Neither party may use the name or logo of the other without written permission, other than as set out in clause 8.",
        ],
      },
      {
        t: "clause",
        title: "Media rights and consent",
        items: [
          `${J}, through FrameMind AI Studio, will photograph and film the workshop. The School will circulate the Photo, Video and Drone Consent Form of ${J} to parents before the workshop, and will return the signed forms, or a list of the students without consent, to ${J}.`,
          `${J} will not show a student without consent in a way in which the student can be identified, and will blur or leave out a student on the School's instruction.`,
          `The School may use all delivered media for its own marketing and admissions. ${J} may use the media for its portfolio, subject to consent, with the faces of students blurred on request.`,
          "Drone flights take place only with the School's written permission, given on the Drone Permission Letter, and within the law.",
        ],
      },
      {
        t: "clause",
        title: "Data protection",
        items: [
          `The School is the primary source of student data. The School is responsible for obtaining verifiable parental consent for the participation of its students and for the sharing of their personal data with ${J}, in line with the Digital Personal Data Protection Act, 2023 and the rules under it.`,
          `${J} will collect only what it needs (names, grades, attendance and certificates), keep it secure, use it only for the services, and delete or return it when it is no longer needed. ${J} will tell the School without undue delay of any personal data breach that affects its students.`,
          `${J} will not use the data of children for tracking, behavioural monitoring or targeted advertising.`,
        ],
      },
      {
        t: "clause",
        title: "Confidentiality",
        items: [
          `Each party will keep the business information of the other that is not public confidential, and will use it only for this Agreement, while the Agreement runs and for ${fill(ctx, "confidentialYears", 10)} years after it ends. This does not apply to information that is public, that was already known, or that the law requires to be disclosed.`,
        ],
      },
      {
        t: "clause",
        title: "Liability",
        items: [
          "Each party is responsible for its own acts and for its staff.",
          ...(val(ctx, "liabilityCap") === "no" ? [] : [`The total liability of ${J} under this Agreement is limited to the fees received for the affected workshop. This limit does not apply to a liability that the law does not allow to be limited.`]),
          "Neither party is liable to the other for indirect or consequential loss.",
          ...(val(ctx, "insurance") ? [`${J} holds public liability insurance: ${insurance}.`] : []),
        ],
      },
      {
        t: "clause",
        title: "Force majeure",
        items: [
          `Neither party is liable for a delay or a failure caused by an event beyond its reasonable control, such as a natural disaster, severe weather, an epidemic, a government order, a strike, a road closure or the closure of the School. The parties will agree a new date in good faith within ${fill(ctx, "fmDays", 10)} days, and the amounts already paid are carried to the new date. If a new date is not possible, the force majeure rule of Schedule C applies.`,
        ],
      },
      {
        t: "clause",
        title: "Term and termination",
        items: [
          `This Agreement runs until the services in Schedule A are delivered and paid for. Either party may end it if the other is in material breach and does not put the breach right within ${fill(ctx, "cureDays", 10)} days of written notice.`,
        ],
      },
      {
        t: "clause",
        title: "Dispute resolution and governing law",
        items: [
          `The parties first try to resolve a dispute by discussion between the Principal and a founder of ${J}. A dispute that is not resolved within ${fill(ctx, "talkDays", 10)} days goes to arbitration by a sole arbitrator under the Arbitration and Conciliation Act, 1996, seated at ${fill(ctx, "seat", 30)} and held in English.`,
          `This Agreement is governed by the laws of India. The courts at ${fill(ctx, "seat", 30)} have exclusive jurisdiction over matters outside the arbitration.`,
        ],
      },
      {
        t: "clause",
        title: "General",
        items: [
          "This Agreement, with its three Schedules, is the whole agreement between the parties on this subject.",
          "A change to it is made only in writing, signed by both parties.",
          `Notices are sent to the addresses above, or by email to ${J} at ${or(c.email, 50)} and to the School at ${or(schoolEmail, 50)}.`,
          "A clause that by its nature continues after this Agreement ends does so.",
        ],
      },
      { t: "p", text: "Signed by the parties in two originals, one for each party, on the date first written above." },
      { t: "sign", blocks: [...joveSign(ctx), schoolSign(ctx)] },
    ];

    const scheduleA: Block[] = [
      { t: "break" },
      { t: "h", text: "Schedule A: Programme and fees" },
      ...(prog ? [] : ([{ t: "p", text: "Programme (tick one):" }, { t: "checks", items: PROGRAMMES.map((p) => `${J} ${p.name} (${p.what})`) }] satisfies Block[])),
      {
        t: "table",
        widths: [24, 76],
        rows: [
          ...(prog ? [["Programme", `${prog.title}${prog.what ? ` (${prog.what})` : ""}`]] : []),
          [ctx.blank ? "Workshop date or dates" : more ? "Workshop dates" : "Workshop date", ctx.blank ? line(100) : `${dateOf(ctx, "day")}${more ? `; further dates: ${tidy(ctx, "moreDates")}` : ""}`],
          ...(proposal ? [["Proposal", `Proposal ${proposalRef}`]] : []),
        ],
      },
      { t: "table", head: ["Grade group", "Students", "Price per student", "Amount"], widths: [40, 18, 20, 22], rows: fees.rows },
      {
        t: "p",
        text: `All amounts are before GST.${prog ? "" : ` The prices shown are those of a ${J} Day: for another programme, the price agreed in the proposal is written in their place.`} The agreed total is for the numbers of students above. The final bill follows the final count, as clause 3 sets out.`,
      },
      {
        t: "table",
        widths: [24, 76],
        rows: [
          ...(!prog || prog.id === "jove-day" || prog.id === "jove-quarter" ? [["Minimum", `${minimumLine(ctx).replace(/^each/, "Each")}.`]] : []),
          ["GST", `${gstLine(ctx)}.`],
          ["Advance", `${advanceOf(ctx, fees.total)}, on signing.`],
          ["Balance", `The rest of the final bill, within ${rules.balanceDueDays} days of the workshop date, against ${invoiceWord(ctx)}.`],
          ["Add-ons", addOns.length ? addOns.join("\n") : ctx.blank ? `${line(120)}\n${line(120)}` : "None."],
        ],
      },
    ];

    const scheduleB: Block[] = [
      { t: "break" },
      { t: "h", text: "Schedule B: The Media Pack" },
      { t: "p", text: `The ${J} Media Pack is made by FrameMind AI Studio, the in-house film studio of ${J}. It is included at no extra charge with each ${J} Day.` },
      { t: "table", head: ["Item", "What it is", "Delivered"], widths: [24, 50, 26], rows: mediaPack.items.map((m) => [paper(m.title, J), paper(m.detail, J), paper(m.delivery, J)]) },
      {
        t: "list",
        items: [
          "Delivery times are counted in working days from the workshop date. The media is delivered through a private shared link.",
          `Drone aerial shots are taken only with the School's written permission, within the Drone Rules, 2021 and any local restriction, and in safe weather. If the drone is not flown, the film is delivered without aerial shots and the rest of the Media Pack is not reduced. ${J} does not put stock footage in their place.`,
          "The principal testimonial clip is recorded only if the Principal agrees, and the Principal approves the cut before it is used.",
          "The use of the media is governed by clause 8. A student without parental consent does not appear in a way in which the student can be identified.",
          `${J} may hold back media while a payment is overdue, as clause 3.5 sets out.`,
        ],
      },
    ];

    const scheduleC: Block[] = [
      { t: "break" },
      { t: "h", text: "Schedule C: Workshop Terms and Cancellation Policy" },
      { t: "p", text: `${b("1. Booking.")} A date is held when ${J} receives this Agreement signed by the School and the ${rules.advancePercent}% advance. The balance is due within ${rules.balanceDueDays} days of the workshop date, against ${invoiceWord(ctx)}.` },
      {
        t: "p",
        text: `${b("2. Minimums and capacity.")} For a ${J} Day the minimum is ${count(rules.minimumStudents)} students or ${inr(rules.minimumBilling)} of billing before GST, whichever is higher. At most ${count(rules.maxStudentsPerDay)} students take part in one day. One session takes up to ${listAnd(BANDS.map((x) => `${count(x.band.maxPerSession)} students of ${x.grades}`))}. The final number of students is due 7 days before the workshop. A number below the minimum is billed at the minimum.`,
      },
      { t: "p", text: `${b("3. Cancellation by the School.")} What happens to the advance depends on how long before the workshop date the School cancels.` },
      { t: "table", head: ["Notice before the workshop date", "The advance paid", "Also"], widths: [26, 37, 37], rows: cancellationRows(ctx) },
      {
        t: "p",
        text: `${b("4. Change of date by the School.")} One free change of date with 14 or more days' notice, subject to the availability of ${J}. With less than 14 days' notice, a reschedule fee of ${money(ctx, "rescheduleFee")} applies, to cover the vehicle, crew and venue commitments already made. A further change of date counts as a cancellation.`,
      },
      { t: "p", text: `${b(`5. Cancellation or change of date by ${J}.`)} If ${J} must cancel for a reason within its control, the School may choose a new date, or a full refund of all amounts paid, made within 14 days. ${J} is not liable for the indirect costs of the School.` },
      {
        t: "p",
        text: `${b("6. Force majeure.")} Events beyond reasonable control, such as severe weather, floods, government or school-closure orders, epidemics, strikes, road blockades, or a serious accident or illness in the team, do not make either party liable. ${cap(fmRule(ctx))}.`,
      },
      {
        t: "p",
        text: `${b("7. Weather and changes on the day.")} Indoor sessions go ahead in rain. Drone flights are cancelled in unsafe weather. The film is still delivered, without the aerial shots, and the Media Pack is not otherwise reduced. Short delays caused by the School, such as a late hall or a power cut, may shorten some sessions. No refund applies where the core programme is delivered.`,
      },
      { t: "p", text: `${b("8. What the School provides.")} A hall or classrooms, a projector or screen, power points, tables, a staff coordinator, water, parking access, and the signed media consent forms, as clauses 4 and 8 of the Agreement set out.` },
      { t: "p", text: `${b("9. Media and certificates.")} Certificates are handed out on the day. The Media Pack is delivered through a shared link within the times in Schedule B. ${J} may hold back media while a payment is overdue, as clause 3.5 of the Agreement sets out.` },
      { t: "p", text: `${b("10. Complaints.")} The School raises any issue with the ${J} team on the day, or in writing to ${or(c.email, 50)} within 7 days of the workshop. ${J} responds within 3 working days.` },
      { t: "p", text: `${b("11. Changes to this policy.")} A change to this policy applies to bookings made after the change. The version in this Schedule applies to this booking.` },
    ];

    return [...agreement, ...scheduleA, ...scheduleB, ...scheduleC];
  },
  cover(ctx) {
    const J = jove(ctx);
    const day = val(ctx, "day") ? ` on ${dateOf(ctx, "day")}` : "";
    return plain(
      `Respected Sir / Madam, thank you for choosing ${J} for the workshop${day}. Attached is the School Service Agreement, with the fees, the Media Pack and the Workshop Terms as its three schedules. Kindly read it, sign and seal the signature page, initial the other pages and send us a scan. It is signed in two originals, so that the School and ${J} each keep one.`,
    );
  },
};

/* ───────────────────────────── 2 · booking confirmation ───────────────────────────── */

export const bookingConfirmation: SignTemplate = {
  id: "booking-confirmation",
  version: "1.0",
  title: "Booking Confirmation",
  name: "Booking confirmation",
  group: "school",
  kind: "letter",
  parties: ["school"],
  signs: "both",
  blurb: "The written confirmation sent when a school says yes: the date and timings, the student numbers and prices, the advance and balance, what the school provides, the Media Pack, and the terms for a change of date or a cancellation.",
  when: "Within a day of the school's yes, with the advance invoice",
  series: "SCH",
  source: "03_SOP/05_Booking_Confirmation_and_Contracting_SOP.md",
  keep: "Contract term + 8 years",
  requiredForSchools: true,
  lawyer: [
    "The cancellation figures (5% charge, 50% kept, ₹5,000 reschedule fee) and the 90 days to move a date after an event outside anyone's control are the library's proposed terms, not confirmed ones. Keep the boxes the same here and in the School Service Agreement.",
    "SOP-05 section 4 has older and different cancellation terms: the whole advance kept on any cancellation, costs billed at actuals for a late change of date, and a new date within 30 days if the company cancels. This letter follows the Workshop Terms and Cancellation Policy instead. Bring the SOP in line.",
    "The school signs this letter and, later, the Service Agreement for the same booking. The letter says the signed Agreement applies where the two differ. Confirm that order.",
    "SOP-05 says the date is locked by this letter and the advance. The Workshop Terms say it is held on the signed Agreement and the advance. The letter says the advance locks the date. Settle one rule.",
    "SOP-05 asks every school for two halls and an assembly space, while the Agreement asks for a hall or classrooms for each session. Decide which is asked of every school.",
    "Releasing the date when the advance has not come within 5 working days is the SOP's internal rule. The letter now tells the school of it.",
    "The minimum ('200 students or ₹70,000, whichever is higher') is open in the same way as on the School Service Agreement: the table applies only the ₹70,000 floor.",
  ],
  fields: [
    PROGRAMME,
    DAY,
    { key: "reportTime", label: "The team reports at", kind: "text", from: "workshop.startTime", default: "07:30", half: true },
    { key: "endTime", label: "The day ends at about", kind: "text", default: "16:30", half: true },
    ...STUDENTS,
    ...PRICES,
    DISCOUNT,
    TOTAL,
    PROPOSAL_NO,
    PROPOSAL_DATE,
    ...CANCELLATION,
    FM_DAYS,
  ],
  build(ctx) {
    const J = jove(ctx);
    const p = ctx.party;
    const rules = joveDayRules;
    const prog = programmeOf(ctx);
    const day = dateOf(ctx, "day");
    const fees = feeTable(ctx, { floor: prog?.id === "jove-day", extras: false });
    const proposal = val(ctx, "proposalNo") || ctx.blank;
    const proposalRef = `no. ${fill(ctx, "proposalNo", 30)}${val(ctx, "proposalDate") || ctx.blank ? ` dated ${dateOf(ctx, "proposalDate")}` : ""}`;
    const venue = [or(p.name, 60), flat(p.address) || p.city].filter(Boolean).join(", ");
    const items = mediaPack.items;
    const media: string[][] = [];
    for (let i = 0; i < items.length; i += 2) media.push([paper(items[i].title, J), paper(items[i].delivery, J), items[i + 1] ? paper(items[i + 1].title, J) : "", items[i + 1] ? paper(items[i + 1].delivery, J) : ""]);
    return [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: `Confirmation of your booking: ${prog ? prog.title : `${J} workshop`} on ${day}` },
      { t: "p", text: "Respected Sir / Madam," },
      { t: "p", text: `Thank you for choosing ${J}. We are glad to confirm your booking${proposal ? `, as in our proposal ${proposalRef}` : ""}. We are holding the date for you. The details and the terms are set out below.` },
      {
        t: "table",
        widths: [20, 80],
        rows: [
          ["Programme", prog ? `${prog.title}${prog.what ? ` (${prog.what})` : ""}` : `${PROGRAMMES.slice(0, -1).map((x) => `${J} ${x.name}`).join(", ")} or ${J} ${PROGRAMMES[PROGRAMMES.length - 1].name} (circle one)`],
          ["Date", b(day)],
          ["Venue", venue],
          ["Timing", `The ${J} team reports at ${clock(ctx, "reportTime")}. The day ends at about ${clock(ctx, "endTime")}.`],
        ],
      },
      { t: "table", head: ["Grade group", "Students expected", "Price per student", "Amount"], widths: [40, 18, 20, 22], rows: fees.rows },
      {
        t: "table",
        widths: [20, 80],
        rows: [
          ["GST", `All prices are before GST.${prog ? "" : ` The prices shown are those of a ${J} Day: for another programme, the price agreed in the proposal is written in their place.`} ${gstLine(ctx)}.`],
          ["Minimum", `${minimumLine(ctx).replace(/^each/, "Each")}.`],
          ["Advance", `${advanceOf(ctx, fees.total)}, against our advance invoice. The date is locked when we receive it.`],
          ["Balance", `The rest of the final bill, within ${rules.balanceDueDays} days of the workshop date, against our invoice.`],
          ["Final count", "Kindly confirm the final number of students in each grade group, in writing, 7 days before the workshop. We bill the confirmed number or the number who attend, whichever is higher, and never less than the minimum."],
        ],
      },
      { t: "h", text: "What we need from the School" },
      { t: "p", text: "Two halls and an assembly space; power points, a projector and tables; drinking water; a staff liaison for the day; and one member of staff with each grade group." },
      { t: "h", text: `The Media Pack, at no extra charge with a ${J} Day` },
      { t: "table", head: ["Item", "Delivered", "Item", "Delivered"], widths: [27, 23, 27, 23], rows: media },
      {
        t: "p",
        text: `Delivery times are counted in working days from the workshop date. Your school may use all delivered media for its own marketing and admissions. ${J} may use the media for its portfolio, within the consent that parents give and with the faces of students blurred on request. Drone shots are taken only with your written permission, within the drone rules and in safe weather. If the drone is not flown, the film comes without aerial shots and nothing else in the Media Pack is reduced.`,
      },
      { t: "h", text: "Change of date and cancellation" },
      {
        t: "table",
        widths: [24, 76],
        rows: [
          ["The School cancels", cancellationLines(ctx).join("\n")],
          ["The School changes the date", `One free change with 14 or more days' notice, subject to our availability. With less notice, a reschedule fee of ${money(ctx, "rescheduleFee")} applies. A further change counts as a cancellation.`],
          [`${J} cancels`, "If we must cancel for a reason within our control, you choose a new date or a full refund, within 14 days, of all amounts paid."],
          ["Events outside our control", `If severe weather, a closure order, a strike or a similar event stops the workshop, ${fmRule(ctx)}.`],
        ],
      },
      {
        t: "p",
        text: `The School Service Agreement, the Photo, Video and Drone Consent Form for parents and the Drone Permission Letter follow. The Agreement sets out the full terms, and where it differs from this letter the signed Agreement applies. If the advance has not reached us within 5 working days, we may have to release the date, and we will tell you if we do.`,
      },
      { t: "p", text: `To accept, kindly sign and seal below and return this letter. By signing, the School accepts this booking on the terms above.` },
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: [...joveSign(ctx, { lines: [] }), schoolSign(ctx, "Accepted for the School")] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    const day = val(ctx, "day") ? ` for ${dateOf(ctx, "day")}` : "";
    return plain(
      `Respected Sir / Madam, thank you for saying yes to ${J}. The attached letter confirms your booking${day}: the timings, the student numbers and prices, and the terms. Kindly sign and seal the acceptance and send it back, or reply "Accepted" by email. Our advance invoice comes with it, and the date is locked once the advance reaches us.`,
    );
  },
};

/* ───────────────────────────── 3 · filming and venue permission ───────────────────────────── */

export const filmingVenuePermission: SignTemplate = {
  id: "filming-venue-permission",
  version: "1.0",
  title: "Permission for Photography, Filming and Use of the Venue",
  name: "Filming and venue permission",
  group: "school",
  kind: "letter",
  parties: ["school"],
  signs: "both",
  blurb: "Asks the school for written permission to photograph and film the workshop and to use its halls for the day, and says how students without consent are kept out of the media.",
  when: "Sent with the parent consent forms, about two weeks before the workshop; signed by the school before the day",
  series: "SCH",
  source: "26_TEMPLATES/03_Letter_Templates.md",
  keep: "Contract term + 8 years",
  requiredForSchools: true,
  lawyer: [
    "This letter is the school's permission to film on its premises. It is not the parents' consent: each child still needs the signed parent form. Confirm that the two together are enough under the Digital Personal Data Protection Act, 2023.",
    "If a school refuses photography and filming, no Media Pack can be made. The library does not say what then happens to the booking or the price. Decide, and tell the school before the day.",
    "Two halls and the assembly area is what the booking SOP asks of every school, while the Service Agreement asks for a hall or classrooms for each session. The box carries the SOP's words. Settle one.",
    "The library's letter also asks for the drone in the same letter. Here the drone has its own letter with the flight plan, and this letter says it does not cover a flight.",
  ],
  fields: [
    DAY,
    { key: "spaces", label: "Halls or ground needed", kind: "text", default: "Two halls and the assembly area", help: "What the booking SOP asks of a school. Change it to what this school has agreed to give." },
    { key: "fromTime", label: "From (time)", kind: "text", from: "workshop.startTime", default: "07:30", half: true },
    { key: "toTime", label: "To (time)", kind: "text", default: "16:30", half: true },
    { key: "provides", label: "What the school provides there", kind: "text", default: "A projector or screen, power points and tables" },
  ],
  build(ctx) {
    const J = jove(ctx);
    const day = dateOf(ctx, "day");
    // a blank copy leaves both times open; a made document carries the usual day unless the boxes say otherwise
    const [from, to] = ctx.blank ? [line(20), line(20)] : [clock(ctx, "fromTime"), clock(ctx, "toTime")];
    return [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: `Request for permission to photograph and film the ${J} workshop on ${day}, and to use the venue` },
      { t: "p", text: "Respected Sir / Madam," },
      { t: "p", text: `For the ${J} workshop at your school on ${b(day)}, we request your permission to photograph and film the day, and to use the spaces listed below.` },
      { t: "h", text: "Photography and filming" },
      {
        t: "p",
        text: "Our in-house film studio, FrameMind AI Studio, will photograph and film the sessions. The Photo, Video and Drone Consent Form for parents is attached. Kindly circulate it to parents before the day, and return to us the signed forms, or a list of the students without consent.",
      },
      {
        t: "list",
        items: [
          "We keep students without consent out of identifiable shots, or blur them in editing. We also blur or leave out any student on your instruction.",
          "We do not publish the full names of students.",
          "Our crew does not film in toilets or changing areas, or in private moments.",
          `We share the finished media with you through a private link. Your school may use it for its own marketing and admissions, and decides what it publishes. ${J} may use the media in its portfolio, within the consent that parents give.`,
        ],
      },
      { t: "h", text: "Use of the venue" },
      {
        t: "table",
        widths: [24, 76],
        rows: [
          ["Spaces", cap(tidy(ctx, "spaces", 100))],
          ["Time", `From ${from} to ${to} on ${day}`],
          ["From the School", `${cap(tidy(ctx, "provides", 100))}, and a staff coordinator who is present through the day`],
        ],
      },
      { t: "p", text: "Drone shots are requested separately, in our Drone Permission Letter, which has the flight plan and the safety measures. This letter does not cover a drone flight." },
      { t: "p", text: "We would be grateful if you would tick your decision below, sign and seal it, and return a scanned copy." },
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: joveSign(ctx, { lines: [] }) },
      { t: "h", text: "School permission" },
      {
        t: "checks",
        items: [
          `Photography and filming of the workshop on ${day} are permitted, as described above.`,
          `Photography and filming are not permitted. ${J} will not photograph or film on the campus.`,
          `${J} may use the spaces listed above, at the times stated.`,
        ],
      },
      { t: "fields", rows: [["Areas or classes not to be filmed, or other conditions", ""], ["Staff coordinator for the day (name and phone)", ""]], cols: 2 },
      { t: "sign", blocks: [schoolSign(ctx)] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    const day = val(ctx, "day") ? ` on ${dateOf(ctx, "day")}` : "";
    return plain(
      `Respected Sir / Madam, at the ${J} workshop${day} our film studio, FrameMind AI Studio, would like to photograph and film the day for your school. The attached letter asks for your permission and for the halls we need, and the consent form for parents comes with it. Kindly tick your decision, sign and seal it, and send us a scan before the workshop. Thank you.`,
    );
  },
};

/* ───────────────────────────── 4 · the school's confirmation of parent consent ───────────────────────────── */

export const consentConfirmation: SignTemplate = {
  id: "consent-confirmation",
  version: "1.0",
  title: "School's Confirmation of Parent Consent",
  name: "Consent confirmation",
  group: "school",
  kind: "declaration",
  parties: ["school"],
  signs: "party",
  blurb: "The school confirms that it sent the media consent form to parents, returns the signed forms and lists the students without consent, and confirms that it holds parents' consent for taking part and for sharing class lists.",
  when: "Returned by the school with the signed parent forms, at least 3 days before the workshop",
  series: "SCH",
  source: "18_LEGAL_CONSENT/02_School_Service_Agreement.md",
  keep: "3 years after the workshop",
  scanNote: "This paper names children. Keep the scan with the parent consent forms in the school's Legal folder, and nowhere else.",
  requiredForSchools: true,
  lawyer: [
    "The Service Agreement makes the School responsible for verifiable parental consent. Confirm that this signed confirmation, with the parent forms, is enough under the rules in force under the Digital Personal Data Protection Act, 2023.",
    "The safeguarding SOP says the company shares a template for consent to take part. The library has only the media consent form. Decide whether a participation consent template is needed, or whether the School's own form is relied on.",
    "The paper names children. It is kept for 3 years after the workshop and then destroyed, like the parent forms. The retention schedule has no line of its own for it: confirm.",
    "The paper says students without media consent still take part in full and get their certificates, as the parent form promises. Make sure the crew briefing and the wristband or seating plan are in place before it is signed.",
  ],
  fields: [DAY],
  build(ctx) {
    const J = jove(ctx);
    return [
      { t: "title", text: "School's Confirmation of Parent Consent", sub: `To reach ${J} at least 3 days before the workshop` },
      { t: "p", text: `${schoolName(ctx)} (the "School") gives this confirmation to ${J} for the ${J} workshop at the School on ${b(dateOf(ctx, "day"))}.` },
      {
        t: "list",
        ordered: true,
        items: [
          `${b("Taking part.")} The School has the verifiable consent of a parent or guardian for every student taking part in the workshop.`,
          `${b("Class lists.")} Parents and guardians have agreed that the School shares with ${J} what the workshop needs: the names and grades of the students, for attendance and certificates. The School shares no more than this, in line with the Digital Personal Data Protection Act, 2023.`,
          `${b("Media consent forms.")} Before the workshop, the School gave the Photo, Video and Drone Consent Form of ${J} to the parents and guardians of the students taking part, and it returns with this confirmation the signed forms it has received. Taking part does not depend on a parent saying yes to photographs or video. ${J} follows each form as the parent has ticked it.`,
          `${b("Students without media consent.")} A student whose parent did not return the form, or ticked none of the uses, is listed below. These students take part in full and receive their certificates, and ${J} keeps them out of identifiable shots or blurs them in editing. On the day, the School helps the crew to recognise them by a wristband or the seating plan.`,
          `${b("Later changes.")} If a parent refuses or withdraws consent after this confirmation, the School tells ${J} at once, and ${J} honours it.`,
        ],
      },
      { t: "fields", rows: [["Number of students taking part", ""], ["Number of signed forms returned", ""]], cols: 2 },
      { t: "h", text: "Students without media consent" },
      {
        t: "checks",
        items: ["None: a signed form with at least one use ticked has come back for every student taking part.", "The students listed below, and on any signed sheet attached, have no media consent."],
      },
      // ten names in two halves side by side, so that the confirmation stays on one page
      { t: "table", head: ["No.", "Name of the student", "Grade", "No.", "Name of the student", "Grade"], widths: [6, 31, 13, 6, 31, 13], rows: Array.from({ length: 5 }, (_, i) => [String(i + 1), "", "", String(i + 6), "", ""]) },
      { t: "sign", blocks: [schoolSign(ctx)] },
      { t: "fields", rows: [[`Received and checked for ${J} by (name and date)`, ""]], cols: 1 },
    ];
  },
  cover(ctx) {
    const day = val(ctx, "day") ? ` on ${dateOf(ctx, "day")}` : "";
    return plain(
      `Respected Sir / Madam, thank you for sending the consent forms home to parents. The attached one-page confirmation for the workshop${day} records how many signed forms are coming back to us, and lists the students whose parents have not agreed to photographs and video, so that our crew keeps them out of the shots. Kindly fill it in, sign and seal it, and return it with the forms at least 3 days before the workshop.`,
    );
  },
};

/* ───────────────────────────── 5 · workshop completion certificate ───────────────────────────── */

const ATTENDED: SignField[] = BANDS.map((x) => ({ key: x.a, label: `Attended, ${x.grades}`, kind: "number", half: true, help: x.a === "a12" ? "Leave empty to write the numbers by hand on the day." : undefined }));

export const completionCertificate: SignTemplate = {
  id: "completion-certificate",
  version: "1.0",
  title: "Workshop Completion Certificate",
  name: "Completion certificate",
  group: "school",
  kind: "declaration",
  parties: ["school"],
  signs: "both",
  blurb: "Signed by the school at the end of the day: the workshop was delivered, this many students attended in each grade group, and JOVE's kits were packed. The balance invoice follows it.",
  when: "At the end of the workshop day, before the team leaves",
  series: "SCH",
  source: "03_SOP/08_Post_Workshop_T1_to_T10_SOP.md",
  keep: "Contract term + 8 years",
  lawyer: [
    "This is JOVE's own record, not a statutory form. If a school needs its own work-completion format for its accounts, sign that as well.",
    "Billing on the higher of the count confirmed before the day and the number who attended, subject to the minimum, is from SOP-05. Make sure each signed agreement says the same.",
  ],
  fields: [DAY, PROGRAMME, ...ATTENDED],
  build(ctx) {
    const J = jove(ctx);
    const programme = programmeOf(ctx);
    const counts = BANDS.map((x) => num(ctx, x.a));
    const some = counts.some((n) => n !== null);
    const total = some && !ctx.blank ? counts.reduce<number>((s, n) => s + (n ?? 0), 0) : null;
    // a Quarter, Year or Club has several days: the certificate covers the one day it is signed on
    const known = PROGRAMMES.some((x) => x.id === programme?.id);
    const what = !programme || !known ? `the ${b(`${J} workshop`)}` : programme.id === "jove-day" ? `the ${b(programme.title)}` : `a session of the ${b(programme.title)}`;
    return [
      { t: "title", text: "Workshop Completion Certificate", sub: "Signed by the School at the end of the workshop" },
      { t: "p", text: `${schoolName(ctx)} (the "School") confirms that ${J} delivered ${what} at the School on ${b(dateOf(ctx, "day"))}.` },
      {
        t: "table",
        head: ["Grade group", "Students who attended"],
        widths: [62, 38],
        rows: [...BANDS.map((x, i) => [x.label, counts[i] === null ? (some && !ctx.blank ? "0" : line(20)) : count(counts[i] as number)]), [b("Total"), b(total === null ? line(20) : count(total))]],
      },
      {
        t: "checks",
        items: [
          "The sessions were held for the grade groups above.",
          "Certificates were given to the students who attended.",
          `${J}'s kits, tools and equipment were counted and packed by the ${J} team before leaving the School.`,
        ],
      },
      {
        t: "p",
        text: `The balance invoice follows the School Service Agreement: billing is on the higher of the final count confirmed before the day and the number who attended, subject to the minimum, less the advance already paid. It is due within ${count(joveDayRules.balanceDueDays)} days of the workshop date.`,
      },
      { t: "fields", rows: [["Remarks of the School (optional)", ""], ["", ""]], cols: 1 },
      { t: "sign", blocks: [schoolSign(ctx), ...joveSign(ctx, { lines: [] })] },
    ];
  },
  cover(ctx) {
    const day = val(ctx, "day") ? ` on ${dateOf(ctx, "day")}` : "";
    return plain(`Respected Sir / Madam, thank you for hosting the ${jove(ctx)} workshop${day}. Attached is the one-page completion certificate with the number of students who attended. Kindly check the numbers, sign and seal it, and send us a photo or scan. The balance invoice follows it.`);
  },
};

/* ───────────────────────────── 6 · Media Pack receipt ───────────────────────────── */

export const mediaPackReceipt: SignTemplate = {
  id: "media-pack-receipt",
  version: "1.0",
  title: "Media Pack Receipt",
  name: "Media Pack receipt",
  group: "school",
  kind: "declaration",
  parties: ["school"],
  signs: "party",
  blurb: "The school confirms what it received of the Media Pack, when and how, and the terms on which both sides may use the media.",
  when: "With the second delivery (the film), about 10 working days after the workshop",
  series: "SCH",
  source: "03_SOP/09_Media_Pack_Delivery_SOP.md",
  keep: "Contract term + 8 years",
  lawyer: [
    "A download link can expire. Ask the school to save its files; the retention schedule keeps raw footage of children for 12 months only, so JOVE may not be able to send it again later.",
    "Licences for the music used in the films are kept by the studio (SOP-09). Confirm the licences allow the school's use for admissions and on its own channels.",
  ],
  fields: [
    DAY,
    { key: "delivered", label: "Delivered on", kind: "date", half: true },
    { key: "how", label: "How it was delivered", kind: "text", default: "A private download link", half: true },
    { key: "link", label: "The link (optional)", kind: "text", placeholder: "Left empty, it is not printed", half: true },
  ],
  build(ctx) {
    const J = jove(ctx);
    const link = val(ctx, "link");
    return [
      { t: "title", text: "Media Pack Receipt", sub: `${paper(mediaPack.name, J)}` },
      {
        t: "p",
        text: `${schoolName(ctx)} (the "School") confirms that it received from ${J} the items of the Media Pack ticked below, for the workshop at the School on ${b(dateOf(ctx, "day"))}. The Media Pack is made by FrameMind AI Studio, the in-house film studio of ${J}.`,
      },
      { t: "p", text: `The last items were delivered on ${b(dateOf(ctx, "delivered"))}, by ${fill(ctx, "how", 60).replace(/^A /, "a ")}${link || ctx.blank ? ` (${link || line(70)})` : ""}. The link may expire, so the School keeps its own copy of the files.` },
      { t: "h", text: "What was received (tick each item)" },
      {
        t: "checks",
        // a receipt records what arrived, not when: the drone shots and the principal's clip exist only where they were allowed
        items: mediaPack.items.map((item) =>
          /drone/i.test(item.title) ? `${paper(item.title, J)}, in the film (only where the drone rules and the School allowed a flight)` : /testimonial/i.test(item.title) ? `${paper(item.title, J)} (only if the Principal agreed to record one)` : paper(item.title, J),
        ),
      },
      { t: "h", text: "Using the media" },
      {
        t: "list",
        items: [
          `The School may use all the delivered media for its own marketing and admissions.`,
          `${J} may use the media for its portfolio, with students' faces blurred on request, and only within the parents' consent forms on file.`,
          `Students whose parents did not give media consent were kept out of identifiable shots or blurred. If the School finds such a student in the media, it tells ${J}, and ${J} corrects the files.`,
          `A public post by ${J} that shows the School's students is made only after the School confirms it.`,
        ],
      },
      { t: "fields", rows: [["Anything missing or to be corrected (optional)", ""], ["", ""]], cols: 1 },
      { t: "sign", blocks: [schoolSign(ctx)] },
    ];
  },
  cover(ctx) {
    const day = val(ctx, "day") ? ` on ${dateOf(ctx, "day")}` : "";
    return plain(`Respected Sir / Madam, your Media Pack for the ${jove(ctx)} workshop${day} is now complete. Kindly download and save the files. The attached one-page receipt lists everything in the pack: please tick what you received, sign and seal it, and send us a photo or scan, telling us of anything missing.`);
  },
};

/* ───────────────────────────── 7 · testimonial and name release ───────────────────────────── */

export const testimonialRelease: SignTemplate = {
  id: "testimonial-release",
  version: "1.0",
  title: "Testimonial and Name Release",
  name: "Testimonial release",
  group: "school",
  kind: "declaration",
  parties: ["school"],
  signs: "party",
  blurb: "The school, and the person quoted, allow JOVE to use the school's name, logo and a testimonial, as ticked and only in the words approved. Nothing is published before it is signed.",
  when: "After the testimonial is recorded or written, and before anything is published",
  series: "SCH",
  source: "14_TESTIMONIALS/01_Testimonial_Collection_SOP.md",
  keep: "As long as the testimonial is used, and after that as your advocate advises",
  lawyer: [
    "The retention schedule has no line for testimonial releases. Keep it at least as long as the testimonial is used, and decide how long after.",
    "When the person quoted is not the person who signs for the School, both sign. Confirm the School is content for its name and logo to be used as ticked.",
  ],
  fields: [
    DAY,
    { key: "speaker", label: "Person quoted", kind: "text", from: "school.principalName", half: true },
    { key: "speakerRole", label: "Their designation", kind: "text", default: "Principal", half: true },
    { key: "words", label: "The words approved for use (optional)", kind: "textarea", help: "Exactly as approved. Left empty, the paper has lines to write them on, or a signed sheet can be attached." },
  ],
  build(ctx) {
    const J = jove(ctx);
    const words = val(ctx, "words");
    // a blank copy may be for a teacher or a coordinator as well as the principal: the designation is then written by hand
    const role = ctx.blank ? "" : val(ctx, "speakerRole");
    const speaker: SignBlock = { heading: "The person quoted", name: val(ctx, "speaker"), title: role, lines: ["Date"] };
    // the principal is often both the person quoted and the one who signs for the school: then one signature does both
    const same = !!val(ctx, "speaker") && val(ctx, "speaker").toLowerCase() === ctx.party.person.trim().toLowerCase();
    return [
      { t: "title", text: "Testimonial and Name Release" },
      { t: "p", text: `${schoolName(ctx)} (the "School"), and ${b(fill(ctx, "speaker", 50))}, ${or(role, 30)}, allow ${J} to use the testimonial given after the ${J} workshop on ${dateOf(ctx, "day")}, on the terms below.` },
      { t: "h", text: `What ${J} may use (tick each one allowed)` },
      { t: "checks", items: ["The School's name", "The School's logo", "The words below, exactly as approved", "The video testimonial recorded at the School", "Photographs of the person quoted", "The name and designation of the person quoted, with the words"] },
      { t: "h", text: "Where (tick each one allowed)" },
      { t: "checks", items: [`${J}'s website`, `${J}'s social media`, "Proposals and brochures given to other schools", "Paid advertisements"] },
      ...(words
        ? ([{ t: "h", text: "The words" }, { t: "note", text: `“${words}”` }] satisfies Block[])
        : ([{ t: "fields", rows: [["The words, written here and on the lines below, or on a sheet attached and signed by the person quoted", ""], ["", ""], ["", ""]], cols: 1 }] satisfies Block[])),
      { t: "h", text: "Terms" },
      {
        t: "list",
        items: [
          `${J} uses the words exactly as approved, and publishes nothing before this release is signed and the final text or video is approved. A shorter version is used only after the person quoted approves it in writing.`,
          `The testimonial was given freely: ${J} offered no discount or other benefit for it.`,
          `The permission lasts until it is withdrawn. To withdraw it, write to ${J} at ${or(ctx.company.email, 50)}: ${J} removes the testimonial from its website and active channels within 2 working days. Material already printed, or already given to others, cannot be recalled.`,
          `This release does not cover students. A student's words or image are used only with a parent's written consent through the School.`,
        ],
      },
      { t: "sign", blocks: same ? [schoolSign(ctx, "The person quoted, for the School")] : [speaker, schoolSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`Respected Sir / Madam, thank you for your kind words about the ${jove(ctx)} workshop. Before we share them, the attached one-page release lets you choose exactly what we may use and where. Kindly tick the options, sign it with the School's seal, and send us a photo or scan. Nothing is published before that.`);
  },
};

/** The templates of this file, in the order HQ lists them. */
export const SCHOOL_DOCS: SignTemplate[] = [schoolServiceAgreement, bookingConfirmation, filmingVenuePermission, consentConfirmation, completionCertificate, mediaPackReceipt, testimonialRelease];
