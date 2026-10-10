"use client";

import { addOns, type AddOn } from "@/lib/content/business";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/hq/ui";
import { cn, formatINR } from "@/lib/utils";
import { PRICED_ADD_ONS, toNumber, type TabProps } from "./draft";
import { NumBox, TABLE_WRAP, TD, TH } from "./fields";

/** The words customers read for an add-on's price, in the same form the website uses: "₹14,999 / month", "from ₹3,50,000". */
function wording(a: AddOn, price: number) {
  if (a.price.startsWith("from ")) return `from ${formatINR(price)}`;
  return a.unit === "project" ? formatINR(price) : `${formatINR(price)} / ${a.unit}`;
}

export function AddOnsTab({ draft, book, update }: TabProps) {
  const takeHome = addOns.filter((a) => a.unit === "kit");
  return (
    <Panel title="Add-ons" subtitle="Extras a school can add to a booking. Prices are before GST." bodyClassName="p-0">
      <div className={TABLE_WRAP}>
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <caption className="sr-only">Add-on prices and the wording customers read</caption>
          <colgroup>
            <col />
            <col className="w-[160px]" />
            <col className="w-[26%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
              <th scope="col" className={TH}>
                Add-on
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                Price
              </th>
              <th scope="col" className={TH}>
                Customers will read
              </th>
            </tr>
          </thead>
          <tbody>
            {PRICED_ADD_ONS.map((a) => {
              const price = book.addOns[a.id] ?? 0;
              const differs = price !== a.priceValue;
              return (
                <tr key={a.id} className="border-b border-graphite/[0.07]">
                  <th scope="row" className={cn(TD, "py-3 text-left font-normal")}>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-graphite">{a.name}</span>
                      <Badge tone="outline" className="text-[9px]">
                        {a.owner}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-blueprint">{a.detail}</span>
                  </th>
                  <td className={cn(TD, "align-top pt-3")}>
                    <NumBox kind="money" value={draft.addOns[a.id] ?? ""} onChange={(v) => update((d) => ({ ...d, addOns: { ...d.addOns, [a.id]: v } }))} label={`Price of ${a.name}`} invalid={toNumber(draft.addOns[a.id] ?? "") <= 0} />
                  </td>
                  <td className={cn(TD, "align-top pt-3")}>
                    <span className="tabular flex h-9 items-center font-mono text-sm font-semibold text-graphite">{price > 0 ? wording(a, price) : <span className="font-sans font-normal text-blueprint">Type a price</span>}</span>
                    <span className={cn("tabular block min-h-4 text-[11px] leading-4", differs ? "font-medium text-warn" : "text-blueprint")}>{differs ? `Website today: ${a.price}` : ""}</span>
                  </td>
                </tr>
              );
            })}
            {takeHome.map((a) => (
              <tr key={a.id} className="bg-graphite/[0.02]">
                <th scope="row" className={cn(TD, "py-3 text-left font-normal")}>
                  <span className="text-sm font-semibold text-graphite">{a.name}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-blueprint">{a.detail}</span>
                </th>
                <td className={cn(TD, "py-3 text-right text-xs text-blueprint")}>No price of its own</td>
                <td className={cn(TD, "py-3")}>
                  <span className="tabular font-mono text-sm font-semibold text-graphite">{book.schoolDiscountPercent}% off MRP</span>
                  <span className="block text-[11px] leading-4 text-blueprint">Follows the school bulk discount on the Kits tab.</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
