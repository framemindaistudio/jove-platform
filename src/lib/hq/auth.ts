import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";
import type { Role, SessionUser } from "./roles";

interface ConfiguredUser extends SessionUser {
  password: string; // plain or "sha256:<hex>"
}

/**
 * Users come from the HQ_USERS environment variable (JSON array):
 * [{"username":"shiva","name":"Shivaprasad Reddy S S","role":"founder","password":"sha256:..."}]
 * Generate a hash with:  node scripts/hash-password.mjs "your-password"
 */
export function configuredUsers(): ConfiguredUser[] {
  const raw = process.env.HQ_USERS;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((u) => u && u.username && u.password && u.role)
      .map((u) => ({ username: String(u.username).toLowerCase(), name: String(u.name || u.username), role: u.role as Role, password: String(u.password) }));
  } catch {
    return [];
  }
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(stored: string, given: string) {
  if (stored.startsWith("sha256:")) {
    const hash = crypto.createHash("sha256").update(given).digest("hex");
    return safeEqual(stored.slice(7).toLowerCase(), hash);
  }
  return safeEqual(stored, given);
}

export function authenticate(username: string, password: string): SessionUser | null {
  const user = configuredUsers().find((u) => u.username === username.trim().toLowerCase());
  if (!user) {
    checkPassword("sha256:" + "0".repeat(64), password); // even out timing
    return null;
  }
  if (!checkPassword(user.password, password)) return null;
  return { username: user.username, name: user.name, role: user.role };
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** For server components/pages: redirect to login (or HQ home) if not allowed. */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/hq/login");
  if (roles && !roles.includes(user.role)) redirect("/hq?denied=1");
  return user;
}

/** For route handlers: returns the user or a 401/403 response. */
export async function apiUser(roles?: Role[]): Promise<{ user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const user = await getSession();
  if (!user) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (roles && !roles.includes(user.role)) return { error: NextResponse.json({ error: "You don't have access to this" }, { status: 403 }) };
  return { user };
}
