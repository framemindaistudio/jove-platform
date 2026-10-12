"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { kits, schoolDiscountPercent as discountToday, type Kit, type KitId } from "@/lib/content/business";
import { bomCostExact, kitFigures, priceForMargin, type KitFigures, type Margin } from "@/lib/pricebook/math";
import type { PriceBook, Rounding } from "@/lib/pricebook/types";
import { EmptyState, Panel } from "@/components/hq/ui";
import { cn, formatINR } from "@/lib/utils";
import { kitChanged, newPart, rupees, toNumber, type Draft, type DraftKit, type DraftPart, type TabProps } from "./draft";
import { AddButton, ChangedDot, FIGURE, Labeled, NumBox, PickBox, RemoveButton, TABLE_WRAP, TD, TextBox, TH, todayNote, useEditable } from "./fields";

const ROUNDINGS: { value: Rounding; label: string }[] = [
  { value: "99", label: "a price ending in 99" },
  { value: "49-99", label: "a price ending in 49 or 99" },
  { value: "9", label: "a price ending in 9" },
  { value: "none", label: "no rounding (the next whole rupee)" },
];

const figuresOf = (id: KitId, book: PriceBook) => kitFigures(book.kits[id], book.kitGstPercent, book.schoolDiscountPercent);

/**
 * False while a kit has no price that could be shown as real: nothing typed, or a price that should follow a cost
 * nobody has entered yet (the arithmetic would still produce a number).
 */
const hasPrice = (mode: DraftKit["mode"], mrp: number, priced: boolean) => mrp > 0 && (mode === "fixed" || priced);

export function KitsTab({ draft, book, saved, update, active, onActive }: TabProps & { active: KitId; onActive: (id: KitId) => void }) {
  const kit = kits.find((k) => k.id === active) ?? kits[0];
  const dk = draft.kits[kit.id];
  const f = figuresOf(kit.id, book);
  const exact = bomCostExact(book.kits[kit.id].bom);
  const priced = exact > 0;
  const target = book.kits[kit.id].pricing.targetMarginPercent;
  // what is saved in HQ for this kit right now: tells "after saving" from "saved, waiting for the website"
  const was = figuresOf(kit.id, saved);

  const setKit = (change: (k: DraftKit) => DraftKit) => update((d) => ({ ...d, kits: { ...d.kits, [kit.id]: change(d.kits[kit.id]) } }));
  // One part, one cost: the same part in another kit follows, as long as it had the same cost there. Where the
  // costs already differed (a loose name such as "Packaging") each kit keeps its own.
  const setCost = (id: string, text: string) =>
    update((d) => {
      const line = d.kits[kit.id].bom.find((l) => l.id === id);
      if (!line) return d;
      const before = toNumber(line.unitCost);
      const next = { ...d.kits };
      for (const k of kits) {
        next[k.id] = { ...d.kits[k.id], bom: d.kits[k.id].bom.map((l) => ((k.id === kit.id ? l.id === id : samePart(l.item, line.item) && toNumber(l.unitCost) === before) ? { ...l, unitCost: text } : l)) };
      }
      return { ...d, kits: next };
    });

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Choose a kit" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kits.map((k) => {
          const kf = figuresOf(k.id, book);
          const priced = bomCostExact(book.kits[k.id].bom) > 0;
          const on = k.id === kit.id;
          const priceKnown = hasPrice(book.kits[k.id].pricing.mode, kf.mrp, priced);
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={on}
              onClick={() => onActive(k.id)}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] border bg-paper-50 p-2.5 text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite",
                on ? "border-graphite shadow-[var(--shadow-paper)]" : "border-graphite/12 hover:border-graphite/40",
              )}
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-paper-200">
                <Image src={k.image} alt="" fill sizes="56px" quality={75} className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-bold leading-tight text-graphite">
                  <span className="truncate">{k.name}</span>
                  {kitChanged(k.id, book, saved) && <ChangedDot />}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-blueprint">{k.grades}</span>
                <span className="tabular mt-1 block truncate font-mono text-xs text-charcoal">
                  {priceKnown ? formatINR(kf.mrp) : "no price yet"} · {priced ? (priceKnown ? `${kf.atMrp.marginPct}% margin` : `costs ${formatINR(kf.cost)}`) : "no costs yet"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Figures
        kit={kit}
        f={f}
        priced={priced}
        known={hasPrice(dk.mode, f.mrp, priced)}
        gst={book.kitGstPercent}
        discount={book.schoolDiscountPercent}
        target={dk.mode === "margin" ? target : null}
        unsaved={was.mrp !== f.mrp || was.schoolPrice !== f.schoolPrice}
      />

      <PricingPanel key={`price-${kit.id}`} kit={kit} dk={dk} f={f} exact={exact} gst={book.kitGstPercent} target={target} setKit={setKit} />

      <PartsPanel key={`parts-${kit.id}`} kit={kit} dk={dk} exact={exact} setKit={setKit} all={draft.kits} setCost={setCost} />

      <Panel title="Shared by all four kits" subtitle="These two numbers apply to every kit.">
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Labeled label="GST inside kit prices" note="A kit's MRP includes GST. It is taken out before the margin is worked out." className="max-w-xs">
            <NumBox kind="percent" value={draft.kitGstPercent} onChange={(v) => update((d) => ({ ...d, kitGstPercent: v }))} invalid={toNumber(draft.kitGstPercent) > 40} />
          </Labeled>
          <Labeled
            label="School bulk discount"
            {...todayNote(book.schoolDiscountPercent !== discountToday, `${discountToday}% off the MRP`, "A school buying 30 or more kits pays the MRP less this. Also used for take-home kits.")}
            className="max-w-xs"
          >
            <NumBox kind="percent" value={draft.schoolDiscountPercent} onChange={(v) => update((d) => ({ ...d, schoolDiscountPercent: v }))} invalid={toNumber(draft.schoolDiscountPercent) > 90} />
          </Labeled>
        </div>
      </Panel>
    </div>
  );
}

