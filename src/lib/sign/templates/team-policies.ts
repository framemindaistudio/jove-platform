/**
 * The papers a team member signs beside the offer letter or the trainer agreement: the NDA for employees and interns,
 * the consent to background checks, the joining form, and the five policy declarations.
 *
 * Each one follows an Operations Library document, named in its `source`. Where the library leaves a figure in
 * brackets, the figure is a box; where it is silent or disagrees with itself, the point is in the `lawyer` list.
 * Bank, tax and identity details are written by hand on the paper and are never boxes, so they are not stored in HQ.
 */
import { b, companyIntro, docDate, fill, firstName, jove, joveSign, or, partySign, plain, plainDate, val } from "../text";
import type { DocContext, SignTemplate } from "../types";

const EVERYONE = ["Founder", "Full-time", "Part-time", "Freelance", "Intern"];
const ALL_BUT_FOUNDERS = ["Full-time", "Part-time", "Freelance", "Intern"];
const EMPLOYEES_AND_INTERNS = ["Full-time", "Part-time", "Intern"];

/** "I, Asha Rao, working with JOVE as Trainer," : the opening of a declaration. */
const iAm = (ctx: DocContext) => `I, ${b(or(ctx.party.name, 60))}${ctx.party.role || ctx.blank ? `, working with ${jove(ctx)} as ${or(ctx.party.role, 45)}` : ""},`;

const hi = (ctx: DocContext) => `Hi ${firstName(ctx.party.name) || "there"},`;

/** The self-declaration asked of everyone who works around children. The same words on both papers that carry it. */
const cleanRecord = (J: string) => [
  "I have never been convicted by a court of an offence against a child, or of an offence involving violence or sexual misconduct.",
  "As far as I know, no police case or court case for such an offence is pending against me.",
  "I have never been removed from work with children, or asked to leave it, because of a concern about my behaviour towards a child.",
  `If any of the three statements above stops being true, I will tell a founder of ${J} at once.`,
];

const TICK_NOTE = "Tick each statement that is true. If you cannot tick one, leave it empty and explain in the space below.";

/* ───────────────────────────── 1. NDA and IP agreement ───────────────────────────── */

