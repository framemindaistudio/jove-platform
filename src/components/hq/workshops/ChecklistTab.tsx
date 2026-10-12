"use client";

import { useId } from "react";
import { AlertTriangle, CheckCheck, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import { useShowMoney } from "@/components/hq/data";
import { Countdown, ProgressBar, ReadinessRing } from "./bits";
import {
  CHECKLIST,
  checklistOf,
  daysBetween,
  dayMonth,
  isIso,
  kitPlan,
  list,
  money,
  nextPending,
  overallProgress,
  phaseDue,
  phaseProgress,
  readiness,
  str,
  studentsOf,
  type ChecklistItem,
  type ChecklistPhase,
  type Rec,
} from "./logic";
import type { PatchFn } from "./useWorkshopDoc";

/** Small live hints taken from the workshop record, so the checklist and the data agree. */
function hintFor(id: string, w: Rec, showMoney: boolean): string | null {
  switch (id) {
    case "t14-advance": {
      if (!showMoney) return null;
      const m = money(w);
      return m.basis ? `${formatINR(m.advanceReceived)} of ${formatINR(m.advanceDue)} recorded` : "Set the amount in Edit first";
    }
    case "t14-counts":
      return `${formatNumber(studentsOf(w))} students booked`;
    case "t14-team": {
      const t = list(w.team);
      return t.length ? `${t.length} assigned — ${t.join(", ")}` : "No team recorded yet";
    }
    case "t14-drone-request":
    case "t7-airspace":
      return `Drone permission: ${str(w.droneAllowed) || "Pending"}`;
    case "t3-consent-collected":
      return `Consent collected: ${w.consentCollected ? "Yes" : "Not yet"}`;
    case "t7-kits-counted":
      return `${kitPlan(w).totals.kitsToPack} kits to pack (stations + spares)`;
    case "t7-certificates":
    case "t7-worksheets":
      return `${formatNumber(studentsOf(w))} needed`;
    default:
      return null;
  }
}

export function ChecklistTab({ w, patch, canWrite, today }: { w: Rec; patch: PatchFn; canWrite: boolean; today: string }) {
  const checks = checklistOf(w);
  const ready = readiness(w);
  const overall = overallProgress(w);
  const next = nextPending(w);
  const hasDate = isIso(w.date);

  function setMany(ids: string[], on: boolean) {
    const nextChecks = { ...checks };
    for (const id of ids) {
      if (on) nextChecks[id] = true;
      else delete nextChecks[id];
    }
    patch({ checklist: nextChecks });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite p-5 text-paper sm:p-6" aria-label="Readiness summary">
        <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-x-8 gap-y-5">
          <ReadinessRing value={ready.pct} size={96} label="Ready" dark />
          <div className="min-w-0 flex-1 basis-64">
            <p className="annot text-paper/55">Pre-event readiness (T-14 → T-1)</p>
            <p className="mt-1 text-lg font-bold tracking-tight">
              {ready.done} of {ready.total} items done
            </p>
            <ProgressBar value={overall.pct} dark className="mt-3" label="Overall checklist progress" />
            <p className="tabular mt-1.5 font-mono text-[11px] text-paper/60">
              Overall incl. day-of and post-workshop: {overall.done}/{overall.total} · {Math.round(overall.pct * 100)}%
            </p>
          </div>
          <div className="basis-64 text-sm">
            <p className="annot text-paper/55">Next up</p>
            {next ? (
              <p className="mt-1 leading-snug">
                <span className="font-mono text-paper/60">{next.phase.code}</span> · {next.item.label}
              </p>
            ) : (
              <p className="mt-1">Every item is done. Excellent work.</p>
            )}
            {hasDate && <Countdown date={w.date} today={today} className="mt-3 bg-paper/10! text-paper!" />}
          </div>
        </div>
      </section>

      <nav aria-label="Checklist phases" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {CHECKLIST.map((p) => {
          const pr = phaseProgress(checks, p);
          return (
            <a key={p.id} href={`#phase-${p.id}`} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", pr.pct === 1 ? "border-ok/40 bg-ok/10 text-ok" : "border-graphite/20 hover:border-graphite/50")}>
              <span className="font-mono">{p.code}</span> <span className="tabular font-mono text-[10px] opacity-70">{pr.done}/{pr.total}</span>
            </a>
          );
        })}
      </nav>

      <div className="space-y-5">
        {CHECKLIST.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} w={w} checks={checks} today={today} canWrite={canWrite} onToggle={(id, on) => setMany([id], on)} onAll={(on) => setMany(phase.items.map((i) => i.id), on)} />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase, w, checks, today, canWrite, onToggle, onAll }: { phase: ChecklistPhase; w: Rec; checks: Record<string, boolean>; today: string; canWrite: boolean; onToggle: (id: string, on: boolean) => void; onAll: (on: boolean) => void }) {
  const showMoney = useShowMoney();
  const pr = phaseProgress(checks, phase);
  const due = phaseDue(w, phase);
  const days = due ? daysBetween(today, due) : null;
  const late = !!due && due < today && pr.pct < 1 && str(w.status) !== "cancelled";
  const isPost = phase.id === "post";

  return (
    <section id={`phase-${phase.id}`} className={cn("scroll-mt-24 overflow-hidden rounded-[var(--radius-md)] border bg-paper-50", late ? "border-bad/40" : "border-graphite/12")} aria-labelledby={`h-${phase.id}`}>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-graphite/10 px-5 py-3.5">
        <span className={cn("grid h-8 min-w-12 place-items-center rounded-[var(--radius-sm)] px-2 font-mono text-xs font-bold", pr.pct === 1 ? "bg-ok text-white" : "bg-graphite text-paper")}>{phase.code}</span>
        <div className="min-w-0 flex-1">
          <h3 id={`h-${phase.id}`} className="text-sm font-semibold">
            {phase.label}
          </h3>
          <p className={cn("text-xs", late ? "font-medium text-bad" : "text-blueprint")}>
            {late && <AlertTriangle className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />}
            {due ? (isPost ? `Target: by ${dayMonth(due)} (${phase.offset} days after)` : `Complete by ${dayMonth(due)}`) : "Set the workshop date to see the due date"}
            {late && days !== null && ` · ${-days} day${-days === 1 ? "" : "s"} overdue`}
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-56">
          <ProgressBar value={pr.pct} className="flex-1" label={`${phase.label} progress`} />
          <span className="tabular font-mono text-[11px] text-charcoal">
            {pr.done}/{pr.total}
          </span>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => onAll(pr.pct < 1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-charcoal hover:bg-graphite/10"
          >
            {pr.pct < 1 ? <CheckCheck className="size-4" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}
            {pr.pct < 1 ? "Mark all" : "Clear"}
          </button>
        )}
      </header>
      <ul className="divide-y divide-dashed divide-graphite/10">
        {phase.items.map((item) => (
          <ItemRow key={item.id} item={item} checked={!!checks[item.id]} hint={hintFor(item.id, w, showMoney)} disabled={!canWrite} onChange={(on) => onToggle(item.id, on)} />
        ))}
      </ul>
    </section>
  );
}

function ItemRow({ item, checked, hint, disabled, onChange }: { item: ChecklistItem; checked: boolean; hint: string | null; disabled: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <li>
      <label htmlFor={id} className={cn("flex items-start gap-3.5 px-5 py-3 transition-colors", disabled ? "cursor-default" : "cursor-pointer hover:bg-graphite/[0.03]")}>
        <input id={id} type="checkbox" className="mt-0.5 size-[18px] shrink-0 cursor-[inherit] rounded-[3px] border-graphite/30 accent-graphite" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm font-medium leading-snug", checked && "text-blueprint line-through decoration-graphite/30")}>{item.label}</span>
          {item.detail && <span className="mt-0.5 block text-xs leading-relaxed text-blueprint">{item.detail}</span>}
          {hint && <span className="tabular mt-1 block font-mono text-[11px] text-charcoal">↳ {hint}</span>}
        </span>
        <Badge tone="outline" className="mt-0.5 shrink-0 text-[9px]!">
          {item.owner}
        </Badge>
      </label>
    </li>
  );
}
