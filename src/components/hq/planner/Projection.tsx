"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Panel } from "@/components/hq/ui";
import { cn, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { Metric, NumField, Section, TABLE_WRAP, TH } from "./controls";
import { projection, type Scenario } from "./model";
import type { Update } from "./PlannerApp";

const ProjectionChart = dynamic(() => import("./ProjectionChart"), {
  ssr: false,
  loading: () => <div className="grid h-[300px] place-items-center text-sm text-blueprint">Loading chart…</div>,
});

const inr = (v: number) => formatINR(Math.round(v));
const signed = (v: number) => (v < 0 ? `−${inr(-v)}` : inr(v));

export function Projection({ s, update }: { s: Scenario; update: Update }) {
  const p = useMemo(() => projection(s), [s]);
  const last = p.rows[p.rows.length - 1];
  const cashPositive = last.cash >= 0;

  return (
    <Section
      id="projection"
      index="03"
      title="12-month projection"
      intro="Oct 2026 to Sep 2027. Edit the ramp of workshops and camps; revenue, costs and cash follow. Camps are an assumption to test, not a commitment."
    >
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="12-month revenue" value={formatINRCompact(p.totals.revenue)} sub={`${p.totals.workshops} workshops, ${p.totals.camps} camps`} />
          <Metric label="12-month profit" value={<span className={p.totals.profit < 0 ? "text-bad" : undefined}>{formatINRCompact(p.totals.profit)}</span>} sub="After fixed costs" />
          <Metric label="Launch spend" value={formatINRCompact(p.capex.spend)} sub={p.capex.selectedReserve ? `+ ${formatINRCompact(p.capex.selectedReserve)} cash reserve` : "Selected capex"} />
          <Metric
            label="Payback month"
            value={p.paybackLabel ?? (p.extraMonths ? `~${p.extraMonths} mo after Sep ’27` : "Not reached")}
            sub={p.paybackLabel ? `Month ${p.paybackIndex + 1} of 12` : p.extraMonths ? "At the last 3 months’ run-rate" : "Run-rate profit is not positive"}
            strong
          />
          <Metric label="Deepest cash dip" value={formatINRCompact(p.lowestCash)} sub="Lowest point after capex" />
          <Metric label="Exit run-rate" value={`${formatINRCompact(p.runRate)}/mo`} sub="Avg profit, last 3 months" />
        </div>

        <Panel
          title="Cash position vs launch capex"
          subtitle={
            p.paybackLabel
              ? `Launch spend of ${inr(p.capex.spend)} is recovered in ${p.paybackLabel}. By Sep 2027 the cash position is ${signed(last.cash)}.`
              : `Launch spend of ${inr(p.capex.spend)} is not recovered within 12 months; cash position in Sep 2027 is ${signed(last.cash)}.`
          }
        >
          <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-charcoal" aria-hidden>
            <li className="flex items-center gap-2"><span className="hatch inline-block h-3 w-5 border border-graphite/60" /> Cash after capex</li>
            <li className="flex items-center gap-2"><span className="inline-block h-0.5 w-5 bg-graphite" /> Revenue</li>
            <li className="flex items-center gap-2"><span className="inline-block w-5 border-t-2 border-dashed border-blueprint" /> Profit</li>
          </ul>
          <ProjectionChart rows={p.rows} spend={p.capex.spend} paybackLabel={p.paybackLabel} />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className={TABLE_WRAP}>
            <table className="w-full min-w-[820px] text-sm">
              <caption className="sr-only">Monthly ramp, revenue, costs, profit and cash position</caption>
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                  <th className={TH}>Month</th>
                  <th className={cn(TH, "w-24")}>Workshops</th>
                  <th className={cn(TH, "w-24")}>Camps</th>
                  <th className={cn(TH, "text-right")}>Revenue</th>
                  <th className={cn(TH, "text-right")}>Costs</th>
                  <th className={cn(TH, "text-right")}>Profit</th>
                  <th className={cn(TH, "text-right")}>Cash after capex</th>
                </tr>
              </thead>
              <tbody>
                {p.rows.map((r, i) => (
                  <tr key={r.label} className={cn("border-b border-graphite/[0.07]", i === p.paybackIndex && "bg-graphite/[0.06]")}>
                    <th scope="row" className="px-3 py-1.5 text-left font-medium">
                      {r.label}
                      {i === p.paybackIndex && <span className="annot ml-2 rounded-full bg-graphite px-2 py-0.5 text-[9px] text-paper">Payback</span>}
                    </th>
                    <td className="px-3 py-1.5">
                      <NumField ariaLabel={`${r.label} workshops`} inputClassName="h-9" max={31} value={s.year.workshops[i]} onChange={(v) => update((d) => ((d.year.workshops[i] = v), d))} />
                    </td>
                    <td className="px-3 py-1.5">
                      <NumField ariaLabel={`${r.label} camps`} inputClassName="h-9" max={8} value={s.year.camps[i]} onChange={(v) => update((d) => ((d.year.camps[i] = v), d))} />
                    </td>
                    <td className="tabular px-3 py-1.5 text-right">{inr(r.revenue)}</td>
                    <td className="tabular px-3 py-1.5 text-right">{inr(r.variable + r.fixed)}</td>
                    <td className={cn("tabular px-3 py-1.5 text-right font-medium", r.profit < 0 && "text-bad")}>{signed(r.profit)}</td>
                    <td className={cn("tabular px-3 py-1.5 text-right font-bold", r.cash < 0 && "text-bad")}>{signed(r.cash)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-graphite/20 bg-graphite/[0.035] font-bold">
                  <td className="px-3 py-2.5">12 months</td>
                  <td className="tabular px-3 py-2.5">{formatNumber(p.totals.workshops)}</td>
                  <td className="tabular px-3 py-2.5">{formatNumber(p.totals.camps)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{inr(p.totals.revenue)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{inr(p.totals.variable + p.totals.fixed)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{signed(p.totals.profit)}</td>
                  <td className={cn("tabular px-3 py-2.5 text-right", !cashPositive && "text-bad")}>{signed(last.cash)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <Panel title="Camps and add-ons" subtitle="Assumptions behind the ramp.">
            <div className="space-y-4">
              <NumField label="Students per camp batch" value={s.year.campStudents} onChange={(v) => update((d) => ((d.year.campStudents = v), d))} />
              <NumField label="Camp price per student" prefix="₹" step={100} value={s.year.campPrice} onChange={(v) => update((d) => ((d.year.campPrice = v), d))} hint="Camps list at ₹2,999 to ₹4,999 for 5 days." />
              <NumField label="Camp margin kept" suffix="%" max={100} value={s.year.campMarginPct} onChange={(v) => update((d) => ((d.year.campMarginPct = v), d))} hint="Planning assumption." />
              <NumField label="Add-ons (section 02) start in month" min={1} max={13} value={s.year.addonsFromMonth} onChange={(v) => update((d) => ((d.year.addonsFromMonth = Math.round(v)), d))} hint="Use 13 to leave add-ons out of the projection." />
            </div>
          </Panel>
        </div>
        <p className="text-xs text-blueprint">
          Fixed costs run every month. The working-capital reserve in launch capex is cash held, not spent, so payback is measured against the spend only. These are planning scenarios, not forecasts: review with your CA before sharing outside the company.
        </p>
      </div>
    </Section>
  );
}
