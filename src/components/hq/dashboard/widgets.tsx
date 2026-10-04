"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { getCollection, invoiceTotals, totalStudents, type BaseRecord } from "@/lib/hq/collections";
import { Badge, statusTone } from "@/components/ui/Badge";
import { cn, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { stageLabel } from "@/components/hq/sales/crm";
import { checklistProgress, isOverdueInvoice } from "./metrics";
import { dueLabel, timeAgo, type DueTone } from "./time";
import { DateTile, MiniBar, Widget, WidgetEmpty, WidgetSkeleton } from "./Widget";

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));

const dueClass: Record<DueTone, string> = {
  bad: "text-bad font-semibold",
  warn: "text-warn font-semibold",
  info: "text-info",
  neutral: "text-charcoal",
};

function Due({ date, today, className }: { date: unknown; today: string; className?: string }) {
  const d = dueLabel(date, today);
  if (!d) return <span className={cn("text-[11px] text-blueprint", className)}>No date</span>;
  return <span className={cn("whitespace-nowrap font-mono text-[11px]", dueClass[d.tone], className)}>{d.text}</span>;
}

function optionLabel(collection: string, field: string, value: unknown) {
  const f = getCollection(collection)?.fields.find((x) => x.key === field);
  return f?.options?.find((o) => o.value === value)?.label ?? s(value);
}

const rowLink = "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-graphite/[0.035] focus-visible:bg-graphite/[0.05] sm:px-5";

function More({ count, href, label }: { count: number; href: string; label: string }) {
  if (count <= 0) return null;
  return (
    <Link href={href} className="block border-t border-graphite/10 px-4 py-2.5 text-center text-[11px] font-semibold text-charcoal hover:bg-graphite/[0.035] hover:text-graphite sm:px-5">
      +{count} more {label}
    </Link>
  );
}

/* ─────────────────────────── 01 · upcoming workshops ─────────────────────────── */

