"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ExternalLink, MessageCircle, Phone, Printer, Rows3, Columns3 } from "lucide-react";
import { kitMargin } from "@/lib/content/business";
import { lineItemsTotal } from "@/lib/hq/collections";
import { can, OPS } from "@/lib/hq/roles";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { Kanban } from "@/components/hq/Kanban";
import { nextNumber, useCollection, useHq } from "@/components/hq/data";
import { EmptyState, KV, PageHeader, StatCard } from "@/components/hq/ui";
import { cn, formatDate, formatINR, monthKey, slugify } from "@/lib/utils";
import { IconLink, Notice, Segmented, errMsg, useDrawerControl, useNotice } from "./controls";
import { ORDER_FLOW, ORDER_STATUSES, getKit, num, orderUnits, orderWhatsAppText, statusLabel, str, telLink, waLink, type Rec } from "./lib";

type Tab = "orders" | "products";

export function ShopApp({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<Tab>(initialTab === "products" ? "products" : "orders");
  return (
    <>
      <PageHeader
        eyebrow="Kits · Inventory · Shop"
        title="Online Shop"
        icon="ShoppingBag"
        description="Customer orders from the public kit store, and the products it sells. Orders arrive here automatically with prices re-checked on the server."
        actions={
          <Button href="/shop" external variant="secondary" size="sm">
            <ExternalLink className="size-3.5" aria-hidden /> View shop
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "orders", label: "Orders" },
          { value: "products", label: "Products" },
        ]}
      />
      <div className="pt-6" role="tabpanel">
        {tab === "orders" ? <OrdersTab /> : <ProductsTab />}
      </div>
    </>
  );
}

/* ═════════════════════════════ Orders ═════════════════════════════ */

const PIPELINE_COLUMNS = ORDER_FLOW.map((v) => ({ value: v as string, label: statusLabel(v) }));
const OPEN_STATUSES = ["new", "confirmed", "paid", "packed"];
const DEAD_STATUSES = ["cancelled", "refunded"];

const ORDER_EXTRA: ExtraColumn<Rec>[] = [
  { key: "units", label: "Items", className: "text-right", sortValue: orderUnits, render: (r) => <span className="tabular">{orderUnits(r)}</span> },
  { key: "placed", label: "Placed", sortValue: (r) => str(r.createdAt), render: (r) => <span className="tabular whitespace-nowrap">{r.createdAt ? formatDate(str(r.createdAt)) : "—"}</span> },
];

async function normalizeOrder(r: Record<string, unknown>) {
  const number = str(r.number).trim() || (await nextNumber("order"));
  const hasItems = Array.isArray(r.items) && r.items.length > 0;
  return hasItems ? { ...r, number, total: Math.round((lineItemsTotal(r.items) + num(r.shipping)) * 100) / 100 } : { ...r, number };
}

