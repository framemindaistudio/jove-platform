import { invoiceTotals, totalStudents, type BaseRecord } from "@/lib/hq/collections";
import type { SessionUser } from "@/lib/hq/roles";
import { OPEN_STAGES, schoolValue, stageProbability } from "@/components/hq/sales/crm";
import { isIsoDate } from "./time";

/**
 * Pure business maths for the Command Center.
 * Everything here works on raw HQ records so it can be unit-reasoned and reused
 * (Tasks page, Settings, future reports).
 */

const n = (v: unknown) => Number(v) || 0;
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/* ─────────────────────────── revenue ─────────────────────────── */

/**
 * Money actually received on an invoice, ex-GST.
 * Targets in the business plan (₹4L / month) are ex-GST turnover, so the GST
 * share of every receipt is stripped before comparing.
 */
export function invoiceCollectedExGst(inv: BaseRecord) {
  if (s(inv.status) === "cancelled") return 0;
  const t = invoiceTotals(inv);
  const paid = Math.min(t.paid, t.total || t.paid);
  const ratio = t.total > 0 ? t.taxable / t.total : 1;
  return paid * ratio;
}

/** Revenue for a month (YYYY-MM): invoice receipts (ex-GST, by invoice date) + other income. */
export function revenueForMonth(month: string, invoices: BaseRecord[], income: BaseRecord[]) {
  const fromInvoices = invoices.filter((i) => s(i.date).startsWith(month)).reduce((acc, i) => acc + invoiceCollectedExGst(i), 0);
  const other = income.filter((i) => s(i.date).startsWith(month)).reduce((acc, i) => acc + n(i.amount), 0);
  return { fromInvoices: Math.round(fromInvoices), other: Math.round(other), total: Math.round(fromInvoices + other) };
}

export function expensesForMonth(month: string, expenses: BaseRecord[]) {
  return Math.round(expenses.filter((e) => s(e.date).startsWith(month)).reduce((acc, e) => acc + n(e.amount), 0));
}

/* ─────────────────────────── invoices ─────────────────────────── */

/** An invoice the school still owes money on (sent / partially paid / overdue). */
export function isOpenInvoice(inv: BaseRecord) {
  const st = s(inv.status);
  if (["draft", "cancelled", "paid"].includes(st)) return false;
  return invoiceTotals(inv).balance > 0.5;
}

export function isOverdueInvoice(inv: BaseRecord, today: string) {
  if (!isOpenInvoice(inv)) return false;
  return s(inv.status) === "overdue" || (isIsoDate(inv.dueDate) && s(inv.dueDate).slice(0, 10) < today);
}

export function receivables(invoices: BaseRecord[], today: string) {
  const open = invoices.filter(isOpenInvoice);
  const overdue = open.filter((i) => isOverdueInvoice(i, today));
  return {
    open,
    overdue,
    balance: Math.round(open.reduce((acc, i) => acc + invoiceTotals(i).balance, 0)),
    overdueBalance: Math.round(overdue.reduce((acc, i) => acc + invoiceTotals(i).balance, 0)),
  };
}

/* ─────────────────────────── pipeline ─────────────────────────── */

/**
 * Open pipeline = schools still being worked (not won / lost / nurture).
 * Deal value and close probability come from the Schools CRM helpers, so the
 * Command Center and the CRM always show the same numbers: the entered
 * "Expected deal value", or a JOVE Day estimate from student counts.
 */
export function pipeline(schools: BaseRecord[]) {
  const active = schools.filter((x) => (OPEN_STAGES as string[]).includes(s(x.stage) || "lead"));
  let value = 0;
  let weighted = 0;
  let estimated = 0;
  for (const x of active) {
    const v = schoolValue(x);
    value += v.value;
    weighted += v.value * stageProbability(s(x.stage) || "lead");
    if (v.estimated) estimated += v.value;
  }
  return {
    active,
    value: Math.round(value),
    weighted: Math.round(weighted),
    estimated: Math.round(estimated),
    won: schools.filter((x) => s(x.stage) === "won").length,
  };
}

/* ─────────────────────────── workshops ─────────────────────────── */

export function workshopsInMonth(workshops: BaseRecord[], month: string) {
  const inMonth = workshops.filter((w) => s(w.date).startsWith(month));
  const completed = inMonth.filter((w) => s(w.status) === "completed").length;
  const confirmed = inMonth.filter((w) => s(w.status) === "confirmed").length;
  const tentative = inMonth.filter((w) => s(w.status) === "tentative").length;
  return { count: completed + confirmed, completed, confirmed, tentative, students: inMonth.filter((w) => ["completed", "confirmed"].includes(s(w.status))).reduce((a, w) => a + totalStudents(w), 0) };
}

