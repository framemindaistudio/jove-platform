"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Panel } from "@/components/hq/ui";
import type { PriceBook } from "@/lib/pricebook/types";
import { cn, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { Metric, NumField, PricesLink, Section, SliderField, TABLE_WRAP, TH, TextButton } from "./controls";
import { monthlyPlan, type Scenario } from "./model";
import type { Update } from "./PlannerApp";

// "|| 0" turns the −0 of "minus nothing" into a plain 0, so it never prints as "-₹0"
const inr = (v: number) => formatINR(Math.round(v) || 0);
const signed = (v: number) => (v < 0 ? `−${inr(-v)}` : inr(v));

export function MonthlyPlan({ s, update, book }: { s: Scenario; update: Update; book: PriceBook }) {
  const m = useMemo(() => monthlyPlan(s), [s]);
  // the company's own targets, as kept in the price book (0 = not set yet)
  const targets = book.planner.targets;
  const targetHint =
    targets.monthlyRevenue > 0
      ? `Company target: ${formatINR(targets.monthlyRevenue)}${targets.revenuePerWorkshop > 0 ? ` (${targets.workshopsPerMonth} workshops × ${formatINR(targets.revenuePerWorkshop)})` : ""}, from Money → Prices & Costs.`
      : "No company target yet: set it in Money → Prices & Costs, or type one here to try it.";
  /** without cost lines or fixed costs a profit figure would be made up: show a dash */
  const noLines = s.day.lines.length === 0;
  const noFixed = s.month.fixed.length === 0;
  const dash = "—";
  const needCeil = m.workshopsForTarget === null ? null : Math.ceil(m.workshopsForTarget - 1e-9);
  const pct = Math.round(m.progress * 100);
  const onTarget = m.target > 0 && m.revenue >= m.target;

  return (
    <Section id="monthly" index="02" title="Monthly plan" intro="Workshops per month plus add-ons, against fixed costs. Revenue is ex-GST; EBITDA is before tax and depreciation.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Workshops and target">
            <div className="grid gap-5 sm:grid-cols-2">
              <SliderField label="Workshops per month" min={0} max={12} value={s.month.workshops} onChange={(v) => update((d) => ((d.month.workshops = v), d))} />
              <NumField label="Monthly revenue target" prefix="₹" step={10000} value={s.month.target} onChange={(v) => update((d) => ((d.month.target = v), d))} hint={targetHint} />
            </div>
            <fieldset className="mt-5">
              <legend className="annot mb-2 text-charcoal">Revenue per workshop</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border p-3 text-sm", s.month.revenueMode === "day" ? "border-graphite bg-white" : "border-graphite/15")}>
                  <input type="radio" name="rev-mode" className="mt-1 accent-graphite" checked={s.month.revenueMode === "day"} onChange={() => update((d) => ((d.month.revenueMode = "day"), d))} />
                  <span>
                    <span className="block font-semibold">From the JOVE Day model</span>
                    <span className="tabular text-charcoal">{inr(m.day.revenue)} per workshop</span>
                  </span>
                </label>
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border p-3 text-sm", s.month.revenueMode === "custom" ? "border-graphite bg-white" : "border-graphite/15")}>
                  <input type="radio" name="rev-mode" className="mt-1 accent-graphite" checked={s.month.revenueMode === "custom"} onChange={() => update((d) => ((d.month.revenueMode = "custom"), d))} />
                  <span className="min-w-0 flex-1">
                    <span className="mb-1.5 block font-semibold">Custom amount</span>
                    <NumField ariaLabel="Custom revenue per workshop" prefix="₹" step={5000} inputClassName="h-9" value={s.month.customRevenue} onChange={(v) => update((d) => ((d.month.customRevenue = v), (d.month.revenueMode = "custom"), d))} />
                  </span>
                </label>
              </div>
            </fieldset>
          </Panel>

          <Panel title="Add-on revenue" subtitle="Upside on top of workshops. Margin is your own assumption: the share of revenue you keep after delivery costs. It starts at 0% for the services, so type it.">
            <div className={TABLE_WRAP}>
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                    <th className={TH}>Stream (per month)</th>
                    <th className={cn(TH, "w-24")}>Qty</th>
                    <th className={cn(TH, "w-32")}>₹ per unit</th>
                    <th className={cn(TH, "w-24")}>Margin</th>
                    <th className={cn(TH, "text-right")}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {s.month.addons.map((a, i) => (
                    <tr key={a.id} className="border-b border-graphite/[0.07] last:border-0">
                      <td className="px-3 py-2">
                        <span className="block font-medium">{a.label}</span>
                        <span className="text-xs text-blueprint">per {a.unit.replace(/s$/, "")}</span>
                      </td>
                      <td className="px-3 py-2">
                        <NumField ariaLabel={`${a.label} quantity`} inputClassName="h-9" value={a.qty} onChange={(v) => update((d) => ((d.month.addons[i].qty = v), d))} />
                      </td>
                      <td className="px-3 py-2">
                        <NumField ariaLabel={`${a.label} price per unit`} prefix="₹" inputClassName="h-9" value={a.unitRevenue} onChange={(v) => update((d) => ((d.month.addons[i].unitRevenue = v), d))} />
                      </td>
                      <td className="px-3 py-2">
                        <NumField ariaLabel={`${a.label} margin percent`} suffix="%" max={100} inputClassName="h-9" value={a.marginPct} onChange={(v) => update((d) => ((d.month.addons[i].marginPct = v), d))} />
                      </td>
                      <td className="tabular px-3 py-2 text-right font-medium">{inr(a.qty * a.unitRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Fixed costs per month"
            subtitle={
              <>
                What the company spends every month. They start as the monthly costs in <PricesLink />.
              </>
            }
            action={
              <TextButton
                className="shrink-0 whitespace-nowrap"
                onClick={() =>
                  update((d) => {
                    d.month.fixed.push({ id: `custom-${Date.now().toString(36)}`, label: "New fixed cost", amount: 0 });
                    return d;
                  })
                }
              >
                <Plus className="size-3.5" aria-hidden /> Add line
              </TextButton>
            }
          >
            {noFixed && (
              <p className="mb-3 rounded-[var(--radius-sm)] border border-dashed border-graphite/25 px-3 py-2 text-xs text-charcoal">
                No monthly fixed costs yet, so profit and break-even cannot be worked out. Add them in <PricesLink /> (every HQ screen then uses them), or use Add line to try a number here only.
              </p>
            )}
            <div className={cn(TABLE_WRAP, noFixed && "hidden")}>
              <table className="w-full min-w-[480px] text-sm">
                <tbody>
                  {s.month.fixed.map((f, i) => (
                    <tr key={f.id} className="border-b border-graphite/[0.07]">
                      <td className="px-3 py-1.5">
                        <input
                          aria-label={`Fixed cost ${i + 1} name`}
                          value={f.label}
                          onChange={(ev) => update((d) => ((d.month.fixed[i].label = ev.target.value), d))}
                          className="h-9 w-full rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 text-sm hover:border-graphite/15 focus:border-graphite focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="w-36 px-3 py-1.5">
                        <NumField ariaLabel={`${f.label} amount`} prefix="₹" step={500} inputClassName="h-9" value={f.amount} onChange={(v) => update((d) => ((d.month.fixed[i].amount = v), d))} />
                      </td>
                      <td className="w-10 px-1 py-1.5 text-right">
                        <button
                          type="button"
                          aria-label={`Remove ${f.label}`}
                          onClick={() => update((d) => ((d.month.fixed = d.month.fixed.filter((x) => x.id !== f.id)), d))}
                          className="grid size-8 place-items-center rounded text-blueprint hover:bg-bad/10 hover:text-bad focus-visible:outline-2 focus-visible:outline-graphite"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-graphite/[0.035] font-bold">
                    <td className="px-3 py-2.5">Total fixed costs</td>
                    <td className="tabular px-3 py-2.5 text-right" colSpan={2}>
                      {inr(m.fixed)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          {/* target progress */}
          <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite p-5 text-paper">
            <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <div className="relative">
              <div className="flex items-baseline justify-between gap-3">
                <p className="annot text-paper/55">{m.target > 0 ? <>Progress to {formatINRCompact(m.target)} / month</> : "No monthly target yet"}</p>
                <p className="tabular text-2xl font-bold">{m.target > 0 ? `${pct}%` : dash}</p>
              </div>
              <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-paper/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, pct)} aria-label="Monthly revenue as a share of the target">
                <div className="absolute inset-y-0 left-0 rounded-full bg-paper transition-[width] duration-700" style={{ width: `${Math.min(100, m.progress * 100)}%` }} />
              </div>
              <p className="tabular mt-2 flex justify-between text-xs text-paper/60">
                <span>{inr(m.revenue)} planned</span>
                <span>{m.target > 0 ? `${inr(m.target)} target` : "no target"}</span>
              </p>
              <p className="mt-4 text-sm leading-relaxed" aria-live="polite">
                {m.target <= 0 ? (
                  "Set a monthly revenue target to see what it takes."
                ) : onTarget ? (
                  <>
                    On target: <strong>{m.workshops} workshops</strong> at {inr(m.perWorkshopRevenue)}
                    {m.addonRevenue > 0 && <> plus {inr(m.addonRevenue)} of add-ons</>} bring in <strong>{inr(m.revenue)}</strong> a month, {formatNumber(Math.round(m.students))} students taught.
                  </>
                ) : needCeil === null ? (
                  "Revenue per workshop is zero, so the target cannot be reached with workshops alone."
                ) : (
                  <>
                    To hit <strong>{formatINRCompact(m.target)}</strong> a month you need <strong>{needCeil} workshop{needCeil === 1 ? "" : "s"}</strong> at {inr(m.perWorkshopRevenue)} each
                    {m.addonRevenue > 0 && <> alongside {inr(m.addonRevenue)} of add-ons</>}, about one school every {Math.max(1, Math.round(30 / Math.max(needCeil, 1)))} days and {formatNumber(needCeil * m.day.students)} students. You plan {m.workshops}, a gap of {inr(m.gap)}.
                  </>
                )}
              </p>
            </div>
          </div>

          <Panel title="Monthly profit and loss" subtitle="Ex-GST, before tax.">
            <dl className="text-sm">
              <PnlRow k={`Workshop revenue (${m.workshops} × ${inr(m.perWorkshopRevenue)})`} v={inr(m.workshopRevenue)} />
              <PnlRow k="Add-on revenue" v={inr(m.addonRevenue)} />
              <PnlRow k="Total revenue" v={inr(m.revenue)} bold />
              <PnlRow k={noLines ? "Workshop delivery costs (no cost lines yet)" : `Workshop delivery costs (${m.workshops} × ${inr(m.perWorkshopVariable)})`} v={noLines ? dash : signed(-m.workshopVariable)} />
              <PnlRow k="Add-on direct costs" v={signed(-m.addonDirect)} />
              <PnlRow k="Contribution" v={noLines ? dash : signed(m.contribution)} bold />
              <PnlRow k={noFixed ? "Fixed costs (none yet)" : "Fixed costs"} v={noFixed ? dash : signed(-m.fixed)} />
              <PnlRow k={noLines || noFixed ? "EBITDA" : `EBITDA (${m.marginPct.toFixed(0)}% of revenue)`} v={noLines || noFixed ? dash : signed(m.ebitda)} bold strong negative={!noLines && !noFixed && m.ebitda < 0} />
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-dashed border-graphite/20 pt-4">
              <Metric
                label="Break-even workshops / month"
                value={noLines || noFixed ? dash : m.breakEvenWorkshops === null ? "n/a" : m.breakEvenWorkshops.toFixed(1)}
                sub={noLines ? "Needs the cost lines of a JOVE Day" : noFixed ? "Needs monthly fixed costs" : m.breakEvenWorkshops === null ? "Each workshop loses money" : `${inr(m.perWorkshopContribution)} contribution each covers ${inr(m.fixed)} of fixed costs`}
              />
              <Metric label="Students taught / month" value={formatNumber(Math.round(m.students))} sub={`${m.day.students} per workshop`} />
            </div>
          </Panel>
        </div>
      </div>
    </Section>
  );
}

function PnlRow({ k, v, bold, strong, negative }: { k: string; v: string; bold?: boolean; strong?: boolean; negative?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 border-b border-dashed border-graphite/15 py-2 last:border-0", bold && "border-solid border-graphite/25 font-bold", strong && "bg-graphite/[0.05] px-2 text-base")}>
      <dt className={cn(!bold && "text-charcoal")}>{k}</dt>
      <dd className={cn("tabular whitespace-nowrap", negative && "text-bad")}>{v}</dd>
    </div>
  );
}
