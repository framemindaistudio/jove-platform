"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { gradeBands, joveDayRules } from "@/lib/content/business";
import { Panel } from "@/components/hq/ui";
import type { PriceBook } from "@/lib/pricebook/types";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import { Metric, NumField, PricesLink, Section, TABLE_WRAP, TH, TextButton } from "./controls";
import { dayEconomics, waterfall, type CostType, type Scenario } from "./model";
import type { Update } from "./PlannerApp";

const TYPE_LABEL: Record<CostType, string> = { fixed: "Fixed per day", perStudent: "Per student", percentRevenue: "% of revenue" };
const short = (label: string) => label.replace(/\s*[(—–].*$/, "").trim() || label;
const inr = (v: number) => formatINR(Math.round(v));

export function UnitEconomics({ s, update, book }: { s: Scenario; update: Update; book: PriceBook }) {
  const e = useMemo(() => dayEconomics(s.day), [s.day]);
  const wf = useMemo(() => waterfall(e), [e]);
  const negative = e.contribution < 0;
  /** without cost lines there is no cost to show: a dash, not a day that costs nothing */
  const noLines = s.day.lines.length === 0;

  return (
    <Section
      id="unit-economics"
      index="01"
      title="JOVE Day unit economics"
      intro={
        <>
          One full-day workshop. Defaults come from <PricesLink />: a {formatNumber(book.planner.students)}-student mix at about {inr(book.planner.avgPricePerStudent)} per student, minimum billing {inr(book.rules.minimumBilling)} (ex-GST).
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* ── inputs ── */}
        <div className="space-y-6">
          <Panel title="Students and price per grade band" subtitle="Edit head-count and price; revenue is ex-GST.">
            <div className={TABLE_WRAP}>
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                    <th className={TH}>Band</th>
                    <th className={cn(TH, "w-28")}>Students</th>
                    <th className={cn(TH, "w-32")}>₹ / student</th>
                    <th className={cn(TH, "text-right")}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeBands.map((b) => (
                    <tr key={b.id} className="border-b border-graphite/[0.07] last:border-0">
                      <td className="px-3 py-2">
                        <span className="block font-semibold">{b.grades}</span>
                        <span className="text-xs text-blueprint">{b.name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <NumField ariaLabel={`${b.grades} students`} value={s.day.students[b.id]} onChange={(v) => update((d) => ((d.day.students[b.id] = v), d))} />
                      </td>
                      <td className="px-3 py-2">
                        <NumField ariaLabel={`${b.grades} price per student`} prefix="₹" value={s.day.prices[b.id]} onChange={(v) => update((d) => ((d.day.prices[b.id] = v), d))} />
                      </td>
                      <td className="tabular px-3 py-2 text-right font-medium">{inr(s.day.students[b.id] * s.day.prices[b.id])}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-graphite/20 bg-graphite/[0.035] font-bold">
                    <td className="px-3 py-2.5">Total</td>
                    <td className="tabular px-3 py-2.5">{formatNumber(e.students)}</td>
                    <td className="tabular px-3 py-2.5">{inr(e.avgPrice)} avg</td>
                    <td className="tabular px-3 py-2.5 text-right">{inr(e.gross)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumField label="Minimum billing (ex-GST)" prefix="₹" step={1000} value={s.day.minimumBilling} onChange={(v) => update((d) => ((d.day.minimumBilling = v), d))} hint={`Rule: at least ${joveDayRules.minimumStudents} students or this amount, whichever is higher.`} />
              <div className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 px-3 py-2 text-xs text-charcoal">
                {e.students > joveDayRules.maxStudentsPerDay && <p className="font-semibold text-warn">Above the {joveDayRules.maxStudentsPerDay}-student daily cap in the SOP.</p>}
                {e.students > 0 && e.students < joveDayRules.minimumStudents && <p className="font-semibold text-warn">Below the {joveDayRules.minimumStudents}-student minimum for a JOVE Day.</p>}
                {e.minimumApplied ? <p>Minimum billing applies: revenue is lifted from {inr(e.gross)} to {inr(e.revenue)}.</p> : <p>Per-student pricing exceeds the minimum billing, so the floor does not apply.</p>}
              </div>
            </div>
          </Panel>

          <Panel
            title="Cost lines"
            subtitle={
              <>
                Per-day costs of delivering one JOVE Day. They start as the cost lines in <PricesLink />.
              </>
            }
            action={
              <TextButton
                className="shrink-0 whitespace-nowrap"
                onClick={() =>
                  update((d) => {
                    d.day.lines.push({ id: `custom-${Date.now().toString(36)}`, label: "New cost line", type: "fixed", amount: 0 });
                    return d;
                  })
                }
              >
                <Plus className="size-3.5" aria-hidden /> Add line
              </TextButton>
            }
          >
            {noLines && (
              <p className="mb-3 rounded-[var(--radius-sm)] border border-dashed border-graphite/25 px-3 py-2 text-xs text-charcoal">
                No cost lines yet, so this day has no cost to show. Add what a JOVE Day costs to run in <PricesLink /> (every HQ screen then uses it), or use Add line to try a number here only.
              </p>
            )}
            <div className={cn(TABLE_WRAP, noLines && "hidden")}>
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                    <th className={TH}>Cost</th>
                    <th className={cn(TH, "w-36")}>Type</th>
                    <th className={cn(TH, "w-28")}>Amount</th>
                    <th className={cn(TH, "text-right")}>Per day</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {s.day.lines.map((l, i) => (
                    <tr key={l.id} className="border-b border-graphite/[0.07] last:border-0">
                      <td className="px-3 py-1.5">
                        <input
                          aria-label={`Cost line ${i + 1} name`}
                          value={l.label}
                          onChange={(ev) => update((d) => ((d.day.lines[i].label = ev.target.value), d))}
                          className="h-9 w-full rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 text-sm hover:border-graphite/15 focus:border-graphite focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <select
                          aria-label={`${short(l.label)} cost type`}
                          value={l.type}
                          onChange={(ev) => update((d) => ((d.day.lines[i].type = ev.target.value as CostType), d))}
                          className="h-9 w-full rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-2 text-xs focus:border-graphite focus:outline-none"
                        >
                          {(Object.keys(TYPE_LABEL) as CostType[]).map((t) => (
                            <option key={t} value={t}>
                              {TYPE_LABEL[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <NumField
                          ariaLabel={`${short(l.label)} amount`}
                          prefix={l.type === "percentRevenue" ? undefined : "₹"}
                          suffix={l.type === "percentRevenue" ? "%" : undefined}
                          step={l.type === "percentRevenue" ? 0.5 : 1}
                          inputClassName="h-9"
                          value={l.amount}
                          onChange={(v) => update((d) => ((d.day.lines[i].amount = v), d))}
                        />
                      </td>
                      <td className="tabular px-3 py-1.5 text-right font-medium">{inr(e.costs[i]?.total ?? 0)}</td>
                      <td className="px-1 py-1.5 text-right">
                        <button
                          type="button"
                          aria-label={`Remove ${short(l.label)}`}
                          onClick={() => update((d) => ((d.day.lines = d.day.lines.filter((x) => x.id !== l.id)), d))}
                          className="grid size-8 place-items-center rounded text-blueprint hover:bg-bad/10 hover:text-bad focus-visible:outline-2 focus-visible:outline-graphite"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-graphite/20 bg-graphite/[0.035] font-bold">
                    <td className="px-3 py-2.5" colSpan={3}>
                      Total variable cost per day
                    </td>
                    <td className="tabular px-3 py-2.5 text-right">{inr(e.variable)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        </div>

        {/* ── results ── */}
        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite p-5 text-paper">
            <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <div className="relative grid grid-cols-2 gap-x-6 gap-y-5">
              <Metric className="[&_p:first-child]:text-paper/55" label="Revenue (ex-GST)" value={inr(e.revenue)} sub={<span className="text-paper/60">{formatNumber(e.students)} students · {inr(e.revenuePerStudent)} each</span>} strong />
              <Metric className="[&_p:first-child]:text-paper/55" label="Contribution" value={noLines ? "—" : <span className={negative ? "text-bad" : undefined}>{inr(e.contribution)}</span>} sub={<span className="text-paper/60">{noLines ? "Needs cost lines" : `${e.marginPct.toFixed(1)}% margin`}</span>} strong />
              <Metric className="[&_p:first-child]:text-paper/55" label="Variable cost" value={noLines ? "—" : inr(e.variable)} sub={<span className="text-paper/60">{e.costs.length} cost lines</span>} />
              <Metric className="[&_p:first-child]:text-paper/55" label="Cost per student" value={noLines ? "—" : inr(e.costPerStudent)} sub={<span className="text-paper/60">vs {inr(e.avgPrice)} avg price</span>} />
            </div>
            <div className={cn("relative mt-5 border-t border-paper/15 pt-4 text-sm", noLines && "hidden")}>
              {e.breakEvenStudents ? (
                <p>
                  <span className="annot mr-2 text-paper/55">Break-even</span>
                  <strong className="tabular">{formatNumber(e.breakEvenStudents)} students</strong> ({inr(e.breakEvenRevenue ?? 0)}) cover this day on per-student pricing alone.
                </p>
              ) : (
                <p className="text-bad">Per-student price is below per-student cost: no head-count breaks even. Review prices or costs.</p>
              )}
              <p className="mt-1.5 text-paper/70">
                At the {joveDayRules.minimumStudents}-student minimum the day still contributes <strong className="tabular text-paper">{inr(e.atMinimum.contribution)}</strong> ({e.atMinimum.marginPct.toFixed(0)}%).
              </p>
            </div>
          </div>

          {!noLines && (
            <Panel title="Where the money goes" subtitle="Revenue minus each cost line leaves the contribution.">
              <Waterfall e={e} wf={wf} />
            </Panel>
          )}
        </div>
      </div>
    </Section>
  );
}

type WfRowProps = { label: string; title: string; value: number; style: React.CSSProperties; className: string; signed?: "minus"; zero: number | null };

function WfRow({ label, title, value, style, className, signed, zero }: WfRowProps) {
  return (
    <li className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_4.75rem] items-center gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_5.5rem] sm:gap-3">
      <span className="truncate text-xs text-charcoal" title={title}>
        {label}
      </span>
      <div className="relative h-5 rounded-[2px] bg-graphite/[0.05]" aria-hidden>
        {zero !== null && <span className="absolute inset-y-0 w-px bg-graphite/40" style={{ left: `${zero}%` }} />}
        <div className={cn("absolute inset-y-0 rounded-[2px]", className)} style={style} />
      </div>
      <span className="tabular text-right text-xs font-semibold">
        {signed === "minus" ? "−" : value < 0 ? "−" : ""}
        {inr(Math.abs(value))}
      </span>
    </li>
  );
}

function Waterfall({ e, wf }: { e: ReturnType<typeof dayEconomics>; wf: ReturnType<typeof waterfall> }) {
  const min = Math.min(0, e.contribution);
  const max = Math.max(e.revenue, 1);
  const span = max - min || 1;
  const pos = (v: number) => ((v - min) / span) * 100;
  const bar = (a: number, b: number) => ({ left: `${pos(Math.min(a, b))}%`, width: `${Math.max(0.6, Math.abs(pos(a) - pos(b)))}%` });
  const zero = min < 0 ? pos(0) : null;

  return (
    <ol className="space-y-1.5" aria-label="Revenue to contribution waterfall">
      <WfRow zero={zero} label="Revenue" title="Revenue" value={e.revenue} style={bar(0, e.revenue)} className="bg-graphite" />
      {wf.steps.map((st) => (
        <WfRow key={st.id} zero={zero} label={short(st.label)} title={st.label} value={st.value} signed="minus" style={bar(st.from, st.to)} className="hatch border border-graphite/45" />
      ))}
      <li className="my-1 border-t border-dashed border-graphite/25" aria-hidden />
      <WfRow zero={zero} label="Contribution" title="Contribution" value={e.contribution} style={bar(0, e.contribution)} className={e.contribution < 0 ? "bg-bad" : "bg-ink"} />
    </ol>
  );
}