/* ═════════════════════════════ what the kit costs and earns ═════════════════════════════ */

/** Always in view while a kit is edited: it stays under the top bar when the page scrolls. */
function Figures({
  kit,
  f,
  priced,
  known,
  gst,
  discount,
  target,
  unsaved,
}: {
  kit: Kit;
  f: KitFigures;
  /** false while no part has a cost */
  priced: boolean;
  /** false while the kit has no price that can be shown */
  known: boolean;
  gst: number;
  discount: number;
  /** the margin asked for, while the price follows the cost */
  target: number | null;
  /** true while the prices shown are not saved yet */
  unsaved: boolean;
}) {
  const moves = known && (f.mrp !== kit.mrp || f.schoolPrice !== kit.schoolPrice);
  const rows: FigureRowProps[] = [
    { label: "MRP", sub: "Website and shop, GST included", price: f.mrp, m: f.atMrp, priced, known, strong: true, note: target !== null && priced ? `you asked for ${target}%` : undefined },
    { label: "School bulk price", sub: `MRP less ${discount}%, for 30 or more kits`, price: f.schoolPrice, m: f.atSchool, priced, known },
  ];
  return (
    <section aria-label={`What the ${kit.name} costs and earns`} className="z-20 overflow-hidden rounded-[var(--radius-md)] border border-graphite/30 bg-paper shadow-[var(--shadow-paper)] md:sticky md:top-16">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-b border-graphite/10 px-5 py-3">
        <h2 className="text-base font-bold tracking-tight text-graphite">
          {kit.name} <span className="ml-1 text-xs font-normal text-blueprint">{kit.grades}</span>
        </h2>
        {moves ? (
          <p role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-graphite">
            <span className="rounded-full bg-warn/15 px-2 py-0.5 font-semibold text-warn">Price changes for customers</span>
            <span className="tabular">
              On the website today <span className="font-mono font-semibold">{formatINR(kit.mrp)}</span> <span className="text-blueprint">(schools {formatINR(kit.schoolPrice)})</span>
            </span>
            <ArrowRight className="size-3.5 text-blueprint" aria-hidden />
            <span className="tabular">
              {unsaved ? "after saving" : "saved, after the website rebuilds"} <span className="font-mono font-semibold">{formatINR(f.mrp)}</span> <span className="text-blueprint">(schools {formatINR(f.schoolPrice)})</span>
            </span>
          </p>
        ) : known ? (
          <p className="text-xs text-blueprint">Same prices as on the website today.</p>
        ) : (
          <p role="status" className="text-xs font-medium text-warn">
            No price yet. On the website today: <span className="tabular font-mono">{formatINR(kit.mrp)}</span>.
          </p>
        )}
      </div>
      {/* a phone gets the same figures as two short lists; wider screens get the table */}
      <div className="divide-y divide-graphite/[0.07] sm:hidden">
        {rows.map((r) => (
          <dl key={r.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 px-5 py-3 text-sm">
            <dt className="font-semibold text-graphite">
              {r.label} <span className="block text-[11px] font-normal text-blueprint">{r.sub}</span>
            </dt>
            <dd className={cn(FIGURE, "text-lg font-bold")}>{known ? formatINR(r.price) : "—"}</dd>
            <dt className="text-xs text-blueprint">Left after {gst}% GST</dt>
            <dd className={FIGURE}>{known ? formatINR(r.m.net) : "—"}</dd>
            <dt className="text-xs text-blueprint">Cost to make</dt>
            <dd className={FIGURE}>{priced ? formatINR(r.m.cost) : "—"}</dd>
            <dt className="text-xs text-blueprint">Margin{r.note ? ` (${r.note})` : ""}</dt>
            <dd className={cn(FIGURE, "font-bold", r.m.margin < 0 && priced && known && "text-bad")}>{priced && known ? `${formatINR(r.m.margin)} · ${r.m.marginPct}%` : "—"}</dd>
          </dl>
        ))}
      </div>
      <div className={cn(TABLE_WRAP, "hidden sm:block")}>
        <table className="w-full min-w-[600px] text-sm">
          <caption className="sr-only">Cost, price and margin of the {kit.name}</caption>
          <thead>
            <tr className="text-left">
              <th scope="col" className={TH}>
                <span className="sr-only">Price</span>
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                Customer pays
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                Left after {gst}% GST
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                Cost to make
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                Margin
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <FigureRow key={r.label} {...r} />
            ))}
          </tbody>
        </table>
      </div>
      {!priced && <p className="border-t border-graphite/10 px-5 py-2.5 text-xs text-blueprint">Add the parts and what they cost below to see what this kit costs to make and what it earns.</p>}
      {priced && !known && <p className="border-t border-graphite/10 px-5 py-2.5 text-xs text-blueprint">Type a price below, or let the price follow the cost.</p>}
    </section>
  );
}