function OrdersTab() {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const orders = useCollection<Rec>("orders");
  const drawer = useDrawerControl();
  const { notice, setNotice, clear } = useNotice();
  const [view, setView] = useState<"pipeline" | "table">("pipeline");
  const [thisMonth] = useState(() => monthKey(new Date()));

  const stats = useMemo(() => {
    const live = orders.records.filter((r) => !DEAD_STATUSES.includes(str(r.status)));
    const month = live.filter((r) => r.createdAt && monthKey(str(r.createdAt)) === thisMonth);
    const toShip = orders.records.filter((r) => OPEN_STATUSES.includes(str(r.status)));
    const unpaid = orders.records.filter((r) => ["new", "confirmed"].includes(str(r.status)));
    const sum = (list: Rec[]) => list.reduce((s, r) => s + num(r.total), 0);
    return {
      monthCount: month.length,
      monthRevenue: sum(month),
      toShipCount: toShip.length,
      toShipValue: sum(toShip),
      unpaidCount: unpaid.length,
      unpaidValue: sum(unpaid),
      dead: orders.records.length - live.length,
    };
  }, [orders.records, thisMonth]);

  async function setStatus(order: Record<string, unknown>, status: string) {
    clear();
    try {
      await orders.save({ ...order, status });
    } catch (e) {
      setNotice({ tone: "bad", text: errMsg(e, "Could not update the order") });
    }
  }

  const toggle = <Segmented label="Orders view" value={view} onChange={setView} options={[{ value: "pipeline", label: "Pipeline", icon: <Columns3 className="size-3.5" aria-hidden /> }, { value: "table", label: "Table", icon: <Rows3 className="size-3.5" aria-hidden /> }]} />;

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders this month" value={stats.monthCount} sub="excluding cancelled & refunded" />
        <StatCard label="Revenue this month" value={formatINR(stats.monthRevenue)} sub="order value incl. shipping & GST" />
        <StatCard label="Pending to ship" value={stats.toShipCount} sub={`${formatINR(stats.toShipValue)} · new → packed`} tone={stats.toShipCount ? "dark" : "light"} />
        <StatCard label="Awaiting payment" value={stats.unpaidCount} sub={`${formatINR(stats.unpaidValue)} · new & confirmed`} />
      </div>

      <Notice notice={notice} onDismiss={clear} />

      {view === "pipeline" && (
        <div>
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-blueprint">
              Drag a card to the next stage, or click it for details.
              {stats.dead > 0 && ` ${stats.dead} cancelled/refunded order${stats.dead === 1 ? " is" : "s are"} only in Table view.`}
            </p>
            {toggle}
          </div>
          {orders.error && <p className="mb-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{orders.error}</p>}
          {!orders.loading && !orders.records.length ? (
            <EmptyState icon="Package" title="No orders yet" description="Orders placed on the public shop land here automatically. You can also add one by hand from Table view." />
          ) : (
            <Kanban<Rec>
              records={orders.records}
              field="status"
              columns={PIPELINE_COLUMNS}
              disabled={!canWrite}
              onOpen={(r) => drawer.openRecord(r.id)}
              onMove={(r, value) => setStatus(r, value)}
              renderCard={(r) => <OrderCard order={r} />}
              columnFooter={(_, items) => <span className="tabular">{formatINR(items.reduce((s, r) => s + num(r.total), 0))}</span>}
            />
          )}
        </div>
      )}

      <CollectionManager<Rec>
        name="orders"
        className={view === "table" ? undefined : "hidden"}
        columns={["number", "status", "total", "customerName", "phone"]}
        extraColumns={ORDER_EXTRA}
        defaults={{ status: "new", shipping: 0 }}
        newLabel="New order"
        openId={drawer.openId}
        onOpenChange={drawer.onOpenChange}
        beforeSave={normalizeOrder}
        toolbar={toggle}
        emptyText="Orders placed on the public shop land here automatically."
        rowActions={(r) => {
          const wa = waLink(r.phone, orderWhatsAppText(r));
          return (
            <div className="inline-flex items-center gap-1">
              {wa && (
                <IconLink label={`WhatsApp ${str(r.customerName)}`} href={wa} external>
                  <MessageCircle className="size-3.5" aria-hidden />
                </IconLink>
              )}
              <IconLink label={`Packing slip for ${str(r.number)}`} href={`/hq/print/packing-slip/${r.id}`}>
                <Printer className="size-3.5" aria-hidden />
              </IconLink>
            </div>
          );
        }}
        drawerExtra={(r) => <OrderExtras order={r} canWrite={canWrite} onStatus={(s) => setStatus(r, s)} />}
        drawerActions={(r) => {
          if (!r.id) return null;
          const wa = waLink(r.phone, orderWhatsAppText(r));
          const tel = telLink(r.phone);
          return (
            <div className="flex flex-wrap items-center gap-1">
              {wa && (
                <Button href={wa} external variant="ghost" size="sm">
                  <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
                </Button>
              )}
              {tel && (
                <Button href={tel} variant="ghost" size="sm">
                  <Phone className="size-3.5" aria-hidden /> Call
                </Button>
              )}
              <Button href={`/hq/print/packing-slip/${str(r.id)}`} variant="ghost" size="sm">
                <Printer className="size-3.5" aria-hidden /> Packing slip
              </Button>
            </div>
          );
        }}
      />
    </div>
  );
}

