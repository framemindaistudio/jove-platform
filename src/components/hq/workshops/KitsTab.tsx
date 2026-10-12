"use client";

import { Package, Printer, Square } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatINR, formatNumber } from "@/lib/utils";
import { useBook } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Notice, PricesLink } from "./bits";
import { kitPlan, materialLines, packingList, planCosts, SPARE_RATE, type Rec } from "./logic";

const th = "annot px-4 py-2.5 text-[10px] text-blueprint";
const tdNum = "tabular px-4 py-3 text-right font-mono";
const dash = <span className="text-blueprint/60">—</span>;

export function KitsTab({ w, showMoney }: { w: Rec; showMoney: boolean }) {
  // what materials cost is in the price book, which only the roles that see Finance receive
  const book = useBook();
  const plan = kitPlan(w);
  const t = plan.totals;
  const packing = packingList(w);
  const materials = materialLines(t, planCosts(book));
  const canCost = showMoney && !!book;
  /** the cost columns appear once the price book has a cost for at least one of the three items */
  const withCost = canCost && materials.total !== null;

  if (!plan.rows.length) {
    return <Notice tone="warn">Add student counts per grade band (Edit) and this tab works out stations, kits to pack, batteries, worksheets and certificates for you.</Notice>;
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Stations & kits to pack"
        subtitle={`Stations = students per session ÷ students per station (rounded up) · spares = ${Math.round(SPARE_RATE * 100)}% of stations (rounded up)`}
        bodyClassName="p-0"
        action={
          <a href={`/hq/print/runsheet/${w.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-graphite px-3 text-xs font-semibold hover:bg-graphite hover:text-paper">
            <Printer className="size-4" aria-hidden /> Packing list
          </a>
        }
      >
        <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-graphite/10 text-left">
                <th scope="col" className={th}>
                  Band & kit
                </th>
                {["Students", "Sessions", "Per session", "Stations", "Spares", "Kits to pack", "Battery sets", "AA cells"].map((h) => (
                  <th key={h} scope="col" className={`${th} text-right`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.rows.map((p) => (
                <tr key={p.band.id} className="border-b border-dashed border-graphite/10 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{p.band.name}</p>
                    <p className="text-xs text-blueprint">
                      {p.band.grades} · {p.kit?.name ?? "Kit"} · {p.band.studentsPerStation} per station, max {p.band.maxPerSession} per session
                    </p>
                  </td>
                  <td className={tdNum}>{formatNumber(p.students)}</td>
                  <td className={tdNum}>{p.sessions}</td>
                  <td className={tdNum}>{p.perSession}</td>
                  <td className={tdNum}>{p.stations}</td>
                  <td className={tdNum}>{p.spares}</td>
                  <td className={`${tdNum} font-bold`}>{p.kitsToPack}</td>
                  <td className={tdNum}>{p.batterySets}</td>
                  <td className={tdNum}>{p.cellsPerStation === null ? <span className="text-blueprint" title="USB / power-module kit">USB</span> : p.aaCells}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-graphite/20 bg-graphite/[0.035]">
                <th scope="row" className="px-4 py-3 text-left font-semibold">
                  Total
                </th>
                <td className={`${tdNum} font-bold`}>{formatNumber(t.students)}</td>
                <td className={`${tdNum} font-bold`}>{t.sessions}</td>
                <td />
                <td className={`${tdNum} font-bold`}>{t.stations}</td>
                <td className={`${tdNum} font-bold`}>{t.spares}</td>
                <td className={`${tdNum} font-bold`}>{t.kitsToPack}</td>
                <td className={`${tdNum} font-bold`}>{t.batterySets}</td>
                <td className={`${tdNum} font-bold`}>{t.aaCells}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel
          title="Consumables, worksheets & certificates"
          subtitle={
            withCost ? (
              <>
                Unit costs from the cost lines of a JOVE Day in <PricesLink className="hover:text-graphite" />
              </>
            ) : (
              "Quantities to pack"
            )
          }
          className="lg:col-span-3"
          bodyClassName="p-0"
        >
          <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-graphite/10 text-left">
                  <th scope="col" className={th}>
                    Item
                  </th>
                  {["Quantity", ...(withCost ? ["Unit cost", "Cost"] : [])].map((h) => (
                    <th key={h} scope="col" className={`${th} text-right`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.lines.map((r) => (
                  <tr key={r.id} className="border-b border-dashed border-graphite/10">
                    <td className="px-4 py-3">{r.label}</td>
                    <td className={tdNum}>{formatNumber(r.qty)}</td>
                    {withCost && <td className={tdNum}>{r.unitCost === null ? dash : formatINR(r.unitCost, { decimals: !Number.isInteger(r.unitCost) })}</td>}
                    {withCost && <td className={`${tdNum} font-semibold`}>{r.cost === null ? dash : formatINR(Math.round(r.cost))}</td>}
                  </tr>
                ))}
              </tbody>
              {withCost && materials.total !== null && (
                <tfoot>
                  <tr className="bg-graphite/[0.035]">
                    <th scope="row" colSpan={3} className="px-4 py-3 text-left font-semibold">
                      {materials.incomplete ? "Materials cost so far" : "Materials cost"}
                    </th>
                    <td className={`${tdNum} font-bold`}>{formatINR(Math.round(materials.total))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {canCost && materials.incomplete && (
            <p className="border-t border-graphite/10 px-4 py-3 text-xs leading-relaxed text-blueprint">
              {withCost ? "A dash means no cost per student is set for that item yet." : "No cost per student is set for these items yet, so only the quantities are shown."} Add it to the cost lines of a JOVE Day in <PricesLink className="hover:text-graphite" /> and it appears here.
            </p>
          )}
        </Panel>

        <Panel title="Kit for each band" className="lg:col-span-2">
          <ul className="space-y-3">
            {plan.rows.map((p) => (
              <li key={p.band.id}>
                <details className="group rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3 py-2.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-graphite [&::-webkit-details-marker]:hidden">
                    <Package className="size-4 shrink-0 text-blueprint" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      {p.kit?.name ?? "Kit"} <span className="font-normal text-blueprint">· {p.band.grades}</span>
                    </span>
                    <Badge tone="outline">{p.kitsToPack} to pack</Badge>
                  </summary>
                  <p className="mt-2 text-xs text-charcoal">{p.kit?.project}</p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-charcoal marker:text-blueprint">
                    {(p.kit?.inTheBox ?? []).map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Packing list for the vehicle" subtitle="Built from the plan above — prints with tick boxes on the run sheet">
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {packing.map((g) => (
            <section key={g.group} aria-label={g.group}>
              <h4 className="annot mb-2 border-b border-graphite/15 pb-1.5 text-[10px] text-blueprint">{g.group}</h4>
              <ul className="space-y-1.5">
                {g.items.map((i) => (
                  <li key={i.label} className="flex items-start gap-2 text-sm">
                    <Square className="mt-0.5 size-3.5 shrink-0 text-graphite/40" aria-hidden />
                    <span className="min-w-0 flex-1">{i.label}</span>
                    {i.qty && <span className="tabular shrink-0 font-mono text-xs text-charcoal">{i.qty}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Panel>
    </div>
  );
}