interface FigureRowProps {
  label: string;
  sub: string;
  price: number;
  m: Margin;
  /** false while no part has a cost: a margin would then read as 100% */
  priced: boolean;
  /** false while there is no price to show */
  known: boolean;
  strong?: boolean;
  note?: string;
}

function FigureRow({ label, sub, price, m, priced, known, strong, note }: FigureRowProps) {
  const dash = <span className="text-blueprint/60">—</span>;
  return (
    <tr className="border-t border-graphite/[0.07]">
      <th scope="row" className={cn(TD, "py-2.5 text-left font-normal")}>
        <span className="block text-sm font-semibold text-graphite">{label}</span>
        <span className="block text-[11px] text-blueprint">{sub}</span>
      </th>
      <td className={cn(TD, FIGURE, "font-bold", strong ? "text-xl" : "text-base")}>{known ? formatINR(price) : dash}</td>
      <td className={cn(TD, FIGURE)}>{known ? formatINR(m.net) : dash}</td>
      <td className={cn(TD, FIGURE)}>{priced ? formatINR(m.cost) : dash}</td>
      <td className={cn(TD, FIGURE, m.margin < 0 && priced && known && "text-bad")}>
        {priced && known ? (
          <>
            {formatINR(m.margin)} <span className={cn("ml-1 font-bold", strong ? "text-xl" : "text-base")}>{m.marginPct}%</span>
            {note && <span className="block font-sans text-[11px] font-normal text-blueprint">{note}</span>}
          </>
        ) : (
          dash
        )}
      </td>
    </tr>
  );
}

