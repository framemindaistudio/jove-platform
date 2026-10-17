/**
 * Freelance Trainer Agreement and NDA.
 * The wording follows OPERATIONS/18_LEGAL_CONSENT/03_Freelance_Trainer_Agreement_and_NDA.md, with the blanks of that
 * draft turned into boxes. Rates and rules come from 19_HR_TEAM/05 (pay) and 19_HR_TEAM/07 (availability).
 */
import { b, companyIntro, docDate, fill, firstName, jove, joveSign, money, or, partySign, plain, val } from "../text";
import type { SignTemplate } from "../types";

export const trainerAgreement: SignTemplate = {
  id: "freelance-trainer-agreement",
  version: "1.1",
  title: "Freelance Trainer Agreement and Non-Disclosure Agreement",
  name: "Trainer agreement and NDA",
  group: "joining",
  kind: "agreement",
  parties: ["team"],
  signs: "both",
  blurb: "Engages a freelance trainer per workshop day: fee, conduct, child protection, confidentiality and who owns the material.",
  when: "Before the trainer's first workshop",
  series: "HR",
  source: "18_LEGAL_CONSENT/03_Freelance_Trainer_Agreement_and_NDA.md",
  keep: "Engagement + 8 years",
  initials: true,
  requiredFor: ["Freelance"],
  marksAgreement: true,
  lawyer: [
    "Independent contractor or employee: have the classification checked for the way trainers actually work.",
    "Non-solicitation (clause 8): broad restraints after an engagement ends are hard to enforce in India; confirm the wording and the period.",
    "Stamp duty in Karnataka and whether the agreement should be on stamp paper.",
    "TDS (section 194J or 194C) on trainer fees: confirm with the CA.",
    "Insurance (clause 9): JOVE has no public liability insurance yet. Decide what happens if a trainer is hurt, or causes harm, at a workshop before a policy is in force.",
    "Seat of arbitration and courts: set in the box, confirm the choice.",
  ],
  fields: [
    { key: "role", label: "Engaged as", kind: "text", from: "member.role", default: "Freelance Trainer", half: true },
    { key: "pan", label: "Trainer's PAN (optional)", kind: "text", placeholder: "ABCDE1234F", half: true, help: "Left empty, the paper has a line to write it on." },
    { key: "fee", label: "Fee per workshop day", kind: "money", from: "member.perWorkshopRate", required: true, half: true, help: "Filled from the person's per-workshop rate in Team & Payroll. The rates for each level are in the pay policy (19_HR_TEAM/05)." },
    { key: "leadFee", label: "Fee when leading on site (optional)", kind: "money", half: true },
    { key: "travel", label: "Travel when not in JOVE's vehicle", kind: "text", default: "public transport at actual cost, with a ticket or UPI proof, when approved before the trip" },
    { key: "payDays", label: "Paid within (days of the workshop)", kind: "number", default: "7", half: true },
    { key: "noticeDays", label: "Notice to end the agreement (days)", kind: "number", default: "7", half: true },
    { key: "confidentialYears", label: "Confidentiality lasts (years after the end)", kind: "number", default: "3", half: true },
    { key: "nonSolicitMonths", label: "No approaching JOVE's schools for (months)", kind: "number", default: "12", half: true },
    { key: "seat", label: "Arbitration and courts at", kind: "text", default: "Bengaluru", half: true, help: "Your advocate confirms this choice." },
    { key: "emergency", label: "Emergency contact (optional)", kind: "text", placeholder: "Name, relation and phone", half: true },
  ],
  build(ctx) {
    const J = jove(ctx);
    const lead = val(ctx, "leadFee");
    return [
      { t: "title", text: "Freelance Trainer Agreement and Non-Disclosure Agreement" },
      {
        t: "p",
        text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${b(or(ctx.party.name, 60))}, residing at ${or(ctx.party.address.replace(/\n/g, ", "), 80)}, PAN ${fill(ctx, "pan", 34)} (the "${b("Trainer")}").`,
      },
      {
        t: "clause",
        title: "Engagement",
        items: [
          `The Trainer is engaged as ${fill(ctx, "role", 40)}, an independent freelancer and not an employee, to deliver ${J} workshops one assignment at a time. ${J} is not obliged to offer any minimum number of assignments, and the Trainer is free to decline an assignment.`,
          "Each assignment is confirmed by message or by the run sheet, stating the school, date, grade groups, reporting time, location and fee.",
          "Once the Trainer accepts an assignment it is a commitment to a school. A Trainer who must withdraw tells a founder at least 72 hours before, or at once in an emergency.",
        ],
      },
      {
        t: "clause",
        title: "Fees and expenses",
        items: [
          `Fee: ${b(money(ctx, "fee"))} for each workshop day${lead || ctx.blank ? `, and ${b(money(ctx, "leadFee"))} for a day on which the Trainer leads on site` : ""}. A half-day assignment is paid at 60% of the day fee.`,
          `Travel: the team travels in the vehicle ${J} arranges. Where the Trainer travels separately, ${J} pays for ${fill(ctx, "travel", 80)}. Meals are provided on workshop days.`,
          `Payment: within ${fill(ctx, "payDays", 12)} days of the workshop, by bank transfer or UPI, against a short invoice or payment voucher.`,
          "A workshop that the school cancels with less than 48 hours' notice pays the Trainer 50% of the fee for that day.",
          `Tax: ${J} deducts tax at source where the law requires and gives the certificate for it. The Trainer is responsible for the Trainer's own income tax and, where it applies, GST registration.`,
        ],
      },
      {
        t: "clause",
        title: "Standards of conduct",
        items: [
          `The Trainer will arrive at the reporting time in ${J} branded wear, follow the ${J} Day On-Site SOP and the Trainer Manual, and use only kits and tools approved by ${J}.`,
          `The Trainer will follow the ${J} Child Protection and Safeguarding Policy at all times: never be alone with a child, have no private contact with students, and take no photographs or video of students. Only the ${J} media team films.`,
          "The Trainer will not use alcohol or tobacco on duty, will report any accident to the founder on site at once, and will report any concern about a child to the Safeguarding Lead at once.",
        ],
      },
      {
        t: "clause",
        title: "Verification and training",
        items: [
          `Before the first assignment the Trainer will pass the demo class, give a copy of a government identity document and a police verification certificate, and complete the safety and child-protection briefing. Until the certificate arrives, a documented application is enough for the Trainer to shadow under a founder, never alone with students.`,
          `${J} may suspend assignments while a complaint or concern is looked into.`,
        ],
      },
      {
        t: "clause",
        title: "Confidentiality",
        items: [
          `"Confidential Information" means information about ${J} that is not public and that the Trainer receives because of this engagement. It includes the curriculum, lesson plans, worksheets, kit designs and bills of materials, supplier details and prices, pricing, proposals, school contacts and the sales pipeline, student and school data, financial information and media that has not been released.`,
          `The Trainer will keep Confidential Information secret, use it only to deliver ${J} work, copy it only as far as that work needs, and return or delete it when ${J} asks or when the engagement ends.`,
          `This does not cover information that is public through no fault of the Trainer, that the Trainer already lawfully knew, or that the law requires to be disclosed. Where the law allows, the Trainer tells ${J} before such a disclosure. Nothing in this Agreement stops the Trainer from reporting a concern about a child's safety, a crime or harassment to a school, a committee or an authority that the law provides for.`,
          `These duties continue for ${fill(ctx, "confidentialYears", 10)} years after the engagement ends, and without limit of time for the personal data of students.`,
        ],
      },
      {
        t: "clause",
        title: "Intellectual property",
        items: [
          `Everything the Trainer creates for ${J} under this engagement (improvements to lessons, worksheets, code, designs, videos) belongs to ${J}, and the Trainer assigns all rights in it to ${J}.`,
          `The Trainer keeps the Trainer's own earlier material and gives ${J} a licence to use any of it that the Trainer includes in ${J} work.`,
          `The Trainer will not copy or reuse the ${J} curriculum elsewhere.`,
        ],
      },
      {
        t: "clause",
        title: "Media and personal image",
        items: [
          `${J} may photograph and film the Trainer during workshops and use that media to promote ${J}.`,
          `The Trainer will not post photographs or video of students, schools or ${J} kits on personal channels without the approval of the media team.`,
        ],
      },
      {
        t: "clause",
        title: "Non-solicitation",
        items: [`For ${fill(ctx, "nonSolicitMonths", 10)} months after the engagement ends, the Trainer will not use Confidential Information to approach the schools ${J} works with in order to offer them competing workshops.`],
      },
      {
        t: "clause",
        title: "Liability and insurance",
        items: [
          "The Trainer is responsible for the Trainer's own negligent or wrongful acts.",
          `Where ${J} holds public liability insurance, it covers workshop activities carried out under the direction of ${J}.`,
          "Nothing in this Agreement limits a liability that the law does not allow to be limited.",
        ],
      },
      {
        t: "clause",
        title: "Term and ending",
        items: [
          `This Agreement starts on the date above and continues until either party ends it with ${fill(ctx, "noticeDays", 10)} days' written notice. ${J} may end it at once for a breach of clause 3, clause 5 or the Child Protection and Safeguarding Policy.`,
          "Fees for workshops already completed remain payable.",
          `When the engagement ends the Trainer returns the uniform, the ID badge, and every kit, tool and document that belongs to ${J}.`,
        ],
      },
      {
        t: "clause",
        title: "Law and disputes",
        items: [
          `This Agreement is governed by the laws of India. The parties first try to settle a dispute by discussion. A dispute that is not settled goes to a sole arbitrator under the Arbitration and Conciliation Act, 1996, with the seat at ${fill(ctx, "seat", 30)} and in English; the courts at ${fill(ctx, "seat", 30)} have jurisdiction over matters outside the arbitration.`,
          "This is the whole agreement between the parties on this subject. A change to it is made in writing and signed by both.",
        ],
      },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...joveSign(ctx), partySign(ctx, "The Trainer", { title: val(ctx, "role") || ctx.party.role })] },
      { t: "h", text: "Annexure: acknowledgement" },
      {
        t: "checks",
        items: [
          `I have received and read the ${J} Child Protection and Safeguarding Policy and the Code of Conduct, and I will follow them.`,
          "I have given a copy of my government identity document for the company's records.",
        ],
      },
      { t: "fields", rows: [["Emergency contact (name, relation, phone)", val(ctx, "emergency")], ["Trainer's signature", ""]], cols: 1 },
    ];
  },
  cover(ctx) {
    return plain(
      `Hi ${firstName(ctx.party.name) || "there"}, welcome to ${jove(ctx)}. Attached is your Freelance Trainer Agreement and NDA. Please read it, and sign and date the last page and initial the others. Bring the signed copy to your first workshop, or send us a clear scan of every page. If anything is unclear, call me and we will go through it together.`,
    );
  },
};
