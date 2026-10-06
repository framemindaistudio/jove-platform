import { ALL, type Role, type SessionUser } from "./roles";
import { passwordStamp, type Session } from "./session";

/** Shared by proxy.ts and server code — no Node-only imports here. */

export interface ConfiguredUser extends SessionUser {
  password: string; // plain or "sha256:<hex>"
}

/**
 * Users come from the HQ_USERS environment variable (JSON array):
 * [{"username":"shiva","name":"Shivaprasad Reddy S S","role":"founder","password":"sha256:..."}]
 * Create it with:  node scripts/make-hq-env.mjs   ·   change one login with:  node scripts/hq-user.mjs
 * An entry whose role is not recognised is ignored, so a typing mistake shows up at once as a login that does not work.
 */
export function configuredUsers(): ConfiguredUser[] {
  const raw = process.env.HQ_USERS;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((u) => u && u.username && u.password && ALL.includes(u.role))
      .map((u) => ({ username: String(u.username).toLowerCase(), name: String(u.name || u.username), role: u.role as Role, password: String(u.password) }));
  } catch {
    return [];
  }
}

/**
 * A signed-in session, checked against today's HQ_USERS: the account must still exist with the same password, and
 * its role and name are taken from there rather than from the cookie. So removing someone, changing their role or
 * giving the login a new password takes effect on their very next click — not when a 7-day session runs out.
 */
export async function liveUser(session: Session | null): Promise<SessionUser | null> {
  if (!session) return null;
  const user = configuredUsers().find((u) => u.username === session.username.toLowerCase());
  if (!user || !session.stamp || session.stamp !== (await passwordStamp(user.password))) return null;
  return { username: user.username, name: user.name, role: user.role };
}
