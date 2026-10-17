/**
 * Every document JOVE gets signed, in the order HQ lists them. To add one: write the template in templates/ and add it
 * to the list here.
 */
import { dronePermission } from "./templates/drone";
import { offerLetter } from "./templates/offer";
import { PARTNER_DOCS } from "./templates/partners";
import { SCHOOL_DOCS } from "./templates/schools";
import { TEAM_LETTERS } from "./templates/team-letters";
import { TEAM_POLICIES } from "./templates/team-policies";
import { trainerAgreement } from "./templates/trainer";
import type { DocGroup, SignTemplate } from "./types";

export const GROUPS: { id: DocGroup; title: string; note: string }[] = [
  { id: "joining", title: "Team: joining", note: "What a new person signs before the first day: the offer or agreement, and the papers that go with it." },
  { id: "policies", title: "Team: policies and declarations", note: "What everyone who works with JOVE signs once, and again when a policy changes." },
  { id: "exit", title: "Team: later letters and leaving", note: "Confirmation, authority to act for JOVE, handing things over, and the papers for the last day." },
  { id: "school", title: "Schools", note: "What a school signs for a workshop: the agreement, the permissions, and the papers that close the day." },
  { id: "events", title: "Parents and public events", note: "Consent and waivers signed by parents and participants." },
  { id: "partners", title: "Vendors and partners", note: "Confidentiality and working terms with suppliers, colleges and sponsors." },
];

const ORDER = GROUPS.map((g) => g.id);

/** All templates, grouped in the order above; inside a group, in the order they were written. */
export const TEMPLATES: SignTemplate[] = [offerLetter, trainerAgreement, ...TEAM_LETTERS, ...TEAM_POLICIES, ...SCHOOL_DOCS, dronePermission, ...PARTNER_DOCS]
  .map((t, i) => ({ t, i }))
  .sort((a, b) => ORDER.indexOf(a.t.group) - ORDER.indexOf(b.t.group) || a.i - b.i)
  .map(({ t }) => t);

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));
/** A template by its id. Looked up among the real ones only: an id from a link is never trusted to exist. */
export const templateById = (id: string | undefined | null) => (id ? byId.get(id) : undefined);

export const templatesIn = (group: DocGroup) => TEMPLATES.filter((t) => t.group === group);

/** The papers a team member of this group must have ("Founder", "Full-time", "Part-time", "Freelance", "Intern"). */
export const requiredForMember = (group: string) => TEMPLATES.filter((t) => t.parties.includes("team") && t.requiredFor?.includes(group));
/** The papers every booked workshop needs from its school. */
export const requiredForSchool = () => TEMPLATES.filter((t) => t.parties.includes("school") && t.requiredForSchools);
