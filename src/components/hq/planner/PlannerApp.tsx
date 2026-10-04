"use client";

import { useMemo } from "react";
import { Download, RotateCcw } from "lucide-react";
import { downloadText } from "@/components/hq/CollectionManager";
import { PageHeader, StatCard } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { formatINR, formatINRCompact } from "@/lib/utils";
import { Capex, KitEconomics } from "./CapexKits";
import { MonthlyPlan } from "./MonthlyPlan";
import { Projection } from "./Projection";
import { Streams } from "./Streams";
import { UnitEconomics } from "./UnitEconomics";
import { monthlyPlan, projection, scenarioCsv, type Scenario } from "./model";
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

export function PlannerApp() {
  const { scenario, update, reset } = usePlanner();
  const m = useMemo(() => monthlyPlan(scenario), [scenario]);
  const p = useMemo(() => projection(scenario), [scenario]);
  const inr = (v: number) => formatINR(Math.round(v));

  return (
    <>
      <PageHeader
        title="Business Planner"
        eyebrow="Founders’ cockpit"
        icon="Calculator"
        description="Unit economics, monthly targets and a 12-month projection. Every default comes from the company business model; your changes stay in this browser."
        actions={
          <>
            <Button variant="secondary" size="sm" className="h-10" onClick={() => downloadText(`jove-planner-scenario-${new Date().toISOString().slice(0, 10)}.csv`, scenarioCsv(scenario))}>
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10"
              onClick={() => {
                if (window.confirm("Reset every planner input to the company defaults? Your current scenario will be lost.")) reset();
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> Reset to defaults
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue / workshop" value={formatINRCompact(m.perWorkshopRevenue)} sub={`${m.day.students} students, ex-GST`} />
        <StatCard label="Contribution / workshop" value={formatINRCompact(m.perWorkshopContribution)} sub={m.perWorkshopRevenue > 0 ? `${Math.round((m.perWorkshopContribution / m.perWorkshopRevenue) * 100)}% margin` : "No revenue"} />
        <StatCard label="Monthly revenue" value={formatINRCompact(m.revenue)} sub={`${m.workshops} workshops / month`} progress={m.progress} />
        <StatCard label="Monthly EBITDA" value={<span className={m.ebitda < 0 ? "text-bad" : undefined}>{formatINRCompact(m.ebitda)}</span>} sub={`After ${formatINRCompact(m.fixed)} fixed costs`} />
        <StatCard label="Break-even" value={m.breakEvenWorkshops === null ? "n/a" : `${m.breakEvenWorkshops.toFixed(1)} / mo`} sub="Workshops to cover fixed costs" />
        <StatCard label="Capex payback" value={p.paybackLabel ?? (p.extraMonths ? `+${p.extraMonths} mo` : "Not reached")} sub={`${inr(p.capex.spend)} launch spend`} tone="dark" />
      </div>

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
        <UnitEconomics s={scenario} update={update} />
        <MonthlyPlan s={scenario} update={update} />
        <Projection s={scenario} update={update} />
        <Capex s={scenario} update={update} />
        <KitEconomics s={scenario} update={update} />
        <Streams s={scenario} update={update} />
      </div>

      <p className="mt-12 border-t border-graphite/10 pt-4 text-xs text-blueprint">
        All amounts are in Indian rupees. Workshop and add-on revenue is shown ex-GST; kit MRPs include 18% GST. Figures are planning scenarios, not forecasts or tax advice: confirm GST, TDS and depreciation treatment with your CA.
      </p>
    </>
  );
}