/* ═════════════════════════════ how the price is set ═════════════════════════════ */

function PricingPanel({ kit, dk, f, exact, gst, target, setKit }: { kit: Kit; dk: DraftKit; f: KitFigures; exact: number; gst: number; target: number; setKit: (change: (k: DraftKit) => DraftKit) => void }) {
  const editable = useEditable();
  const priced = exact > 0;
  // the working behind "price follows the cost", shown step by step
  const beforeGst = priced ? exact / (1 - target / 100) : 0;
  const withGst = beforeGst * (1 + gst / 100);
  const rounding = ROUNDINGS.find((r) => r.value === dk.rounding)?.label ?? "";

  return (
    <Panel title="How the selling price is set" subtitle="The MRP customers see on the website and in the shop, GST included.">
      <div role="radiogroup" aria-label={`How the price of the ${kit.name} is set`} className="grid gap-4 lg:grid-cols-2">
        <ModeCard name={`mode-${kit.id}`} checked={dk.mode === "margin"} disabled={!editable} onSelect={() => setKit((k) => ({ ...k, mode: "margin" }))} title="Price follows the cost" text="You choose the margin. When a part's cost changes, the price moves so the margin stays the same.">
          {dk.mode === "margin" && (
            <div className="space-y-3">
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[9rem_1fr]">
                <Labeled label="Margin I want" note="Of the price before GST.">
                  <NumBox kind="percent" value={dk.targetMarginPercent} onChange={(v) => setKit((k) => ({ ...k, targetMarginPercent: v }))} invalid={toNumber(dk.targetMarginPercent) > 95} />
                </Labeled>
                <Labeled label="Round the price up to">
                  <PickBox value={dk.rounding} options={ROUNDINGS} onChange={(v) => setKit((k) => ({ ...k, rounding: v }))} />
                </Labeled>
              </div>
              {priced ? (
                <dl className="rounded-[var(--radius-sm)] border border-graphite/10 bg-paper px-3 py-1 text-xs">
                  <Step k="Cost of the parts" v={rupees(exact)} />
                  <Step k={`Price before GST for a ${target}% margin`} v={rupees(Math.round(beforeGst * 100) / 100)} />
                  <Step k={`With ${gst}% GST`} v={rupees(Math.round(withGst * 100) / 100)} />
                  <Step k={dk.rounding === "none" ? "Rounded up to the next rupee" : `Rounded up to ${rounding}`} v={formatINR(f.mrp)} strong />
                </dl>
              ) : (
                <p className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-graphite">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden />
                  This kit has no part costs yet, so there is nothing for the price to follow. Add the parts and what they cost below first.
                </p>
              )}
              {priced && <p className="text-xs text-blueprint">Because the price is rounded up, the margin you get is the one you asked for or a little more.</p>}
            </div>
          )}
          {dk.mode !== "margin" && priced && (
            <p className="tabular text-xs text-blueprint">
              With a {target}% margin the price would be <span className="font-mono font-semibold text-charcoal">{formatINR(priceForMargin(exact, target, gst, dk.rounding))}</span>.
            </p>
          )}
        </ModeCard>

        <ModeCard name={`mode-${kit.id}`} checked={dk.mode === "fixed"} disabled={!editable} onSelect={() => setKit((k) => ({ ...k, mode: "fixed" }))} title="I set the price" text="You type the MRP. When a part's cost changes, the price stays and the margin moves.">
          {dk.mode === "fixed" ? (
            <div className="space-y-1">
              <Labeled label="MRP, GST included" note={priced && f.mrp > 0 ? `At this price the margin is ${f.atMrp.marginPct}% (${formatINR(f.atMrp.margin)} a kit).` : undefined} className="max-w-[12rem]">
                <NumBox kind="money" value={dk.mrp} onChange={(v) => setKit((k) => ({ ...k, mrp: v }))} invalid={toNumber(dk.mrp) <= 0} />
              </Labeled>
            </div>
          ) : (
            <p className="tabular text-xs text-blueprint">
              {toNumber(dk.mrp) > 0 ? (
                <>
                  The price typed here earlier: <span className="font-mono font-semibold text-charcoal">{formatINR(toNumber(dk.mrp))}</span>.
                </>
              ) : (
                "No price typed here yet."
              )}
              {editable && priced && toNumber(dk.mrp) !== f.mrp && (
                <>
                  {" "}
                  <button type="button" onClick={() => setKit((k) => ({ ...k, mode: "fixed", mrp: String(f.mrp) }))} className="font-semibold text-graphite underline underline-offset-2 hover:text-ink">
                    Fix the price at {formatINR(f.mrp)} instead
                  </button>
                </>
              )}
            </p>
          )}
        </ModeCard>
      </div>
    </Panel>
  );
}

