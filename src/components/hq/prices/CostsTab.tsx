"use client";

import { useState } from "react";
import { targets as targetsToday } from "@/lib/content/business";
import { dayEconomics } from "@/lib/pricebook/math";
import { RESERVED_COST_LINES, type CostLineType } from "@/lib/pricebook/types";
import { EmptyState, Panel } from "@/components/hq/ui";
import { cn, formatINR } from "@/lib/utils";
import { newCostLine, newMoneyLine, toNumber, type Draft, type DraftCostLine, type DraftMoneyLine, type TabProps } from "./draft";
import { AddButton, FIGURE, Labeled, NumBox, PickBox, RemoveButton, TABLE_WRAP, TD, TextBox, TH, todayNote, useEditable } from "./fields";

const KINDS: { value: CostLineType; label: string }[] = [
  { value: "fixed", label: "A fixed amount" },
  { value: "perStudent", label: "Per student" },
  { value: "percentRevenue", label: "Percent of revenue" },
];

export function CostsTab({ draft, book, update }: TabProps) {
  const editable = useEditable();
  const [added, setAdded] = useState<string | null>(null);
  const p = book.planner;
  const setPlanner = (change: (pl: Draft["planner"]) => Draft["planner"]) => update((d) => ({ ...d, planner: change(d.planner) }));
  const setLine = (id: string, patch: Partial<DraftCostLine>) => setPlanner((pl) => ({ ...pl, lines: pl.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const setTarget = (key: keyof Draft["planner"]["targets"], v: string) => setPlanner((pl) => ({ ...pl, targets: { ...pl.targets, [key]: v } }));
  const addLine = () => {
    const line = newCostLine();
    setAdded(line.id);
    setPlanner((pl) => ({ ...pl, lines: [...pl.lines, line] }));
  };

  const day = dayEconomics(p.students, p.avgPricePerStudent, p.lines, book.rules.minimumBilling);
  const dayTotal = new Map(day.costs.map((c) => [c.id, c.total]));
  const hasDay = p.lines.length > 0;
  const atMinimum = p.students * p.avgPricePerStudent < book.rules.minimumBilling;
  const fixedTotal = p.fixedCosts.reduce((s, l) => s + l.amount, 0);
  const daysToCover = hasDay && day.contribution > 0 && fixedTotal > 0 ? Math.ceil(fixedTotal / day.contribution) : null;
  const t = p.targets;

  return (
    <div className="space-y-6">
      <p className="rounded-[var(--radius-sm)] border border-graphite/12 bg-graphite/[0.035] px-4 py-2.5 text-sm text-charcoal">
        These are your private planning numbers. They drive the Business Planner and the workshop economics inside HQ, and are never part of the website.
      </p>

      <Panel title="One JOVE Day" subtitle="What it costs to run one JOVE Day, and what the day leaves." bodyClassName="p-0">
        <div className="grid gap-x-6 gap-y-3 border-b border-graphite/10 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Labeled label="Students on the day" note="The costs below are written for a day of this size.">
            <NumBox value={draft.planner.students} onChange={(v) => setPlanner((pl) => ({ ...pl, students: v }))} invalid={toNumber(draft.planner.students) < 1} />
          </Labeled>
          <Labeled label="Average price per student" note="Before GST, across a usual mix of grades.">
            <NumBox kind="money" value={draft.planner.avgPricePerStudent} onChange={(v) => setPlanner((pl) => ({ ...pl, avgPricePerStudent: v }))} />
          </Labeled>
          <div>
            <p className="annot mb-1.5 text-charcoal">The school pays, before GST</p>
            <p className="tabular flex h-9 items-center font-mono text-lg font-bold text-graphite">{formatINR(day.revenue)}</p>
            <p className="mt-1 min-h-4 text-xs leading-4 text-blueprint">{atMinimum ? `The minimum billing of ${formatINR(book.rules.minimumBilling)} applies.` : `${p.students} students × ${formatINR(p.avgPricePerStudent)}`}</p>
          </div>
        </div>

        {draft.planner.lines.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="Calculator"
              title="No costs listed for a JOVE Day yet"
              description={editable ? "Add what one day costs you: trainers, travel, food, consumables, certificates. HQ then shows what each JOVE Day leaves." : "The founders have not listed the costs of a JOVE Day yet."}
              action={<AddButton onClick={addLine}>Add the first cost</AddButton>}
            />
          </div>
        ) : (
          <>
            <div className={TABLE_WRAP}>
              <table className="w-full min-w-[760px] table-fixed text-sm">
                <caption className="sr-only">What one JOVE Day costs to run</caption>
                <colgroup>
                  <col />
                  <col className="w-[208px]" />
                  <col className="w-[130px]" />
                  <col className="w-[120px]" />
                  <col className="w-14" />
                </colgroup>
                <thead>
                  <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                    <th scope="col" className={TH}>
                      Cost
                    </th>
                    <th scope="col" className={TH}>
                      Counted as
                    </th>
                    <th scope="col" className={cn(TH, "text-right")}>
                      Amount
                    </th>
                    <th scope="col" className={cn(TH, "text-right")}>
                      For this day
                    </th>
                    <th scope="col" className={TH}>
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {draft.planner.lines.map((l, i) => {
                    const name = l.label.trim() || `cost line ${i + 1}`;
                    return (
                      <tr key={l.id} className="border-b border-graphite/[0.07]">
                        <td className={TD}>
                          <TextBox value={l.label} onChange={(v) => setLine(l.id, { label: v })} label={`Name of cost line ${i + 1}`} placeholder="What the money is spent on" invalid={!l.label.trim() && !!l.amount.trim()} autoFocus={l.id === added} maxLength={160} className="font-medium" />
                        </td>
                        <td className={TD}>
                          <PickBox value={l.type} options={KINDS} onChange={(v) => setLine(l.id, { type: v })} label={`How ${name} is counted`} />
                        </td>
                        <td className={TD}>
                          <NumBox kind={l.type === "percentRevenue" ? "percent" : "money"} value={l.amount} onChange={(v) => setLine(l.id, { amount: v })} label={`Amount of ${name}`} invalid={l.type === "percentRevenue" && toNumber(l.amount) > 100} />
                        </td>
                        <td className={cn(TD, FIGURE)}>{formatINR(dayTotal.get(l.id) ?? 0)}</td>
                        <td className={cn(TD, "text-right")}>
                          {/* the workshop screens read these lines by name: change the amount, do not remove the line */}
                          {(RESERVED_COST_LINES as readonly string[]).includes(l.id) ? (
                            <span className="text-[11px] text-blueprint" title="Workshop packing lists and the trip estimator use this line. Set it to 0 if it does not apply.">
                              kept
                            </span>
                          ) : (
                            <RemoveButton what={name} onClick={() => setPlanner((pl) => ({ ...pl, lines: pl.lines.filter((x) => x.id !== l.id) }))} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-graphite/[0.035]">
                    <th scope="row" colSpan={3} className={cn(TD, "py-3 text-left text-sm font-semibold text-graphite")}>
                      Costs of the day
                    </th>
                    <td className={cn(TD, FIGURE, "text-base font-bold")}>{formatINR(day.variable)}</td>
                    <td className={TD} />
                  </tr>
                </tfoot>
              </table>
            </div>
            {editable && (
              <div className="border-t border-graphite/10 px-5 py-3">
                <AddButton onClick={addLine}>Add a cost</AddButton>
              </div>
            )}
          </>
        )}

        {hasDay && (
          <dl className="grid gap-px border-t border-graphite/15 bg-graphite/10 sm:grid-cols-3">
            <Result label="The school pays" value={formatINR(day.revenue)} sub="before GST" />
            <Result label="Costs of the day" value={formatINR(day.variable)} sub={`${p.lines.length} cost line${p.lines.length === 1 ? "" : "s"}`} />
            <Result label="One JOVE Day leaves" value={formatINR(day.contribution)} sub={`${day.marginPct}% of what the school pays`} strong bad={day.contribution < 0} />
          </dl>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <MoneyTable
          title="Monthly fixed costs"
          subtitle="What you pay every month whether or not there is a workshop."
          lines={draft.planner.fixedCosts}
          total={fixedTotal}
          totalLabel="Every month"
          addLabel="Add a monthly cost"
          empty="No monthly costs listed yet"
          emptyHelp="Add stipends, rent, software, marketing and the like."
          placeholder="What you pay for"
          footnote={daysToCover !== null ? `One JOVE Day leaves ${formatINR(day.contribution)}, so it takes ${daysToCover} JOVE Day${daysToCover === 1 ? "" : "s"} a month to cover these.` : undefined}
          onAdd={() => {
            const line = newMoneyLine("fixed");
            setPlanner((pl) => ({ ...pl, fixedCosts: [...pl.fixedCosts, line] }));
            return line.id;
          }}
          onChange={(change) => setPlanner((pl) => ({ ...pl, fixedCosts: change(pl.fixedCosts) }))}
        />
        <MoneyTable
          title="One-time launch budget"
          subtitle="What you buy once to start: kit stations, tools, branding, registration."
          lines={draft.planner.capex}
          total={p.capex.reduce((s, l) => s + l.amount, 0)}
          totalLabel="To launch"
          addLabel="Add a launch cost"
          empty="No launch costs listed yet"
          emptyHelp="Add what you need to buy before the first JOVE Day."
          placeholder="What you buy"
          onAdd={() => {
            const line = newMoneyLine("capex");
            setPlanner((pl) => ({ ...pl, capex: [...pl.capex, line] }));
            return line.id;
          }}
          onChange={(change) => setPlanner((pl) => ({ ...pl, capex: change(pl.capex) }))}
        />
      </div>

      <Panel title="Targets" subtitle="What you are aiming for. The Business Planner measures the plan against these.">
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <Labeled label="Workshops a month" {...todayNote(t.workshopsPerMonth !== targetsToday.workshopsPerMonth, String(targetsToday.workshopsPerMonth), "Also said on the website.")}>
            <NumBox value={draft.planner.targets.workshopsPerMonth} onChange={(v) => setTarget("workshopsPerMonth", v)} />
          </Labeled>
          <Labeled label="Revenue per workshop" note="Before GST. HQ only.">
            <NumBox kind="money" value={draft.planner.targets.revenuePerWorkshop} onChange={(v) => setTarget("revenuePerWorkshop", v)} />
          </Labeled>
          <Labeled label="Revenue a month" note={t.workshopsPerMonth > 0 && t.revenuePerWorkshop > 0 ? `${t.workshopsPerMonth} × ${formatINR(t.revenuePerWorkshop)} is ${formatINR(t.workshopsPerMonth * t.revenuePerWorkshop)}.` : "Before GST. HQ only."}>
            <NumBox kind="money" value={draft.planner.targets.monthlyRevenue} onChange={(v) => setTarget("monthlyRevenue", v)} />
          </Labeled>
          <Labeled label="Schools in year one" {...todayNote(t.yearOneSchools !== targetsToday.yearOneSchools, String(targetsToday.yearOneSchools), "Also said on the website.")}>
            <NumBox value={draft.planner.targets.yearOneSchools} onChange={(v) => setTarget("yearOneSchools", v)} />
          </Labeled>
        </div>
        <p className="mt-2 text-xs text-blueprint">Workshops a month and schools in year one are the two targets the website mentions (About and Careers pages). The revenue targets stay inside HQ.</p>
      </Panel>
    </div>
  );
}

function Result({ label, value, sub, strong, bad }: { label: string; value: string; sub: string; strong?: boolean; bad?: boolean }) {
  return (
    <div className={cn("px-5 py-4", strong ? "bg-paper" : "bg-paper-50")}>
      <dt className="annot text-[10px] text-blueprint">{label}</dt>
      <dd className={cn("tabular mt-1 font-mono font-bold leading-tight", strong ? "text-2xl" : "text-lg", bad ? "text-bad" : "text-graphite")}>{value}</dd>
      <dd className="mt-0.5 text-xs text-charcoal">{sub}</dd>
    </div>
  );
}

/** A plain list of named amounts with a total: the monthly costs, the launch budget. */
function MoneyTable({
  title,
  subtitle,
  lines,
  total,
  totalLabel,
  addLabel,
  empty,
  emptyHelp,
  placeholder,
  footnote,
  onAdd,
  onChange,
}: {
  title: string;
  subtitle: string;
  lines: DraftMoneyLine[];
  total: number;
  totalLabel: string;
  addLabel: string;
  empty: string;
  emptyHelp: string;
  placeholder: string;
  footnote?: string;
  /** adds an empty row and returns its id */
  onAdd: () => string;
  onChange: (change: (lines: DraftMoneyLine[]) => DraftMoneyLine[]) => void;
}) {
  const editable = useEditable();
  const [added, setAdded] = useState<string | null>(null);
  const add = () => setAdded(onAdd());
  const set = (id: string, patch: Partial<DraftMoneyLine>) => onChange((all) => all.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <Panel title={title} subtitle={subtitle} bodyClassName="p-0" className="min-w-0">
      {lines.length === 0 ? (
        <div className="p-5">
          <EmptyState icon="Wallet" title={empty} description={editable ? emptyHelp : "The founders have not filled this in yet."} action={<AddButton onClick={add}>{addLabel}</AddButton>} className="py-10" />
        </div>
      ) : (
        <>
          <div className={TABLE_WRAP}>
            <table className="w-full min-w-[420px] table-fixed text-sm">
              <caption className="sr-only">{title}</caption>
              <colgroup>
                <col />
                <col className="w-[136px]" />
                <col className="w-14" />
              </colgroup>
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                  <th scope="col" className={TH}>
                    What for
                  </th>
                  <th scope="col" className={cn(TH, "text-right")}>
                    Amount
                  </th>
                  <th scope="col" className={TH}>
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const name = l.label.trim() || `line ${i + 1}`;
                  return (
                    <tr key={l.id} className="border-b border-graphite/[0.07]">
                      <td className={TD}>
                        <TextBox value={l.label} onChange={(v) => set(l.id, { label: v })} label={`${title}: name of line ${i + 1}`} placeholder={placeholder} invalid={!l.label.trim() && !!l.amount.trim()} autoFocus={l.id === added} maxLength={160} />
                      </td>
                      <td className={TD}>
                        <NumBox kind="money" value={l.amount} onChange={(v) => set(l.id, { amount: v })} label={`${title}: amount of ${name}`} />
                      </td>
                      <td className={cn(TD, "text-right")}>
                        <RemoveButton what={name} onClick={() => onChange((all) => all.filter((x) => x.id !== l.id))} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-graphite/[0.035]">
                  <th scope="row" className={cn(TD, "py-3 text-left text-sm font-semibold text-graphite")}>
                    {totalLabel}
                  </th>
                  <td className={cn(TD, FIGURE, "pr-[18px] text-base font-bold")}>{formatINR(total)}</td>
                  <td className={TD} />
                </tr>
              </tfoot>
            </table>
          </div>
          {(editable || footnote) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-graphite/10 px-5 py-3">
              <AddButton onClick={add}>{addLabel}</AddButton>
              {footnote && <p className="text-xs text-blueprint">{footnote}</p>}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
