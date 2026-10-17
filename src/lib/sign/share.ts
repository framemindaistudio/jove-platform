/**
 * Sending a paper to be signed: a private link to it, kept on the paper's record, and the reminder rules.
 *
 *   share: { token, createdOn, expiresOn, stopped?, sentTo?, sentOn?, via[], openedOn?, remind, reminders[] }
 *
 * The link opens that one paper (/papers/<token>), to print or save as a PDF. It is long and random, so it cannot be
 * guessed; it ends on expiresOn, or at once when a founder switches it off. Pure functions only.
 */
import type { SignTemplate } from "./types";
import type { SignDoc } from "./context";

export interface Share {
  token: string;
  createdOn: string;
  expiresOn: string;
  stopped?: boolean;
  /** the address it was emailed to */
  sentTo?: string;
  sentOn?: string;
  via: ("email" | "whatsapp" | "link")[];
  /** first opened by someone who has the link */
  openedOn?: string;
  /** remind them by email until it is signed */
  remind: boolean;
  /** dates reminders went out */
  reminders: string[];
}

export const LINK_DAYS = 30;
export const MAX_REMINDERS = 3;
export const REMIND_EVERY_DAYS = 4;

const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : "");
export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export function shareOf(doc: Pick<SignDoc, "share"> | null | undefined): Share | null {
  const s = (doc as { share?: unknown } | null | undefined)?.share;
  if (!s || typeof s !== "object" || typeof (s as Share).token !== "string" || !(s as Share).token) return null;
  const v = s as Partial<Share>;
  return {
    token: v.token!,
    createdOn: day(v.createdOn),
    expiresOn: day(v.expiresOn),
    stopped: v.stopped === true,
    sentTo: typeof v.sentTo === "string" ? v.sentTo : undefined,
    sentOn: day(v.sentOn) || undefined,
    via: Array.isArray(v.via) ? v.via.filter((x): x is Share["via"][number] => x === "email" || x === "whatsapp" || x === "link") : [],
    openedOn: day(v.openedOn) || undefined,
    remind: v.remind !== false,
    reminders: Array.isArray(v.reminders) ? v.reminders.map(day).filter(Boolean) : [],
  };
}

/** The link works: not switched off, not past its date, and the paper not withdrawn. */
export function linkLive(doc: SignDoc, today: string) {
  const s = shareOf(doc);
  return !!s && !s.stopped && (!s.expiresOn || s.expiresOn >= today) && doc.status !== "void";
}

/** A new link lasts 30 days, and at least two weeks past the date it is due back. */
export function expiryFor(today: string, dueBy?: string) {
  const a = addDays(today, LINK_DAYS);
  const b = day(dueBy) ? addDays(day(dueBy), 14) : "";
  return b > a ? b : a;
}

/** Still waiting for the other side's signature. */
export function waitingForThem(doc: SignDoc, template: Pick<SignTemplate, "signs"> | undefined) {
  return doc.status === "issued" && (template?.signs ?? "both") !== "jove" && doc.partySigned !== true;
}

/**
 * Whether a reminder goes out today: the paper was emailed, is still unsigned, the link works and reminders are on;
 * at most three, four days apart, and one the day before it is due.
 */
export function reminderDue(doc: SignDoc, template: Pick<SignTemplate, "signs"> | undefined, today: string): boolean {
  const s = shareOf(doc);
  if (!s || !s.sentTo || !s.remind || !linkLive(doc, today) || !waitingForThem(doc, template)) return false;
  if (s.reminders.length >= MAX_REMINDERS || s.reminders.includes(today)) return false;
  const last = s.reminders.at(-1) || s.sentOn || "";
  if (!last || last === today) return false;
  const due = day(doc.dueBy);
  if (due && addDays(today, 1) === due) return true;
  return daysBetween(last, today) >= REMIND_EVERY_DAYS;
}

/** A link nobody can guess: 24 random bytes, written for an address. */
export function newToken(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
