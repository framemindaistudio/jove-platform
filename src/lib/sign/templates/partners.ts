/**
 * Vendors, partners and public events: the event waiver, the mutual NDA, supply terms with a vendor, and the MoUs with a
 * college and with a CSR sponsor.
 *
 * The wording follows the Operations Library:
 *   event waiver   18_LEGAL_CONSENT/08 (the waiver) and 01 (the photo and video choices and promises)
 *   mutual NDA     18_LEGAL_CONSENT/03 clause 5, as trainer.ts words it, made two-way
 *   supply terms   03_SOP/19, 06_ROBOTICS_KITS/07 and 10 (working terms only: no cost, price paid or margin is printed)
 *   college MoU    23_PARTNERSHIPS/03
 *   CSR MoU        23_PARTNERSHIPS/01, 21_MARKETING/06 (names and logos), 18_LEGAL_CONSENT/06 (changes of date)
 * Where the library leaves a point open there is a box, and the open point is in the template's "lawyer" list.
 */
import { joveDayRules } from "@/lib/content/business";
import { b, companyIntro, dateOf, docDate, fill, jove, joveSign, line, moneyWords, or, partySign, plain, val } from "../text";
import type { DocContext, SignBlock, SignField, SignTemplate } from "../types";

/* ───────────────────────────── shared pieces ───────────────────────────── */

/** What was typed in a box without the full stop some people end with, or a line to write on. */
const tidy = (ctx: DocContext, key: string, mm = 60) => val(ctx, key).replace(/[\s.;,:]+$/, "") || line(mm);

/** A box filled in one point per line, as the points (without the full stop some people end with). */
const points = (ctx: DocContext, key: string) =>
  val(ctx, key)
    .split("\n")
    .map((s) => s.trim().replace(/[\s.;,:]+$/, ""))
    .filter(Boolean);

/** The points of a box as numbered items, or three lines to write on when the box is empty. */
const pointsOrLines = (ctx: DocContext, key: string) => {
  const all = points(ctx, key).map((s) => `${s}.`);
  return all.length ? all : [line(150), line(150), line(150)];
};

/** The other side as an agreement names it: the name (and `after` it, such as a GSTIN), where it is, and who signs for it. */
function partyIntro(ctx: DocContext, after = "") {
  const p = ctx.party;
  const where = p.address.replace(/\s*\n\s*/g, ", ") || p.city;
  const signer = p.person ? `${p.person}${p.role ? `, ${p.role}` : ""}` : ctx.blank ? line(60) : "";
  return `${b(or(p.name, 60))}${after}, of ${or(where, 80)}${signer ? `, represented by ${signer}` : ""}`;
}

/** "Hello Lakshmi" for a message. A name that starts with a title or an initial is used whole ("Hello Dr. Meera Rao", "Hello R. Kumar"). */
function hello(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "Hello";
  return `Hello ${/^(dr|prof|mr|mrs|ms|shri|sri|smt)\.?$/i.test(words[0]) || /^[A-Za-z]{1,2}\.?$/.test(words[0]) ? words.join(" ") : words[0]}`;
}

/** Text from a box in the middle of a sentence: a capital first letter is made small, unless the word is in capitals ("PCB"). */
const midSentence = (text: string) => (/^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text);

/** The other side's signature: who signs for it, a line for the designation when HQ does not have one, and a seal for a firm or an institution. */
function otherSign(ctx: DocContext, heading: string, seal: boolean): SignBlock {
  const p = ctx.party;
  return partySign(ctx, heading, { seal, lines: p.person && !p.role ? ["Designation", "Date"] : ["Date"] });
}

/** Governing law and how a dispute is settled, in the words of the trainer agreement. `subject` is "This Agreement is", "These Terms are". */
const lawAndDisputes = (ctx: DocContext, subject: string) =>
  `${subject} governed by the laws of India. The parties first try to settle a dispute by discussion. A dispute that is not settled goes to a sole arbitrator under the Arbitration and Conciliation Act, 1996, with the seat at ${fill(ctx, "seat", 30)} and in English; the courts at ${fill(ctx, "seat", 30)} have jurisdiction over matters outside the arbitration.`;

const SEAT: SignField = { key: "seat", label: "Arbitration and courts at", kind: "text", default: "Bengaluru", half: true, help: "Your advocate confirms this choice." };

/** The open point on the seat, the same in every partner paper. */
const SEAT_NOTE =
  "Stamp duty in Karnataka, and the seat of arbitration and courts in the box (Bengaluru, as in the library's drafts, while the company is in Bagalkot). A court can usually be chosen only among courts that already have jurisdiction, such as where a party is or where the work is done; an arbitration seat can be chosen more freely. Confirm the choice.";

/* ───────────────────────────── 1 · event waiver ───────────────────────────── */