export const ndaIp: SignTemplate = {
  id: "nda-ip",
  version: "1.0",
  title: "Non-Disclosure and Intellectual Property Agreement",
  name: "NDA and IP agreement",
  group: "joining",
  kind: "agreement",
  parties: ["team"],
  signs: "both",
  blurb: "An employee or an intern agrees to keep JOVE's information confidential, and that work made for JOVE belongs to JOVE.",
  when: "With the offer or internship letter, before the first day",
  series: "HR",
  source: "18_LEGAL_CONSENT/03_Freelance_Trainer_Agreement_and_NDA.md",
  keep: "Engagement + 8 years",
  initials: true,
  requiredFor: [...EMPLOYEES_AND_INTERNS],
  marksAgreement: true,
  lawyer: [
    "The library has no NDA written for employees and interns. This one is built from clauses 5 to 8 of the trainer agreement so that everyone is on the same terms: have it read once beside the offer and internship letters.",
    "The 3 years of confidentiality, the 12 months of non-solicitation and Bengaluru as the seat are in brackets in the trainer agreement draft: confirm all three.",
    "Non-solicitation (clause 8): restraints after employment are hard to enforce under section 27 of the Indian Contract Act. The clause is limited to using confidential information to approach JOVE's schools: confirm the wording and the period.",
    "Assignment of rights (clause 7): it is worded for the Copyright Act, 1957 (every country, the full term, no lapse for non-use, pay as the full payment). Confirm it, and what counts as payment where an intern is unpaid.",
    "Stamp duty in Karnataka on this agreement, and whether it should be on stamp paper.",
  ],
  fields: [
    { key: "confidentialYears", label: "Confidentiality lasts (years after the end)", kind: "number", default: "3", half: true },
    { key: "nonSolicitMonths", label: "No approaching JOVE's schools for (months)", kind: "number", default: "12", half: true },
    { key: "seat", label: "Arbitration and courts at", kind: "text", default: "Bengaluru", half: true, help: "Your advocate confirms this choice." },
  ],
  build(ctx) {
    const J = jove(ctx);
    const p = ctx.party;
    return [
      { t: "title", text: "Non-Disclosure and Intellectual Property Agreement" },
      {
        t: "p",
        text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${b(or(p.name, 60))}, residing at ${or(p.address.replace(/\n/g, ", "), 80)}${p.role || ctx.blank ? `, who works with ${J} as ${or(p.role, 45)}` : ""} (the "${b("Team Member")}").`,
      },
      {
        t: "clause",
        title: "Why this Agreement is made",
        items: [
          `The Team Member works with ${J} as an employee or an intern. In that work the Team Member will see information that ${J} keeps private, and will help make the lessons, kits, films and other material that ${J} depends on. This Agreement sets out how that information is kept and who owns that material. It stands beside the Team Member's Offer of Employment and Letter of Appointment, or Internship Offer Letter, and does not change the pay or the other terms in them.`,
        ],
      },
      {
        t: "clause",
        title: "Confidential Information",
        items: [
          `"Confidential Information" means information about ${J} that is not public and that the Team Member receives because of working with ${J}. It includes the curriculum, lesson plans, worksheets, kit designs and bills of materials, supplier details and prices, pricing, proposals, school contacts and the sales pipeline, student and school data, financial information and media that has not been released.`,
          `It is Confidential Information whether it is spoken, written, on paper, in ${J} HQ or in any file, and whether or not it is marked confidential.`,
        ],
      },
      {
        t: "clause",
        title: "Keeping it confidential",
        items: [
          `The Team Member will keep Confidential Information secret, use it only to do ${J} work, copy it only as far as that work needs, and share it only with people at ${J} who need it for their own work.`,
          `The Team Member will keep Confidential Information in the systems and folders ${J} provides, and will not put it into a personal account, a public computer or an online tool that ${J} has not approved.`,
          "The Team Member will tell a founder at once on learning that Confidential Information has been lost, copied or seen by someone who should not have it.",
        ],
      },
      {
        t: "clause",
        title: "What is not covered",
        items: [
          `This Agreement does not cover information that is public through no fault of the Team Member, that the Team Member already lawfully knew, or that the law requires to be disclosed. Where the law allows, the Team Member tells ${J} before such a disclosure.`,
          "Nothing in this Agreement stops the Team Member from reporting a concern about a child's safety, a crime or harassment to a school, a committee or an authority that the law provides for.",
        ],
      },
      {
        t: "clause",
        title: "How long",
        items: [`These duties apply for as long as the Team Member works with ${J} and for ${fill(ctx, "confidentialYears", 10)} years after the engagement ends, and without limit of time for the personal data of students.`],
      },
      {
        t: "clause",
        title: "Return and deletion",
        items: [
          `When the engagement ends, or earlier when ${J} asks, the Team Member will return every document, kit, tool, device, uniform and ID badge that belongs to ${J}, and will delete Confidential Information from the Team Member's own devices and accounts.`,
          `If ${J} asks, the Team Member will confirm in writing that this has been done.`,
          `${J} removes the Team Member's access to HQ, shared folders and tools on the day the engagement ends.`,
        ],
      },
      {
        t: "clause",
        title: "Intellectual property",
        items: [
          `Everything the Team Member creates for ${J} in the course of the engagement (lessons and improvements to them, worksheets, code, designs, photographs and videos) belongs to ${J} from the moment it is made, and the Team Member assigns all rights in it to ${J}.`,
          `The assignment covers every country and lasts for the full term of each right. It does not lapse if ${J} does not use a right within one year or any other period. The pay or stipend under the Team Member's letter is the full payment for these rights, and no royalty is payable.`,
          `The Team Member keeps the Team Member's own earlier material and gives ${J} a licence to use any of it that the Team Member includes in ${J} work.`,
          `The Team Member will not copy or reuse the ${J} curriculum elsewhere, and will show ${J} work in a personal portfolio only with a founder's written approval.`,
          `The Team Member will use only licensed music, images and software in ${J} work, and will not add anyone else's material to it without the right to do so.`,
          `The Team Member will sign any further paper that ${J} reasonably needs to record these rights.`,
        ],
      },
      {
        t: "clause",
        title: "Non-solicitation",
        items: [
          `For ${fill(ctx, "nonSolicitMonths", 10)} months after the engagement ends, the Team Member will not use Confidential Information to approach the schools ${J} works with in order to offer them competing workshops.`,
          `This clause does not stop the Team Member from working in education, robotics or any other field after leaving ${J}.`,
        ],
      },
      {
        t: "clause",
        title: "Law and disputes",
        items: [
          `This Agreement is governed by the laws of India. The parties first try to settle a dispute by discussion. A dispute that is not settled goes to a sole arbitrator under the Arbitration and Conciliation Act, 1996, with the seat at ${fill(ctx, "seat", 30)} and in English; the courts at ${fill(ctx, "seat", 30)} have jurisdiction over matters outside the arbitration.`,
          "Either party may ask a court for an urgent order to stop a breach of this Agreement while a dispute is being settled.",
          "This is the whole agreement between the parties on confidentiality and on who owns the work. If a part of it cannot be enforced, the rest still applies. A change to it is made in writing and signed by both.",
        ],
      },
      { t: "p", text: "The Team Member has read this Agreement and has had the chance to ask questions about it. Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...joveSign(ctx), partySign(ctx, "The Team Member")] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(
      `${hi(ctx)} attached is your Non-Disclosure and Intellectual Property Agreement with ${J}. It says how ${J}'s information is kept private, and that the work you make for ${J} belongs to ${J}. Please read it, sign and date the last page and initial the others, then bring it on your first day or send a clear scan of every page. Call me if you would like to go through any part of it.`,
    );
  },
};

/* ───────────────────────────── 2. Consent for background verification ───────────────────────────── */

