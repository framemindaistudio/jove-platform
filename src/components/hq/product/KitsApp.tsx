"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Factory, PackageCheck, Pencil, Printer, ShoppingCart } from "lucide-react";
import { gradeBands, kits, type Kit } from "@/lib/content/business";
import { lineItemsTotal } from "@/lib/hq/collections";
import { can, LEADERSHIP, OPS } from "@/lib/hq/roles";
import { kitFigures, type KitFigures, type Margin } from "@/lib/pricebook/math";
import type { KitParts, MoneyLine, PriceBook } from "@/lib/pricebook/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { downloadText } from "@/components/hq/CollectionManager";
import { nextNumber, useBook, useCollection, useHq, useKitParts } from "@/components/hq/data";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { cn, formatINR, formatNumber, isoDate } from "@/lib/utils";
import { Notice, errMsg, useNotice } from "./controls";
import { PRICES_HREF, buildRequirements, buildableNow, getKit, indexInventory, inr, kitCostExact, kitLines, kitSlug, norm, num, toCsv, type KitId, type Rec, type Requirement } from "./lib";

type Tab = "bom" | "plan" | "fleet";

/** A kit's prices and margins from the price book. Null for a login that does not see costs. */
function figuresFor(kitId: KitId, book: PriceBook | null): KitFigures | null {
  const k = book?.kits?.[kitId];
  return book && k ? kitFigures(k, book.kitGstPercent, book.schoolDiscountPercent) : null;
}

/** Only rendered for the roles that see Finance: the others cannot open that page. */
function PricesLink({ children = "Money → Prices & Costs" }: { children?: React.ReactNode }) {
  return (
    <Link href={PRICES_HREF} className="font-semibold underline underline-offset-2 hover:text-graphite">
      {children}
    </Link>
  );
}

const dash = <span className="text-blueprint/60">—</span>;

export function KitsApp() {
  const { user, store } = useHq();
  const book = useBook();
  const parts = useKitParts();
  // founders and admins are the only people who can change anything in HQ
  const canEditPrices = can(user, LEADERSHIP) && store.writable;
  const [active, setActive] = useState<KitId>("spark");
  const [tab, setTab] = useState<Tab>("bom");
  const kit = getKit(active) ?? kits[0];

  return (
    <>
      <PageHeader
        eyebrow="Kits · Inventory · Shop"
        title="Kits & BOM"
        icon="Cpu"
        description={
          book
            ? "The four JOVE kits and the bill of materials (BOM) of each — the list of parts in the box. See what a kit costs to make, what it earns at the MRP and at the school bulk price, and what to buy to build a batch. Costs and prices come from Money → Prices & Costs, so every HQ screen and the website stay in step."
            : "The four JOVE kits and the bill of materials (BOM) of each — the list of parts in the box — with what is in stock and what is missing to build a batch."
        }
        actions={
          <>
            <Button href="/hq/inventory" variant="secondary" size="sm">
              Inventory & vendors
            </Button>
            {can(user, OPS) && (
              <Button href="/hq/shop" variant="secondary" size="sm">
                Online shop
              </Button>
            )}
          </>
        }
      />

      <section aria-label="Kit designs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kits.map((k) => (
          <KitCard key={k.id} kit={k} parts={kitLines(k.id, book, parts).length} figures={figuresFor(k.id, book)} cost={kitCostExact(k.id, book)} selected={k.id === active} onSelect={() => setActive(k.id)} />
        ))}
      </section>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {book ? (
          <p className="max-w-3xl text-xs text-blueprint">
            Margin is what is left of the price after {book.kitGstPercent}% GST and the cost of the parts — before shipping, payment-gateway fees and assembly labour. The school price is the MRP less {book.schoolDiscountPercent}%, for bulk orders of 30+ kits. Every number here comes from <PricesLink />.
          </p>
        ) : (
          <p className="max-w-3xl text-xs text-blueprint">The school price applies to bulk orders of 30+ kits. The founders keep each kit&rsquo;s list of parts up to date.</p>
        )}
        {canEditPrices && (
          <Button href={PRICES_HREF} size="sm" className="no-print shrink-0">
            <Pencil className="size-3.5" aria-hidden /> Change costs and prices
          </Button>
        )}
      </div>

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
          {tab === "bom" && <BomPanel kit={kit} book={book} parts={parts} canEditPrices={canEditPrices} />}
          {tab === "plan" && <PlanBuilder key={active} initialKit={active} book={book} parts={parts} canEditPrices={canEditPrices} />}
          {tab === "fleet" && <FleetPlanner book={book} />}
        </div>
      </div>
    </>
  );
}