export const eventWaiver: SignTemplate = {
  id: "event-liability-waiver",
  version: "1.0",
  title: "Participation Consent and Liability Waiver",
  name: "Event waiver",
  group: "events",
  kind: "declaration",
  parties: ["other"],
  signs: "party",
  blurb: "A parent or guardian (or an adult taking part) accepts the ordinary risks of a public event, gives health and emergency details, and chooses separately whether photos and video are allowed.",
  when: "At registration or at the door of a public event, camp or showcase. Not for school workshops, where the school supervises",
  series: "EVT",
  source: "18_LEGAL_CONSENT/08_Liability_Waiver_for_Events.md",
  keep: "3 years after the event",
  lawyer: [
    "A waiver signed by a parent may not bind the child. As the library asks, the form does not try to release the organiser from its own negligence, or from anything the law does not allow to be excluded. Have point 5 (the release) and the whole form confirmed before the first public event, including how the Consumer Protection Act, 2019 treats a paid event.",
    "Photo and video permission is taken on this form, in the words of the parent consent form (Form 01). The library's draft waiver pointed to Form 01 instead. Confirm that one form is enough at a public event and that the tick boxes meet the Digital Personal Data Protection Act, 2023 on a parent's verifiable consent.",
    "The form collects health details of children. The retention schedule has no line for waivers: 3 years is its figure for parent consent forms. A child can bring a claim after turning 18, so confirm how long waivers are kept.",
    "8 years, the age below which a child must come with an adult, is the draft's figure. Set it for each kind of event.",
    "The parent bears the reasonable cost of emergency treatment, as in the draft, except where point 5 leaves the organiser liable (an addition, so that a parent does not pay for the organiser's own fault). Confirm the wording.",
    "Public liability insurance should be in force before a public event (29_COMPLIANCE/02). The form does not mention insurance.",
  ],
  fields: [
    { key: "event", label: "Event", kind: "text", required: true, placeholder: "Robotics open day" },
    { key: "day", label: "Date", kind: "date", half: true },
    { key: "venue", label: "Venue", kind: "text", half: true },
    { key: "minAge", label: "Children below this age come with an adult (years)", kind: "number", default: "8", half: true, help: "The draft's figure is 8. Change it for the event if needed." },
  ],
  build(ctx) {
    const J = jove(ctx);
    const p = ctx.party;
    // the person who signs is the parent or guardian, or the participant when 18 or older
    const signer = p.person || p.name;
    return [
      { t: "title", text: "Participation Consent and Liability Waiver" },
      { t: "p", text: `Event: ${b(fill(ctx, "event", 78))}, on ${b(dateOf(ctx, "day", 30))}\nVenue: ${b(fill(ctx, "venue", 62))}. Organiser: ${b(ctx.company.legalName || J)}` },
      { t: "p", text: "I am the participant's parent or legal guardian, or the participant aged 18 or older. I confirm that:" },
      {
        t: "list",
        ordered: true,
        items: [
          "The event has hands-on robotics and electronics activities with low-voltage kits, tools and moving robots, and a drone display where one is announced. These carry small risks even with reasonable care: minor cuts, pinches, bumps, a warm battery or part, or an allergic reaction.",
          `The participant will follow the instructions of the ${J} team and the venue staff. I am responsible for the participant's behaviour, and for drop-off and pick-up as arranged at the venue. A child below ${fill(ctx, "minAge", 10)} years comes with an adult who stays with the child.`,
          "The participant has no medical condition that prevents safe participation, other than what is written below.",
          "In an emergency the organiser may arrange first aid or medical treatment and will call the phone number below. I will bear the reasonable cost of treatment, except where point 5 leaves the organiser liable.",
          `As far as the law allows, I release the organiser and its team from claims that arise from the ordinary risks of the activity. ${b("This does not release the organiser from liability for its own negligence or wilful misconduct, or from any liability that the law does not allow to be excluded.")}`,
          "I accept the event rules displayed at the venue. The organiser may remove a participant who puts others in danger.",
        ],
      },
      {
        t: "table",
        widths: [19, 81],
        rows: [
          ["Participant", `Name: ${line(76)} Age: ${line(12)} Class: ${line(14)}`],
          ["Person signing", `Relationship to the participant: ${line(50)}`],
          ["Phone", `During the event: ${or(p.phone, 40)} Another emergency contact: ${line(44)}`],
          ["Health", `Allergies, medicines or conditions the team should know of. Write "none" if none.\n${line(134)}`],
        ],
      },
      { t: "p", text: `${b("Photos and video are your choice.")} Taking part does not depend on them. If you tick neither box, the participant is kept out of shot or blurred in editing.` },
      {
        t: "checks",
        items: [
          `${J} may photograph and film the participant at the event, including wide aerial (drone) shots where a drone is flown, and show the media on its website, social media and presentations.`,
          "The participant may appear recognisably, with the face visible, in reels and films.",
        ],
      },
      {
        t: "p",
        text: `${J} never publishes a child's full name with a photo, never sells the media or uses it for third-party advertising, and does not use it to train AI models. You may withdraw this permission at any time by writing to ${or(ctx.company.email, 50)}. The details on this form are used only to run the event safely and to reach you.`,
      },
      { t: "sign", blocks: [{ heading: "Signature", name: signer, title: "Parent, guardian or adult participant", lines: ["Date"] }] },
    ];
  },
  cover(ctx) {
    const day = val(ctx, "day") ? ` on ${dateOf(ctx, "day")}` : "";
    return plain(
      `${hello(ctx.party.person || ctx.party.name)}, thank you for registering for ${val(ctx, "event") || `the ${jove(ctx)} event`}${day}. Attached is the participation consent and waiver. Please read it, fill in the participant's details and sign it, then bring it with you or send us a clear photo before the event. The photo and video permission is your choice, and taking part does not depend on it.`,
    );
  },
};

/* ───────────────────────────── 2 · mutual NDA ───────────────────────────── */

