"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, ClipboardList, Plus, Printer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import { useShowMoney } from "@/components/hq/data";
import { EmptyState } from "@/components/hq/ui";
import {
  addDays,
  bookedBands,
  CHECKLIST,
  checklistOf,
  daysBetween,
  isCancelled,
  money,
  nextPending,
  overallProgress,
  overduePhases,
  phaseProgress,
  readiness,
  str,
  studentsOf,
  type Rec,
} from "./logic";
import { Countdown, DateBlock, ProgressBar, ReadinessRing, StatusBadge } from "./bits";

const HORIZON = 60;

export function UpcomingList({ workshops, today, canWrite, onNew, schoolLabel }: { workshops: Rec[]; today: string; canWrite: boolean; onNew: () => void; schoolLabel: (w: Rec) => string }) {
  const until = addDays(today, HORIZON);
  const upcoming = useMemo(
    () => workshops.filter((w) => !isCancelled(w) && str(w.date) >= today && str(w.date) <= until).sort((a, b) => str(a.date).localeCompare(str(b.date))),
    [workshops, today, until],
  );
  const wrapUp = useMemo(
    () =>
      workshops
        .filter((w) => !isCancelled(w) && str(w.date) && str(w.date) < today && (str(w.status) !== "completed" || overallProgress(w).pct < 1))
        .sort((a, b) => str(b.date).localeCompare(str(a.date)))
        .slice(0, 8),
    [workshops, today],
  );

  return (
    <div className="space-y-10">
      {upcoming.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {upcoming.map((w) => (
            <UpcomingCard key={w.id} w={w} today={today} schoolLabel={schoolLabel} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="CalendarRange"
          title={`No workshops in the next ${HORIZON} days`}
          description="Book the next JOVE Day from a won school in the CRM, or add one here."
          action={
            canWrite ? (
              <Button size="sm" onClick={onNew}>
                <Plus className="size-4" aria-hidden /> New workshop
              </Button>
            ) : undefined
          }
        />
      )}

      {wrapUp.length > 0 && (
        <section aria-labelledby="wrapup-h">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-graphite/40" aria-hidden />
            <h2 id="wrapup-h" className="annot text-blueprint">
              Wrap-up pending · past workshops not closed out
            </h2>
          </div>
          <ul className="divide-y divide-graphite/[0.08] overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
            {wrapUp.map((w) => {
              const post = phaseProgress(checklistOf(w), CHECKLIST[CHECKLIST.length - 1]);
              return (
                <li key={w.id}>
                  <Link href={`/hq/workshops/${w.id}?tab=wrapup`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-graphite/[0.035]">
                    <span className="tabular w-24 font-mono text-xs text-blueprint">{str(w.date)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{str(w.title)}</span>
                    <StatusBadge status={w.status} />
                    <span className="flex w-40 items-center gap-2">
                      <ProgressBar value={post.pct} className="flex-1" label="Post-workshop checklist" />
                      <span className="tabular font-mono text-[11px] text-charcoal">
                        {post.done}/{post.total}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function UpcomingCard({ w, today, schoolLabel }: { w: Rec; today: string; schoolLabel: (w: Rec) => string }) {
  const ready = readiness(w);
  const checks = checklistOf(w);
  const showMoney = useShowMoney();
  const m = money(w);
  const next = nextPending(w);
  const overdue = overduePhases(w, today);
  const days = daysBetween(today, str(w.date));
  const school = schoolLabel(w);
  const soon = days <= 3;

  return (
    <article className={cn("group relative overflow-hidden rounded-[var(--radius-md)] border bg-paper-50 transition-shadow hover:shadow-[var(--shadow-lift)]", soon ? "border-graphite/40" : "border-graphite/12")}>
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative flex gap-4 p-5">
        <DateBlock iso={str(w.date)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Countdown date={w.date} today={today} />
            <StatusBadge status={w.status} />
            {!m.advanceOk && str(w.status) === "confirmed" && <Badge tone="warn">Advance pending</Badge>}
          </div>
          <h3 className="mt-2 text-base font-bold leading-snug tracking-tight">
            <Link href={`/hq/workshops/${w.id}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-graphite">
              {str(w.title) || "Untitled workshop"}
            </Link>
          </h3>
          {school && school !== str(w.title) && <p className="truncate text-xs text-blueprint">{school}</p>}
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <div>
              <dt className="annot text-[9px] text-blueprint">Students</dt>
              <dd className="tabular font-mono font-semibold">{formatNumber(studentsOf(w))}</dd>
            </div>
            <div>
              <dt className="annot text-[9px] text-blueprint">Bands</dt>
              <dd className="font-medium">{bookedBands(w).map((b) => b.grades.replace("Grades ", "Gr ")).join(" · ") || "—"}</dd>
            </div>
            {showMoney && (
              <div>
                <dt className="annot text-[9px] text-blueprint">{m.estimated ? "Value (est.)" : "Agreed"}</dt>
                <dd className="tabular font-mono font-semibold">{formatINR(m.basis)}</dd>
              </div>
            )}
            <div>
              <dt className="annot text-[9px] text-blueprint">Report</dt>
              <dd className="tabular font-mono font-semibold">{str(w.startTime) || "—"}</dd>
            </div>
          </dl>
        </div>
        <ReadinessRing value={ready.pct} />
      </div>

      {/* phase strip */}
      <div className="relative grid grid-cols-6 gap-1 border-t border-graphite/10 px-5 pb-1 pt-3">
        {CHECKLIST.map((p) => {
          const pr = phaseProgress(checks, p);
          const late = overdue.some((o) => o.id === p.id);
          return (
            <div key={p.id} title={`${p.code} · ${p.label}: ${pr.done}/${pr.total}`}>
              <ProgressBar value={pr.pct} className={cn(late && "bg-bad/20")} label={`${p.code} ${p.label}`} />
              <p className={cn("tabular mt-1 font-mono text-[9px]", late ? "text-bad" : "text-blueprint")}>{p.code}</p>
            </div>
          );
        })}
      </div>

      <div className="relative flex flex-wrap items-center gap-3 px-5 pb-4 pt-2">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-xs text-charcoal">
          {overdue.length ? (
            <>
              <AlertTriangle className="size-3.5 shrink-0 text-bad" aria-hidden />
              <span className="truncate text-bad">
                {overdue.map((o) => o.code).join(", ")} checklist overdue
              </span>
            </>
          ) : next ? (
            <>
              <ClipboardList className="size-3.5 shrink-0 text-blueprint" aria-hidden />
              <span className="truncate">
                <span className="font-mono text-blueprint">{next.phase.code}</span> · {next.item.label}
              </span>
            </>
          ) : (
            <span className="text-ok">Checklist complete</span>
          )}
        </p>
        <span className="relative z-10 flex gap-1">
          <a
            href={`/hq/print/runsheet/${w.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-charcoal hover:bg-graphite/10"
            aria-label={`Print run sheet for ${str(w.title)}`}
            title="Print run sheet"
          >
            <Printer className="size-4" aria-hidden />
          </a>
          <Link href={`/hq/workshops/${w.id}?tab=checklist`} className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-charcoal hover:bg-graphite/10" aria-label={`Open checklist for ${str(w.title)}`} title="Open checklist">
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </span>
      </div>
    </article>
  );
}
