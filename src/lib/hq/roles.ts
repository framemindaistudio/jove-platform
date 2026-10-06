/** HQ access roles. Configure users in the HQ_USERS env var (see .env.example). */
export type Role = "founder" | "admin" | "ops" | "trainer" | "media" | "viewer";

export const roleLabels: Record<Role, string> = {
  founder: "Founder",
  admin: "Admin",
  ops: "Operations",
  trainer: "Trainer",
  media: "Media",
  viewer: "Intern (view only)",
};

/*
 * Who may OPEN what.
 *
 * "viewer" is the shared interns login. It sees the delivery and learning side only: workshops (without amounts),
 * media, certificates, feedback, curriculum, the teaching part of the library and printables. Nothing about sales,
 * money, people, stock costs, private files, settings or the activity log.
 */
export const LEADERSHIP: Role[] = ["founder", "admin"];
export const OPS: Role[] = ["founder", "admin", "ops"];
export const OPS_MEDIA: Role[] = ["founder", "admin", "ops", "media"];
export const OPS_TRAINER: Role[] = ["founder", "admin", "ops", "trainer"];
/** Everyone with a job in the company — not the interns login. */
export const STAFF: Role[] = ["founder", "admin", "ops", "trainer", "media"];
export const ALL: Role[] = ["founder", "admin", "ops", "trainer", "media", "viewer"];
/** Media Studio, content calendar, feedback and testimonials: the media side, plus interns. */
export const MEDIA_SIDE: Role[] = ["founder", "admin", "ops", "media", "viewer"];
/** Certificates: the delivery side, plus interns. */
export const DELIVERY_SIDE: Role[] = ["founder", "admin", "ops", "trainer", "viewer"];

/**
 * Who may CHANGE anything. Everyone else can look and print, and nothing more: the menus hide the edit controls and
 * the server refuses every save. To let another role edit the modules it can already open, add it here.
 */
export const EDITORS: Role[] = ["founder", "admin"];

export const VIEW_ONLY_MESSAGE = "Your account can view and print, but not change anything. Ask a founder to make this change.";

export interface SessionUser {
  username: string;
  name: string;
  role: Role;
}

export function can(user: Pick<SessionUser, "role"> | null | undefined, roles: Role[]) {
  return !!user && roles.includes(user.role);
}

/** True when this person may change records limited to `roles` — never true for a view-only account. */
export function canEdit(user: Pick<SessionUser, "role"> | null | undefined, roles: Role[] = ALL) {
  return !!user && EDITORS.includes(user.role) && roles.includes(user.role);
}

/** True for accounts that can look and print but never save. */
export function isViewOnly(user: Pick<SessionUser, "role"> | null | undefined) {
  return !!user && !EDITORS.includes(user.role);
}