/** Shown in place of a table while a kit has no parts in the price book (a fresh installation). */
function NoParts({ kit, book, canEditPrices }: { kit: Kit; book: PriceBook | null; canEditPrices: boolean }) {
  return (
    <EmptyState
      icon="Cpu"
      title={`No parts listed for the ${kit.name} yet`}
      description={
        book ? (
          <>
            Add this kit&rsquo;s parts, and what each one costs, in <PricesLink />. This table, the build planner and the margins fill in from there.
          </>
        ) : (
          "The founders have not listed this kit's parts yet. Ask them to add the list in HQ → Money → Prices & Costs."
        )
      }
      action={
        canEditPrices ? (
          <Button href={PRICES_HREF} size="sm">
            Open Prices & Costs
          </Button>
        ) : undefined
      }
    />
  );
}

/* ═════════════════════════════ kit cards ═════════════════════════════ */

/** `figures` is null for a login that does not see costs; `cost` is also null while no part has a cost typed in. */
function KitCard({ kit, parts, figures, cost, selected, onSelect }: { kit: Kit; parts: number; figures: KitFigures | null; cost: number | null; selected: boolean; onSelect: () => void }) {
  const cells: [string, string, string][] = figures
    ? [
        ["MRP", inr(figures.mrp), "incl. GST"],
        ["School", inr(figures.schoolPrice), "30+ kits"],
        ["Parts cost", cost === null ? "—" : inr(cost), `${parts} part${parts === 1 ? "" : "s"}`],
      ]
    : [
        ["MRP", inr(kit.mrp), "incl. GST"],
        ["School", inr(kit.schoolPrice), "30+ kits"],
        ["Parts", parts ? formatNumber(parts) : "—", parts ? "in the box" : "not listed yet"],
      ];
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
        {cells.map(([k, v, s]) => (
          <div key={k} className="bg-paper-50 px-2 py-3">
            <dt className="annot text-[10px] text-blueprint">{k}</dt>
            <dd className="tabular mt-1 text-base font-bold leading-none">{v}</dd>
            <dd className="mt-1 text-[10px] text-blueprint">{s}</dd>
          </div>
        ))}
      </dl>

      {figures &&
        (cost === null ? (
          // without a cost the margin would read as 100%
          <p className="p-4 text-xs leading-relaxed text-blueprint">
            {parts ? "The parts have no costs yet." : "No parts listed yet."} Add them in <PricesLink /> to see what this kit costs to make and what it earns.
          </p>
        ) : (
          <div className="space-y-3 p-4">
            <MarginRow label="Margin at MRP" price={figures.mrp} m={figures.atMrp} />
            <MarginRow label="Margin at school price" price={figures.schoolPrice} m={figures.atSchool} />
          </div>
        ))}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-graphite/10 px-4 py-3">
        <Link href={`/hq/print/kit-stickers?kit=${kit.id}&from=kits`} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold hover:bg-graphite/5">
          <Printer className="size-3.5" aria-hidden /> Box stickers
        </Link>
        <a href={`/shop/${kitSlug(kit.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold hover:bg-graphite/5">
          <ExternalLink className="size-3.5" aria-hidden /> On site
        </a>
      </div>
    </article>
  );
}

function MarginRow({ label, price, m }: { label: string; price: number; m: Margin }) {
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
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-graphite/10" role="img" aria-label={`${m.marginPct}% margin on ${formatINR(m.net)}, the price without GST`}>
        <div className="h-full rounded-full bg-graphite" style={{ width: `${Math.min(100, Math.max(0, m.marginPct))}%` }} />
      </div>
    </div>
  );
}

/* ═════════════════════════════ bill of materials ═════════════════════════════ */

function BomPanel({ kit, book, parts, canEditPrices }: { kit: Kit; book: PriceBook | null; parts: KitParts | null; canEditPrices: boolean }) {
  const { records } = useCollection<Rec>("inventory");
  const index = useMemo(() => indexInventory(records), [records]);
  const lines = useMemo(() => kitLines(kit.id, book, parts), [kit.id, book, parts]);
  // costs, totals and vendor notes exist only with the price book
  const money = !!book;
  const figures = figuresFor(kit.id, book);
  const total = kitCostExact(kit.id, book);
  const unpriced = money ? lines.filter((l) => l.qty > 0 && !l.unitCost).length : 0;

  if (!lines.length) return <NoParts kit={kit} book={book} canEditPrices={canEditPrices} />;

  function exportCsv() {
    const rows: (string | number)[][] = money
      ? [
          ["#", "Part", "Qty per kit", "Unit cost (INR)", "Line total (INR)", "Where to buy"],
          ...lines.map((b, i) => [i + 1, b.item, b.qty, b.unitCost ?? 0, Math.round(b.qty * (b.unitCost ?? 0) * 100) / 100, b.vendorHint ?? ""]),
          ["", "Total cost of parts", "", "", total === null ? "" : Math.round(total * 100) / 100, ""],
        ]
      : [["#", "Part", "Qty per kit"], ...lines.map((b, i) => [i + 1, b.item, b.qty])];
    downloadText(`jove-bom-${kit.sku.toLowerCase()}.csv`, toCsv(rows));
  }

  const head = money ? ["#", "Part", "Qty", "Unit cost", "Line total", "In stock", "Where to buy"] : ["#", "Part", "Qty per kit", "In stock"];

  return (
    <Panel
      title={`${kit.name} — bill of materials`}
      subtitle={`${kit.sku} · ${lines.length} part${lines.length === 1 ? "" : "s"} · ${kit.weightGrams} g packed`}
      bodyClassName="p-0"
      action={
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download className="size-3.5" aria-hidden /> CSV
        </Button>
      }
    >
      <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
        <table className={cn("w-full text-sm", money ? "min-w-[720px]" : "min-w-[480px]")}>
          <caption className="sr-only">Bill of materials for {kit.name}</caption>
          <thead>
            <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
              {head.map((h, i) => (
                <th key={h} scope="col" className={cn("annot px-4 py-2.5 text-[10px] font-medium text-blueprint", i >= 2 && h !== "Where to buy" && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((b, i) => {
              const rec = index.get(norm(b.item));
              return (
                <tr key={`${i}-${b.item}`} className="border-b border-graphite/[0.07] last:border-0">
                  <td className="tabular px-4 py-2.5 text-blueprint">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-2.5 font-medium text-graphite">{b.item}</td>
                  <td className="tabular px-4 py-2.5 text-right">{b.qty}</td>
                  {money && (
                    <td className="tabular px-4 py-2.5 text-right">
                      {b.unitCost ? (
                        inr(b.unitCost)
                      ) : (
                        <span className="text-blueprint/60" title="No cost typed in yet">
                          —
                        </span>
                      )}
                    </td>
                  )}
                  {money && <td className="tabular px-4 py-2.5 text-right font-medium">{b.unitCost ? inr(b.qty * b.unitCost) : dash}</td>}
                  <td className="tabular px-4 py-2.5 text-right">{rec ? formatNumber(num(rec.stockQty)) : dash}</td>
                  {money && <td className="px-4 py-2.5 text-charcoal">{b.vendorHint}</td>}
                </tr>
              );
            })}
          </tbody>
          {money && (
            <tfoot>
              <tr className="border-t-2 border-graphite/25 bg-graphite/[0.035]">
                <td colSpan={4} className="px-4 py-3 font-semibold">
                  Total cost of parts
                </td>
                <td className="tabular px-4 py-3 text-right text-base font-bold">{total === null ? "—" : inr(total)}</td>
                <td colSpan={2} className="px-4 py-3 text-xs text-blueprint">
                  {total !== null && figures && figures.atMrp.net > 0 && (
                    <>
                      {100 - figures.atMrp.marginPct}% of {inr(figures.atMrp.net)}, the {inr(figures.mrp)} MRP without GST.{" "}
                    </>
                  )}
                  {unpriced > 0 && (
                    <>
                      {unpriced === lines.length ? "No part has a cost yet" : `${unpriced} part${unpriced === 1 ? " has" : "s have"} no cost yet, so this total is too low`} — add {unpriced === 1 ? "it" : "them"} in <PricesLink />.
                    </>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Panel>
  );
}

/* ═════════════════════════════ plan a build ═════════════════════════════ */

function PlanBuilder({ initialKit, book, parts, canEditPrices }: { initialKit: KitId; book: PriceBook | null; parts: KitParts | null; canEditPrices: boolean }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const { records, loading, error } = useCollection<Rec>("inventory");
  const [kitId, setKitId] = useState<KitId>(initialKit);
  const [qtyText, setQtyText] = useState("30");
  const kit = getKit(kitId) ?? kits[0];
  const qty = Math.min(5000, Math.max(1, Math.floor(num(qtyText)) || 1));
  // what is short is not money: everyone sees it. What it costs needs the price book.
  const money = !!book;

  const lines = useMemo(() => kitLines(kit.id, book, parts), [kit.id, book, parts]);
  const index = useMemo(() => indexInventory(records), [records]);
  const reqs = useMemo(() => buildRequirements(lines, qty, index), [lines, qty, index]);
  const shortage = reqs.filter((r) => r.short > 0);
  const shortCost = shortage.reduce((s, r) => s + r.short * (r.unitCost ?? 0), 0);
  const unmatched = reqs.filter((r) => r.stock === null).length;
  // null while no part has a cost typed in: the totals would read as ₹0
  const kitCost = kitCostExact(kit.id, book);
  const head = money ? ["Part", "Per kit", "Required", "In stock", "Shortfall", "Unit cost", "Shortfall cost"] : ["Part", "Per kit", "Required", "In stock", "Shortfall"];

  return (
    <div className="space-y-5">
      <Panel title="Plan a build" subtitle={money ? "Pick a kit and a quantity — see what you need, what you already have, and what to buy." : "Pick a kit and a quantity — see what you need, what is already in stock, and what is missing."}>
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

      {!lines.length ? (
        <NoParts kit={kit} book={book} canEditPrices={canEditPrices} />
      ) : (
        <>
          <div className={cn("grid gap-3 sm:grid-cols-2", money && "xl:grid-cols-4")}>
            {money && <StatCard label="Cost to build" value={kitCost === null ? "—" : formatINR(kitCost * qty)} sub={kitCost === null ? "The parts have no costs yet" : `${qty} × ${inr(kitCost)} of parts`} />}
            {money && (
              <StatCard
                label="Shortfall to buy"
                value={shortage.length && kitCost === null ? "—" : formatINR(shortCost)}
                sub={!shortage.length ? "Nothing to buy" : kitCost === null ? "The parts have no costs yet" : "at the unit costs in Prices & Costs"}
                tone={shortage.length ? "dark" : "light"}
              />
            )}
            <StatCard label="Parts short" value={`${shortage.length} / ${reqs.length}`} sub={unmatched ? `${unmatched} not in inventory yet` : "All matched in inventory"} />
            <StatCard label="Buildable now" value={formatNumber(buildableNow(reqs))} sub="complete kits from current stock" />
          </div>

          {error && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">Could not read inventory: {error}</p>}

          <Panel title={`${qty} × ${kit.name}`} subtitle="Stock is matched to the kit's parts by name (capital letters do not matter)." bodyClassName="p-0">
            <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
              <table className={cn("w-full text-sm", money ? "min-w-[760px]" : "min-w-[560px]")}>
                <caption className="sr-only">
                  Parts needed against stock for {qty} × {kit.name}
                </caption>
                <thead>
                  <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
                    {head.map((h, i) => (
                      <th key={h} scope="col" className={cn("annot px-4 py-2.5 text-[10px] font-medium text-blueprint", i > 0 && "text-right")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={head.length} className="px-4 py-10 text-center text-blueprint">
                        Loading inventory…
                      </td>
                    </tr>
                  ) : (
                    reqs.map((r, i) => (
                      <tr key={`${i}-${r.item}`} className={cn("border-b border-graphite/[0.07] last:border-0", r.short > 0 && "bg-warn/[0.06]")}>
                        <td className="px-4 py-2.5 font-medium text-graphite">{r.item}</td>
                        <td className="tabular px-4 py-2.5 text-right">{r.perKit}</td>
                        <td className="tabular px-4 py-2.5 text-right">{formatNumber(r.required)}</td>
                        <td className="tabular px-4 py-2.5 text-right">
                          {r.stock === null ? (
                            <span className="text-blueprint/60" title="No inventory record with this name">
                              —
                            </span>
                          ) : (
                            formatNumber(r.stock)
                          )}
                        </td>
                        <td className={cn("tabular px-4 py-2.5 text-right font-semibold", r.short > 0 ? "text-warn" : "text-ok")}>{r.short > 0 ? formatNumber(r.short) : "0"}</td>
                        {money && <td className="tabular px-4 py-2.5 text-right">{r.unitCost ? inr(r.unitCost) : dash}</td>}
                        {money && <td className="tabular px-4 py-2.5 text-right">{r.short > 0 && r.unitCost ? inr(r.short * r.unitCost) : "—"}</td>}
                      </tr>
                    ))
                  )}
                </tbody>
                {money && (
                  <tfoot>
                    <tr className="border-t-2 border-graphite/25 bg-graphite/[0.035]">
                      <td colSpan={6} className="px-4 py-3 font-semibold">
                        Total shortfall
                      </td>
                      <td className="tabular px-4 py-3 text-right text-base font-bold">{shortage.length && kitCost === null ? "—" : inr(shortCost)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Panel>

          {canWrite ? (
            <PlanActions kit={kit} qty={qty} shortage={shortage} />
          ) : (
            <p className="text-xs text-blueprint">Creating purchase orders and assembly batches needs a Founder or Admin login (and HQ must not be in read-only mode).</p>
          )}
        </>
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
      const items = shortage.map((r) => ({ description: r.item, qty: r.short, rate: r.unitCost ?? 0 }));
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
        {shortage.length ? "The draft purchase order lists only the shortfall, at the unit costs in Prices & Costs." : "Stock already covers this build — no purchase needed."} Completing the batch later takes the kit&rsquo;s parts out of inventory.
      </p>
    </div>
  );
}

/* ═════════════════════════════ classroom fleet ═════════════════════════════ */

/** What one reusable station costs, from a launch-budget line in Prices & Costs ("… × 25" → amount ÷ 25). */
function stationRate(capex: readonly MoneyLine[], capexId: string): number | null {
  const line = capex.find((l) => l.id === capexId);
  const count = Number(line?.label.match(/(?:×|\bx)\s*(\d+)/i)?.[1]);
  return line && line.amount > 0 && count > 0 ? line.amount / count : null;
}
/** the launch-budget line that pays for each kit's classroom stations */
const FLEET_CAPEX: Record<KitId, string> = { spark: "fleet-primary", explorer: "fleet-primary", builder: "fleet-builder", innovator: "fleet-innovator" };

function FleetPlanner({ book }: { book: PriceBook | null }) {
  const [basis, setBasis] = useState<"bom" | "reusable">("bom");
  const [sizes, setSizes] = useState<Record<string, string>>(() => Object.fromEntries(gradeBands.map((b) => [b.id, String(b.maxPerSession)])));
  // how many stations to set up is for everyone; what they cost needs the price book
  const money = !!book;
  const capex = book?.planner?.capex ?? [];

  const rows = gradeBands.map((b) => {
    const kit = getKit(b.kitId) ?? kits[0];
    const size = Math.max(0, Math.floor(num(sizes[b.id])));
    const stations = Math.ceil(size / b.studentsPerStation);
    const each = basis === "bom" ? kitCostExact(kit.id, book) : stationRate(capex, FLEET_CAPEX[kit.id]);
    return { b, kit, size, stations, each, total: each === null ? null : each * stations };
  });
  const costed = rows.filter((r) => r.total !== null);
  const fleetTotal = costed.reduce((s, r) => s + (r.total ?? 0), 0);
  const stationTotal = rows.reduce((s, r) => s + r.stations, 0);
  const launchFleet = capex.filter((l) => l.id.startsWith("fleet-")).reduce((s, l) => s + l.amount, 0);
  const head = money ? ["Grade band", "Kit", "Max session size", "Per station", "Stations", "Cost / station", "Fleet cost"] : ["Grade band", "Kit", "Max session size", "Per station", "Stations"];

  return (
    <Panel
      title="Classroom fleet planner"
      subtitle="Stations needed to run a session at a given size = students ÷ students per station (rounded up)."
      action={
        money ? (
          <div role="group" aria-label="Cost basis" className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-graphite/15 p-0.5 text-xs font-semibold">
            {(
              [
                ["bom", "Full kit"],
                ["reusable", "Reusable station"],
              ] as const
            ).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={basis === v} onClick={() => setBasis(v)} className={cn("h-full rounded-[3px] px-2.5", basis === v ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}>
                {l}
              </button>
            ))}
          </div>
        ) : undefined
      }
      bodyClassName="p-0"
    >
      <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
        <table className={cn("w-full text-sm", money ? "min-w-[820px]" : "min-w-[600px]")}>
          <caption className="sr-only">{money ? "Stations and fleet cost per grade band" : "Stations per grade band"}</caption>
          <thead>
            <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
              {head.map((h, i) => (
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
                {money && <td className="tabular px-4 py-3 text-right">{each === null ? "—" : inr(each)}</td>}
                {money && <td className="tabular px-4 py-3 text-right font-medium">{total === null ? "—" : inr(total)}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-graphite/25 bg-graphite/[0.035]">
              <td colSpan={4} className="px-4 py-3 font-semibold">
                Whole fleet
              </td>
              <td className="tabular px-4 py-3 text-right text-base font-bold">{stationTotal}</td>
              {money && <td />}
              {money && (
                <td className="tabular px-4 py-3 text-right text-base font-bold">
                  {costed.length ? formatINR(fleetTotal) : "—"}
                  {costed.length > 0 && costed.length < rows.length && <span className="block text-[10px] font-normal text-blueprint">rows with a cost only</span>}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
      {money && (
        <div className="flex flex-col gap-1 border-t border-graphite/10 px-5 py-4 text-xs leading-relaxed text-charcoal">
          <p className="flex items-start gap-2">
            <Factory className="mt-0.5 size-3.5 shrink-0 text-blueprint" aria-hidden />
            <span>
              <strong>Full kit</strong> prices one complete kit per station, at its parts cost. <strong>Reusable station</strong> uses the launch budget in <PricesLink />, where a line such as &ldquo;Builder stations × 25&rdquo; gives the cost of one station and assumes the parts are reused across sessions.
              {launchFleet > 0 && <> The launch budget carries {formatINR(launchFleet)} for these fleets — if a session size needs more stations than that budget funds, plan the top-up before booking.</>}
              {costed.length < rows.length && (
                <>
                  {" "}
                  A dash means there is no cost to show yet: {basis === "bom" ? "that kit's parts have no costs" : "the launch budget has no line for that fleet, or the line's name does not say how many stations it buys (“× 25”)"}.
                </>
              )}
            </span>
          </p>
        </div>
      )}
    </Panel>
  );
}
