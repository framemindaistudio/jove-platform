import { useSyncExternalStore } from "react";
import { payrollNet, type BaseRecord } from "@/lib/hq/collections";
import { isoDate } from "@/lib/utils";

export type Rec = BaseRecord;

export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const num = (v: unknown) => Number(v) || 0;

/* ───────────────────────── today (hydration-safe) ───────────────────────── */

const noopSubscribe = () => () => {};
/** "YYYY-MM-DD" in the browser, `null` during server render / hydration. */
export function useTodayIso(): string | null {
  return useSyncExternalStore(noopSubscribe, () => isoDate(), () => null);
}

/* ───────────────────────── months ───────────────────────── */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10" → "October 2026". */
export function monthLabel(month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return month || "—";
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/* ───────────────────────── onboarding checklist ───────────────────────── */

export const ONBOARDING = [
  { key: "idProof", label: "ID proof collected", hint: "Aadhaar / PAN / driving licence copy, filed in the HQ vault" },
  { key: "backgroundCheck", label: "Background check cleared", hint: "Police verification or two references. Sets “Background verified”.", sync: "backgroundVerified" },
  { key: "safetyTraining", label: "Safety & child-protection training", hint: "Completed the JOVE safety SOP session. Sets “Safety trained”.", sync: "safetyTrained" },
  { key: "agreement", label: "Agreement / NDA signed", hint: "Engagement letter and confidentiality. Sets “Agreement signed”.", sync: "agreementSigned" },
  { key: "payout", label: "Payout details on file", hint: "UPI ID or last 4 digits of the bank account" },
  { key: "idCard", label: "ID card printed", hint: "Worn on every school visit" },
  { key: "tshirt", label: "JOVE T-shirt issued", hint: "Branded workshop wear" },
  { key: "shadow", label: "Shadow workshop done", hint: "Observed one full JOVE Day before leading a session" },
] as const;

export type OnboardingKey = (typeof ONBOARDING)[number]["key"];
export type OnboardingState = Record<OnboardingKey, boolean>;

/** Checklist state: explicit `onboarding` values win, otherwise derive from the member's existing flags. */
export function onboardingState(member: Rec): OnboardingState {
  const saved = (member.onboarding && typeof member.onboarding === "object" ? member.onboarding : {}) as Record<string, unknown>;
  const derived: Record<OnboardingKey, boolean> = {
    idProof: false,
    backgroundCheck: member.backgroundVerified === true,
    safetyTraining: member.safetyTrained === true,
    agreement: member.agreementSigned === true,
    payout: !!str(member.payoutDetails).trim(),
    idCard: false,
    tshirt: false,
    shadow: false,
  };
  const out = { ...derived };
  for (const item of ONBOARDING) if (typeof saved[item.key] === "boolean") out[item.key] = saved[item.key] as boolean;
  return out;
}

export function onboardingProgress(member: Rec) {
  const s = onboardingState(member);
  const done = ONBOARDING.filter((i) => s[i.key]).length;
  return { done, total: ONBOARDING.length };
}

/* ───────────────────────── workshops ↔ people ───────────────────────── */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** "Chinmay" matches "Chinmay R M"; "Rahul Sharma" does not match "Rahul Verma". */
export function teamTagMatches(memberName: string, tag: string) {
  const a = norm(memberName);
  const b = norm(tag);
  if (!a || !b) return false;
  return a === b || a.startsWith(`${b} `) || b.startsWith(`${a} `);
}

function tagsOf(workshop: Rec): string[] {
  const t = workshop.team;
  if (Array.isArray(t)) return t.map(str);
  if (typeof t === "string") return t.split(",").map((s) => s.trim());
  return [];
}

export function workshopIncludes(workshop: Rec, memberName: string) {
  return tagsOf(workshop).some((t) => teamTagMatches(memberName, t));
}

export function memberWorkshops(member: Rec, workshops: Rec[]) {
  const name = str(member.name);
  return workshops.filter((w) => workshopIncludes(w, name));
}

export function completedInMonth(member: Rec, workshops: Rec[], month: string) {
  return memberWorkshops(member, workshops).filter((w) => str(w.status) === "completed" && str(w.date).slice(0, 7) === month);
}

/* ───────────────────────── pay ───────────────────────── */

export const PAY_MODES = [
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
];

export function payModeLabel(v: unknown) {
  return PAY_MODES.find((m) => m.value === str(v))?.label ?? (str(v) || "—");
}

export function expenseCategoryFor(member?: Rec) {
  const freelance = str(member?.type) === "Freelance" || /freelance/i.test(str(member?.role));
  return freelance ? "Freelance trainers" : "Salaries & stipends";
}

export function slipTotals(rec: Rec) {
  const fixed = num(rec.fixedPay);
  const workshops = num(rec.workshops);
  const rate = num(rec.perWorkshopRate);
  const workshopPay = workshops * rate;
  const allowances = num(rec.allowances);
  const bonus = num(rec.bonus);
  const deductions = num(rec.deductions);
  const tds = num(rec.tds);
  const gross = fixed + workshopPay + allowances + bonus;
  return { fixed, workshops, rate, workshopPay, allowances, bonus, deductions, tds, gross, totalDeductions: deductions + tds, net: payrollNet(rec) };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
}
