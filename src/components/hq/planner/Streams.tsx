"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, Eraser } from "lucide-react";
import { EmptyState, Panel } from "@/components/hq/ui";
import { Badge } from "@/components/ui/Badge";
import type { PriceBook } from "@/lib/pricebook/types";
import { cn, formatINR, formatINRCompact } from "@/lib/utils";
import { Metric, NumField, PricesLink, Section, TABLE_WRAP, TH, TextButton } from "./controls";
import { estimatorToAddons, estimatorTotals, type Scenario } from "./model";
import type { Update } from "./PlannerApp";

const inr = (v: number) => formatINR(Math.round(v));

function stageTone(stage: string) {
  if (stage === "Now") return "dark" as const;
  if (/^Month/.test(stage)) return "neutral" as const;
  return "outline" as const;
}

export function Streams({ s, update, book }: { s: Scenario; update: Update; book: PriceBook }) {
  // the founders' own list of ways to earn, kept in the price book
  const streams = book.planner.streams;
  const stages = useMemo(() => [...new Set(streams.map((r) => r.stage).filter(Boolean))], [streams]);
  const [picked, setPicked] = useState<string>("all");
  const [applied, setApplied] = useState(false);
  const stage = picked === "all" || stages.includes(picked) ? picked : "all";
  const shown = useMemo(() => (stage === "all" ? streams : streams.filter((r) => r.stage === stage)), [stage, streams]);
  const est = useMemo(() => estimatorTotals(s, book), [s, book]);

  return (
    <Section
      id="streams"
      index="06"
      title="Revenue streams"
      intro={
        <>
          Every way JOVE can earn, by when it becomes realistic. Potentials are your own planning notes from <PricesLink />, not guarantees.
        </>
      }
    >
      {streams.length === 0 ? (
        <EmptyState
          icon="Calculator"
          title="No revenue streams listed yet"
          description={
            <>
              List the ways JOVE can earn, and when each becomes realistic, in <PricesLink />. They appear here as cards.
            </>
          }
        />
      ) : (
        <>
          <div role="group" aria-label="Filter streams by stage" className="mb-4 flex flex-wrap gap-2">
            {["all", ...stages].map((st) => {
              const count = st === "all" ? streams.length : streams.filter((r) => r.stage === st).length;
              const active = stage === st;
              return (
                <button
                  key={st}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPicked(st)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite",
                    active ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-charcoal hover:border-graphite hover:text-graphite",
                  )}
                >
                  {st === "all" ? "All streams" : st}
                  <span className={cn("tabular text-[10px]", active ? "text-paper/70" : "text-blueprint")}>{count}</span>
                </button>
              );
            })}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((r) => (
              <li key={r.id} className="relative flex flex-col gap-2 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 shadow-[var(--shadow-paper)]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold leading-snug">{r.name}</h3>
                  {r.stage && (
                    <Badge tone={stageTone(r.stage)} className="shrink-0">
                      {r.stage}
                    </Badge>
                  )}
                </div>
                {r.model && <p className="text-xs text-charcoal">{r.model}</p>}
                {r.potential && <p className="mt-auto border-t border-dashed border-graphite/20 pt-2 text-xs font-medium">{r.potential}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8">
        <Panel
          title="Add-on revenue potential estimator"
          subtitle="How many of each could you sell in a month? Prices are today's rate card. Margin is your own assumption (the share of revenue you keep): type it."
          action={
            <div className="flex shrink-0 gap-1">
              <TextButton
                className="whitespace-nowrap"
                onClick={() => {
                  update((d) => ((d.month.addons = estimatorToAddons(d, book)), d));
                  setApplied(true);
                }}
                disabled={est.monthly === 0}
              >
                <ArrowDownToLine className="size-3.5" aria-hidden /> Use in monthly plan
              </TextButton>
              <TextButton
                className="whitespace-nowrap"
                onClick={() => {
                  update((d) => ((d.estimator = {}), d));
                  setApplied(false);
                }}
                disabled={est.monthly === 0}
              >
                <Eraser className="size-3.5" aria-hidden /> Clear
              </TextButton>
            </div>
          }
        >
          <div className={TABLE_WRAP}>
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Add-on streams with quantity per month, revenue, margin and contribution</caption>
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                  <th className={TH}>Stream</th>
                  <th className={cn(TH, "text-right")}>₹ per unit</th>
                  <th className={cn(TH, "w-28")}>Per month</th>
                  <th className={cn(TH, "text-right")}>Revenue</th>
                  <th className={cn(TH, "w-32")}>Margin</th>
                  <th className={cn(TH, "text-right")}>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {est.rows.map((r) => (
                  <tr key={r.id} className="border-b border-graphite/[0.07] last:border-0">
                    <td className="px-3 py-2">
                      <span className="block font-medium">{r.label}</span>
                      <span className="text-xs text-blueprint">{r.unit}</span>
                    </td>
                    <td className="tabular px-3 py-2 text-right text-charcoal">{inr(r.price)}</td>
                    <td className="px-3 py-1.5">
                      <NumField
                        ariaLabel={`${r.label}: ${r.unit}`}
                        inputClassName="h-9"
                        value={r.qty}
                        onChange={(v) => {
                          setApplied(false);
                          update((d) => ((d.estimator[r.id] = v), d));
                        }}
                      />
                    </td>
                    <td className="tabular px-3 py-2 text-right">{inr(r.monthly)}</td>
                    <td className="px-3 py-1.5">
                      <NumField
                        ariaLabel={`${r.label}: margin percent`}
                        suffix="%"
                        max={100}
                        inputClassName="h-9"
                        value={r.marginPct}
                        onChange={(v) => {
                          setApplied(false);
                          update((d) => (((d.estimatorMargins ??= {})[r.id] = v), d));
                        }}
                      />
                    </td>
                    <td className="tabular px-3 py-2 text-right font-medium">{r.monthly > 0 && r.marginPct <= 0 ? <span className="font-normal text-blueprint/60">—</span> : inr(r.contribution)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Add-on revenue / month" value={inr(est.monthly)} strong />
            <Metric label="Contribution / month" value={est.monthly > 0 && est.contribution <= 0 ? "—" : inr(est.contribution)} sub={est.monthly > 0 && est.contribution <= 0 ? "Type a margin to see it" : undefined} />
            <Metric label="If sustained for 12 months" value={formatINRCompact(est.annual)} sub="Revenue, ex-GST" />
          </div>
          <p className="mt-3 text-xs text-blueprint" aria-live="polite">
            {applied ? "Applied: social media, films, clubs and teacher training now feed the monthly plan (section 02). " : ""}
            Camps and lab setups are not part of the monthly add-ons: camps are modelled in the 12-month projection.
          </p>
        </Panel>
      </div>
    </Section>
  );
}
