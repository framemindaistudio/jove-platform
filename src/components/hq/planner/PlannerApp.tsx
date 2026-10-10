"use client";

import { useMemo } from "react";
import { Download, RotateCcw } from "lucide-react";
import { downloadText } from "@/components/hq/CollectionManager";
import { useBook } from "@/components/hq/data";
import { PRICES_HREF } from "@/components/hq/product/lib";
import { EmptyState, PageHeader, StatCard } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import type { PriceBook } from "@/lib/pricebook/types";
import { formatINR, formatINRCompact } from "@/lib/utils";
import { Capex, KitEconomics } from "./CapexKits";
import { Note, PricesLink, listAnd } from "./controls";
import { MonthlyPlan } from "./MonthlyPlan";
import { Projection } from "./Projection";
import { Streams } from "./Streams";
import { UnitEconomics } from "./UnitEconomics";
import { monthlyPlan, ownNumbers, projection, scenarioCsv, type Scenario } from "./model";
import { usePlanner } from "./store";

export type Update = (fn: (draft: Scenario) => Scenario) => void;

const SECTIONS = [
  { id: "unit-economics", label: "JOVE Day" },
  { id: "monthly", label: "Monthly plan" },
  { id: "projection", label: "12-month projection" },
  { id: "capex", label: "Launch capex" },
  { id: "kits", label: "Kit economics" },
  { id: "streams", label: "Revenue streams" },
];

const HEADER = { title: "Business Planner", eyebrow: "Founders’ cockpit", icon: "Calculator" } as const;

/**
 * /hq/planner. Every default is a number from the price book (HQ → Money → Prices & Costs), which only the roles
 * that see Finance receive. Without it there is nothing to plan with.
 */
export function PlannerApp() {
  const book = useBook();
  if (!book) {
    return (
      <>
        <PageHeader {...HEADER} description="Unit economics, monthly targets and a 12-month projection." />
        <EmptyState icon="Calculator" title="The planner is not available for this login" description="It works with what things cost JOVE, and those numbers are shown only to founders, admins and operations." />
      </>
    );
  }
  return <Planner book={book} />;
}