/**
 * Readiness from a workshop checklist, whatever shape the Workshops module stores:
 * booleans, arrays of {done|checked|complete}, grouped {items:[…]}, or nested maps.
 */
export function checklistProgress(c: unknown): { done: number; total: number } | null {
  if (!c || typeof c !== "object") return null;
  let done = 0;
  let total = 0;
  const visit = (node: unknown, depth: number) => {
    if (depth > 4) return;
    if (typeof node === "boolean") {
      total++;
      if (node) done++;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      const flag = o.done ?? o.checked ?? o.complete ?? o.completed ?? o.ok;
      if (typeof flag === "boolean") {
        total++;
        if (flag) done++;
        return;
      }
      if (Array.isArray(o.items)) return visit(o.items, depth + 1);
      Object.values(o).forEach((x) => visit(x, depth + 1));
    }
  };
  visit(c, 0);
  return total ? { done, total } : null;
}

/* ─────────────────────────── tasks ─────────────────────────── */

const norm = (v: unknown) => s(v).trim().toLowerCase().replace(/\s+/g, " ");

/** Is this task assigned to the signed-in user? Matches full name, first name or username. */
export function isMine(assignee: unknown, user: Pick<SessionUser, "name" | "username">) {
  const a = norm(assignee);
  if (!a) return false;
  const name = norm(user.name);
  const uname = norm(user.username);
  const first = (x: string) => x.split(" ")[0];
  return a === name || a === uname || first(a) === first(name) || first(a) === uname;
}

export const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Sort: dated before undated, earliest first, then priority. */
export function compareTasks(a: BaseRecord, b: BaseRecord) {
  const ad = s(a.dueDate) || "9999-12-31";
  const bd = s(b.dueDate) || "9999-12-31";
  if (ad !== bd) return ad < bd ? -1 : 1;
  return (PRIORITY_RANK[s(a.priority)] ?? 2) - (PRIORITY_RANK[s(b.priority)] ?? 2);
}

/* ─────────────────────────── widget queries ─────────────────────────── */

const DONE_MEDIA = ["delivered", "posted"];
const CLOSED_WORKSHOP = ["completed", "cancelled"];

/** Workshops from today to today + `days`, soonest first (tentative / confirmed / postponed). */
export function upcomingWorkshops(workshops: BaseRecord[], today: string, horizon: string) {
  return workshops
    .filter((w) => isIsoDate(w.date) && s(w.date) >= today && s(w.date).slice(0, 10) <= horizon && !CLOSED_WORKSHOP.includes(s(w.status)))
    .sort((a, b) => (s(a.date) + s(a.startTime)).localeCompare(s(b.date) + s(b.startTime)));
}

/** Schools with a follow-up on or before `horizon` (overdue first). Lost schools are ignored. */
export function followUpsDue(schools: BaseRecord[], horizon: string) {
  return schools
    .filter((x) => isIsoDate(x.nextFollowUp) && s(x.nextFollowUp).slice(0, 10) <= horizon && s(x.stage) !== "lost")
    .sort((a, b) => s(a.nextFollowUp).localeCompare(s(b.nextFollowUp)));
}

/** Media deliverables not yet delivered whose due date is on or before `horizon` (includes overdue). */
export function mediaDue(jobs: BaseRecord[], horizon: string) {
  return jobs
    .filter((j) => isIsoDate(j.dueDate) && s(j.dueDate).slice(0, 10) <= horizon && !DONE_MEDIA.includes(s(j.status)))
    .sort((a, b) => s(a.dueDate).localeCompare(s(b.dueDate)));
}

/** Inventory at or below its reorder level (items without a reorder level are skipped). */
export function lowStock(items: BaseRecord[]) {
  return items
    .filter((i) => i.reorderLevel !== undefined && i.reorderLevel !== "" && n(i.reorderLevel) > 0 && n(i.stockQty) <= n(i.reorderLevel))
    .sort((a, b) => n(a.stockQty) / Math.max(1, n(a.reorderLevel)) - n(b.stockQty) / Math.max(1, n(b.reorderLevel)));
}

/* ─────────────────────────── misc ─────────────────────────── */

export function initials(name: unknown) {
  return (
    s(name)
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function firstName(name: unknown) {
  return s(name).trim().split(/\s+/)[0] || "there";
}
