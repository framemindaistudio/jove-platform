"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Factory, PackageCheck, Printer, ShoppingCart } from "lucide-react";
import { gradeBands, kitCost, kitMargin, kits, launchCapex, type Kit } from "@/lib/content/business";
import { lineItemsTotal } from "@/lib/hq/collections";
import { can, OPS } from "@/lib/hq/roles";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { downloadText } from "@/components/hq/CollectionManager";
import { nextNumber, useCollection, useHq } from "@/components/hq/data";
import { PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { cn, formatINR, formatNumber, isoDate } from "@/lib/utils";
import { Notice, errMsg, useNotice } from "./controls";
import { buildRequirements, buildableNow, getKit, indexInventory, inr, kitSlug, norm, num, toCsv, type KitId, type Rec, type Requirement } from "./lib";

type Tab = "bom" | "plan" | "fleet";

export function KitsApp() {
  const [active, setActive] = useState<KitId>("spark");
  const [tab, setTab] = useState<Tab>("bom");
  const kit = getKit(active) ?? kits[0];

  return (
    <>
      <PageHeader
        eyebrow="Kits · Inventory · Shop"
        title="Kits & BOM"
        icon="Cpu"
        description="The four JOVE kits — what each costs to build, what it earns at MRP and at the school bulk price, and what to buy to build a batch. All numbers come from the business plan, so they stay in step with the website."
        actions={
          <>
            <Button href="/hq/inventory" variant="secondary" size="sm">
              Inventory & vendors
            </Button>
            <Button href="/hq/shop" variant="secondary" size="sm">
              Online shop
            </Button>
          </>
        }
      />

      <section aria-label="Kit designs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kits.map((k) => (
          <KitCard key={k.id} kit={k} selected={k.id === active} onSelect={() => setActive(k.id)} />
        ))}
      </section>
      <p className="mt-3 text-xs text-blueprint">
        Margins are gross, calculated on the price excluding 18% GST and before shipping, payment-gateway fees and assembly labour. School price applies to bulk orders of 30+ kits.
      </p>

      <div className="mt-8">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "bom", label: "Bill of materials" },
            { value: "plan", label: "Plan a build" },
            { value: "fleet", label: "Classroom fleet" },
          ]}
        />
        <div className="pt-6" role="tabpanel">
          {tab === "bom" && <BomPanel kit={kit} />}
          {tab === "plan" && <PlanBuilder key={active} initialKit={active} />}
          {tab === "fleet" && <FleetPlanner />}
        </div>
      </div>
    </>
  );
}

/* ═════════════════════════════ kit cards ═════════════════════════════ */

