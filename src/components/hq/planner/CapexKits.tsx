"use client";

import { useMemo } from "react";
import { Panel } from "@/components/hq/ui";
import { Badge } from "@/components/ui/Badge";
import { cn, formatINR, formatINRCompact } from "@/lib/utils";
import { Metric, NumField, Section, SliderField, TABLE_WRAP, TH, TextButton } from "./controls";
import { capexSummary, isOptionalLine, isReserveLine, kitRows, type Scenario } from "./model";
import type { Update } from "./PlannerApp";

const inr = (v: number) => formatINR(Math.round(v));

/* ───────────────────────────── d) launch capex ───────────────────────────── */

export function Capex({ s, update }: { s: Scenario; update: Update }) {
  const c = useMemo(() => capexSummary(s.capex), [s.capex]);
  const preset = (mode: "lean" | "full") =>
    update((d) => {
      d.capex.forEach((l) => (l.included = mode === "full" ? true : !isOptionalLine(l) && !isReserveLine(l)));
      return d;
    });

  return (
    <Section
      id="capex"
      index="04"
      title="Launch capex"
      intro="One-time investment before the first workshop. Tick what you will actually buy; the 12-month projection pays this back from profit."
      action={
        <div className="flex gap-1">
          <TextButton onClick={() => preset("lean")}>Lean budget</TextButton>
          <TextButton onClick={() => preset("full")}>Full budget</TextButton>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className={TABLE_WRAP}>
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Launch capex lines with include toggles and editable amounts</caption>
            <thead>
              <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                <th className={cn(TH, "w-12")}>Buy</th>
                <th className={TH}>Item</th>
                <th className={cn(TH, "w-36")}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.capex.map((l, i) => (
                <tr key={l.id} className={cn("border-b border-graphite/[0.07] last:border-0", !l.included && "opacity-60")}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-graphite"
                      checked={l.included}
                      aria-label={`Include ${l.label}`}
                      onChange={(e) => update((d) => ((d.capex[i].included = e.target.checked), d))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className="mr-2">{l.label}</span>
                    {isOptionalLine(l) && <Badge tone="outline">Optional</Badge>}
                    {isReserveLine(l) && <Badge tone="info">Cash reserve</Badge>}
                  </td>
                  <td className="px-3 py-1.5">
                    <NumField ariaLabel={`${l.label} amount`} prefix="₹" step={500} inputClassName="h-9" value={l.amount} onChange={(v) => update((d) => ((d.capex[i].amount = v), d))} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-graphite/20 bg-graphite/[0.035] font-bold">
                <td className="px-3 py-2.5" colSpan={2}>
                  Selected total
                </td>
                <td className="tabular px-3 py-2.5">{inr(c.selected)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite p-5 text-paper">
            <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <div className="relative">
              <p className="annot text-paper/55">Selected budget</p>
              <p className="tabular mt-2 text-3xl font-bold tracking-tight">{inr(c.selected)}</p>
              <p className="mt-1 text-sm text-paper/70">
                {inr(c.spend)} spent on kit, tools and branding
                {c.selectedReserve > 0 && <> plus {inr(c.selectedReserve)} held as working capital</>}.
              </p>
            </div>
          </div>
          <Panel title="Lean vs full">
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Lean budget" value={formatINRCompact(c.lean)} sub="No laptops, no cash reserve" strong />
              <Metric label="Full budget" value={formatINRCompact(c.full)} sub="Everything in the list" strong />
              <Metric label="Optional items" value={formatINRCompact(c.optional)} sub="Refurbished laptops for AI sessions" />
              <Metric label="Cash reserve" value={formatINRCompact(c.reserve)} sub="About 3 months of fixed costs" />
            </div>
            <p className="mt-4 text-xs text-charcoal">Lean needs {formatINRCompact(c.full - c.lean)} less up front, but leaves no cushion if early school bookings slip. Component prices are 2026 market estimates: confirm with vendors before purchase orders.</p>
          </Panel>
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────────── e) kit economics ───────────────────────────── */

export function KitEconomics({ s, update }: { s: Scenario; update: Update }) {
  const rows = useMemo(() => kitRows(s.kitCostAdjustPct), [s.kitCostAdjustPct]);
  const pct = (v: number) => `${Math.round(v)}%`;

  return (
    <Section
      id="kits"
      index="05"
      title="Kit economics"
      intro="Bill-of-materials cost against online MRP and the bulk school price. Prices include 18% GST; margin is calculated on the amount left after GST."
    >
      <div className="mb-4 max-w-md">
        <SliderField
          label="Component price change (what-if)"
          min={-20}
          max={40}
          step={5}
          value={s.kitCostAdjustPct}
          format={(v) => `${v > 0 ? "+" : ""}${v}%`}
          onChange={(v) => update((d) => ((d.kitCostAdjustPct = v), d))}
        />
      </div>
      <div className={TABLE_WRAP}>
        <table className="w-full min-w-[920px] text-sm">
          <caption className="sr-only">Kit cost, price and margin at MRP and at school price</caption>
          <thead>
            <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
              <th className={TH}>Kit</th>
              <th className={cn(TH, "text-right")}>BOM cost</th>
              <th className={cn(TH, "text-right")}>MRP</th>
              <th className={cn(TH, "text-right")}>Net of GST</th>
              <th className={cn(TH, "text-right")}>Margin at MRP</th>
              <th className={cn(TH, "text-right")}>School price</th>
              <th className={cn(TH, "text-right")}>Net of GST</th>
              <th className={cn(TH, "text-right")}>Margin at school price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ kit, cost, mrp, school }) => (
              <tr key={kit.id} className="border-b border-graphite/[0.07] last:border-0">
                <th scope="row" className="px-3 py-3 text-left">
                  <span className="block font-semibold">{kit.name}</span>
                  <span className="tabular text-xs font-normal text-blueprint">
                    {kit.sku} · {kit.grades} · {kit.bom.length} parts
                  </span>
                </th>
                <td className="tabular px-3 py-3 text-right font-medium">{inr(cost)}</td>
                <td className="tabular px-3 py-3 text-right">{inr(mrp.price)}</td>
                <td className="tabular px-3 py-3 text-right text-charcoal">{inr(mrp.net)}</td>
                <td className={cn("tabular px-3 py-3 text-right font-bold", mrp.margin < 0 && "text-bad")}>
                  {inr(mrp.margin)} <span className="font-normal text-charcoal">({pct(mrp.marginPct)})</span>
                </td>
                <td className="tabular px-3 py-3 text-right">{inr(school.price)}</td>
                <td className="tabular px-3 py-3 text-right text-charcoal">{inr(school.net)}</td>
                <td className={cn("tabular px-3 py-3 text-right font-bold", school.margin < 0 && "text-bad")}>
                  {inr(school.margin)} <span className="font-normal text-charcoal">({pct(school.marginPct)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-blueprint">Margins exclude packaging labour, shipping, payment-gateway fees and returns. Bulk school price applies from 30 kits.</p>
    </Section>
  );
}
