/**
 * Documents to Sign: every paper that needs a signature (offer letters, agreements, declarations, permissions),
 * made in HQ with the names already on it, printed, signed by hand and ticked off.
 *
 * A template is plain data plus one function: the boxes to fill in, and `build`, which turns a filled-in document into
 * blocks (title, clauses, tables, signature lines). The same blocks are drawn on screen and on paper, and are stored
 * with the document once it is printed, so HQ keeps the exact wording that was signed even if a template changes later.
 */

/* ───────────────────────────── who and what ───────────────────────────── */

/** The other side of a document. "other" is anyone not on record in HQ: a parent, a college, a sponsor. */
export type PartyKind = "team" | "school" | "vendor" | "other";

/** What was typed in a document's own boxes. Always text; money and numbers are text of digits. */
export type Values = Record<string, string>;

/** The company as it is printed, from HQ → Settings. Empty text where Settings has nothing yet. */
export interface Company {
  legalName: string;
  brandName: string;
  /** the whole address on one line */
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
}

/** A founder who signs for JOVE. */
export interface Signatory {
  name: string;
  title: string;
}

export interface Party {
  kind: PartyKind;
  /** id of the Team, Schools or Vendors record, when there is one */
  id?: string;
  /** the name as printed: a person's full name, a school's name, a firm's name */
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  /** team: the role ("Freelance Trainer") · school, vendor, other: the designation of the person who signs ("Principal") */
  role: string;
  /** team only: Full-time, Part-time, Freelance or Intern */
  engagement: string;
  /** school, vendor, other: the person who signs for it. Empty for a team member (the name is the person). */
  person: string;
}

/** Everything `build` may use. Nothing here reads the clock or the network: the same input always gives the same paper. */
export interface DocContext {
  company: Company;
  party: Party;
  /** who signs for JOVE: one founder, or both */
  signatories: Signatory[];
  /** the date printed on the document, "2026-10-13" ("" on a blank copy) */
  date: string;
  /** the reference number, "JOVE/HR/26-27/004" ("" on a blank copy) */
  ref: string;
  /** the document's own boxes */
  v: Values;
  /** true for a blank copy that is filled in by hand: every unknown prints as a line to write on */
  blank: boolean;
}

/* ───────────────────────────── the paper ───────────────────────────── */

/**
 * Text in a block may carry two marks:  **bold**  and a write-in line made with `line()` from text.ts.
 * A line break in the text is a line break on paper.
 */
export type Block =
  /** the document's title, once, at the top */
  | { t: "title"; text: string; sub?: string }
  /** the addressee of a letter: "To," and the lines under it */
  | { t: "to"; lines: string[] }
  | { t: "subject"; text: string }
  | { t: "p"; text: string; align?: "left" | "right" | "center" }
  /** a heading without a number */
  | { t: "h"; text: string }
  /** a numbered clause: "3. Fees". Several items become 3.1, 3.2 …; one item is a plain paragraph under the heading */
  | { t: "clause"; title: string; items: string[] }
  | { t: "list"; items: string[]; ordered?: boolean }
  /** empty boxes to tick by hand */
  | { t: "checks"; items: string[] }
  /** `widths` are percentages, one per column */
  | { t: "table"; head?: string[]; rows: string[][]; widths?: number[] }
  /** a form: each row is a label and its value, or a line to write on when the value is empty */
  | { t: "fields"; rows: [label: string, value: string][]; cols?: 1 | 2 }
  /** a boxed note */
  | { t: "note"; text: string }
  /** the signatures, side by side; kept together on one page */
  | { t: "sign"; blocks: SignBlock[] }
  /** start a new page (before a schedule or an annexure) */
  | { t: "break" }
  | { t: "gap"; mm?: number };

export interface SignBlock {
  /** "For JOVE", "The Trainer", "For the School", "Witness" */
  heading: string;
  /** printed under the signature line; empty leaves a line to write the name on */
  name: string;
  /** role or designation, under the name */
  title?: string;
  /** a school or a firm also puts its seal */
  seal?: boolean;
  /** more lines to fill by hand under the name: "Date", "Place" */
  lines?: string[];
}

/* ───────────────────────────── a template ───────────────────────────── */

export type DocGroup = "joining" | "policies" | "exit" | "school" | "events" | "partners";

export interface SignField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "date" | "number" | "money" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  /** flagged as "needed before printing" while empty. It still prints: the paper gets a line to fill by hand. */
  required?: boolean;
  /** half width in the form */
  half?: boolean;
  /**
   * Where the box is filled from when the document is made, as "record.field":
   * member.role · member.type · member.joinDate · member.monthlyPay · member.perWorkshopRate · member.city ·
   * school.principalName · school.city · school.address · workshop.date · workshop.startTime · workshop.studentsG12 ·
   * workshop.agreedAmount · proposal.number · proposal.date · proposal.total · vendor.gstin · company.city ·
   * signatory.name. Several sources may be given with "|": the first one that has a value wins
   * ("workshop.studentsG12|proposal.studentsG12").
   */
  from?: string;
  /** used when `from` gives nothing */
  default?: string;
}

export interface SignTemplate {
  /** kebab-case, never changed once documents exist */
  id: string;
  /** version of the wording: raise it whenever the text changes */
  version: string;
  /** the title printed on the paper */
  title: string;
  /** short name for lists and chips, three words at most */
  name: string;
  group: DocGroup;
  kind: "letter" | "agreement" | "declaration" | "form";
  /** who it can be made for */
  parties: PartyKind[];
  /** who signs: both sides, only the other side, or only JOVE */
  signs: "both" | "party" | "jove";
  /** one sentence: what it is */
  blurb: string;
  /** when it is used: "Before the first workshop" */
  when: string;
  /** reference series: HR (people), SCH (schools), EVT (events and parents), PTR (vendors and partners) */
  series: "HR" | "SCH" | "EVT" | "PTR";
  fields: SignField[];
  build: (ctx: DocContext) => Block[];
  /** a short message to send with the PDF, for WhatsApp or email */
  cover?: (ctx: DocContext) => string;
  /** the Operations Library document the wording follows, "18_LEGAL_CONSENT/03_Freelance_Trainer_Agreement_and_NDA.md" */
  source?: string;
  /** open points for the advocate or the CA. Shown in HQ, never printed. */
  lawyer: string[];
  /** how long the signed copy is kept (29_COMPLIANCE/04) */
  keep: string;
  /** a caution shown where the signed scan is attached ("cover the account number before scanning") */
  scanNote?: string;
  /** agreements: a line for both sides' initials at the foot of every page */
  initials?: boolean;
  /** team: who must have it. Any of "Founder", "Full-time", "Part-time", "Freelance", "Intern". */
  requiredFor?: string[];
  /** schools: needed for every booked workshop */
  requiredForSchools?: boolean;
  /** when it is fully signed, "Agreement / NDA signed" is ticked on the person's Team record */
  marksAgreement?: boolean;
}
