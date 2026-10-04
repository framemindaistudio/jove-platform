"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import type { CompanySettings } from "@/lib/hq/settings";
import { site } from "@/lib/site";
import { useCollection, useSettings } from "@/components/hq/data";
import { formatDate, formatINR, formatNumber } from "@/lib/utils";
import { DocMessage, QrImage, useQr } from "./controls";
import { num, orderLines, orderUnits, str, type Rec } from "./lib";

const BACK = "/hq/shop";

export function PackingSlipPrint({ id }: { id: string }) {
  const orders = useCollection<Rec>("orders");
  const products = useCollection<Rec>("products");
  const { settings, loading: settingsLoading } = useSettings();

  if (orders.loading || products.loading || settingsLoading) return <DocMessage title="Packing slip" back={BACK} state="loading" noun="order" backLabel="Back to orders" />;
  const order = orders.records.find((r) => r.id === id);
  if (!order) return <DocMessage title="Packing slip" back={BACK} state={orders.error ? "error" : "missing"} noun="order" backLabel="Back to orders" />;
  return <Ready order={order} products={products.records} settings={settings} />;
}

function Ready({ order, products, settings }: { order: Rec; products: Rec[]; settings: CompanySettings }) {
  const lines = orderLines(order);
  const number = str(order.number) || "—";
  const labsUrl = `${site.url.replace(/\/$/, "")}/labs`;
  const qr = useQr(labsUrl, 240);

  // estimated parcel weight from the catalogue (only when every line can be matched)
  const weights = lines.map((l) => {
    const p = products.find((x) => (l.productId && x.id === l.productId) || str(x.name).toLowerCase() === l.description.toLowerCase());
    return p && num(p.weightGrams) > 0 ? num(p.weightGrams) * l.qty : null;
  });
  const weightKnown = lines.length > 0 && weights.every((w) => w !== null);
  const weight = weights.reduce<number>((s, w) => s + (w ?? 0), 0);

  const fromLines = [settings.legalName, settings.addressLine1, settings.addressLine2, [settings.city, settings.state, settings.pincode].filter(Boolean).join(", "), settings.phone].filter(Boolean);
  const contact = [site.contact.email, site.contact.phone].filter(Boolean).join(" · ");
  const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const status = str(order.status);
  const warnings = [
    !str(order.address).trim() && "This order has no shipping address.",
    ["cancelled", "refunded"].includes(status) && `This order is marked ${status}.`,
    !fromLines.slice(1).length && "Your company address is empty — add it in HQ → Settings so the return address prints.",
  ].filter(Boolean) as string[];

  return (
    <PrintShell
      title={`Packing slip ${number}`}
      back={BACK}
      toolbar={
        <Link href={`${BACK}?tab=orders`} className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold hover:bg-graphite/5">
          <Pencil className="size-3.5" aria-hidden /> Orders
        </Link>
      }
    >
      {warnings.length > 0 && (
        <ul className="no-print w-full max-w-[210mm] space-y-1.5">
          {warnings.map((w) => (
            <li key={w} className="rounded border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-graphite">
              {w}
            </li>
          ))}
        </ul>
      )}
      <A4Page>
        <Letterhead
          settings={settings}
          docTitle="Packing slip"
          docMeta={
            <>
              <p className="font-mono text-sm font-bold text-graphite">{number}</p>
              {order.createdAt ? <p>Ordered: {formatDate(str(order.createdAt))}</p> : null}
              <p>Status: {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}</p>
            </>
          }
        />

        {/* address label — large, cut-out and paste */}
        <section aria-label="Ship to" className="relative rounded-[3px] border-2 border-dashed border-graphite p-6">
          <p className="annot absolute -top-2.5 left-4 bg-white px-2 text-[10px] text-charcoal">Ship to · cut along the dashed line</p>
          <p className="text-[26px] font-bold leading-tight tracking-tight">{str(order.customerName) || "—"}</p>
          <p className="mt-3 whitespace-pre-line text-[17px] leading-snug">{str(order.address)}</p>
          <p className="mt-2 text-[20px] font-bold tracking-wide">
            {[str(order.city), str(order.pincode)].filter(Boolean).join(" – ")}
          </p>
          {str(order.phone) && <p className="mt-3 font-mono text-[17px] font-semibold">Ph: {str(order.phone)}</p>}
          <div className="mt-4 border-t border-graphite/20 pt-2 text-[9px] leading-relaxed text-charcoal">
            <p className="annot mb-0.5 text-[8px] text-blueprint">From</p>
            {fromLines.join(" · ")}
          </div>
        </section>

        <table className="mt-7 w-full border-collapse text-xs">
          <caption className="sr-only">Items in this order</caption>
          <thead>
            <tr className="border-y-2 border-graphite text-left">
              <th scope="col" className="w-10 py-2 pr-2 font-semibold">
                Packed
              </th>
              <th scope="col" className="py-2 pr-2 font-semibold">
                Item
              </th>
              <th scope="col" className="w-16 py-2 pr-2 text-right font-semibold">
                Qty
              </th>
              <th scope="col" className="w-24 py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="break-inside-avoid border-b border-graphite/15">
                <td className="py-2.5 pr-2">
                  <span aria-hidden className="inline-block size-4 border-2 border-graphite" />
                  <span className="sr-only">Tick when packed</span>
                </td>
                <td className="py-2.5 pr-2 text-sm font-medium">{l.description}</td>
                <td className="tabular py-2.5 pr-2 text-right text-sm font-bold">{l.qty}</td>
                <td className="tabular py-2.5 text-right">{formatINR(l.qty * l.rate, { decimals: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex items-start justify-between gap-6 text-xs">
          <p className="text-charcoal">
            {orderUnits(order)} item{orderUnits(order) === 1 ? "" : "s"}
            {weightKnown && <> · approx. {formatNumber(weight)} g packed weight (excluding outer carton)</>}
          </p>
          <dl className="w-56">
            <div className="flex justify-between border-b border-graphite/15 py-1">
              <dt className="text-charcoal">Items</dt>
              <dd className="tabular">{formatINR(subtotal, { decimals: true })}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/15 py-1">
              <dt className="text-charcoal">Shipping</dt>
              <dd className="tabular">{num(order.shipping) ? formatINR(num(order.shipping), { decimals: true }) : "Free"}</dd>
            </div>
            <div className="flex justify-between border-b-2 border-graphite py-1.5 text-sm font-bold">
              <dt>Total</dt>
              <dd className="tabular">{formatINR(num(order.total) || subtotal + num(order.shipping), { decimals: true })}</dd>
            </div>
          </dl>
        </div>

        {str(order.notes) && (
          <p className="mt-4 rounded-[3px] bg-graphite/[0.05] px-3 py-2 text-xs text-charcoal">
            <span className="annot mr-2 text-[9px] text-blueprint">Customer note</span>
            {str(order.notes)}
          </p>
        )}

        {/* thank-you */}
        <section className="mt-8 flex break-inside-avoid items-center gap-5 rounded-[3px] border border-graphite/25 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold tracking-tight">Thank you for building with JOVE.</p>
            <p className="mt-1.5 text-xs leading-relaxed text-charcoal">
              Your kit pairs with our free Virtual Labs — theory, a live demo, a hands-on simulation and a challenge you can finish before the parts even arrive. Start any time at <span className="font-semibold text-graphite">{labsUrl.replace(/^https?:\/\//, "")}</span>.
            </p>
            {contact && <p className="mt-2 text-[10px] text-blueprint">Need a hand? {contact}</p>}
          </div>
          <div className="text-center">
            <QrImage src={qr} size={84} alt={`QR code linking to ${labsUrl}`} />
            <p className="mt-1 text-[8px] uppercase tracking-wider text-blueprint">Scan for free labs</p>
          </div>
        </section>

        <PrintFooter note={`Order ${number}`} />
      </A4Page>
    </PrintShell>
  );
}