function OrderCard({ order }: { order: Rec }) {
  const units = orderUnits(order);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold">{str(order.number) || "—"}</span>
        <span className="tabular text-xs font-semibold">{formatINR(num(order.total))}</span>
      </div>
      <p className="font-medium leading-snug text-graphite">{str(order.customerName)}</p>
      <p className="text-xs text-blueprint">
        {[str(order.city), `${units} item${units === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
      </p>
      {order.createdAt ? <p className="text-[11px] text-blueprint">{formatDate(str(order.createdAt))}</p> : null}
    </div>
  );
}

function OrderExtras({ order, canWrite, onStatus }: { order: Record<string, unknown>; canWrite: boolean; onStatus: (s: string) => void }) {
  const subtotal = lineItemsTotal(order.items);
  const current = str(order.status);
  const address = [str(order.address), [str(order.city), str(order.pincode)].filter(Boolean).join(" – ")].filter(Boolean);
  return (
    <div className="mt-6 space-y-5">
      {order.id && canWrite ? (
        <div>
          <p className="annot mb-2 text-blueprint">Move order to</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Order status">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === current}
                onClick={() => s !== current && onStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-graphite",
                  s === current ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-charcoal hover:border-graphite hover:bg-graphite/5",
                )}
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-blueprint">Saves immediately, together with any other edits in this form.</p>
        </div>
      ) : null}
      <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50 px-4 py-2">
        <KV k="Items subtotal" v={formatINR(subtotal, { decimals: true })} />
        <KV k="Shipping" v={num(order.shipping) ? formatINR(num(order.shipping), { decimals: true }) : "Free"} />
        <KV k="Total (saved on Save)" v={formatINR(subtotal + num(order.shipping), { decimals: true })} />
        <KV k="Ship to" v={address.length ? <span className="block max-w-[16rem] whitespace-pre-line">{address.join("\n")}</span> : "—"} />
      </div>
    </div>
  );
}

/* ═════════════════════════════ Products ═════════════════════════════ */

function Thumb({ src, alt }: { src: string; alt: string }) {
  if (!src) return <span className="grid h-10 w-14 place-items-center rounded-[3px] border border-dashed border-graphite/25 text-[10px] text-blueprint">No image</span>;
  return <Image src={src} alt={alt} width={56} height={42} sizes="56px" quality={60} unoptimized={!src.startsWith("/")} className="h-10 w-14 rounded-[3px] border border-graphite/10 object-cover" />;
}

const isPublic = (r: Record<string, unknown>) => ["active", "out-of-stock"].includes(str(r.status));

const PRODUCT_EXTRA: ExtraColumn<Rec>[] = [
  { key: "image", label: "Image", sortValue: (r) => str(r.image), render: (r) => <Thumb src={str(r.image)} alt={str(r.name)} /> },
  {
    key: "margin",
    label: "Gross margin",
    className: "text-right",
    sortValue: (r) => {
      const kit = getKit(r.kitId);
      return kit ? kitMargin(kit, num(r.price)).marginPct : -1;
    },
    render: (r) => {
      const kit = getKit(r.kitId);
      if (!kit || !num(r.price)) return <span className="text-blueprint/60">—</span>;
      const m = kitMargin(kit, num(r.price));
      return (
        <span className={cn("tabular", m.margin < 0 && "text-bad")} title={`${formatINR(m.margin)} on ${formatINR(m.net)} net, BOM ${formatINR(m.cost)}`}>
          {m.marginPct}%
        </span>
      );
    },
  },
];

function ProductsTab() {
  const products = useCollection<Rec>("products");

  async function beforeSave(r: Record<string, unknown>) {
    const slug = slugify(str(r.slug).trim() || str(r.name));
    if (slug && products.records.some((p) => p.slug === slug && p.id !== r.id)) throw new Error(`Another product already uses the URL slug “${slug}”. Choose a different slug.`);
    return { ...r, slug };
  }

  return (
    <div>
      <Notice
        notice={{
          tone: "info",
          text: (
            <>
              Only products with status <strong>Active</strong> or <strong>Out of stock</strong> are shown on the public shop; drafts stay private. The shop picks up changes within about 5 minutes. Set a <em>Compare-at</em> price only if a higher price was really charged before — never as a made-up “was” price.
            </>
          ),
        }}
      />
      <CollectionManager<Rec>
        name="products"
        columns={["name", "category", "status", "price", "stock"]}
        extraColumns={PRODUCT_EXTRA}
        defaults={{ category: "Kits", status: "draft", stock: 0 }}
        newLabel="New product"
        beforeSave={beforeSave}
        emptyText="Add a product to sell it on /shop."
        rowActions={(r) =>
          isPublic(r) && r.slug ? (
            <IconLink label={`View ${str(r.name)} on site`} href={`/shop/${str(r.slug)}`} external>
              <ExternalLink className="size-3.5" aria-hidden />
            </IconLink>
          ) : (
            <Badge tone="neutral">Hidden</Badge>
          )
        }
        drawerActions={(r) =>
          r.id && r.slug ? (
            isPublic(r) ? (
              <Button href={`/shop/${str(r.slug)}`} external variant="ghost" size="sm">
                <ExternalLink className="size-3.5" aria-hidden /> View on site
              </Button>
            ) : (
              <span className="text-xs text-blueprint">Not public — set status to Active to list it.</span>
            )
          ) : null
        }
      />
    </div>
  );
}