export const backgroundVerificationConsent: SignTemplate = {
  id: "background-verification-consent",
  version: "1.1",
  title: "Consent for Background Verification",
  name: "Verification consent",
  group: "joining",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "The person agrees to the identity, reference and police checks JOVE makes before anyone works with children, and is told how the copies are kept.",
  when: "Before the first workshop, when the identity copy and the references are given",
  series: "HR",
  source: "19_HR_TEAM/03_Hiring_Process_and_Demo_Class_Rubric.md",
  keep: "Engagement + 3 years, with the verification copies",
  requiredFor: [...ALL_BUT_FOUNDERS],
  lawyer: [
    "Identity and verification copies are kept 3 years after the engagement ends (the privacy policy and the retention schedule now agree). Confirm with the advocate.",
    "Who pays the fee for a police verification certificate is not stated anywhere: decide, and tell the person.",
    "The statements about convictions, pending cases and removal from work with children are usual practice for work with children, not wording from the library. Confirm they are fair and lawful to ask, and what JOVE does when a box is left unticked.",
    "If a person offers an Aadhaar card as the identity document, take a masked copy and never write the number down: confirm the practice.",
    "Consent and notice under the Digital Personal Data Protection Act, 2023: confirm this paper is enough.",
  ],
  scanNote: "The paper promises that only the founders, and an administrator they appoint, see these copies. A scan attached here is kept that way. Upload identity and verification copies to the File Vault's hr folder, which also opens only for founders and admins.",
  fields: [
    { key: "keepYears", label: "Copies are kept for (years after the engagement ends)", kind: "number", default: "3", half: true, help: "The privacy policy suggests 3 years for team records. Your advocate confirms the figure." },
  ],
  build(ctx) {
    const J = jove(ctx);
    return [
      { t: "title", text: "Consent for Background Verification" },
      { t: "p", text: `${J} works with children in schools. Before a person works with children on behalf of ${J}, ${J} checks who that person is. This form records my consent to those checks.` },
      { t: "p", text: `${iAm(ctx)} give ${J} my consent to carry out the checks below and to keep the records of them as this form sets out.` },
      { t: "h", text: "The checks" },
      {
        t: "list",
        ordered: true,
        items: [
          `${b("Identity.")} I will show one government identity document in original and give ${J} a copy of it.`,
          `${b("References.")} ${J} may contact the two people I name below and ask them about my work, my conduct and my suitability to work with children.`,
          `${b("Police verification.")} Before I work with students on my own, I will give ${J} a copy of a police verification certificate. Until it arrives, I only shadow under a founder and am never alone with students.`,
        ],
      },
      { t: "p", text: "I understand that until these checks are complete I do not work with students. At most I may shadow a workshop alongside the team, where a founder allows it." },
      { t: "h", text: "My references" },
      {
        t: "table",
        head: ["", "Full name", "How this person knows me", "Phone"],
        widths: [7, 35, 34, 24],
        rows: [
          ["1\n ", "", "", ""],
          ["2\n ", "", "", ""],
        ],
      },
      { t: "h", text: "My declaration" },
      { t: "p", text: TICK_NOTE },
      {
        t: "checks",
        items: [
          `The information and the documents I give ${J} are true, and the documents are my own.`,
          ...cleanRecord(J),
          `I understand that a false statement, or a check that fails, can stop or end my engagement with ${J}.`,
        ],
      },
      { t: "fields", rows: [[`Anything I must tell ${J} about these statements (write "Nothing" if there is nothing)`, ""]], cols: 1 },
      { t: "h", text: "How my documents are kept" },
      {
        t: "list",
        items: [
          `The copies are kept in a restricted file that only the founders of ${J}, and an administrator they appoint, can open.`,
          `They are used only to verify me and to keep the records the law requires. In its other records ${J} notes only that a check was done, with the type of identity document and its last four digits.`,
          `${J} does not give them to anyone else. Where a school's visitor rules ask for proof that I have been verified, ${J} may show it to that school.`,
          `They are kept while I work with ${J} and for ${fill(ctx, "keepYears", 10)} years after. They are then destroyed securely, paper shredded and files deleted, and the destruction is recorded.`,
          `I may ask to see or correct what ${J} holds about me. I may withdraw this consent in writing at any time; I understand that ${J} cannot place a person with children without these checks.`,
        ],
      },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
      { t: "h", text: `For ${J}'s use` },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Identity document seen in original on", ""],
          ["References spoken to on", ""],
          ["Police verification certificate received on", ""],
          ["Checked by (name and initials)", ""],
        ],
      },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(
      `${hi(ctx)} everyone who works with children for ${J} goes through the same checks before the first workshop. The attached form asks for your consent, the names of two references and a short declaration. Please fill it in, sign it and bring it with your identity document in original, or send me a clear scan. Tell me if anything in it is unclear.`,
    );
  },
};

/* ───────────────────────────── 3. Joining details form ───────────────────────────── */

