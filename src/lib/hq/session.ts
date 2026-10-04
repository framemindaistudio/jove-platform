import { SignJWT, jwtVerify } from "jose";
import type { Role, SessionUser } from "./roles";

/** Shared by proxy.ts and server code — no Node-only imports here. */
export const SESSION_COOKIE = "jove_hq";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.HQ_SESSION_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV !== "production") return new TextEncoder().encode("jove-dev-only-secret-change-me-please-32+chars");
  return null;
}

export async function signSession(user: SessionUser) {
  const key = secret();
  if (!key) throw new Error("HQ_SESSION_SECRET is not set (min 32 characters).");
  return new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifySession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const key = secret();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (!payload.sub || !payload.role) return null;
    return { username: payload.sub, name: String(payload.name ?? payload.sub), role: payload.role as Role };
  } catch {
    return null;
  }
}
