/**
 * Reminders: everything in HQ that needs someone today, from every section, in one list.
 * The Command Center shows it, and the morning email sends it to the founders, so both always say the same.
 * Pure functions only; callers pass the records the person may read.
 */
import { invoiceTotals, type BaseRecord } from "@/lib/hq/collections";
import { formatINR } from "@/lib/utils";
import { overduePhases } from "@/components/hq/workshops/logic";

export type ReminderLevel = "overdue" | "today" | "soon";
export type ReminderArea = "leads" | "followups" | "proposals" | "workshops" | "invoices" | "tasks" | "media" | "papers" | "social" | "stock";

export interface Reminder {
  key: string;
  area: ReminderArea;
  level: ReminderLevel;
  title: string;
  detail: string;
  /** path inside HQ */
  href: string;
  /** the date it is about (YYYY-MM-DD), for sorting */
  date: string;
}

export const AREA_LABEL: Record<ReminderArea, string> = {
  leads: "Website leads",
  followups: "Follow-ups",
  proposals: "Proposals",
  workshops: "Workshops",
  invoices: "Money owed",
  tasks: "Tasks",
  media: "Media",
  papers: "Papers to sign",
  social: "Social media",
  stock: "Stock",
};

/** The collection each area is built from: someone who cannot read it does not get its reminders. */
export const AREA_SOURCE: Record<ReminderArea, string> = {
  leads: "leads",
  followups: "schools",
  proposals: "proposals",
  workshops: "workshops",
  invoices: "invoices",
  tasks: "tasks",
  media: "mediaJobs",
  papers: "signDocs",
  social: "contentCalendar",
  stock: "inventory",
};

export interface ReminderData {
  leads?: BaseRecord[];
  schools?: BaseRecord[];
  proposals?: BaseRecord[];
  workshops?: BaseRecord[];
  invoices?: BaseRecord[];
  tasks?: BaseRecord[];
  mediaJobs?: BaseRecord[];
  signDocs?: BaseRecord[];
  contentCalendar?: BaseRecord[];
  inventory?: BaseRecord[];
}

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const day = (v: unknown) => (/^\d{4}-\d{2}-\d{2}/.test(s(v)) ? s(v).slice(0, 10) : "");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function addDaysIso(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
/** "today", "tomorrow", "3 days ago", "on 21 Oct" */
export function whenLabel(date: string, today: string) {
  if (!date) return "";
  const d = daysBetween(today, date);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d < 0) return `${-d} days ago`;
  const [, m, dd] = date.split("-").map(Number);
  return `on ${dd} ${MONTHS[m - 1]}`;
}
const levelFor = (date: string, today: string): ReminderLevel => (date < today ? "overdue" : date === today ? "today" : "soon");

/*
 * The same rules as the Command Center's boxes (src/components/hq/dashboard/metrics.ts). They are repeated here
 * because that file belongs to the browser, and the morning email is put together on the server.
 */
const isOpenInvoice = (inv: BaseRecord) => !["draft", "cancelled", "paid"].includes(s(inv.status)) && invoiceTotals(inv).balance > 0.5;
const isOverdueInvoice = (inv: BaseRecord, today: string) => isOpenInvoice(inv) && (s(inv.status) === "overdue" || (!!day(inv.dueDate) && day(inv.dueDate) < today));
const followUpsDue = (schools: BaseRecord[], horizon: string) =>
  schools.filter((x) => day(x.nextFollowUp) && day(x.nextFollowUp) <= horizon && s(x.stage) !== "lost").sort((a, b) => day(a.nextFollowUp).localeCompare(day(b.nextFollowUp)));
const mediaDue = (jobs: BaseRecord[], horizon: string) =>
  jobs.filter((j) => day(j.dueDate) && day(j.dueDate) <= horizon && !["delivered", "posted"].includes(s(j.status))).sort((a, b) => day(a.dueDate).localeCompare(day(b.dueDate)));
const lowStock = (items: BaseRecord[]) => items.filter((i) => Number(i.reorderLevel) > 0 && (Number(i.stockQty) || 0) <= Number(i.reorderLevel));