function ModeCard({ name, checked, disabled, onSelect, title, text, children }: { name: string; checked: boolean; disabled: boolean; onSelect: () => void; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border p-4 transition-colors", checked ? "border-graphite bg-paper-50" : "border-graphite/15 bg-transparent")}>
      <label className={cn("flex items-start gap-3", disabled ? "cursor-default" : "cursor-pointer")}>
        <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onSelect} className="mt-0.5 size-4 shrink-0 accent-graphite" />
        <span className="min-w-0">
          <span className="block text-sm font-bold text-graphite">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-charcoal">{text}</span>
        </span>
      </label>
      {children && <div className="mt-4 pl-7">{children}</div>}
    </div>
  );
}

function Step({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-graphite/10 py-1.5 last:border-0">
      <dt className={strong ? "font-semibold text-graphite" : "text-charcoal"}>{k}</dt>
      <dd className={cn("tabular font-mono", strong ? "text-sm font-bold text-graphite" : "text-charcoal")}>{v}</dd>
    </div>
  );
}

/* ═════════════════════════════ the parts ═════════════════════════════ */

/** two names of the same part: case and spacing do not matter (Inventory matches parts the same way) */
const samePart = (a: string, b: string) => {
  const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return key(a) !== "" && key(a) === key(b);
};

/** Where else a part is listed, and whether it costs the same there. */
function AlsoIn({ kit, part, all }: { kit: Kit; part: DraftPart; all: Draft["kits"] }) {
  const others = kits.filter((k) => k.id !== kit.id).flatMap((k) => all[k.id].bom.filter((l) => samePart(l.item, part.item)).map((l) => ({ name: k.name.replace("JOVE ", "").replace(" Kit", ""), same: toNumber(l.unitCost) === toNumber(part.unitCost), cost: toNumber(l.unitCost) })));
  if (!others.length) return null;
  const linked = others.filter((o) => o.same);
  const apart = others.filter((o) => !o.same);
  return (
    <p className="mt-1 text-[11px] leading-snug text-blueprint">
      {linked.length > 0 && <>Also in {linked.map((o) => o.name).join(", ")}: the cost changes there too. </>}
      {apart.length > 0 && <>In {apart.map((o) => `${o.name} at ${rupees(o.cost)}`).join(", ")}: kept separate.</>}
    </p>
  );
}