export const mutualNda: SignTemplate = {
  id: "mutual-nda",
  version: "1.0",
  title: "Mutual Non-Disclosure Agreement",
  name: "Mutual NDA",
  group: "partners",
  kind: "agreement",
  parties: ["vendor", "other"],
  signs: "both",
  blurb: "Both sides agree to keep each other's information confidential while they discuss or do work together: kit designs, curriculum, prices and school contacts on one side, the other side's prices and processes on the other.",
  when: "Before drawings, files, prices or contacts are shared with a supplier, printer, laser-cutter, college, sponsor or consultant",
  series: "PTR",
  source: "18_LEGAL_CONSENT/03_Freelance_Trainer_Agreement_and_NDA.md",
  keep: "Engagement + 8 years",
  initials: true,
  lawyer: [
    "Three years of confidentiality is the trainer agreement's draft figure. Confirm it, and whether kit designs and the curriculum should be protected for longer or without limit of time.",
    "The exceptions match the trainer agreement: public, already known, required by law. Usual NDAs also except information developed independently or received lawfully from someone else. Add these if the advocate advises.",
    "Certificate printing sends students' names to a printer. This NDA does not allow that (clause 5): it needs a separate written agreement that meets the Digital Personal Data Protection Act, 2023.",
    "When the other side is a company, a college or a trust, check that the person signing is authorised to sign for it.",
    `${SEAT_NOTE} Ask also whether the agreement should be on stamp paper.`,
    "The retention schedule names only trainer NDAs (engagement + 8 years); vendor contracts are term + 3 years. The longer period is used here. Confirm.",
  ],
  fields: [
    { key: "purpose", label: "What the two sides are discussing", kind: "text", required: true, placeholder: "Laser-cutting of chassis parts for robotics kits", help: "One line. It sets what the shared information may be used for." },
    { key: "confidentialYears", label: "Confidentiality lasts (years after the end)", kind: "number", default: "3", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = jove(ctx);
    const p = ctx.party;
    return [
      { t: "title", text: "Mutual Non-Disclosure Agreement" },
      {
        t: "p",
        text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${partyIntro(ctx)} (the "${b("Other Party")}").`,
      },
      {
        t: "clause",
        title: "Purpose",
        items: [
          `The parties wish to discuss, and may later work together on, the following: ${b(tidy(ctx, "purpose", 120))} (the "Purpose").`,
          `To do this, each party may give the other information that is not public. This Agreement sets out how that information is protected. The party that gives information is the "disclosing party", and the party that receives it is the "receiving party".`,
        ],
      },
      {
        t: "clause",
        title: "Confidential Information",
        items: [
          `"Confidential Information" means information about a party or its business that is not public and that the other party receives for the Purpose, in any form: spoken, written, or as files, drawings or samples.`,
          `For ${J} it includes the curriculum, lesson plans, worksheets, kit designs and bills of materials, supplier details and prices, pricing, proposals, school contacts and the sales pipeline, financial information and media that has not been released.`,
          "For the Other Party it includes its price lists and quotations, designs, processes, customer and supplier details and financial information.",
        ],
      },
      {
        t: "clause",
        title: "Keeping it confidential",
        items: [
          "The receiving party will keep Confidential Information secret, use it only for the Purpose, and copy it only as far as the Purpose needs.",
          "The receiving party may share it only with those of its own people who need it for the Purpose and who are bound to keep it secret, and is responsible for what they do with it.",
          "Drawings, cutting files, artwork and samples given so that one party can make or supply something for the other are used only for the orders of the party that gave them, and for no one else.",
          "The receiving party will return or delete Confidential Information when the disclosing party asks or when this Agreement ends, except a copy that the law requires it to keep.",
        ],
      },
      {
        t: "clause",
        title: "What is not covered",
        items: ["This Agreement does not cover information that is public through no fault of the receiving party, that the receiving party already lawfully knew, or that the law requires to be disclosed. Where the law allows, the receiving party tells the disclosing party before such a disclosure."],
      },
      {
        t: "clause",
        title: "Personal data of students",
        items: [
          `${J} does not give the personal data of students (such as names, class lists, or photographs and video of children) under this Agreement, and the Other Party does not ask for it.`,
          `If such data reaches the Other Party by mistake, the Other Party tells ${J} at once, does not use or copy it, and deletes it.`,
          "Work that needs such data is done only under a separate written agreement.",
        ],
      },
      {
        t: "clause",
        title: "Ownership",
        items: ["Confidential Information remains the property of the disclosing party. This Agreement gives the receiving party no licence or other right in it. Neither party uses the other's name or logo without written permission."],
      },
      {
        t: "clause",
        title: "No commitment",
        items: ["This Agreement does not oblige either party to place an order, to buy or supply anything, or to sign any further agreement. It does not make the parties partners or agents of each other. Each party remains free to work with others, as long as it keeps to this Agreement."],
      },
      {
        t: "clause",
        title: "Term",
        items: [
          "This Agreement starts on the date above and continues until either party ends it by written notice to the other.",
          `For information received before the end, the duties in this Agreement continue for ${fill(ctx, "confidentialYears", 10)} years after the end, and without limit of time for any personal data of students.`,
        ],
      },
      {
        t: "clause",
        title: "If something goes wrong",
        items: [
          "A party that learns that the other party's Confidential Information has been lost, leaked or misused tells the other party at once and helps to limit the harm.",
          "Each party accepts that money alone may not make good a breach of this Agreement, and that the other party may ask a court for an order to stop or prevent one.",
        ],
      },
      {
        t: "clause",
        title: "Law and disputes",
        items: [lawAndDisputes(ctx, "This Agreement is"), "This is the whole agreement between the parties on this subject. A change to it is made in writing and signed by both."],
      },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...joveSign(ctx), otherSign(ctx, "For the Other Party", p.kind === "vendor" || !!p.person)] },
    ];
  },
  cover(ctx) {
    const about = val(ctx, "purpose") ? ` for ${midSentence(tidy(ctx, "purpose"))}` : "";
    return plain(
      `${hello(ctx.party.person)}, before we share drawings, prices and other details${about}, we would like both sides to sign the attached Mutual Non-Disclosure Agreement. It protects your information in the same way as ours. Please sign and date the last page, initial the other pages and send us a clear scan. We will send back a copy signed by ${jove(ctx)}.`,
    );
  },
};

/* ───────────────────────────── 3 · supply terms with a vendor ───────────────────────────── */

export const vendorSupplyTerms: SignTemplate = {
  id: "vendor-supply-terms",
  version: "1.0",
  title: "Supply Terms",
  name: "Vendor supply terms",
  group: "partners",
  kind: "agreement",
  parties: ["vendor"],
  signs: "both",
  blurb: "The working terms with a supplier of parts, printing, cutting or packaging: how orders are placed, samples and proofs, genuine and child-safe goods, delivery, inspection, replacement of defects, invoices, payment and the confidentiality of designs.",
  when: "When a vendor is added in Inventory, before the first purchase order",
  series: "PTR",
  source: "03_SOP/19_Vendor_and_Procurement_SOP.md",
  keep: "Term + 3 years",
  initials: true,
  lawyer: [
    "Acceptance rule: SOP-19 rejects a batch when more than 5% of the tested pieces fail; the Quality Control Checklist sets a different limit for each kind of part. The paper uses the SOP's 5% in a box. Settle one rule.",
    "SOP-19 raises a replacement within 48 hours; the Quality Control Checklist tells the vendor the same day. The paper promises 48 hours in a box.",
    "Late delivery: the library only says that the backup vendor is used. The right to cancel what is undelivered and to have the advance returned (clause 5.2) is a usual term added here. Confirm it.",
    "Left out because the library is silent: when ownership and risk in the goods pass, a warranty period (there is an optional box), price changes, and the Supplier's liability if an unsafe part harms a child. Ask the advocate which to add.",
    "A supplier registered as a micro or small enterprise must be paid within the time the MSMED Act, 2006 allows (an agreed period of at most 45 days from acceptance of the goods, or 15 days where none is agreed). Check the payment terms in the box against it with the CA.",
    "A printer of certificates receives students' names. Clause 8.3 says no personal data of students is given under these Terms, so certificate printing needs a separate written agreement that meets the Digital Personal Data Protection Act, 2023.",
    "Three years of confidentiality for designs is the trainer agreement's draft figure. Confirm it.",
    "These terms are written for goods. For transport, stay or other services use a separate letter.",
    SEAT_NOTE,
  ],
  fields: [
    { key: "goods", label: "What the Supplier supplies", kind: "text", from: "vendor.category", placeholder: "Electronic components for kits" },
    { key: "gstin", label: "Supplier's GSTIN (if registered)", kind: "text", from: "vendor.gstin", placeholder: "29ABCDE1234F1Z5", half: true },
    { key: "paymentTerms", label: "Payment terms", kind: "text", from: "vendor.paymentTerms", default: "on delivery, after inspection", help: "SOP-19: on delivery, unless an advance is agreed for a custom job." },
    { key: "reportHours", label: "Defects are reported within (hours of delivery)", kind: "number", default: "48", half: true },
    { key: "rejectPercent", label: "Batch rejected when more than (% of tested pieces) fail", kind: "number", default: "5", half: true },
    { key: "replaceDays", label: "Replacement arrives within (days, optional)", kind: "number", half: true, help: "Left empty, the paper says 'without delay'." },
    { key: "laterDays", label: "Defects found later are covered for (days, optional)", kind: "number", half: true, help: "Left empty, the paper covers only what is found on arrival." },
    { key: "confidentialYears", label: "Designs stay confidential (years after the last order)", kind: "number", default: "3", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = jove(ctx);
    const gstin = val(ctx, "gstin");
    const later = val(ctx, "laterDays") || ctx.blank;
    return [
      { t: "title", text: "Supply Terms" },
      {
        t: "p",
        text: `These Supply Terms ("Terms") are agreed on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${partyIntro(ctx, gstin || ctx.blank ? ` (GSTIN ${fill(ctx, "gstin", 40)}${ctx.blank ? ", if registered" : ""})` : "")} (the "${b("Supplier")}").`,
      },
      {
        t: "clause",
        title: "What these Terms cover",
        items: [
          `These Terms apply to every order ${J} places with the Supplier from the date above, for: ${b(tidy(ctx, "goods", 90))}.`,
          `${J} uses the goods in its school workshops and in robotics kits that children handle themselves, so quality, safety and delivery on time are essential.`,
          `These Terms do not oblige ${J} to place any order or to buy only from the Supplier, and do not oblige the Supplier to accept an order.`,
        ],
      },
      {
        t: "clause",
        title: "Orders",
        items: [
          `${J} orders by a purchase order from its HQ system, or by a written order sent by email or WhatsApp. An order states the items, the quantity, the price, GST, the delivery date and the delivery address.`,
          `The Supplier confirms the order in writing. The confirmed price holds for that order and does not change without the written agreement of ${J}.`,
          "Where an order says something different from these Terms, the order applies to that order.",
        ],
      },
      {
        t: "clause",
        title: "Samples and proofs",
        items: [
          `Before the first order of a new part or a new print, the Supplier gives ${J} a sample to test.`,
          `For printed and cut-to-order items, the Supplier makes the full run only after ${J} has approved a proof in writing.`,
          "Goods delivered match the approved sample or proof.",
        ],
      },
      {
        t: "clause",
        title: "Genuine and child-safe goods",
        items: [
          `The Supplier supplies only new and genuine goods that match the description, the brand and the specification in the order, and does not replace an item with a different part, brand or version without the written agreement of ${J}.`,
          "Cells and batteries are fresh and within their shelf life. Cut parts are free of sharp edges and burrs. Nothing supplied has an exposed live conductor or any other fault that could hurt a child.",
          `The Supplier tells ${J} at once if it learns of a safety problem in goods it has supplied.`,
        ],
      },
      {
        t: "clause",
        title: "Delivery",
        items: [
          "The Supplier delivers by the date in the order, to the address in the order, with a delivery challan or invoice that quotes the order number. Freight and packing are as stated in the order.",
          `The workshop dates of ${J} are fixed commitments to schools. If a delivery will be late, the Supplier tells ${J} as soon as it knows. ${J} may then cancel what has not been delivered and buy it elsewhere, and the Supplier returns any advance paid for the cancelled goods.`,
        ],
      },
      {
        t: "clause",
        title: "Inspection and defects",
        items: [
          `${J} inspects each delivery on arrival: it counts the goods against the order and the delivery challan, checks them for damage and tests a sample.`,
          `${J} reports a shortfall or a defect in writing, with photographs, within ${fill(ctx, "reportHours", 10)} hours of the delivery.`,
          `The Supplier replaces every defective or missing item ${val(ctx, "replaceDays") || ctx.blank ? `within ${fill(ctx, "replaceDays", 10)} days of being told` : "without delay"}, or gives a credit note for it where ${J} agrees, at no cost to ${J}.`,
          `${J} may reject the whole batch where more than ${fill(ctx, "rejectPercent", 10)}% of the pieces it tests fail.`,
          ...(later ? [`A defect that could not be found on arrival, and that shows within ${fill(ctx, "laterDays", 10)} days of the delivery, is reported when it is found and replaced in the same way.`] : []),
        ],
      },
      {
        t: "clause",
        title: "Invoices and payment",
        items: [
          "The Supplier sends an invoice for each order that quotes the order number. A Supplier registered for GST gives a tax invoice that shows its GSTIN.",
          `Payment terms: ${b(tidy(ctx, "paymentTerms", 90))}. ${J} pays by bank transfer or UPI, and pays on the agreed terms.`,
          `${J} pays an advance only where the order says so, and never more than 50% of the value of the order. The balance is paid after inspection, for the goods that pass it.`,
        ],
      },
      {
        t: "clause",
        title: "Designs and confidentiality",
        items: [
          `The drawings, cutting files, artwork, kit designs, bills of materials and order quantities of ${J} are confidential and remain the property of ${J}. The Supplier uses them only to fulfil the orders of ${J}, does not share them, does not make or sell items from them for anyone else, and returns or deletes them when ${J} asks.`,
          `${J} keeps the Supplier's price lists and quotations confidential in the same way.`,
          `${J} gives the Supplier no personal data of students under these Terms.`,
          `These duties continue for ${fill(ctx, "confidentialYears", 10)} years after the last order under these Terms.`,
        ],
      },
      {
        t: "clause",
        title: "Fair dealing",
        items: [
          `Neither the Supplier nor anyone acting for it offers a gift, a commission or a favour to anyone at ${J}.`,
          `The Supplier tells a founder of ${J} if anyone at ${J} asks for one, and of any family or business relationship it has with a member of the ${J} team.`,
        ],
      },
      {
        t: "clause",
        title: "Ending these Terms",
        items: ["Either party may end these Terms at any time by written notice to the other. Orders already confirmed are completed, inspected and paid for under these Terms, and clause 8 continues after the end."],
      },
      {
        t: "clause",
        title: "Law and disputes",
        items: [lawAndDisputes(ctx, "These Terms are"), "A change to these Terms is made in writing and signed by both parties."],
      },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...joveSign(ctx), otherSign(ctx, "For the Supplier", true)] },
    ];
  },
  cover(ctx) {
    return plain(
      `${hello(ctx.party.person)}, thank you for working with ${jove(ctx)}. The attached Supply Terms put in writing how we order, inspect and pay, so that both sides know what to expect. Please read them, sign and seal the last page, initial the other pages and send us a clear scan. If any point needs a change, call me and we will sort it out before the first order.`,
    );
  },
};