/** Today in India (YYYY-MM-DD), whatever clock the server keeps. */
export function indiaToday(now = new Date()) {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** Who signs a paper: both sides, only JOVE, or only the other party. Comes from the paper's template. */
export type SignsOf = (templateId: string) => "both" | "jove" | "party";

export function buildReminders(data: ReminderData, today: string, o: { signsOf?: SignsOf } = {}): Reminder[] {
  const out: Reminder[] = [];
  const add = (r: Reminder) => out.push(r);
  const in1 = addDaysIso(today, 1);
  const in3 = addDaysIso(today, 3);
  const schoolName = new Map((data.schools ?? []).map((x) => [x.id, s(x.name)]));
  const workshopById = new Map((data.workshops ?? []).map((w) => [w.id, w]));

  /* website leads waiting for a first reply */
  for (const l of data.leads ?? []) {
    if ((s(l.status) || "new") !== "new") continue;
    const got = indiaToday(new Date(s(l.createdAt) || Date.now()));
    const kind = l.kind === "trainer" ? "application" : l.kind === "workshop" ? "workshop enquiry" : "enquiry";
    add({ key: `lead:${l.id}`, area: "leads", level: got < today ? "overdue" : "today", title: `Reply to ${s(l.name) || "a website visitor"}`, detail: `${kind[0].toUpperCase()}${kind.slice(1)} received ${whenLabel(got, today)}${l.organisation ? ` · ${s(l.organisation)}` : ""}`, href: "/hq/leads", date: got });
  }

  /* school follow-ups */
  for (const x of followUpsDue(data.schools ?? [], in1)) {
    const d = day(x.nextFollowUp);
    add({ key: `follow:${x.id}`, area: "followups", level: levelFor(d, today), title: `Follow up with ${s(x.name)}`, detail: [x.contactName ? s(x.contactName) : "", `due ${whenLabel(d, today)}`].filter(Boolean).join(" · "), href: `/hq/crm/${x.id}`, date: d });
  }

  /* proposals: answers running out, and accepted ones not booked yet */
  for (const p of data.proposals ?? []) {
    const status = s(p.status);
    const name = schoolName.get(s(p.schoolId)) || "a school";
    const until = day(p.validUntil);
    if (status === "sent" && until && until <= in3) {
      add({ key: `prop:${p.id}`, area: "proposals", level: until < today ? "overdue" : until === today ? "today" : "soon", title: `Proposal ${s(p.number)} for ${name} ${until < today ? "has expired" : "expires " + whenLabel(until, today)}`, detail: "Call for an answer, or renew it with new dates", href: `/hq/proposals/${p.id}`, date: until });
    }
    const booked = p.booking && typeof p.booking === "object" && s((p.booking as { bookedOn?: string }).bookedOn);
    if (status === "accepted" && !booked) {
      add({ key: `book:${p.id}`, area: "proposals", level: "today", title: `Book ${name}: proposal ${s(p.number)} is accepted`, detail: "Press Book it to make the workshop, the invoice and the papers", href: `/hq/proposals/${p.id}`, date: day(p.updatedAt) || today });
    }
  }

  /* workshops: the day itself, the advance, and checklists that have fallen behind */
  for (const w of data.workshops ?? []) {
    const status = s(w.status);
    if (["completed", "cancelled"].includes(status)) continue;
    const d = day(w.date);
    if (!d) continue;
    const title = s(w.title) || "Workshop";
    if (d === today || d === in1) {
      add({ key: `ws:${w.id}`, area: "workshops", level: d === today ? "today" : "soon", title: `${d === today ? "Today" : "Tomorrow"}: ${title}`, detail: [w.startTime ? `Team reports at ${s(w.startTime)}` : "", status === "tentative" ? "still tentative" : "", d === today ? "opens in day mode" : ""].filter(Boolean).join(" · "), href: d === today ? `/hq/workshops/${w.id}/day` : `/hq/workshops/${w.id}`, date: d });
    }
    if (status === "tentative" && d >= today && d <= addDaysIso(today, 14) && !(Number(w.advanceReceived) > 0)) {
      add({ key: `adv:${w.id}`, area: "workshops", level: d <= addDaysIso(today, 7) ? "overdue" : "soon", title: `Advance not received: ${title}`, detail: `Workshop ${whenLabel(d, today)}; the date is confirmed when the advance arrives`, href: `/hq/workshops/${w.id}`, date: d });
    }
    if (d >= addDaysIso(today, -10)) {
      const behind = overduePhases(w, today);
      if (behind.length) add({ key: `check:${w.id}`, area: "workshops", level: "overdue", title: `Checklist behind: ${title}`, detail: behind.map((p) => p.label).join(", "), href: `/hq/workshops/${w.id}?tab=checklist`, date: d });
    }
  }

  /* money owed */
  for (const inv of data.invoices ?? []) {
    if (!isOpenInvoice(inv)) continue;
    const due = day(inv.dueDate);
    const balance = formatINR(Math.round(invoiceTotals(inv).balance));
    if (isOverdueInvoice(inv, today)) add({ key: `inv:${inv.id}`, area: "invoices", level: "overdue", title: `Chase ${s(inv.customerName) || "payment"}: ${balance} overdue`, detail: `Invoice ${s(inv.number)}${due ? `, due ${whenLabel(due, today)}` : ""}`, href: `/hq/finance?id=${inv.id}`, date: due || today });
    else if (due && due <= in3) add({ key: `inv:${inv.id}`, area: "invoices", level: due === today ? "today" : "soon", title: `${s(inv.customerName) || "Payment"}: ${balance} due ${whenLabel(due, today)}`, detail: `Invoice ${s(inv.number)}`, href: `/hq/finance?id=${inv.id}`, date: due });
  }

  /* tasks */
  for (const t of data.tasks ?? []) {
    if (s(t.status) === "done") continue;
    const due = day(t.dueDate);
    if (!due || due > today) continue;
    add({ key: `task:${t.id}`, area: "tasks", level: levelFor(due, today), title: s(t.title) || "Task", detail: [t.assignee ? s(t.assignee) : "Nobody assigned", `due ${whenLabel(due, today)}`].join(" · "), href: "/hq/tasks", date: due });
  }

  /* media deliverables */
  for (const j of mediaDue(data.mediaJobs ?? [], addDaysIso(today, 2))) {
    const due = day(j.dueDate);
    const ws = workshopById.get(s(j.workshopId));
    add({ key: `media:${j.id}`, area: "media", level: levelFor(due, today), title: s(j.title) || "Media deliverable", detail: [ws ? s(ws.title) : "", `due ${whenLabel(due, today)}`, j.assignee ? s(j.assignee) : ""].filter(Boolean).join(" · "), href: "/hq/media", date: due });
  }

  /* papers waiting for a signature */
  for (const doc of data.signDocs ?? []) {
    if (s(doc.status) !== "issued") continue;
    const signs = o.signsOf?.(s(doc.template)) ?? "both";
    const needsParty = signs !== "jove" && doc.partySigned !== true;
    const needsJove = signs !== "party" && doc.joveSigned !== true;
    if (!needsParty && !needsJove) continue;
    const due = day(doc.dueBy);
    const issued = day(doc.issuedOn);
    const waiting = needsParty && needsJove ? "both signatures" : needsParty ? `${s(doc.partyName) || "their"} signature` : "JOVE's signature";
    const tab = `${doc.partyKind === "team" ? "team" : doc.partyKind === "school" ? "schools" : "others"}&doc=${encodeURIComponent(doc.id)}`;
    if (due && due <= in3) add({ key: `paper:${doc.id}`, area: "papers", level: levelFor(due, today), title: `${s(doc.title).split(" · ")[0] || "Paper"} for ${s(doc.partyName) || "someone"}`, detail: `Waiting for ${waiting}; to be returned ${whenLabel(due, today)}`, href: `/hq/sign?tab=${tab}`, date: due });
    else if (!due && issued && issued <= addDaysIso(today, -7)) add({ key: `paper:${doc.id}`, area: "papers", level: "soon", title: `${s(doc.title).split(" · ")[0] || "Paper"} for ${s(doc.partyName) || "someone"}`, detail: `Waiting for ${waiting} since ${whenLabel(issued, today)}`, href: `/hq/sign?tab=${tab}`, date: issued });
  }

  /* social posts planned for today, or missed */
  for (const post of data.contentCalendar ?? []) {
    const d = day(post.date);
    if (!d || s(post.status) === "published" || d > today || d < addDaysIso(today, -7)) continue;
    add({ key: `post:${post.id}`, area: "social", level: d < today ? "overdue" : "today", title: `${d < today ? "Not posted yet" : "Post today"}: ${s(post.title) || "a planned post"}`, detail: [s(post.platform), d < today ? `planned ${whenLabel(d, today)}` : ""].filter(Boolean).join(" · "), href: "/hq/social?tab=plan", date: d });
  }

  /* stock: one line, however many items are low */
  const low = lowStock(data.inventory ?? []);
  if (low.length === 1) {
    const i = low[0];
    add({ key: `stock:${i.id}`, area: "stock", level: "soon", title: `Low stock: ${s(i.name) || "an item"}`, detail: `${Number(i.stockQty) || 0} left, reorder at ${Number(i.reorderLevel) || 0}`, href: "/hq/inventory", date: today });
  } else if (low.length > 1) {
    const names = low.slice(0, 3).map((i) => s(i.name)).filter(Boolean);
    add({ key: "stock:many", area: "stock", level: "soon", title: `${low.length} items to reorder`, detail: `${names.join(", ")}${low.length > names.length ? ` and ${low.length - names.length} more` : ""}`, href: "/hq/inventory", date: today });
  }

  const rank: Record<ReminderLevel, number> = { overdue: 0, today: 1, soon: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level] || a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function countByLevel(list: Reminder[]) {
  return { overdue: list.filter((r) => r.level === "overdue").length, today: list.filter((r) => r.level === "today").length, soon: list.filter((r) => r.level === "soon").length };
}