function Planner({ book }: { book: PriceBook }) {
  const { scenario, update, reset } = usePlanner(book);
  const m = useMemo(() => monthlyPlan(scenario), [scenario]);
  const p = useMemo(() => projection(scenario), [scenario]);
  const own = useMemo(() => ownNumbers(scenario), [scenario]);
  const inr = (v: number) => formatINR(Math.round(v));

  // a plan is only as good as the numbers behind it: say what is missing instead of planning with zeros
  const has = { lines: scenario.day.lines.length > 0, fixed: scenario.month.fixed.length > 0, capex: scenario.capex.length > 0 };
  const inBook = { lines: book.planner.lines.length > 0, fixed: book.planner.fixedCosts.length > 0, capex: book.planner.capex.length > 0 };
  const missing = [!has.lines && "the cost lines of a JOVE Day", !has.fixed && "your monthly fixed costs", !has.capex && "your launch budget"].filter((x): x is string => !!x);

  const resetButton = (
    <Button
      variant="ghost"
      size="sm"
      className="h-10"
      onClick={() => {
        if (window.confirm("Reset every planner input to the numbers in Prices & Costs? Your current scenario will be lost.")) reset();
      }}
    >
      <RotateCcw className="size-4" aria-hidden /> Reset to defaults
    </Button>
  );
  const description = (
    <>
      Unit economics, monthly targets and a 12-month projection. Every default comes from <PricesLink />; what you change here is a what-if that stays in this browser.
    </>
  );

  // nothing to plan with: a fresh installation, or a saved scenario with every cost removed
  if (!has.lines && !has.fixed) {
    const empty = !inBook.lines && !inBook.fixed;
    return (
      <>
        <PageHeader {...HEADER} description={description} actions={empty ? undefined : resetButton} />
        <EmptyState
          icon="Calculator"
          title={empty ? "Add your costs first" : "This scenario has no costs in it"}
          description={
            empty ? (
              <>The planner builds its plan from what a JOVE Day costs to run, your monthly fixed costs and your launch budget. None of these is filled in yet: add them in HQ → Money → Prices &amp; Costs and the planner fills in from there.</>
            ) : (
              <>The scenario saved in this browser has no cost lines and no fixed costs, so there is nothing to plan with. Press Reset to defaults to start again from the numbers in Prices &amp; Costs.</>
            )
          }
          action={
            empty ? (
              <Button href={PRICES_HREF} size="sm">
                Open Prices &amp; Costs
              </Button>
            ) : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        {...HEADER}
        description={description}
        actions={
          <>
            <Button variant="secondary" size="sm" className="h-10" onClick={() => downloadText(`jove-planner-scenario-${new Date().toISOString().slice(0, 10)}.csv`, scenarioCsv(scenario, book))}>
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
            {resetButton}
          </>
        }
      />

      {missing.length > 0 && (
        <Note tone="warn" className="mb-4">
          Not filled in yet: {listAnd(missing)}. Add what is missing in <PricesLink />; until then the figures that depend on it show a dash, rather than a plan built on zeros.
        </Note>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue / workshop" value={formatINRCompact(m.perWorkshopRevenue)} sub={`${m.day.students} students, ex-GST`} />
        <StatCard
          label="Contribution / workshop"
          value={has.lines ? formatINRCompact(m.perWorkshopContribution) : "—"}
          sub={!has.lines ? "No cost lines yet" : m.perWorkshopRevenue > 0 ? `${Math.round((m.perWorkshopContribution / m.perWorkshopRevenue) * 100)}% margin` : "No revenue"}
        />
        <StatCard label="Monthly revenue" value={formatINRCompact(m.revenue)} sub={`${m.workshops} workshops / month`} progress={m.target > 0 ? m.progress : undefined} />
        <StatCard
          label="Monthly EBITDA"
          value={has.lines && has.fixed ? <span className={m.ebitda < 0 ? "text-bad" : undefined}>{formatINRCompact(m.ebitda)}</span> : "—"}
          sub={has.lines && has.fixed ? `After ${formatINRCompact(m.fixed)} fixed costs` : !has.fixed ? "No fixed costs yet" : "No cost lines yet"}
        />
        <StatCard
          label="Break-even"
          value={!has.lines || !has.fixed ? "—" : m.breakEvenWorkshops === null ? "n/a" : `${m.breakEvenWorkshops.toFixed(1)} / mo`}
          sub={has.lines && has.fixed ? "Workshops to cover fixed costs" : !has.fixed ? "No fixed costs yet" : "No cost lines yet"}
        />
        <StatCard
          label="Capex payback"
          value={!has.capex || !has.lines || !has.fixed ? "—" : (p.paybackLabel ?? (p.extraMonths ? `+${p.extraMonths} mo` : "Not reached"))}
          sub={has.capex ? `${inr(p.capex.spend)} launch spend` : "No launch budget yet"}
          tone="dark"
        />
      </div>

      {own.length > 0 && (
        <p className="mt-3 text-xs text-blueprint">
          Your own what-if numbers in this browser: {listAnd(own)}. They no longer follow <PricesLink /> — press Reset to defaults to go back to the numbers there.
        </p>
      )}

      <nav aria-label="Planner sections" className="no-print mt-6 flex flex-wrap gap-2 border-b border-graphite/10 pb-4">
        {SECTIONS.map((sec, i) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-graphite/20 px-3 text-xs font-semibold text-charcoal transition-colors hover:border-graphite hover:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
          >
            <span className="tabular text-blueprint">{String(i + 1).padStart(2, "0")}</span>
            {sec.label}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-16">
        <UnitEconomics s={scenario} update={update} book={book} />
        <MonthlyPlan s={scenario} update={update} book={book} />
        <Projection s={scenario} update={update} book={book} />
        <Capex s={scenario} update={update} />
        <KitEconomics s={scenario} update={update} book={book} />
        <Streams s={scenario} update={update} book={book} />
      </div>

      <p className="mt-12 border-t border-graphite/10 pt-4 text-xs text-blueprint">
        All amounts are in Indian rupees. Workshop and add-on revenue is shown ex-GST; kit MRPs include {book.kitGstPercent}% GST. Figures are planning scenarios, not forecasts or tax advice: confirm GST, TDS and depreciation treatment with your CA.
      </p>
    </>
  );
}