/* ───────────────────────────── 4 · MoU with a college ───────────────────────────── */

export const collegeMou: SignTemplate = {
  id: "college-mou",
  version: "1.0",
  title: "Memorandum of Understanding",
  name: "College MoU",
  group: "partners",
  kind: "agreement",
  parties: ["other"],
  signs: "both",
  blurb: "Sets out how a college and the company work together so that its students can train and work as associate trainers and interns: what each side provides, selection and training, safeguarding, certificates, materials and how either side may end it.",
  when: "When a college agrees to the trainer and internship programme, before its students are selected",
  series: "PTR",
  source: "23_PARTNERSHIPS/03_College_and_Trainer_Pipeline_Partnerships.md",
  keep: "Contract term + 8 years",
  lawyer: [
    "Thirty days' notice to end the MoU is a usual figure, not company policy yet.",
    "Clause 12 says which clauses bind (money, safeguarding, materials, confidentiality, law) and that the rest is a statement of intent. Confirm this split.",
    "Students paid per workshop day: confirm they are engaged under the Freelance Trainer Agreement, and whether an internship needs a separate letter for the college or the university.",
    "Stipends: the playbook allows them only where legally and academically appropriate. Check the college's and the university's internship rules before filling the stipend box.",
    "Background verification of students: confirm which check is practical for a student and who pays for it.",
    "Check that the person signing is authorised to sign for the college (principal, registrar or trust).",
    SEAT_NOTE,
    "The retention schedule has no line for partner MoUs. The longer contract period (term + 8 years) is used. Confirm.",
  ],
  fields: [
    { key: "start", label: "Starts on", kind: "date", required: true, half: true },
    { key: "months", label: "Runs for (months)", kind: "number", default: "12", half: true, help: "The playbook: one year, renewable." },
    { key: "collegeContact", label: "College's coordinator", kind: "text", placeholder: "Name, designation and phone" },
    { key: "joveContact", label: "Our coordinator", kind: "text", from: "signatory.name", half: true },
    {
      key: "collegeProvides",
      label: "What the College provides",
      kind: "textarea",
      help: "One point per line. These are the playbook's points: change them to what was agreed.",
      default: [
        "A chance to present the programme to students, through the placement or training cell, the department or the robotics club",
        "Notice to final-year and pre-final-year students that they may apply",
        "Permission for selected students to take part, where their enrolment, credit or internship status needs it",
        "Use of a lab or a classroom for training days, when one is available",
      ].join("\n"),
    },
    {
      key: "joveProvides",
      label: "What we provide",
      kind: "textarea",
      help: "One point per line. For a film or media college, add media internships with FrameMind AI Studio.",
      default: [
        "Hands-on training and live-project experience in real school workshops, and a certificate for each student who completes the training",
        "Paid work on workshop days for students who are certified as associate trainers",
        "Guest sessions or workshops for the College's robotics club, at reasonable or no cost",
        "A possible junior role for a student who does very well, when a role is open",
        "Joint events with the College, such as a Maker Day hosted at the College",
      ].join("\n"),
    },
    { key: "stipend", label: "Internship stipend (optional)", kind: "text", placeholder: "Amount per month and for how long", help: "Left empty, the paper says no stipend is fixed." },
    { key: "fee", label: "Money between the College and us (optional)", kind: "text", placeholder: "For example a fee for a workshop at the College", help: "Left empty, the paper says neither side owes the other any money." },
    { key: "credit", label: "Academic credit or internship status (optional)", kind: "text", placeholder: "For example: counts as the final-year internship" },
    { key: "noticeDays", label: "Notice to end the MoU (days)", kind: "number", default: "30", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = jove(ctx);
    const stipend = val(ctx, "stipend") || ctx.blank;
    const fee = val(ctx, "fee") || ctx.blank;
    const credit = val(ctx, "credit") || ctx.blank;
    const reach = [ctx.company.phone, ctx.company.email].filter(Boolean).join(", ");
    return [
      { t: "title", text: "Memorandum of Understanding" },
      {
        t: "p",
        text: `This Memorandum of Understanding ("MoU") is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${partyIntro(ctx)} (the "${b("College")}").`,
      },
      {
        t: "clause",
        title: "Purpose",
        items: [
          `${J} runs hands-on Robotics and AI workshops in schools for students of Grades 1 to 10. The College wishes its students to gain practical experience, and ${J} wishes to train students of the College as associate trainers and interns for these workshops.`,
          `This MoU sets out how the two will work together. It is not exclusive: the College may work with others, and ${J} may work with other colleges.`,
        ],
      },
      { t: "clause", title: "What the College provides", items: pointsOrLines(ctx, "collegeProvides") },
      { t: "clause", title: `What ${J} provides`, items: pointsOrLines(ctx, "joveProvides") },
      {
        t: "clause",
        title: "Selection, training and work",
        items: [
          `${J} selects students through an application, a short hands-on test and an interview, and decides whom it selects.`,
          `Selected students attend the 2-day ${J} training in the curriculum, kit handling, classroom management, child protection and safety. They then assist on 2 workshop days under a founder.`,
          `After a practical review, ${J} certifies a student as a ${J} Associate Trainer. A certified student may lead a station at a workshop, with a founder on site.`,
          `${J} reviews the feedback of schools, trainers and founders, and may pause or stop a student's work.`,
          `Before any school work, each student signs an agreement with ${J} on confidentiality, child safeguarding, conduct and teaching materials.`,
        ],
      },
      {
        t: "clause",
        title: "Money",
        items: [
          `A student who works on a workshop day is paid for that day, at the rate ${J} sets and tells the student before the day. ${J} pays the student directly.`,
          stipend ? `Where a student works as an intern, the stipend is: ${tidy(ctx, "stipend", 90)}. A stipend is paid only where the law and the College's rules allow it.` : "This MoU fixes no internship stipend. One may be agreed in writing for a student, where the law and the College's rules allow it.",
          fee ? `Between the College and ${J}: ${tidy(ctx, "fee", 100)}. Apart from this, neither party owes the other any money under this MoU.` : "Neither party owes the other any money under this MoU.",
        ],
      },
      {
        t: "clause",
        title: "Safeguarding and conduct",
        items: [
          `The safety of children comes first. Every student completes background verification and signs the Child Protection and Safeguarding Declaration of ${J} before any school work.`,
          `No student has unsupervised access to school children. A founder of ${J} is on site on every workshop day, and school staff are present in every session.`,
          `Students follow the ${J} Child Protection and Safeguarding Policy and Code of Conduct. They are never alone with a child, have no private contact with school students, and take no photographs or video of them.`,
          `${J} may suspend a student at once while a concern is looked into.`,
        ],
      },
      {
        t: "clause",
        title: "Certificates and credit",
        items: [
          `${J} gives a certificate to each student who completes the training.`,
          `Whether a student's work with ${J} counts as an internship or for academic credit is for the College to decide under its own rules.${credit ? ` Agreed for this MoU: ${tidy(ctx, "credit", 100)}.` : ""}`,
        ],
      },
      {
        t: "clause",
        title: "Materials, names and media",
        items: [
          `The curriculum, lesson plans, worksheets, kit designs, code and brand of ${J} remain the property of ${J}. The College uses them only for work under this MoU, and does not copy them or teach from them elsewhere. Each student is bound in the same way by the agreement in clause 4.5.`,
          "Each party uses the other's name and logo only with written permission, and never in a way that suggests an approval that has not been given.",
          `FrameMind AI Studio, the film studio of ${J}, may photograph and film training sessions and events held under this MoU, with the College's permission for each. Photographs and video of school children are taken only by the ${J} media team and are used only within the consent that parents have given.`,
        ],
      },
      {
        t: "clause",
        title: "Confidentiality and personal data",
        items: [
          "Each party keeps the other's information that is not public confidential, and uses it only for this MoU.",
          `${J} collects students' applications with their consent, and uses their details only for selection, training and engagement.`,
          "The College receives no personal data of school children under this MoU.",
        ],
      },
      {
        t: "clause",
        title: "Period and ending",
        items: [
          `This MoU starts on ${b(dateOf(ctx, "start"))} and runs for ${fill(ctx, "months", 10)} months. The parties may renew it in writing.`,
          `Either party may end it with ${fill(ctx, "noticeDays", 10)} days' written notice. A workshop day already confirmed with a student is completed and paid for.`,
          "Clauses 6, 8 and 9 continue to apply to anything done under this MoU.",
        ],
      },
      {
        t: "clause",
        title: "Contacts",
        items: [`For the College: ${tidy(ctx, "collegeContact", 100)}.`, `For ${J}: ${tidy(ctx, "joveContact", 50)}${reach ? `, ${reach}` : ""}.`],
      },
      {
        t: "clause",
        title: "What this MoU is, law and disputes",
        items: [
          `This MoU records how the parties intend to work together in good faith. It does not oblige the College to provide any number of students, or ${J} to select, train or engage any student. Clauses 5, 6, 8 and 9 and this clause are binding.`,
          "Nothing in this MoU makes the parties partners or agents of each other.",
          lawAndDisputes(ctx, "This MoU is"),
          "A change to this MoU is made in writing and signed by both parties.",
        ],
      },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...joveSign(ctx), otherSign(ctx, "For the College", true)] },
    ];
  },
  cover(ctx) {
    return plain(
      `Respected Sir / Madam, thank you for the discussion about the ${jove(ctx)} trainer and internship programme for your students. The attached Memorandum of Understanding sets out what each side provides and how students are selected, trained and kept safe. Kindly review it and, if it is in order, sign and seal it and send us a scan. We will return a copy signed by ${jove(ctx)}, and I would be glad to come over and go through it.`,
    );
  },
};