export const joiningDetails: SignTemplate = {
  id: "joining-details",
  version: "1.0",
  title: "Joining Details Form",
  name: "Joining details",
  group: "joining",
  kind: "form",
  parties: ["team"],
  signs: "party",
  blurb: "The personal, tax, payout and emergency details JOVE needs from a new team member, written by hand.",
  when: "On or before the first day",
  series: "HR",
  source: "19_HR_TEAM/04_Onboarding_Checklist.md",
  keep: "Engagement + 3 years; pay and tax records 8 years",
  requiredFor: [...ALL_BUT_FOUNDERS],
  lawyer: [
    "This form carries a full bank account number, and the privacy policy says HQ holds only the last four digits. Keep the signed paper in the locked file, and cover the account number before a scan goes into the File Vault.",
    "The form is kept 3 years after the engagement ends, as the privacy policy now says for identity details. Payout and tax details that payroll needs are kept with the pay records (8 years). Confirm with the CA.",
    "The safety box may hold health information, which is optional and sensitive: confirm how it is stored and who may see it.",
    "Ask the CA what else must be collected from an employee once salary TDS, PF or ESI apply. This form does not ask for PF or ESI numbers.",
  ],
  scanNote: "Cover the bank account number before you scan this form: HQ keeps only the last four digits. The paper original stays in the locked file.",
  fields: [
    { key: "start", label: "Joining date", kind: "date", from: "member.joinDate", half: true },
    { key: "keepYears", label: "The form is kept for (years after the engagement ends)", kind: "number", default: "3", half: true, help: "The privacy policy suggests 3 years for team records. Your advocate confirms the figure." },
  ],
  build(ctx) {
    const J = jove(ctx);
    const p = ctx.party;
    return [
      { t: "title", text: "Joining Details Form", sub: "Please write in capital letters. Strike out and correct anything already printed that is wrong." },
      { t: "h", text: "About you" },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Full name", p.name],
          ["Role", p.role],
          ["Engaged as (full-time, part-time, freelance or intern)", p.engagement],
          ["Joining date", plainDate(val(ctx, "start"))],
          ["Mobile phone", p.phone],
          ["Email", p.email],
        ],
      },
      { t: "fields", cols: 1, rows: [["Home address with PIN code", p.address.replace(/\n/g, ", ")]] },
      { t: "h", text: "Identity and tax" },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Date of birth", ""],
          ["PAN", ""],
          ["Identity document given (type)", ""],
          ["Its last four digits only", ""],
        ],
      },
      { t: "p", text: "Write only the type of identity document and its last four digits, not the full number. The PAN is needed because the law applies a higher rate of tax deduction to a payment made without one." },
      { t: "h", text: "How you are paid" },
      { t: "p", text: "Fill in the UPI ID or the bank account, whichever you want to be paid into." },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["UPI ID", ""],
          ["Account holder's name", ""],
          ["Bank and branch", ""],
          ["IFSC", ""],
        ],
      },
      { t: "fields", cols: 1, rows: [["Account number", ""]] },
      { t: "h", text: "Emergency contact" },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Name", ""],
          ["Relation to you", ""],
          ["Phone", ""],
          ["Another phone, if any", ""],
        ],
      },
      { t: "h", text: "For your safety on a workshop day (optional)" },
      { t: "p", text: "You may tell us about an allergy, a medical condition or a medicine you carry, so that the team can help you in an emergency. You may leave this empty." },
      { t: "fields", cols: 1, rows: [[`Anything ${J} should know`, ""]] },
      { t: "h", text: `Why ${J} asks for this, and who sees it` },
      {
        t: "note",
        text: `${J} collects these details to pay you, to deduct and report tax where the law requires, to verify who you are, and to reach your family in an emergency. Only the founders, and an administrator they appoint, can see them. This paper is kept in a restricted file. In HQ, ${J} records your UPI ID, or only the last four digits of your account number. Your details go outside ${J} only as far as paying you and meeting tax law need: to the bank, to ${J}'s accountant and to the tax authorities. The form is kept while you work with ${J} and for ${fill(ctx, "keepYears", 10)} years after; payment and tax records are kept for as long as tax law requires. You may ask to see or correct your details at any time.`,
      },
      { t: "h", text: "Declaration" },
      { t: "p", text: "The details I have given are true and complete. I will tell a founder when any of them changes." },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
      { t: "h", text: `For ${J}'s use` },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Received by (name and signature)", ""],
          ["Date", ""],
        ],
      },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(
      `${hi(ctx)} to set you up at ${J} we need a few details: your PAN, where to pay you, and someone to call in an emergency. Please print the attached form, fill it in by hand and sign it. Hand it to me in person rather than sending bank details over chat. It is kept in a restricted file.`,
    );
  },
};

/* ───────────────────────────── 4. Code of Conduct ───────────────────────────── */

