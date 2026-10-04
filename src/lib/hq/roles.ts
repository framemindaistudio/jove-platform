/** HQ access roles. Configure users in the HQ_USERS env var (see .env.example). */
export type Role = "founder" | "admin" | "ops" | "trainer" | "media";

export const roleLabels: Record<Role, string> = {
  founder: "Founder",
  admin: "Admin",
  ops: "Operations",
  trainer: "Trainer",
  media: "Media",
};

export const ALL: Role[] = ["founder", "admin", "ops", "trainer", "media"];
export const LEADERSHIP: Role[] = ["founder", "admin"];
export const OPS: Role[] = ["founder", "admin", "ops"];
export const OPS_MEDIA: Role[] = ["founder", "admin", "ops", "media"];
export const OPS_TRAINER: Role[] = ["founder", "admin", "ops", "trainer"];

export interface SessionUser {
  username: string;
  name: string;
  role: Role;
}

export function can(user: Pick<SessionUser, "role"> | null | undefined, roles: Role[]) {
  return !!user && roles.includes(user.role);
}