export function UpcomingWorkshops({
  index,
  items,
  today,
  loading,
  schools,
  money,
  canPlan,
}: {
  index: string;
  items: BaseRecord[];
  today: string;
  loading: boolean;
  schools: Map<string, BaseRecord>;
  money: boolean;
  canPlan: boolean;
}) {
  const shown = items.slice(0, 6);
  return (
    <Widget index={index} title="Upcoming workshops" subtitle="Next 30 days · readiness from each workshop checklist" icon="CalendarRange" count={items.length} href="/hq/workshops" hrefLabel="Calendar">
      {loading ? (
        <WidgetSkeleton />
      ) : !items.length ? (
        <WidgetEmpty
          icon="CalendarRange"
          title="No workshops in the next 30 days"
          hint={canPlan ? "Once a school confirms, schedule the JOVE Day so the team, kits, transport and media crew line up." : "Workshops you're assigned to will appear here once scheduled."}
          action={
            canPlan ? (
              <Link href="/hq/workshops" className="text-xs font-semibold text-graphite underline underline-offset-4">
                Schedule a workshop
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-graphite/[0.07]">
            {shown.map((w) => {
              const school = schools.get(s(w.schoolId));
              const students = totalStudents(w);
              const progress = checklistProgress(w.checklist);
              const isToday = s(w.date).slice(0, 10) === today;
              return (
                <li key={w.id}>
                  <Link href={`/hq/workshops/${encodeURIComponent(w.id)}`} className={rowLink}>
                    <DateTile iso={s(w.date)} tone={isToday ? "dark" : "neutral"} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-graphite group-hover:underline group-hover:underline-offset-4">{s(w.title) || "Untitled workshop"}</span>
                      <span className="mt-0.5 block truncate text-xs text-charcoal">
                        {[school ? s(school.name) : "", students ? `${formatNumber(students)} students` : "", w.startTime ? `report ${s(w.startTime)}` : "", money && Number(w.agreedAmount) ? formatINRCompact(Number(w.agreedAmount)) : ""]
                          .filter(Boolean)
                          .join(" · ") || "Details pending"}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="flex items-center gap-2">
                        <Due date={w.date} today={today} className="hidden sm:inline" />
                        <Badge tone={statusTone(w.status)}>{optionLabel("workshops", "status", w.status || "tentative")}</Badge>
                      </span>
                      {progress ? (
                        <MiniBar value={progress.done / progress.total} label={`Readiness ${progress.done} of ${progress.total} checklist items`} />
                      ) : (
                        <span className="text-[10px] text-blueprint">Checklist not started</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <More count={items.length - shown.length} href="/hq/workshops" label="in the next 30 days" />
        </>
      )}
    </Widget>
  );
}

/* ─────────────────────────── follow-ups ─────────────────────────── */

export function FollowUps({ index, items, today, loading }: { index: string; items: BaseRecord[]; today: string; loading: boolean }) {
  const shown = items.slice(0, 6);
  const overdue = items.filter((x) => s(x.nextFollowUp).slice(0, 10) < today).length;
  return (
    <Widget
      index={index}
      title="Follow-ups due"
      subtitle={overdue ? `${overdue} overdue · next 3 days` : "Overdue and next 3 days"}
      icon="PhoneCall"
      count={items.length}
      countTone={overdue ? "bad" : "neutral"}
      href="/hq/crm"
      hrefLabel="CRM"
    >
      {loading ? (
        <WidgetSkeleton />
      ) : !items.length ? (
        <WidgetEmpty icon="PhoneCall" title="No follow-ups due" hint="Set a “Next follow-up” date on every school you speak to — it shows up here three days ahead." />
      ) : (
        <>
          <ul className="divide-y divide-graphite/[0.07]">
            {shown.map((x) => {
              const late = s(x.nextFollowUp).slice(0, 10) < today;
              return (
                <li key={x.id} className={cn(late && "bg-bad/[0.035] shadow-[inset_2px_0_0_var(--color-bad)]")}>
                  <Link href={`/hq/crm/${encodeURIComponent(x.id)}`} className={rowLink}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-graphite group-hover:underline group-hover:underline-offset-4">{s(x.name) || "Unnamed school"}</span>
                      <span className="mt-0.5 block truncate text-xs text-charcoal">{[stageLabel(x.stage), s(x.contactName), s(x.city)].filter(Boolean).join(" · ")}</span>
                    </span>
                    <Due date={x.nextFollowUp} today={today} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <More count={items.length - shown.length} href="/hq/crm" label="follow-ups" />
        </>
      )}
    </Widget>
  );
}

/* ─────────────────────────── receivables ─────────────────────────── */

export function Receivables({ index, open, today, loading }: { index: string; open: BaseRecord[]; today: string; loading: boolean }) {
  const sorted = [...open].sort((a, b) => {
    const ao = isOverdueInvoice(a, today) ? 0 : 1;
    const bo = isOverdueInvoice(b, today) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return (s(a.dueDate) || "9999").localeCompare(s(b.dueDate) || "9999");
  });
  const shown = sorted.slice(0, 6);
  const overdue = open.filter((i) => isOverdueInvoice(i, today)).length;
  return (
    <Widget
      index={index}
      title="Unpaid invoices"
      subtitle={overdue ? `${overdue} overdue — chase today` : "Sent and part-paid invoices"}
      icon="ReceiptIndianRupee"
      count={open.length}
      countTone={overdue ? "bad" : "neutral"}
      href="/hq/finance"
      hrefLabel="Finance"
    >
      {loading ? (
        <WidgetSkeleton />
      ) : !open.length ? (
        <WidgetEmpty icon="ReceiptIndianRupee" title="Nothing outstanding" hint="Every sent invoice is paid. Balances appear here the moment an invoice is marked sent." />
      ) : (
        <>
          <ul className="divide-y divide-graphite/[0.07]">
            {shown.map((inv) => {
              const t = invoiceTotals(inv);
              const late = isOverdueInvoice(inv, today);
              return (
                <li key={inv.id} className={cn(late && "bg-bad/[0.035] shadow-[inset_2px_0_0_var(--color-bad)]")}>
                  <Link href="/hq/finance" className={rowLink}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-graphite">
                        <span className="font-mono text-xs">{s(inv.number) || "Draft no."}</span> · {s(inv.customerName) || "Customer"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-charcoal">
                        {t.paid > 0 && <span>Paid {formatINRCompact(t.paid)} of {formatINRCompact(t.total)}</span>}
                        {inv.dueDate ? <Due date={inv.dueDate} today={today} /> : <span className="text-blueprint">No due date</span>}
                      </span>
                    </span>
                    <span className={cn("tabular shrink-0 text-sm font-bold", late ? "text-bad" : "text-graphite")}>{formatINR(t.balance)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <More count={open.length - shown.length} href="/hq/finance" label="unpaid invoices" />
        </>
      )}
    </Widget>
  );
}

/* ─────────────────────────── low stock ─────────────────────────── */

export function LowStock({ index, items, loading }: { index: string; items: BaseRecord[]; loading: boolean }) {
  const shown = items.slice(0, 5);
  return (
    <Widget index={index} title="Low stock" subtitle="At or below reorder level" icon="Boxes" count={items.length} countTone={items.length ? "bad" : "neutral"} href="/hq/inventory" hrefLabel="Inventory">
      {loading ? (
        <WidgetSkeleton rows={2} />
      ) : !items.length ? (
        <WidgetEmpty icon="PackageCheck" title="Stock levels healthy" hint="Set a “Reorder at” level on components and kits to get warned before a JOVE Day." />
      ) : (
        <>
          <ul className="divide-y divide-graphite/[0.07]">
            {shown.map((i) => {
              const qty = Number(i.stockQty) || 0;
              const lvl = Number(i.reorderLevel) || 0;
              return (
                <li key={i.id}>
                  <Link href="/hq/inventory" className={rowLink}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-graphite">{s(i.name)}</span>
                      <span className="mt-0.5 block truncate text-xs text-charcoal">{[s(i.category), s(i.location)].filter(Boolean).join(" · ") || "Uncategorised"}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn("tabular font-mono text-xs font-semibold", qty === 0 ? "text-bad" : "text-warn")}>
                        {formatNumber(qty)} / {formatNumber(lvl)} {s(i.unit) || "pcs"}
                      </span>
                      <MiniBar value={lvl ? qty / lvl : 0} label={`${qty} in stock against reorder level ${lvl}`} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <More count={items.length - shown.length} href="/hq/inventory" label="items to reorder" />
        </>
      )}
    </Widget>
  );
}

/* ─────────────────────────── media deliverables ─────────────────────────── */

export function MediaDue({ index, items, today, loading, workshops }: { index: string; items: BaseRecord[]; today: string; loading: boolean; workshops: Map<string, BaseRecord> }) {
  const shown = items.slice(0, 5);
  const late = items.filter((j) => s(j.dueDate).slice(0, 10) < today).length;
  return (
    <Widget
      index={index}
      title="Media due"
      subtitle={late ? `${late} overdue · next 7 days` : "Reels, films & drone shots · next 7 days"}
      icon="Clapperboard"
      count={items.length}
      countTone={late ? "bad" : "neutral"}
      href="/hq/media"
      hrefLabel="Studio"
    >
      {loading ? (
        <WidgetSkeleton rows={2} />
      ) : !items.length ? (
        <WidgetEmpty icon="Clapperboard" title="No deliverables due this week" hint="Every JOVE Day promises reels, a full-day film and drone shots — they're tracked in Media Studio." />
      ) : (
        <>
          <ul className="divide-y divide-graphite/[0.07]">
            {shown.map((j) => {
              const w = workshops.get(s(j.workshopId));
              const overdue = s(j.dueDate).slice(0, 10) < today;
              return (
                <li key={j.id} className={cn(overdue && "bg-bad/[0.035] shadow-[inset_2px_0_0_var(--color-bad)]")}>
                  <Link href="/hq/media" className={rowLink}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-graphite">{s(j.title)}</span>
                      <span className="mt-0.5 block truncate text-xs text-charcoal">{[s(j.deliverable), w ? s(w.title) : "", s(j.assignee)].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Due date={j.dueDate} today={today} />
                      <Badge tone={statusTone(j.status)}>{optionLabel("mediaJobs", "status", j.status || "planned")}</Badge>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <More count={items.length - shown.length} href="/hq/media" label="deliverables" />
        </>
      )}
    </Widget>
  );
}

/* ─────────────────────────── my tasks ─────────────────────────── */

export function MyTasks({
  index,
  items,
  today,
  loading,
  canWrite,
  onDone,
}: {
  index: string;
  items: BaseRecord[];
  today: string;
  loading: boolean;
  canWrite: boolean;
  onDone: (task: BaseRecord) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const shown = items.slice(0, 7);
  async function complete(t: BaseRecord) {
    setBusy(t.id);
    setError("");
    try {
      await onDone(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the task");
    } finally {
      setBusy(null);
    }
  }
  return (
    <Widget index={index} title="My open tasks" subtitle="Assigned to you · soonest first" icon="ListChecks" count={items.length} href="/hq/tasks" hrefLabel="Board">
      {error && <p className="mx-4 mt-3 rounded border border-bad/30 bg-bad/10 px-3 py-1.5 text-xs text-bad sm:mx-5">{error}</p>}
      {loading ? (
        <WidgetSkeleton />
      ) : !items.length ? (
        <WidgetEmpty icon="ListChecks" title="Nothing on your plate" hint="Tasks assigned to you on the shared board show up here." />
      ) : (
        <>
          <ul className="divide-y divide-graphite/[0.07]">
            {shown.map((t) => {
              const p = s(t.priority);
              return (
                <li key={t.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
                  <button
                    type="button"
                    disabled={!canWrite || busy === t.id}
                    onClick={() => complete(t)}
                    className="group/check mt-0.5 grid size-5 shrink-0 place-items-center rounded-[4px] border border-graphite/35 bg-paper text-graphite transition-colors hover:border-graphite hover:bg-graphite hover:text-paper disabled:opacity-50"
                    aria-label={`Mark “${s(t.title)}” as done`}
                    title={canWrite ? "Mark as done" : "Read-only"}
                  >
                    {busy === t.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3 opacity-0 transition-opacity group-hover/check:opacity-100 group-focus-visible/check:opacity-100" />}
                  </button>
                  <Link href="/hq/tasks" className="group min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-snug text-graphite group-hover:underline group-hover:underline-offset-4">{s(t.title)}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-charcoal">
                      <Due date={t.dueDate} today={today} />
                      {s(t.area) && <span>· {s(t.area)}</span>}
                      {s(t.status) === "blocked" && <Badge tone="bad">Blocked</Badge>}
                      {s(t.status) === "doing" && <Badge tone="info">Doing</Badge>}
                      {(p === "urgent" || p === "high") && <Badge tone={statusTone(p)}>{p}</Badge>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <More count={items.length - shown.length} href="/hq/tasks" label="open tasks" />
        </>
      )}
    </Widget>
  );
}

/* ─────────────────────────── recent leads ─────────────────────────── */

export function RecentLeads({ index, items, nowMs, loading, newCount }: { index: string; items: BaseRecord[]; nowMs: number; loading: boolean; newCount: number }) {
  return (
    <Widget index={index} title="Website leads" subtitle={newCount ? `${newCount} new — reply within a working day` : "Latest enquiries from the public site"} icon="Inbox" count={newCount} href="/hq/leads" hrefLabel="Inbox">
      {loading ? (
        <WidgetSkeleton rows={2} />
      ) : !items.length ? (
        <WidgetEmpty icon="Inbox" title="No enquiries yet" hint="Workshop, kit, studio and trainer forms on the website land here automatically." />
      ) : (
        <ul className="divide-y divide-graphite/[0.07]">
          {items.map((l) => (
            <li key={l.id}>
              <Link href="/hq/leads" className={rowLink}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-graphite/15 bg-paper font-mono text-[10px] font-semibold text-graphite" aria-hidden>
                  {s(l.name)
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-graphite">{s(l.name) || "Anonymous"}</span>
                  <span className="mt-0.5 block truncate text-xs text-charcoal">{[optionLabel("leads", "kind", l.kind), s(l.organisation), s(l.city)].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={statusTone(l.status || "new")}>{optionLabel("leads", "status", l.status || "new")}</Badge>
                  <span className="text-[10px] text-blueprint">{timeAgo(l.createdAt, nowMs)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}