function KitCard({ kit, selected, onSelect }: { kit: Kit; selected: boolean; onSelect: () => void }) {
  const cost = kitCost(kit);
  const atMrp = kitMargin(kit);
  const atSchool = kitMargin(kit, kit.schoolPrice);
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-[var(--radius-md)] border bg-paper-50 transition-shadow", selected ? "border-graphite shadow-[var(--shadow-lift)]" : "border-graphite/12 hover:shadow-[var(--shadow-paper)]")}>
      <button type="button" onClick={onSelect} aria-pressed={selected} className="group block text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-graphite">
        <div className="relative aspect-[4/3] overflow-hidden bg-paper-200">
          <Image src={kit.image} alt={`${kit.name} box`} fill sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw" quality={75} className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105" />
          <span className="annot absolute left-3 top-3 rounded-[3px] bg-paper/90 px-2 py-1 text-[10px] text-graphite">{kit.sku}</span>
          {selected && (
            <Badge tone="dark" className="absolute right-3 top-3">
              Selected
            </Badge>
          )}
        </div>
        <div className="p-4 pb-3">
          <p className="annot text-blueprint">{kit.grades}</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-graphite">{kit.name}</h2>
          <p className="mt-0.5 text-sm text-charcoal">{kit.project}</p>
        </div>
      </button>

      <dl className="grid grid-cols-3 gap-px border-y border-graphite/10 bg-graphite/10 text-center">
        {[
          ["MRP", inr(kit.mrp), "incl. GST"],
          ["School", inr(kit.schoolPrice), "30+ kits"],
          ["BOM cost", inr(cost), `${kit.bom.length} lines`],
        ].map(([k, v, s]) => (
          <div key={k} className="bg-paper-50 px-2 py-3">
            <dt className="annot text-[10px] text-blueprint">{k}</dt>
            <dd className="tabular mt-1 text-base font-bold leading-none">{v}</dd>
            <dd className="mt-1 text-[10px] text-blueprint">{s}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3 p-4">
        <MarginRow label="Margin at MRP" price={kit.mrp} m={atMrp} />
        <MarginRow label="Margin at school price" price={kit.schoolPrice} m={atSchool} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-graphite/10 px-4 py-3">
        <Link href={`/hq/print/kit-label/${kit.id}`} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold hover:bg-graphite/5">
          <Printer className="size-3.5" aria-hidden /> Box labels
        </Link>
        <a href={`/shop/${kitSlug(kit.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold hover:bg-graphite/5">
          <ExternalLink className="size-3.5" aria-hidden /> On site
        </a>
      </div>
    </article>
  );
}

function MarginRow({ label, price, m }: { label: string; price: number; m: { net: number; cost: number; margin: number; marginPct: number } }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-blueprint">
          {label} <span className="tabular">({inr(price)})</span>
        </span>
        <span className={cn("tabular font-semibold", m.margin < 0 && "text-bad")}>
          {inr(m.margin)} · {m.marginPct}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-graphite/10" role="img" aria-label={`${m.marginPct}% gross margin on ${formatINR(m.net)} net price`}>
        <div className="h-full rounded-full bg-graphite" style={{ width: `${Math.min(100, Math.max(0, m.marginPct))}%` }} />
      </div>
    </div>
  );
}

/* ═════════════════════════════ BOM table ═════════════════════════════ */

function BomPanel({ kit }: { kit: Kit }) {
  const { records } = useCollection<Rec>("inventory");
  const index = useMemo(() => indexInventory(records), [records]);
  const total = kitCost(kit);
  const net = kitMargin(kit).net;

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["#", "Component", "Qty per kit", "Unit cost (INR)", "Line total (INR)", "Vendor hint"],
      ...kit.bom.map((b, i) => [i + 1, b.item, b.qty, b.unitCost, b.qty * b.unitCost, b.vendorHint]),
      ["", "Total BOM cost", "", "", total, ""],
    ];
    downloadText(`jove-bom-${kit.sku.toLowerCase()}.csv`, toCsv(rows));
  }

  return (
    <Panel
      title={`${kit.name} — bill of materials`}
      subtitle={`${kit.sku} · ${kit.bom.length} components · ${kit.weightGrams} g packed`}
      bodyClassName="p-0"
      action={
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download className="size-3.5" aria-hidden /> CSV
        </Button>
      }
    >
      <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Bill of materials for {kit.name}</caption>
          <thead>
            <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
              {["#", "Component", "Qty", "Unit cost", "Line total", "In stock", "Vendor hint"].map((h, i) => (
                <th key={h} scope="col" className={cn("annot px-4 py-2.5 text-[10px] font-medium text-blueprint", (i === 2 || i === 3 || i === 4 || i === 5) && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kit.bom.map((b, i) => {
              const rec = index.get(norm(b.item));
              return (
                <tr key={b.item} className="border-b border-graphite/[0.07] last:border-0">
                  <td className="tabular px-4 py-2.5 text-blueprint">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-2.5 font-medium text-graphite">{b.item}</td>
                  <td className="tabular px-4 py-2.5 text-right">{b.qty}</td>
                  <td className="tabular px-4 py-2.5 text-right">{inr(b.unitCost)}</td>
                  <td className="tabular px-4 py-2.5 text-right font-medium">{inr(b.qty * b.unitCost)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{rec ? formatNumber(num(rec.stockQty)) : <span className="text-blueprint/60">—</span>}</td>
                  <td className="px-4 py-2.5 text-charcoal">{b.vendorHint}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-graphite/25 bg-graphite/[0.035]">
              <td colSpan={4} className="px-4 py-3 font-semibold">
                Total BOM cost
              </td>
              <td className="tabular px-4 py-3 text-right text-base font-bold">{inr(total)}</td>
              <td colSpan={2} className="px-4 py-3 text-xs text-blueprint">
                {Math.round((total / net) * 100)}% of the {inr(net)} net price at MRP
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

/* ═════════════════════════════ plan a build ═════════════════════════════ */

function PlanBuilder({ initialKit }: { initialKit: KitId }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const { records, loading, error } = useCollection<Rec>("inventory");
  const [kitId, setKitId] = useState<KitId>(initialKit);
  const [qtyText, setQtyText] = useState("30");
  const kit = getKit(kitId) ?? kits[0];
  const qty = Math.min(5000, Math.max(1, Math.floor(num(qtyText)) || 1));

  const index = useMemo(() => indexInventory(records), [records]);
  const reqs = useMemo(() => buildRequirements(kit, qty, index), [kit, qty, index]);
  const shortage = reqs.filter((r) => r.short > 0);
  const shortCost = shortage.reduce((s, r) => s + r.short * r.unitCost, 0);
  const unmatched = reqs.filter((r) => r.stock === null).length;

  return (
    <div className="space-y-5">
      <Panel title="Plan a build" subtitle="Pick a kit and a quantity — see what you need, what you already have, and what to buy.">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
          <Field label="Kit" htmlFor="plan-kit">
            <Select id="plan-kit" value={kitId} onChange={(e) => setKitId(e.target.value as KitId)}>
              {kits.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} — {k.grades}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity" htmlFor="plan-qty" help="Kits to build">
            <Input id="plan-qty" type="number" inputMode="numeric" min={1} max={5000} value={qtyText} onChange={(e) => setQtyText(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cost to build" value={formatINR(kitCost(kit) * qty)} sub={`${qty} × ${inr(kitCost(kit))} BOM`} />
        <StatCard label="Shortfall to buy" value={formatINR(shortCost)} sub={shortage.length ? `at BOM unit costs` : "Nothing to buy"} tone={shortage.length ? "dark" : "light"} />
        <StatCard label="Components short" value={`${shortage.length} / ${reqs.length}`} sub={unmatched ? `${unmatched} not in inventory yet` : "All matched in inventory"} />
        <StatCard label="Buildable now" value={formatNumber(buildableNow(reqs))} sub="complete kits from current stock" />
      </div>

      {error && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">Could not read inventory: {error}</p>}

      <Panel title={`${qty} × ${kit.name}`} subtitle="Stock is matched to the BOM by component name (case-insensitive)." bodyClassName="p-0">
        <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Required components against stock for {qty} × {kit.name}</caption>
            <thead>
              <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
                {["Component", "Per kit", "Required", "In stock", "Shortfall", "Unit cost", "Shortfall cost"].map((h, i) => (
                  <th key={h} scope="col" className={cn("annot px-4 py-2.5 text-[10px] font-medium text-blueprint", i > 0 && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-blueprint">
                    Loading inventory…
                  </td>
                </tr>
              ) : (
                reqs.map((r) => (
                  <tr key={r.item} className={cn("border-b border-graphite/[0.07] last:border-0", r.short > 0 && "bg-warn/[0.06]")}>
                    <td className="px-4 py-2.5 font-medium text-graphite">{r.item}</td>
                    <td className="tabular px-4 py-2.5 text-right">{r.perKit}</td>
                    <td className="tabular px-4 py-2.5 text-right">{formatNumber(r.required)}</td>
                    <td className="tabular px-4 py-2.5 text-right">{r.stock === null ? <span className="text-blueprint/60" title="No inventory record with this name">—</span> : formatNumber(r.stock)}</td>
                    <td className={cn("tabular px-4 py-2.5 text-right font-semibold", r.short > 0 ? "text-warn" : "text-ok")}>{r.short > 0 ? formatNumber(r.short) : "0"}</td>
                    <td className="tabular px-4 py-2.5 text-right">{inr(r.unitCost)}</td>
                    <td className="tabular px-4 py-2.5 text-right">{r.short > 0 ? inr(r.short * r.unitCost) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-graphite/25 bg-graphite/[0.035]">
                <td colSpan={6} className="px-4 py-3 font-semibold">
                  Total shortfall
                </td>
                <td className="tabular px-4 py-3 text-right text-base font-bold">{inr(shortCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      {canWrite ? (
        <PlanActions kit={kit} qty={qty} shortage={shortage} />
      ) : (
        <p className="text-xs text-blueprint">Creating purchase orders and assembly batches needs a Founder or Admin login (and HQ must not be in read-only mode).</p>
      )}
    </div>
  );
}

function PlanActions({ kit, qty, shortage }: { kit: Kit; qty: number; shortage: Requirement[] }) {
  const purchases = useCollection<Rec>("purchases");
  const batches = useCollection<Rec>("kitBatches");
  const { notice, setNotice, clear } = useNotice();
  const [busy, setBusy] = useState<"" | "po" | "batch">("");

  async function createPo() {
    setBusy("po");
    clear();
    try {
      const poNumber = await nextNumber("po");
      const items = shortage.map((r) => ({ description: r.item, qty: r.short, rate: r.unitCost }));
      const rec = await purchases.save({
        poNumber,
        date: isoDate(),
        status: "draft",
        items,
        shipping: 0,
        total: lineItemsTotal(items),
        paid: false,
        notes: `Build plan: ${qty} × ${kit.name} (${kit.sku}). Quantities are the shortfall against stock on ${isoDate()}. Vendor not set — choose one, or split the lines by supplier.`,
      });
      setNotice({
        tone: "ok",
        text: (
          <>
            Draft purchase order <strong>{poNumber}</strong> created with {items.length} line{items.length === 1 ? "" : "s"}.{" "}
            <Link href={`/hq/inventory?tab=purchases&id=${encodeURIComponent(rec.id)}`} className="font-semibold underline underline-offset-2">
              Open it
            </Link>
            .
          </>
        ),
      });
    } catch (e) {
      setNotice({ tone: "bad", text: errMsg(e, "Could not create the purchase order") });
    } finally {
      setBusy("");
    }
  }

  async function createBatch() {
    setBusy("batch");
    clear();
    try {
      const rec = await batches.save({
        kitId: kit.id,
        qty,
        date: isoDate(),
        status: "planned",
        destination: "Stock",
        notes: `Planned from the build planner (${qty} × ${kit.name}).`,
      });
      setNotice({
        tone: "ok",
        text: (
          <>
            Assembly batch planned: <strong>{qty} × {kit.name}</strong>.{" "}
            <Link href={`/hq/inventory?tab=assembly&id=${encodeURIComponent(rec.id)}`} className="font-semibold underline underline-offset-2">
              Open it
            </Link>
            .
          </>
        ),
      });
    } catch (e) {
      setNotice({ tone: "bad", text: errMsg(e, "Could not create the batch") });
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <Notice notice={notice} onDismiss={clear} />
      <div className="flex flex-wrap gap-3">
        <Button onClick={createPo} disabled={busy !== "" || !shortage.length}>
          <ShoppingCart className="size-4" aria-hidden /> {busy === "po" ? "Creating…" : "Create purchase order draft"}
        </Button>
        <Button variant="secondary" onClick={createBatch} disabled={busy !== ""}>
          <PackageCheck className="size-4" aria-hidden /> {busy === "batch" ? "Creating…" : "Create assembly batch"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-blueprint">
        {shortage.length ? "The draft PO lists only the shortfall at BOM unit costs." : "Stock already covers this build — no purchase needed."} Completing the batch later deducts the BOM from inventory.
      </p>
    </div>
  );
}

/* ═════════════════════════════ classroom fleet ═════════════════════════════ */

/** Reusable per-station cost derived from launch capex lines ("… × 25" → amount / 25). */
function stationRate(capexId: string): number | null {
  const line = launchCapex.find((l) => l.id === capexId);
  const count = line?.label.match(/×\s*(\d+)/)?.[1];
  return line && count ? line.amount / Number(count) : null;
}
const FLEET_CAPEX: Record<KitId, string> = { spark: "fleet-primary", explorer: "fleet-primary", builder: "fleet-builder", innovator: "fleet-innovator" };

function FleetPlanner() {
  const [basis, setBasis] = useState<"bom" | "reusable">("bom");
  const [sizes, setSizes] = useState<Record<string, string>>(() => Object.fromEntries(gradeBands.map((b) => [b.id, String(b.maxPerSession)])));

  const rows = gradeBands.map((b) => {
    const kit = getKit(b.kitId) ?? kits[0];
    const size = Math.max(0, Math.floor(num(sizes[b.id])));
    const stations = Math.ceil(size / b.studentsPerStation);
    const each = basis === "bom" ? kitCost(kit) : stationRate(FLEET_CAPEX[kit.id]);
    return { b, kit, size, stations, each, total: each === null ? null : each * stations };
  });
  const fleetTotal = rows.reduce((s, r) => s + (r.total ?? 0), 0);
  const stationTotal = rows.reduce((s, r) => s + r.stations, 0);
  const launchFleet = launchCapex.filter((l) => l.id.startsWith("fleet-")).reduce((s, l) => s + l.amount, 0);

  return (
    <Panel
      title="Classroom fleet planner"
      subtitle="Stations needed to run a session at a given size = students ÷ students per station (rounded up)."
      action={
        <div role="group" aria-label="Cost basis" className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-graphite/15 p-0.5 text-xs font-semibold">
          {(
            [
              ["bom", "Full BOM kit"],
              ["reusable", "Reusable station"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={basis === v} onClick={() => setBasis(v)} className={cn("h-full rounded-[3px] px-2.5", basis === v ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}>
              {l}
            </button>
          ))}
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-[820px] text-sm">
          <caption className="sr-only">Stations and fleet cost per grade band</caption>
          <thead>
            <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
              {["Grade band", "Kit", "Max session size", "Per station", "Stations", "Cost / station", "Fleet cost"].map((h, i) => (
                <th key={h} scope="col" className={cn("annot px-4 py-2.5 text-[10px] font-medium text-blueprint", i >= 3 && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, kit, stations, each, total }) => (
              <tr key={b.id} className="border-b border-graphite/[0.07] last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-graphite">{b.grades}</p>
                  <p className="text-xs text-blueprint">{b.name}</p>
                </td>
                <td className="px-4 py-3 text-charcoal">{kit.name}</td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`fleet-${b.id}`}>
                    Maximum students per session for {b.grades}
                  </label>
                  <Input id={`fleet-${b.id}`} type="number" inputMode="numeric" min={0} className="h-9 w-28" value={sizes[b.id]} onChange={(e) => setSizes((s) => ({ ...s, [b.id]: e.target.value }))} />
                </td>
                <td className="tabular px-4 py-3 text-right">{b.studentsPerStation}</td>
                <td className="tabular px-4 py-3 text-right text-base font-bold">{stations}</td>
                <td className="tabular px-4 py-3 text-right">{each === null ? "—" : inr(each)}</td>
                <td className="tabular px-4 py-3 text-right font-medium">{total === null ? "—" : inr(total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-graphite/25 bg-graphite/[0.035]">
              <td colSpan={4} className="px-4 py-3 font-semibold">
                Whole fleet
              </td>
              <td className="tabular px-4 py-3 text-right text-base font-bold">{stationTotal}</td>
              <td />
              <td className="tabular px-4 py-3 text-right text-base font-bold">{formatINR(fleetTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-col gap-1 border-t border-graphite/10 px-5 py-4 text-xs leading-relaxed text-charcoal">
        <p className="flex items-start gap-2">
          <Factory className="mt-0.5 size-3.5 shrink-0 text-blueprint" aria-hidden />
          <span>
            <strong>Full BOM kit</strong> prices a complete kit per station. <strong>Reusable station</strong> uses the launch-plan station rates, which assume parts are reused across sessions. The launch budget carries {formatINR(launchFleet)} for these three fleets — if a session size needs more stations than that budget funds, plan the top-up before booking.
          </span>
        </p>
      </div>
    </Panel>
  );
}