/* ───────────────────────────── 5 · MoU with a CSR sponsor ───────────────────────────── */

export const csrMou: SignTemplate = {
  id: "csr-partnership-mou",
  version: "1.0",
  title: "CSR Partnership Memorandum of Understanding",
  name: "CSR partnership MoU",
  group: "partners",
  kind: "agreement",
  parties: ["other"],
  signs: "both",
  blurb: "A company or foundation funds workshops for the students of named schools: the programme, the amount and how it is paid, what is reported and when, children's safety, media and data, and how the sponsor's name is used.",
  when: "When a sponsor agrees to fund workshops, before any school is told and before any work starts",
  series: "PTR",
  source: "23_PARTNERSHIPS/01_CSR_Partnership_Playbook.md",
  keep: "Contract term + 8 years",
  lawyer: [
    "The company is for-profit and is not a CSR implementing agency. Whether a sponsor's payment to it counts as CSR spending under section 135 of the Companies Act, 2013 and the CSR Rules must be confirmed by the sponsor's advisers and by the CA before signing (clause 1.2 says so on the paper).",
    "Where the money comes through an NGO or trust (CSR-1, 12A, 80G), this MoU is still only between the company and the sponsor. Consider a three-party agreement, or a separate service agreement with that agency.",
    "GST on CSR contracts depends on the structure. Confirm with the CA and quote it explicitly.",
    "The parent consent form (Form 01) has no tick for use by a sponsor. Add one for sponsored workshops before giving a sponsor any photograph or film in which a child can be recognised (clause 6.2).",
    "Government schools: confirm for each district what permission the education department requires (clause 3.3).",
    "The payment schedule in the box starts from the school rule (advance on signing, balance within days of the workshop). It is not a CSR rule from the playbook: agree it with the sponsor.",
    "Clause 9 follows the school Workshop Terms (move within 90 days; refund within 14 days). Confirm it suits a sponsored programme.",
    "Clause 10: 15 days to put a breach right is the school agreement's draft figure, and the refund of money held for undelivered workshops is a usual term. Confirm both.",
    "There is no limit on liability and no insurance clause. Decide with the advocate.",
    "Clause 3.4 (a school is never charged for what the Sponsor paid) is a usual term added here, not a rule from the playbook. Confirm it.",
    "The MoU does not say what happens when a school named in clause 2 withdraws: whether its share moves to another school (clause 4.4) or is refunded. Decide, and add it if needed.",
    SEAT_NOTE,
    "The retention schedule has no line for sponsor agreements. The period for school agreements (contract term + 8 years) is used. Confirm.",
  ],
  fields: [
    {
      key: "programme",
      label: "The programme sponsored",
      kind: "textarea",
      required: true,
      help: "From the playbook's package for one school day. Change it for a cluster day, a quarter, a year or a lab corner.",
      default: "One full workshop day at each school: age-appropriate hands-on sessions, kits, a certificate for every student, and documentation (photographs and a short film) for reporting",
    },
    { key: "schools", label: "Schools covered", kind: "textarea", placeholder: "Government High School, Bagalkot", help: "One school per line. Left empty, the paper has lines to write them on." },
    { key: "students", label: "Students (about)", kind: "number", half: true },
    { key: "start", label: "Period: from", kind: "date", half: true },
    { key: "end", label: "Period: to", kind: "date", half: true },
    { key: "amount", label: "Total amount (before GST)", kind: "money", required: true, half: true },
    {
      key: "schedule",
      label: "Payment schedule",
      kind: "text",
      default: `${joveDayRules.advancePercent}% on signing this MoU, and the balance within ${joveDayRules.balanceDueDays} days of the last workshop`,
      help: "Starts from the school rule. Change it to what the sponsor agreed.",
    },
    { key: "agency", label: "Implementing agency (optional)", kind: "text", help: "The registered NGO or trust the money comes through, if there is one. Left empty, the paper does not mention one." },
    {
      key: "reporting",
      label: "What is reported, and when",
      kind: "textarea",
      help: "One report per line. For a quarter or a year, add the quarterly summary and the annual impact report from the playbook.",
      default: [
        "An event report within 10 working days of each workshop: attendance by grade, activities, photographs, feedback and media",
        "A utilisation statement when the Sponsor's reporting requires one, prepared with the CA and, where there is one, the implementing agency",
      ].join("\n"),
    },
    { key: "logoUse", label: "Where the Sponsor's name and logo appear", kind: "text", default: "on the workshop banner and standee, and as a credit in the short film and in the reports" },
    { key: "cureDays", label: "Days to put a serious breach right", kind: "number", default: "15", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = jove(ctx);
    const agency = val(ctx, "agency");
    const schools = points(ctx, "schools");
    const billed = agency ? `${agency}, through which the Sponsor funds the Programme` : ctx.blank ? "the Sponsor or, where clause 1.3 applies, the implementing agency" : "the Sponsor";
    return [
      { t: "title", text: "CSR Partnership Memorandum of Understanding" },
      {
        t: "p",
        text: `This Memorandum of Understanding ("MoU") is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${partyIntro(ctx)} (the "${b("Sponsor")}").`,
      },
      {
        t: "clause",
        title: "Purpose",
        items: [
          `${J} runs hands-on Robotics and AI workshops in schools for students of Grades 1 to 10. The Sponsor wishes to fund such workshops for the students of the schools named in clause 2.`,
          `${J} is a for-profit business and delivers the Programme as a service provider. ${J} is not registered as a CSR implementing agency. Whether the Sponsor's payment counts as CSR spending under section 135 of the Companies Act, 2013 is for the Sponsor to decide with its own advisers, and ${J} makes no statement about it.`,
          ...(agency || ctx.blank ? [`The Sponsor funds the Programme through ${fill(ctx, "agency", 70)}, a registered implementing agency. Its arrangement with the Sponsor is separate from this MoU.${ctx.blank ? " Strike this point out if there is no such agency." : ""}`] : []),
        ],
      },
      { t: "clause", title: "The Programme", items: [`The Sponsor funds, and ${J} delivers, the programme set out below (the "Programme").`] },
      {
        t: "table",
        widths: [20, 80],
        rows: [
          ["Programme", tidy(ctx, "programme", 120)],
          ["Schools", schools.length ? schools.join("\n") : `${line(130)}\n${line(130)}`],
          ["Students", `About ${fill(ctx, "students", 16)}`],
          ["Period", `From ${dateOf(ctx, "start")} to ${dateOf(ctx, "end")}. The workshop dates are fixed with each school.`],
        ],
      },
      {
        t: "clause",
        title: `What ${J} delivers`,
        items: [
          `${J} provides the trained team, the kits, tools and materials, and a certificate for every student who takes part.`,
          `Workshop kits are reusable and remain with ${J}. Students take a kit home only where the Programme includes take-home kits.`,
          "A workshop is held only after the school has agreed in writing and, where it is needed, the education department has given permission.",
          `${J} does not charge a school or its students for anything the Sponsor has paid for.`,
        ],
      },
      {
        t: "clause",
        title: "Amount and payment",
        items: [
          `The Sponsor pays ${b(moneyWords(ctx, "amount"))} for the Programme${agency || ctx.blank ? ", directly or through the implementing agency in clause 1.3" : ""}. This amount is before GST. ${ctx.company.gstin ? "GST at the rate in force is added on the invoice" : `GST is added at the rate in force once ${J} is registered for GST`}.`,
          `Payment: ${tidy(ctx, "schedule", 110)}.`,
          `${J} raises its invoices on ${billed}.`,
          "A change in the schools, the number of students or the amount is agreed in writing before the workshop it affects.",
        ],
      },
      {
        t: "clause",
        title: `What ${J} reports`,
        items: [
          ...pointsOrLines(ctx, "reporting"),
          `${J} reports only what it has counted, such as students reached, sessions delivered, attendance, and quiz and feedback results where they were taken. It promises no figure in advance, and gives no estimate of reach or impact that it cannot measure.`,
        ],
      },
      {
        t: "clause",
        title: "Children: safety, media and data",
        items: [
          `The ${J} Child Protection and Safeguarding Policy applies at every workshop to everyone present, including the Sponsor's staff, guests and volunteers. They are never alone with a child and take no photographs or video of children. Only the ${J} media team films.`,
          `${J} gives the Sponsor photographs and a short film of the Programme for its reporting. A child appears recognisably in them only where the parent or guardian has consented in writing to that use, including use by the Sponsor. Any other child is kept out of shot or blurred.`,
          `The Sponsor uses that media only for its CSR reporting and its own communications about the Programme. The Sponsor does not name a child with a photograph, does not use the media to advertise a product or to train AI models, and removes it from its own channels when ${J} passes on a parent's withdrawal of consent.`,
          `The Sponsor receives numbers, not names. ${J} gives the Sponsor no class list, attendance sheet with names, phone number or other personal data of a student, and the Sponsor does not ask for it.`,
        ],
      },
      {
        t: "clause",
        title: "Names and logos",
        items: [
          `The Sponsor's name and logo appear ${tidy(ctx, "logoUse", 110)}. ${J} uses them only as the Sponsor's brand guidelines allow, and only where the school agrees to the branding.`,
          "Nothing is sold or advertised to children at a workshop.",
          `${J} names the Sponsor in its own marketing only with the Sponsor's written permission. The Sponsor uses the ${J} name and logo unaltered, and only to describe the Programme.`,
          "Neither party says or suggests that the other, a school or a government body has approved or endorsed something that it has not approved in writing.",
        ],
      },
      {
        t: "clause",
        title: "Fair dealing and records",
        items: [
          "Neither party gives or offers a commission, a gift or any other inducement to a school, an official or anyone else in connection with the Programme.",
          `${J} keeps clear records of the workshops delivered and of the amounts received, and shows them to the Sponsor on request.`,
        ],
      },
      {
        t: "clause",
        title: "Changes of date and cancellation",
        items: [
          `If a workshop cannot be held on its date for a reason outside the parties' control, such as severe weather, a closure order, a strike or a serious illness in the team, it is moved to a new date within 90 days and the amount paid for it carries forward. If it cannot be moved, ${J} refunds what was paid for it, less only the costs that ${J} has already paid to third parties and can document.`,
          `If ${J} cancels a workshop for a reason within its control, the Sponsor chooses a new date or a full refund, within 14 days, of what it paid for that workshop.`,
        ],
      },
      {
        t: "clause",
        title: "Period and ending",
        items: [
          `This MoU starts on ${b(dateOf(ctx, "start"))} and ends on ${b(dateOf(ctx, "end"))}, or when the Programme has been delivered, reported and paid for, if that is later.`,
          `Either party may end it by written notice if the other has seriously broken it and has not put the matter right within ${fill(ctx, "cureDays", 10)} days of being asked in writing.`,
          `When this MoU ends, the Sponsor pays for the workshops already delivered, ${J} returns any amount it holds for workshops not delivered, and clauses 6 and 7 continue to apply to media and information already shared.`,
        ],
      },
      {
        t: "clause",
        title: "Law and disputes",
        items: [
          `The parties intend this MoU to be a binding agreement. ${lawAndDisputes(ctx, "It is")}`,
          "Nothing in this MoU makes the parties partners or agents of each other.",
          "This is the whole agreement between the parties on this subject. A change to it is made in writing and signed by both.",
        ],
      },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...joveSign(ctx), otherSign(ctx, "For the Sponsor", true)] },
    ];
  },
  cover(ctx) {
    return plain(
      `Respected Sir / Madam, thank you for considering support for hands-on Robotics and AI workshops for school students. The attached Memorandum of Understanding sets out the programme, the amount, what ${jove(ctx)} reports to you, and how children's safety and privacy are protected. Kindly review it and, if it is in order, sign and seal it and send us a scan. We will gladly go through any point with your team.`,
    );
  },
};

/** The templates of this file, in the order HQ lists them. */
export const PARTNER_DOCS: SignTemplate[] = [eventWaiver, mutualNda, vendorSupplyTerms, collegeMou, csrMou];