export const codeOfConductAck: SignTemplate = {
  id: "code-of-conduct-ack",
  version: "1.0",
  title: "Code of Conduct: Acknowledgement",
  name: "Code of Conduct",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "The JOVE Code of Conduct in full, with the person's signature that they have read it and will follow it.",
  when: "At onboarding, before the first workshop, and again when the Code changes",
  series: "HR",
  source: "19_HR_TEAM/06_Code_of_Conduct.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EVERYONE],
  lawyer: [
    "Consequences (clause 8): for employees, confirm the steps a fair disciplinary process needs before a warning, a suspension or a dismissal.",
  ],
  fields: [{ key: "mediaLead", label: "Official channels are run by", kind: "text", default: "Chinmay R M", half: true, help: "The Code of Conduct names who runs JOVE's official social media channels." }],
  build(ctx) {
    const J = jove(ctx);
    return [
      { t: "title", text: "Code of Conduct: Acknowledgement", sub: `For everyone who represents ${J}` },
      { t: "p", text: `We are guests in schools and role models for children. This is how everyone who represents ${J} behaves.` },
      {
        t: "clause",
        title: "Our values in action",
        items: [
          `${b("Vision:")} think a step ahead, and leave the school better than we found it.`,
          `${b("Excellence:")} prepare, check the kit, and finish what we start.`,
          `${b("Honesty:")} promise only what ${J} can deliver. Never invent results, testimonials or numbers.`,
          `${b("Care:")} children first, then colleagues, then the work.`,
        ],
      },
      { t: "clause", title: "With children", items: [`Follow the ${J} Child Protection and Safeguarding Policy at all times. No private contact, no unsupervised one-to-one, no unapproved photographs, no shaming.`] },
      {
        t: "clause",
        title: "With schools and parents",
        items: [`Be punctual: the team arrives at the agreed time. Dress in ${J} wear, greet the staff, respect the school's rules, and ask before using any space. Take criticism humbly and report it to a founder.`],
      },
      {
        t: "clause",
        title: "With each other",
        items: ["Treat colleagues with respect, without discrimination or harassment. Disagree in private and support decisions in public. Share credit and own mistakes. Do not gossip about clients or colleagues."],
      },
      {
        t: "clause",
        title: "Professional standards",
        items: [
          "Arrive rested and sober. No alcohol, tobacco or drugs on duty.",
          "Use kits and tools as trained, and report damage honestly.",
          "Keep school and student data confidential. Never post workshop photographs of children on personal accounts.",
          "Declare a conflict of interest, for example working for a competitor or accepting a gift from a vendor.",
          "No bribes, kickbacks or personal deals with schools or vendors.",
          "Respect intellectual property: use only licensed music, images and software.",
        ],
      },
      {
        t: "clause",
        title: "Social media",
        items: [`Do not post about ${J}, schools or students without the media team's approval. Never criticise a school or a colleague online. The official channels are run by ${fill(ctx, "mediaLead", 45)} and the media team.`],
      },
      {
        t: "clause",
        title: "Reporting concerns",
        items: [
          "Raise a concern with a founder. If the concern involves a founder, write to the other founder. Retaliation against anyone who raises a concern in good faith is a breach of this Code. Safeguarding concerns follow the Child Protection and Safeguarding Policy and are reported the same day.",
        ],
      },
      {
        t: "clause",
        title: "Consequences",
        items: ["A breach may lead to a warning, suspension from assignments or the end of the engagement and, where the law requires, a report to the authorities. A serious safeguarding or integrity breach means immediate removal."],
      },
      { t: "h", text: "Acknowledgement" },
      { t: "p", text: `${iAm(ctx)} have read the ${J} Code of Conduct set out above. I have had the chance to ask questions about it, and I agree to follow it.` },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(`${hi(ctx)} attached is the ${J} Code of Conduct. It is short, and it is how all of us behave in schools and with each other. Please read it, sign the acknowledgement at the end and bring it to your first day, or send me a clear scan. Ask me about anything in it.`);
  },
};

/* ───────────────────────────── 5. Child protection declaration ───────────────────────────── */

export const childProtectionDeclaration: SignTemplate = {
  id: "child-protection-declaration",
  version: "1.1",
  title: "Child Protection and Safeguarding Declaration",
  name: "Child protection declaration",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "The safeguarding rules a person follows in a school, how a concern is reported, and a self-declaration, signed before the first school visit.",
  when: "Before the first school visit, and again when the policy changes",
  series: "HR",
  source: "18_LEGAL_CONSENT/04_Child_Protection_and_Safeguarding_Policy.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EVERYONE],
  lawyer: [
    "Reporting under the Protection of Children from Sexual Offences Act, 2012: confirm the wording of the duty to report, and who at JOVE makes the report.",
    "The statements about convictions, pending cases and removal from work with children are usual practice for work with children, not wording from the library. Confirm they are fair and lawful to ask of every team member, and what JOVE does when a box is left unticked.",
    "The library asks for this policy to be aligned with each school's own child-protection policy and with any state or board guidelines.",
    "A person is taken off work with children while a concern about them is looked into. Whether an employee is paid during that time is not stated anywhere: decide.",
  ],
  fields: [
    { key: "dsl", label: "Designated Safeguarding Lead", kind: "text", default: "Shivaprasad Reddy S S, Founder & CEO", help: "The founder every safeguarding concern is reported to, as the policy names." },
    { key: "deputy", label: "Deputy, when the concern involves the Lead", kind: "text", default: "Chinmay R M, Co-Founder & Chief Creative Officer" },
  ],
  build(ctx) {
    const J = jove(ctx);
    return [
      { t: "title", text: "Child Protection and Safeguarding Declaration", sub: `Signed by everyone who represents ${J} in a school, before the first visit` },
      { t: "p", text: `${J} works with children aged about 6 to 16 in schools. Their safety, dignity and wellbeing come before any workshop, film or schedule.` },
      { t: "p", text: `${iAm(ctx)} will follow the rules below in every school and at every ${J} event. Where a school's own rule is stricter, I follow the school.` },
      { t: "h", text: "The rules I follow" },
      {
        t: "list",
        ordered: true,
        items: [
          `${b("Never alone with a child.")} I work in open, visible areas with a member of the school's staff present. No closed doors, no one-to-one in an empty room, no private transport. I do not take a child out of the supervised area.`,
          `${b("Physical contact.")} A high-five or a pat on the shoulder is the limit, and I ask first. I guide with words or by showing on a spare kit, and touch a child's hand only to keep the child safe. I do not hug, carry, tickle or sit a child on my lap.`,
          `${b("No private contact.")} I do not ask for or share a child's phone number, social media handle or address. I do not add or message a child online. All communication goes through the school.`,
          `${b("Photographs and video.")} Only the ${J} media team photographs or films children, and only those whose parents have given signed consent. I never photograph or film a child on my own phone. No child is filmed in a toilet, a changing area or a medical area, or in a way that could embarrass the child.`,
          `${b("Respect and dignity.")} I treat every child equally and speak respectfully. No physical punishment, shouting, shaming, sarcasm, comparing of children, favouritism, threats or discriminatory remarks.`,
          `${b("No gifts and no secrets.")} I do not give a child gifts, money, sweets or favours, and I never promise a child secrecy.`,
          `${b("Fit for work.")} I am never under the influence of alcohol or drugs, and I do not smoke or chew tobacco on a school campus. I wear the ${J} ID badge and uniform.`,
          `${b("Tools and kits.")} I use only the kits and tools ${J} has approved. Children never use hot tools, cutting blades or mains-powered equipment; hot tools are used only by the team, away from students.`,
        ],
      },
      { t: "h", text: "If I have a concern" },
      {
        t: "list",
        ordered: true,
        items: [
          "If a child tells me something troubling, I listen calmly. I do not promise secrecy, question the child for detail or investigate. As soon as I can, I write down the child's own words, the time, the place and who was present.",
          `At once I tell the Designated Safeguarding Lead of ${J}: ${b(fill(ctx, "dsl", 70))}. If the concern involves the Lead, or the Lead cannot be reached, I tell the deputy: ${b(fill(ctx, "deputy", 60))}. The Lead tells the school's principal or designated child-protection person the same day; if I cannot reach either of them, I tell the school's designated person myself.`,
          "If I see inappropriate behaviour towards a child by anyone, a colleague included, I make the child safe and report it to the Lead at once. A report made in good faith never leads to a penalty.",
          "I keep a concern confidential. I put the facts in a private note to the Lead, not in a group chat, and share them only with those who need to know.",
          "Indian law, including the Protection of Children from Sexual Offences Act, 2012, requires a person who knows of certain offences against a child to report them to the police or the Special Juvenile Police Unit. The child helpline is 1098.",
          `If a concern is raised about me, I understand that ${J} will take me off work with children at once while it is looked into, will inform the school, and will report to the authorities where the law requires.`,
        ],
      },
      { t: "h", text: "My declaration" },
      { t: "p", text: TICK_NOTE },
      {
        t: "checks",
        items: [
          `I have read the ${J} Child Protection and Safeguarding Policy and the rules above, and I will follow them.`,
          ...cleanRecord(J),
          `I will complete the safety and child-protection briefing before my first school visit, and a refresher every 6 months.`,
          `I understand that breaking these rules can end my engagement with ${J} and can be reported to the authorities.`,
        ],
      },
      { t: "fields", rows: [[`Anything I must tell ${J} about these statements (write "Nothing" if there is nothing)`, ""]], cols: 1 },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(
      `${hi(ctx)} children's safety comes before everything else at ${J}, so everyone signs the attached Child Protection and Safeguarding Declaration before a first school visit. Please read the rules carefully, tick the statements that are true, sign it and bring it with you. If you cannot tick a statement, or anything is unclear, call me first and we will talk it through.`,
    );
  },
};

/* ───────────────────────────── 6. POSH acknowledgement ───────────────────────────── */

export const poshAck: SignTemplate = {
  id: "posh-ack",
  version: "1.0",
  title: "Prevention of Sexual Harassment: Acknowledgement",
  name: "POSH acknowledgement",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "JOVE's policy against sexual harassment, discrimination and bullying, how to raise a concern, and the person's acknowledgement.",
  when: "At onboarding, before the first workshop or trip",
  series: "HR",
  source: "19_HR_TEAM/09_POSH_and_Workplace_Policy_Note.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EVERYONE],
  lawyer: [
    "How the POSH Act, 2013 applies to JOVE's freelancers and interns and on the school campuses it visits, and who counts towards the ten-employee threshold: the library asks for this to be confirmed.",
    "The external person for a complaint about a founder is still blank in the policy. Name one in the box, or the paper leaves that route out.",
    "Get the current office and contact of the Local Committee of the district and type it in the box.",
    "The Act's time limit for a complaint to a committee is not in the policy and not on the paper: decide whether to add it.",
    "The Act protects women, while JOVE's policy covers everyone and adds discrimination and bullying: confirm the wider policy is worded as intended.",
    "The composition of an Internal Committee once JOVE reaches ten employees is marked for confirmation in the library.",
  ],
  fields: [
    { key: "external", label: "External person for complaints (optional)", kind: "text", placeholder: "Name, phone or email", help: "Someone outside JOVE a person can write to when the concern involves a founder. Left empty, the paper does not mention this route." },
    { key: "localCommittee", label: "Local Committee of the district (optional)", kind: "text", placeholder: "Office and phone or email", help: "The district committee that hears complaints under the POSH Act while JOVE has fewer than ten employees. Ask the district administration for the current contact." },
  ],
  build(ctx) {
    const J = jove(ctx);
    const external = val(ctx, "external");
    const committee = val(ctx, "localCommittee");
    return [
      { t: "title", text: "Prevention of Sexual Harassment: Acknowledgement", sub: `For everyone working with or for ${J}` },
      {
        t: "p",
        text: `${J} does not tolerate sexual harassment or any form of discrimination or bullying. This applies at workshops, in the vehicle, on trips, in messaging groups, at events and online. ${J} follows this policy from its first day, whatever its size, because its team works in schools, travels together and sometimes stays overnight.`,
      },
      { t: "h", text: "What is not acceptable" },
      {
        t: "list",
        items: [
          "Unwelcome physical contact or advances.",
          "Sexual remarks or jokes, and showing sexual material.",
          "Persistent unwelcome messages or calls.",
          "Comments about a person's appearance.",
          "Discrimination based on gender, religion, caste, region, language, disability or sexual orientation.",
          "Retaliation against anyone who complains.",
        ],
      },
      { t: "h", text: "How to raise a concern" },
      {
        t: "list",
        ordered: true,
        items: [
          `Speak to a founder or write to one. If the concern involves a founder, write to the other founder${external || ctx.blank ? `, or to the external person ${J} has nominated: ${fill(ctx, "external", 70)}` : ""}.`,
          `A written complaint is preferred but not required. ${J} will help you write it.`,
          "A complaint is acknowledged within 24 hours, handled confidentially, and investigated fairly, with both sides heard.",
          "Interim steps may include separating work assignments, with no loss of pay for the person who complained.",
          "Outcomes range from counselling to ending the engagement. Where the law requires, the matter goes to the Internal Committee or the Local Committee, or to the police.",
          "No retaliation. Retaliation is itself misconduct.",
        ],
      },
      { t: "h", text: "The committee under the law" },
      {
        t: "p",
        text: `The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 requires an employer with ten or more employees to set up an Internal Committee. While ${J} has fewer than ten employees, a complaint under the Act goes to the Local Committee of the district${committee || ctx.blank ? `, which can be reached at ${fill(ctx, "localCommittee", 70)}` : ""}. ${J}'s own process does not take away anyone's right to go to the Local Committee or to the police. When ${J} reaches ten employees it will set up an Internal Committee and display its members' contact details.`,
      },
      { t: "h", text: "Trips and overnight stays" },
      { t: "p", text: "The itinerary and the accommodation details of a trip are shared with a founder. Rooms are separate, and no one is pressured to share a room. Safe transport is arranged for anyone travelling late, and no one is left alone at a school." },
      { t: "h", text: "Acknowledgement" },
      {
        t: "p",
        text: `${iAm(ctx)} have read this policy. I will not harass, bully or discriminate against anyone I meet through my work with ${J}. I know how to raise a concern, and that no one is penalised for raising one in good faith. I will keep confidential what I learn about another person's complaint.`,
      },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(
      `${hi(ctx)} attached is the ${J} policy against sexual harassment, discrimination and bullying. It says what is not acceptable and exactly who to speak to if something happens to you or to a colleague. Please read it, sign the acknowledgement and return it at onboarding. You can raise a concern with either founder at any time, in confidence.`,
    );
  },
};

/* ───────────────────────────── 7. Data privacy undertaking ───────────────────────────── */

export const dataPrivacyUndertaking: SignTemplate = {
  id: "data-privacy-undertaking",
  version: "1.0",
  title: "Data Privacy and Confidentiality Undertaking",
  name: "Data privacy undertaking",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "The working rules for anyone who handles students', parents' and schools' data: what to collect, where it is kept, sharing, breaches and deletion.",
  when: "At onboarding, before HQ access or a class list is given",
  series: "HR",
  source: "18_LEGAL_CONSENT/05_Data_Privacy_Policy_Internal.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EVERYONE],
  lawyer: [
    "The Digital Personal Data Protection Act, 2023 and its rules are being phased in. Confirm the current duties: notice, verifiable consent of a parent, and reporting a breach to the Data Protection Board with its timelines.",
    "Reporting a suspected breach to a founder 'within the hour' follows the policy's rule to contain a breach within the hour. Confirm it is the standard you want every team member held to.",
    "The grievance contact (name and email) is still blank in the privacy policy, and the times for answering a request are in brackets.",
  ],
  fields: [],
  build(ctx) {
    const J = jove(ctx);
    return [
      { t: "title", text: "Data Privacy and Confidentiality Undertaking", sub: `For everyone with access to ${J} HQ or to school data` },
      {
        t: "p",
        text: `${J} handles children's names, grades, photographs and videos, and the contact details of parents, teachers and schools. Under the Digital Personal Data Protection Act, 2023 children's data gets extra protection. ${iAm(ctx)} undertake to follow the rules below whenever I handle personal data for ${J}.`,
      },
      { t: "h", text: "Collect and use only what is needed" },
      {
        t: "list",
        items: [
          "For a child I collect only the name, the grade and the school. Never a child's home address, phone number, Aadhaar number or biometric data.",
          `Parents' consent for participation and for media is collected by the school on ${J}'s consent form. I do not contact children or parents directly for marketing.`,
          "I use personal data only for the purpose it was given for, such as certificates, attendance, run sheets, delivery and invoicing. I do not sell it, share it for advertising, or use children's images to train AI models.",
          "I do not add trackers, advertising pixels or behavioural profiling to any page that children use.",
        ],
      },
      { t: "h", text: "Where data is kept and how it is shared" },
      {
        t: "list",
        items: [
          `Personal data stays in ${J} HQ, the File Vault, the company's Google Drive and the studio's drives. I do not keep it in a personal email, drive or chat, and I do not upload it to a personal or unvetted AI tool, file converter or free hosting service.`,
          "A class list is shared with a trainer only for the assigned workshop, as a printout or a restricted view. I do not forward class lists or children's photographs on WhatsApp groups. Files are shared by access-controlled links, and the access is removed after delivery.",
          "Children are filmed only on the crew's devices. I keep no child's face in my own phone gallery, and raw footage is never shared from a personal account.",
          "A full bank account number is never entered in HQ: the last four digits only.",
        ],
      },
      { t: "h", text: "Logins and devices" },
      {
        t: "list",
        items: [
          "I use my login only for my own work and give no password to anyone else. I never send a password in a chat or an email, or write one in a document.",
          `For ${J} accounts I use a password manager, a different password for each account, and two-factor authentication on email and on every account that offers it.`,
          `A device I use for ${J} work has full-disk encryption, a screen lock of under five minutes and automatic updates. I do not open HQ on a public computer, and I sign out after using a device that others also use.`,
          "Before I act on a message that asks for a password, an urgent payment or a change of bank details, I check the sender and confirm by calling the person on a known number.",
        ],
      },
      { t: "h", text: "If something goes wrong" },
      {
        t: "p",
        text: `I tell a founder at once, and within the hour, if I lose a device used for ${J} work, think someone else has used my login, or learn that personal data has been lost, sent to the wrong person or seen by someone who should not see it. I do not hide it or try to fix it quietly. The founders contain it, record it, and inform the schools or people affected and the Data Protection Board of India as the rules require.`,
      },
      { t: "h", text: "Requests and deletion" },
      {
        t: "list",
        items: [
          "If a parent, a teacher, a school or a customer asks to see, correct or delete their data, or withdraws consent, I pass the request to a founder without delay.",
          "When a workshop or a task is over I keep no copy of a class list or of other personal data. Printouts go back to a founder or are shredded, not thrown away, and files are deleted from my devices.",
          `When my engagement ends I return or delete every file and paper that belongs to ${J}, and my access is removed the same day.`,
          "If a founder tells me that a dispute or an investigation is expected, I stop deleting the related records until I am told otherwise.",
        ],
      },
      { t: "h", text: "Undertaking" },
      {
        t: "p",
        text: `I have read the ${J} Data Privacy Policy and will read it again each year. I will keep the data of schools, students and parents confidential during my work with ${J} and after it ends. I understand that breaking these rules is a breach of the Code of Conduct and can end my engagement.`,
      },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(
      `${hi(ctx)} at ${J} we hold children's names and photographs, so everyone signs the attached Data Privacy and Confidentiality Undertaking before getting HQ access or a class list. It sets out the working rules: what we collect, where it is kept, and what to do within the hour if something goes wrong. Please read it, sign it and return it at onboarding.`,
    );
  },
};

/* ───────────────────────────── 8. Media release (team) ───────────────────────────── */

export const mediaReleaseTeam: SignTemplate = {
  id: "media-release-team",
  version: "1.0",
  title: "Media Release (Team)",
  name: "Team media release",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "An employee or an intern allows JOVE and FrameMind AI Studio to photograph and film them at work and to use it to promote JOVE.",
  when: "At onboarding, before the first shoot day",
  series: "HR",
  source: "18_LEGAL_CONSENT/03_Freelance_Trainer_Agreement_and_NDA.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EMPLOYEES_AND_INTERNS],
  lawyer: [
    "The paper says no separate payment or royalty is due for the use of a team member's image. The library is silent on this: confirm it is what you intend.",
    "The paper excludes using a person's image or voice to train an AI model or to create a likeness. This limit is not in the library; it is added to be fair to the person: confirm you want it.",
    "Withdrawal covers future use, and the paper says printed and delivered copies cannot be recalled. Confirm what JOVE must take down from its own website and channels after a withdrawal under the Digital Personal Data Protection Act, 2023.",
    "The permission continues after the person leaves, until it is withdrawn: confirm. Keep the signed release for as long as media of the person is in use, even past the 8 years in the retention schedule.",
    "Freelance trainers give the same permission in clause 7 of their agreement, without tick boxes: decide whether trainers should sign this release too.",
  ],
  fields: [],
  build(ctx) {
    const J = jove(ctx);
    return [
      { t: "title", text: "Media Release (Team)", sub: "Permission to photograph and film a team member at work" },
      { t: "p", text: `${J} films its workshops through its in-house film studio, FrameMind AI Studio, and the team appears in those photographs and films. This release records what I allow.` },
      { t: "p", text: `${iAm(ctx)} allow ${J} and FrameMind AI Studio to photograph, film and record me while I work for ${J}, and to use what I tick in the ways set out below.` },
      { t: "h", text: "What I allow" },
      { t: "p", text: "Tick each one you allow." },
      { t: "checks", items: ["Photographs of me at work", "Video of me at work", "My recorded voice", "My name and role in captions and credits"] },
      { t: "h", text: "How it is used" },
      {
        t: "list",
        items: [
          `To promote ${J}: on its website and social media channels, in its brochures, proposals and presentations, and in its portfolio.`,
          `In the photographs, reels and films ${J} delivers to a school, which the school may use for its own marketing and admissions.`,
          `The photographs, films and recordings belong to ${J}. No separate payment or royalty is due to me for this use.`,
          "This permission does not cover using my image or voice to train an AI model, or to make me appear to say or do something I did not. That needs my separate written consent.",
          `The permission continues after my engagement with ${J} ends, until I withdraw it.`,
        ],
      },
      { t: "h", text: "My own channels" },
      { t: "p", text: `I will not post photographs or video of students, schools or ${J} kits on my personal channels without the approval of the media team, and I will not photograph or film children on my own phone.` },
      { t: "h", text: "Withdrawing this permission" },
      { t: "p", text: `I may withdraw this permission for future use at any time by writing to a founder. ${J} stops new use of my image, voice and name from the day it receives my letter. It cannot recall what has already been printed or delivered to a school.` },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    const J = jove(ctx);
    return plain(
      `${hi(ctx)} our studio films every ${J} workshop, and you will be in some of those photographs and films. The attached release asks what you are comfortable with: tick what you allow, sign it and return it before your first shoot day. You can change your mind later by writing to me.`,
    );
  },
};

export const TEAM_POLICIES: SignTemplate[] = [ndaIp, backgroundVerificationConsent, joiningDetails, codeOfConductAck, childProtectionDeclaration, poshAck, dataPrivacyUndertaking, mediaReleaseTeam];