function PartsPanel({ kit, dk, exact, setKit, all, setCost }: { kit: Kit; dk: DraftKit; exact: number; setKit: (change: (k: DraftKit) => DraftKit) => void; all: Draft["kits"]; setCost: (id: string, text: string) => void }) {
  const editable = useEditable();
  // the row added last gets the cursor, so the founder can type its name straight away
  const [added, setAdded] = useState<string | null>(null);
  const setPart = (id: string, patch: Partial<DraftPart>) => setKit((k) => ({ ...k, bom: k.bom.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const addPart = () => {
    const part = newPart();
    setAdded(part.id);
    setKit((k) => ({ ...k, bom: [...k.bom, part] }));
  };
  const unpriced = dk.bom.filter((l) => l.item.trim() && toNumber(l.qty) > 0 && toNumber(l.unitCost) <= 0).length;

  return (
    <Panel
      title="Parts in the box"
      subtitle={`The bill of materials of the ${kit.name}: every part, how many go in one kit, and what one costs you.`}
      bodyClassName="p-0"
      action={
        dk.bom.length > 0 ? (
          <p className="shrink-0 text-right">
            <span className="annot block text-[10px] text-blueprint">Cost to make one kit</span>
            <span className="tabular font-mono text-base font-bold text-graphite">{rupees(exact)}</span>
          </p>
        ) : undefined
      }
    >
      {dk.bom.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon="Cpu"
            title={`No parts listed for the ${kit.name} yet`}
            description={editable ? "Add each part that goes in the box, how many, and what one costs. The kit's cost and margin add up as you type." : "The founders have not listed this kit's parts yet."}
            action={<AddButton onClick={addPart}>Add the first part</AddButton>}
          />
        </div>
      ) : (
        <>
          <div className={TABLE_WRAP}>
            <table className="w-full min-w-[820px] table-fixed text-sm">
              <caption className="sr-only">Parts of the {kit.name}</caption>
              <colgroup>
                <col className="w-12" />
                <col />
                <col className="w-[88px]" />
                <col className="w-[124px]" />
                <col className="w-[108px]" />
                <col className="w-[27%]" />
                <col className="w-14" />
              </colgroup>
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                  <th scope="col" className={TH}>
                    #
                  </th>
                  <th scope="col" className={TH}>
                    Part
                  </th>
                  <th scope="col" className={cn(TH, "text-right")}>
                    Quantity
                  </th>
                  <th scope="col" className={cn(TH, "text-right")}>
                    Cost of one
                  </th>
                  <th scope="col" className={cn(TH, "text-right")}>
                    Row total
                  </th>
                  <th scope="col" className={TH}>
                    Where to buy / note
                  </th>
                  <th scope="col" className={TH}>
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {dk.bom.map((l, i) => {
                  const name = l.item.trim() || `part ${i + 1}`;
                  const nameless = !l.item.trim() && (!!l.unitCost.trim() || !!l.vendorHint.trim());
                  return (
                    <tr key={l.id} className="border-b border-graphite/[0.07]">
                      <td className={cn(TD, "tabular font-mono text-xs text-blueprint")}>{String(i + 1).padStart(2, "0")}</td>
                      <td className={TD}>
                        <TextBox value={l.item} onChange={(v) => setPart(l.id, { item: v })} label={`Name of part ${i + 1}`} placeholder="Name of the part" invalid={nameless} autoFocus={l.id === added} maxLength={140} className="font-medium" />
                        <AlsoIn kit={kit} part={l} all={all} />
                      </td>
                      <td className={TD}>
                        <NumBox value={l.qty} onChange={(v) => setPart(l.id, { qty: v })} label={`Quantity of ${name}`} />
                      </td>
                      <td className={TD}>
                        <NumBox kind="money" value={l.unitCost} onChange={(v) => setCost(l.id, v)} label={`Cost of one ${name}`} />
                      </td>
                      <td className={cn(TD, FIGURE)}>{rupees(Math.round(toNumber(l.qty) * toNumber(l.unitCost) * 100) / 100)}</td>
                      <td className={TD}>
                        <TextBox value={l.vendorHint} onChange={(v) => setPart(l.id, { vendorHint: v })} label={`Where to buy ${name}, or a note`} placeholder="Shop, website or a note" maxLength={180} className="text-charcoal" />
                      </td>
                      <td className={cn(TD, "text-right")}>
                        <RemoveButton what={name} onClick={() => setKit((k) => ({ ...k, bom: k.bom.filter((x) => x.id !== l.id) }))} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-graphite/[0.035]">
                  <td className={TD} />
                  <th scope="row" colSpan={3} className={cn(TD, "py-3 text-left text-sm font-semibold text-graphite")}>
                    Cost to make one kit
                  </th>
                  <td className={cn(TD, FIGURE, "text-base font-bold")}>{rupees(exact)}</td>
                  <td className={cn(TD, "text-xs text-blueprint")} colSpan={2}>
                    {dk.bom.length} part{dk.bom.length === 1 ? "" : "s"}
                    {unpriced > 0 && ` · ${unpriced} without a cost yet`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {editable && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-graphite/10 px-5 py-3">
              <AddButton onClick={addPart}>Add a part</AddButton>
              <p className="text-xs text-blueprint">A quantity can be a fraction (0.5 m of wire). A row with no name is not saved.</p>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
