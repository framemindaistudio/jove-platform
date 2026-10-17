/**
 * Careers: the open roles and the application form's questions.
 * Used by the /careers page, the application form, the public form handler and the HQ lead view, so the role names
 * and choices are written once.
 */

export type RoleId = "trainer" | "lead-trainer" | "media" | "partnerships" | "other";

/** The roles an applicant can choose in the form (the long descriptions live on the careers page). */
export const APPLY_ROLES: { id: RoleId; code: string; title: string; short: string; type: string }[] = [
  { id: "trainer", code: "R-01", title: "Freelance Robotics & AI Trainer", short: "Teach hands-on sessions on JOVE Days", type: "Freelance · per workshop day" },
  { id: "lead-trainer", code: "R-02", title: "Lead Trainer", short: "Run a hall and guide the trainers", type: "Senior freelance" },
  { id: "media", code: "R-03", title: "Video Editor / Media Intern", short: "Edit the reels and films schools receive", type: "Internship or freelance" },
  { id: "partnerships", code: "R-04", title: "School Partnerships Associate", short: "Meet principals and help schools book", type: "Part-time or full-time" },
  { id: "other", code: "R-00", title: "Something else", short: "Tell us the role you have in mind", type: "Open" },
];

export const roleTitle = (id: unknown) => APPLY_ROLES.find((r) => r.id === id)?.title ?? "";

/** What each role is asked to tick. */
export const SKILLS: Record<RoleId, string[]> = {
  trainer: ["Arduino", "Basic electronics", "Sensors and motors", "Block coding (Scratch)", "Python", "AI / machine learning", "3D printing", "Taught children before"],
  "lead-trainer": ["Arduino", "Sensors and motor drivers", "Python", "AI / machine learning", "Taught a full class", "Led other trainers", "Robotics competitions", "Curriculum writing"],
  media: ["Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "CapCut", "After Effects", "Camera operation", "Colour grading", "Audio and music sync"],
  partnerships: ["School sales or outreach", "Phone calls with strangers", "Presentations", "Spreadsheets or a CRM", "Event coordination", "Ed-tech experience"],
  other: [],
};

export const LANGUAGES = ["English", "Kannada", "Hindi", "Telugu", "Marathi", "Tamil", "Urdu"];
export const AVAILABILITY = ["Weekdays", "Saturdays", "Sundays", "College holidays", "Any day with a week's notice"];
export const TRAVEL = ["Yes, anywhere in Karnataka", "Within my district", "Not able to travel"];
export const HEARD = ["Instagram", "LinkedIn", "WhatsApp", "A friend or a JOVE trainer", "My college", "Google", "Other"];

/** The showreel is the application for the editor role. */
export const linksRequired = (role: RoleId) => role === "media";

export interface Application {
  role: RoleId;
  roleOther: string;
  /** what they do now: "B.E. ECE, 3rd year" or "Robotics trainer at …" */
  current: string;
  student: boolean;
  experience: number;
  skills: string[];
  languages: string[];
  availability: string[];
  travel: string;
  links: string;
  startFrom: string;
  heardFrom: string;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = (v: unknown, allowed: string[]) => (Array.isArray(v) ? [...new Set(v.map(String).filter((x) => allowed.includes(x)))] : []);

/** Keeps only known choices and short text; anything else is dropped. */
export function cleanApplication(v: unknown): Application | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const a = v as Record<string, unknown>;
  const role = APPLY_ROLES.find((r) => r.id === a.role)?.id;
  if (!role) return undefined;
  const years = Math.round(Number(a.experience) * 2) / 2;
  return {
    role,
    roleOther: role === "other" ? text(a.roleOther, 80) : "",
    current: text(a.current, 120),
    student: a.student === true,
    experience: Number.isFinite(years) ? Math.min(40, Math.max(0, years)) : 0,
    skills: pick(a.skills, SKILLS[role]),
    languages: pick(a.languages, LANGUAGES),
    availability: pick(a.availability, AVAILABILITY),
    travel: TRAVEL.includes(String(a.travel)) ? String(a.travel) : "",
    links: text(a.links, 600),
    startFrom: /^\d{4}-\d{2}-\d{2}$/.test(String(a.startFrom)) ? String(a.startFrom) : "",
    heardFrom: HEARD.includes(String(a.heardFrom)) ? String(a.heardFrom) : "",
  };
}

/** The applied-for role as one line: "Lead Trainer", or "Something else: Operations Intern". */
export const appliedFor = (a: Pick<Application, "role" | "roleOther">) => (a.role === "other" ? `Something else${a.roleOther ? `: ${a.roleOther}` : ""}` : roleTitle(a.role));
