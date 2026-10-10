"use client";

import { useMemo, useState } from "react";
import { Minus, PackageCheck, Plus, Printer, ReceiptText, ShoppingCart, TriangleAlert } from "lucide-react";
import { lineItemsTotal } from "@/lib/hq/collections";
import { can, OPS } from "@/lib/hq/roles";
import type { PriceBook } from "@/lib/pricebook/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { nextNumber, useBook, useCollection, useHq, useKitParts, useLookup } from "@/components/hq/data";
import { KV, PageHeader, StatCard } from "@/components/hq/ui";
import { formatINR, formatNumber, isoDate } from "@/lib/utils";
import { IconButton, Notice, errMsg, useDrawerControl, useNotice, type NoticeState } from "./controls";
import { getKit, indexInventory, inr, kitCostExact, kitLines, needsRestock, norm, num, str, stockState, stockValue, type Rec } from "./lib";

type Tab = "stock" | "vendors" | "purchases" | "assembly";
const TABS: Tab[] = ["stock", "vendors", "purchases", "assembly"];

export function InventoryApp({ initialTab, initialId }: { initialTab?: string; initialId?: string }) {
  const { user } = useHq();
  const isOps = can(user, OPS);
  const wanted = TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "stock";
  const [tab, setTab] = useState<Tab>(!isOps && (wanted === "vendors" || wanted === "purchases") ? "stock" : wanted);
  const { records } = useCollection<Rec>("inventory");
  const low = records.filter(needsRestock).length;

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "stock", label: "Stock", count: low || undefined },
    ...(isOps ? ([{ value: "vendors", label: "Vendors" }, { value: "purchases", label: "Purchase orders" }] as const) : []),
    { value: "assembly", label: "Assembly" },
  ];
  const deepLink = (t: Tab) => (t === wanted ? initialId : undefined);

  return (
    <>
      <PageHeader
        eyebrow="Kits · Inventory · Shop"
        title="Inventory & Vendors"
        icon="Boxes"
        description="What is on the shelf, who supplies it, what has been ordered and what has been built. Receiving a purchase order and completing an assembly batch keep stock in step automatically."
        actions={
          <Button href="/hq/kits" variant="secondary" size="sm">
            Kits & BOM
          </Button>
        }
      />
      <Tabs value={tab} onChange={setTab} tabs={tabs} />
      <div className="pt-6" role="tabpanel">
        {tab === "stock" && <StockTab initialId={deepLink("stock")} />}
        {tab === "vendors" && isOps && <VendorsTab initialId={deepLink("vendors")} />}
        {tab === "purchases" && isOps && <PurchasesTab initialId={deepLink("purchases")} />}
        {tab === "assembly" && <AssemblyTab initialId={deepLink("assembly")} />}
      </div>
    </>
  );
}

/* ═════════════════════════════ Stock ═════════════════════════════ */

const STOCK_COLUMNS: ExtraColumn<Rec>[] = [
  {
    key: "stockState",
    label: "Status",
    sortValue: (r) => ({ out: 0, low: 1, untracked: 2, ok: 3 })[stockState(r)],
    render: (r) => {
      const s = stockState(r);
      return s === "out" ? (
        <Badge tone="bad" dot>
          Out
        </Badge>
      ) : s === "low" ? (
        <Badge tone="warn" dot>
          Low
        </Badge>
      ) : s === "untracked" ? (
        <Badge tone="neutral">Not stocked</Badge>
      ) : (
        <Badge tone="ok" dot>
          OK
        </Badge>
      );
    },
  },
  { key: "stockValue", label: "Stock value", className: "text-right", sortValue: stockValue, render: (r) => <span className="tabular">{stockValue(r) ? formatINR(stockValue(r)) : <span className="text-blueprint/60">—</span>}</span> },
];

function StockTab({ initialId }: { initialId?: string }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const inv = useCollection<Rec>("inventory");
  const { notice, setNotice, clear } = useNotice();
  const [lowOnly, setLowOnly] = useState(false);
  const drawer = useDrawerControl(initialId);

  const stats = useMemo(
    () => ({ items: inv.records.length, value: inv.records.reduce((s, r) => s + stockValue(r), 0), low: inv.records.filter(needsRestock) }),
    [inv.records],
  );

  async function adjust(r: Rec, delta: number) {
    clear();
    try {
      await inv.save({ ...r, stockQty: Math.max(0, num(r.stockQty) + delta) });
    } catch (e) {
      setNotice({ tone: "bad", text: errMsg(e, "Could not update stock") });
    }
  }

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Inventory lines" value={formatNumber(stats.items)} sub="components, packaging, tools & demo gear" />
        <StatCard label="Stock value" value={formatINR(stats.value)} sub="quantity × unit cost" />
        <StatCard label="Need restocking" value={formatNumber(stats.low.length)} sub={stats.low.length ? "at or below reorder level" : "Everything is above its reorder level"} tone={stats.low.length ? "dark" : "light"} />
      </div>
      <Notice notice={notice} onDismiss={clear} />
      <CollectionManager<Rec>
        name="inventory"
        columns={["name", "category", "stockQty", "reorderLevel", "unitCost"]}
        extraColumns={STOCK_COLUMNS}
        filter={lowOnly ? needsRestock : undefined}
        defaults={{ unit: "pcs", stockQty: 0, reorderLevel: 0 }}
        newLabel="New item"
        openId={drawer.openId}
        onOpenChange={drawer.onOpenChange}
        toolbar={
          <>
            <Button variant={lowOnly ? "primary" : "secondary"} size="sm" className="h-10" aria-pressed={lowOnly} onClick={() => setLowOnly((v) => !v)}>
              <TriangleAlert className="size-4" aria-hidden /> Low stock ({stats.low.length})
            </Button>
            {canWrite && <RestockPoButton low={stats.low} onResult={setNotice} />}
          </>
        }
        rowActions={
          canWrite
            ? (r) => (
                <div className="inline-flex items-center gap-1">
                  <IconButton label={`Remove 1 ${str(r.name)} (Shift-click removes 10)`} disabled={num(r.stockQty) <= 0} onClick={(e) => adjust(r, e.shiftKey ? -10 : -1)}>
                    <Minus className="size-3.5" aria-hidden />
                  </IconButton>
                  <IconButton label={`Add 1 ${str(r.name)} (Shift-click adds 10)`} onClick={(e) => adjust(r, e.shiftKey ? 10 : 1)}>
                    <Plus className="size-3.5" aria-hidden />
                  </IconButton>
                </div>
              )
            : undefined
        }
        emptyText="Add components by hand, or receive a purchase order to create them automatically."
      />
    </div>
  );
}

/** Draft PO that tops every low / out item back up to twice its reorder level. */
function RestockPoButton({ low, onResult }: { low: Rec[]; onResult: (n: NoticeState) => void }) {
  const purchases = useCollection<Rec>("purchases");
  const [busy, setBusy] = useState(false);
  const lines = low.map((r) => ({ description: str(r.name), qty: Math.max(1, num(r.reorderLevel) * 2 - num(r.stockQty)), rate: num(r.unitCost) })).filter((l) => l.description);
  async function run() {
    if (!lines.length) return;
    setBusy(true);
    try {
      const poNumber = await nextNumber("po");
      await purchases.save({
        poNumber,
        date: isoDate(),
        status: "draft",
        items: lines,
        shipping: 0,
        total: lineItemsTotal(lines),
        paid: false,
        notes: "Restock draft: every item at or below its reorder level, topped up to 2× the reorder level. Vendor not set — choose one or split by supplier.",
      });
      onResult({ tone: "ok", text: <>Draft purchase order <strong>{poNumber}</strong> created for {lines.length} low-stock line{lines.length === 1 ? "" : "s"}. Find it under Purchase orders.</> });
    } catch (e) {
      onResult({ tone: "bad", text: errMsg(e, "Could not create the purchase order") });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="secondary" size="sm" className="h-10" disabled={busy || !lines.length} onClick={run} title="Creates a draft PO topping low items up to 2× their reorder level">
      <ShoppingCart className="size-4" aria-hidden /> {busy ? "Creating…" : "PO for low stock"}
    </Button>
  );
}

/* ═════════════════════════════ Vendors ═════════════════════════════ */

const VENDOR_COLUMNS: ExtraColumn<Rec>[] = [
  {
    key: "website",
    label: "Website",
    sortValue: (r) => str(r.website).toLowerCase(),
    render: (r) => {
      const url = str(r.website).trim();
      if (!url) return <span className="text-blueprint/60">—</span>;
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-medium underline underline-offset-2 hover:text-ink">
          {url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
        </a>
      );
    },
  },
];

function VendorsTab({ initialId }: { initialId?: string }) {
  const drawer = useDrawerControl(initialId);
  return (
    <div>
      <Notice notice={{ tone: "info", text: "This is a starter list of well-known sources, not a recommendation or an agreement. Verify contact details and GSTIN before the first order, then add the phone, contact person and payment terms you agree." }} />
      <CollectionManager<Rec>
        name="vendors"
        columns={["name", "category", "city", "phone", "rating"]}
        extraColumns={VENDOR_COLUMNS}
        newLabel="New vendor"
        openId={drawer.openId}
        onOpenChange={drawer.onOpenChange}
      />
    </div>
  );
}

/* ═════════════════════════════ Purchase orders ═════════════════════════════ */

async function normalizePo(r: Record<string, unknown>) {
  const poNumber = str(r.poNumber).trim() || (await nextNumber("po"));
  const total = Math.round((lineItemsTotal(r.items) + num(r.shipping)) * 100) / 100;
  return { ...r, poNumber, total };
}

const PO_COLUMNS: ExtraColumn<Rec>[] = [
  {
    key: "lines",
    label: "Lines",
    className: "text-right",
    sortValue: (r) => (Array.isArray(r.items) ? r.items.length : 0),
    render: (r) => <span className="tabular">{Array.isArray(r.items) ? r.items.length : 0}</span>,
  },
];

function PurchasesTab({ initialId }: { initialId?: string }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const purchases = useCollection<Rec>("purchases");
  const inv = useCollection<Rec>("inventory");
  const expenses = useCollection<Rec>("expenses");
  const vendors = useLookup("vendors");
  const { notice, setNotice, clear } = useNotice();
  const drawer = useDrawerControl(initialId);
  const [busy, setBusy] = useState(false);

  async function receive(po: Record<string, unknown>) {
    clear();
    if (!po.id) return setNotice({ tone: "bad", text: "Save the purchase order first, then mark it received." });
    const lines = (Array.isArray(po.items) ? (po.items as Record<string, unknown>[]) : [])
      .map((l) => ({ description: str(l.description).trim(), qty: num(l.qty), rate: num(l.rate) }))
      .filter((l) => l.description && l.qty > 0);
    if (!lines.length) return setNotice({ tone: "bad", text: "This purchase order has no items with a quantity to receive." });
    const label = str(po.poNumber) || "this purchase order";
    if (!window.confirm(`Mark ${label} as received?\n\nStock will increase for ${lines.length} item line${lines.length === 1 ? "" : "s"}; items not yet in inventory are created.`)) return;
    setBusy(true);
    try {
      const index = indexInventory(inv.records);
      const staged = new Map<string, Record<string, unknown>>();
      let created = 0;
      for (const l of lines) {
        const key = norm(l.description);
        const cur = staged.get(key);
        if (cur) {
          cur.stockQty = num(cur.stockQty) + l.qty;
          continue;
        }
        const existing = index.get(key);
        if (existing) {
          staged.set(key, { ...existing, stockQty: num(existing.stockQty) + l.qty, unitCost: num(existing.unitCost) > 0 ? existing.unitCost : l.rate });
        } else {
          created += 1;
          staged.set(key, {
            name: l.description,
            category: "Consumables",
            unit: "pcs",
            unitCost: l.rate,
            stockQty: l.qty,
            reorderLevel: 0,
            ...(po.vendorId ? { vendorId: po.vendorId } : {}),
            notes: `Added on receiving ${label}. Set its category and reorder level.`,
          });
        }
      }
      await inv.saveMany([...staged.values()]);
      try {
        await purchases.save({ ...(await normalizePo(po)), status: "received", receivedDate: isoDate() });
      } catch (e) {
        setNotice({ tone: "bad", text: `Stock was updated, but the purchase order could not be marked received (${errMsg(e)}). Set its status to Received by hand — do not press Mark received again, or stock will be counted twice.` });
        return;
      }
      drawer.closeDrawer();
      setNotice({ tone: "ok", text: `${label} received — ${staged.size - created} stock line${staged.size - created === 1 ? "" : "s"} increased${created ? `, ${created} new item${created === 1 ? "" : "s"} added to inventory (check category and reorder level)` : ""}.` });
    } catch (e) {
      setNotice({ tone: "bad", text: errMsg(e, "Could not receive the purchase order") });
    } finally {
      setBusy(false);
    }
  }

  async function logExpense(po: Record<string, unknown>) {
    clear();
    if (!po.id) return setNotice({ tone: "bad", text: "Save the purchase order first." });
    const normalized = await normalizePo(po);
    const total = num(normalized.total);
    if (total <= 0) return setNotice({ tone: "bad", text: "The purchase order total is ₹0 — add item rates before logging an expense." });
    const vendorName = refName(vendors.get(str(po.vendorId)));
    if (!window.confirm(`Log ${formatINR(total, { decimals: true })} as an expense (Kits & components) for ${str(normalized.poNumber)}?`)) return;
    setBusy(true);
    try {
      const exp = await expenses.save({
        date: isoDate(),
        category: "Kits & components",
        amount: total,
        description: `Purchase order ${str(normalized.poNumber)}${vendorName ? ` — ${vendorName}` : ""}`,
        vendor: vendorName,
        paidBy: "Company account",
        notes: `Logged from purchase order ${str(normalized.poNumber)}.`,
      });
      await purchases.save({ ...normalized, paid: true, expenseId: exp.id });
      drawer.closeDrawer();
      setNotice({ tone: "ok", text: `Expense of ${formatINR(total, { decimals: true })} logged under Kits & components. Edit paid-by or payment mode in Finance → Expenses if needed.` });
    } catch (e) {
      setNotice({ tone: "bad", text: errMsg(e, "Could not log the expense") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Notice notice={notice} onDismiss={clear} />
      <CollectionManager<Rec>
        name="purchases"
        columns={["poNumber", "date", "vendorId", "status", "total", "paid"]}
        extraColumns={PO_COLUMNS}
        defaults={{ date: isoDate(), status: "draft", shipping: 0 }}
        newLabel="New purchase order"
        openId={drawer.openId}
        onOpenChange={drawer.onOpenChange}
        beforeSave={normalizePo}
        emptyText="Create one from the Kits & BOM build planner, from low stock, or by hand."
        drawerExtra={(r) => {
          const subtotal = lineItemsTotal(r.items);
          return (
            <div className="mt-6 rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50 px-4 py-2">
              <KV k="Items subtotal" v={formatINR(subtotal, { decimals: true })} />
              <KV k="Shipping" v={formatINR(num(r.shipping), { decimals: true })} />
              <KV k="Total (saved on Save)" v={formatINR(subtotal + num(r.shipping), { decimals: true })} />
              {r.expenseId ? <KV k="Expense" v={<Badge tone="ok">Logged</Badge>} /> : null}
              {r.receivedDate ? <KV k="Received on" v={str(r.receivedDate)} /> : null}
            </div>
          );
        }}
        drawerActions={(r) =>
          r.id ? (
            <div className="flex flex-wrap items-center gap-1">
              <Button href={`/hq/print/po/${str(r.id)}`} variant="ghost" size="sm">
                <Printer className="size-3.5" aria-hidden /> Print PO
              </Button>
              {canWrite && str(r.status) !== "received" && str(r.status) !== "cancelled" && (
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => receive(r)}>
                  <PackageCheck className="size-3.5" aria-hidden /> Mark received
                </Button>
              )}
              {canWrite && !r.expenseId && (
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => logExpense(r)}>
                  <ReceiptText className="size-3.5" aria-hidden /> Log as expense
                </Button>
              )}
            </div>
          ) : null
        }
      />
    </div>
  );
}

const refName = (r: Rec | undefined) => (r ? str(r.name) : "");

/* ═════════════════════════════ Assembly ═════════════════════════════ */

/** What the parts of a batch cost, from the price book. The column is left out for logins that do not see costs. */
const batchColumns = (book: PriceBook | null): ExtraColumn<Rec>[] =>
  book
    ? [
        {
          key: "bomCost",
          label: "Parts cost",
          className: "text-right",
          sortValue: (r) => Math.round((kitCostExact(r.kitId, book) ?? 0) * num(r.qty)),
          render: (r) => {
            const each = kitCostExact(r.kitId, book);
            return <span className="tabular">{each === null ? "—" : inr(Math.round(each * num(r.qty)))}</span>;
          },
        },
      ]
    : [];

function AssemblyTab({ initialId }: { initialId?: string }) {
  const { user, store } = useHq();
  const book = useBook();
  const columns = useMemo(() => batchColumns(book), [book]);
  const canWrite = can(user, OPS) && store.writable;
  const { notice, setNotice, clear } = useNotice();
  const drawer = useDrawerControl(initialId);

  return (
    <div>
      <Notice notice={notice} onDismiss={clear} />
      <CollectionManager<Rec>
        name="kitBatches"
        columns={["kitId", "qty", "date", "status", "destination"]}
        extraColumns={columns}
        defaults={{ status: "planned", date: isoDate(), destination: "Stock" }}
        newLabel="Plan a batch"
        openId={drawer.openId}
        onOpenChange={drawer.onOpenChange}
        emptyText="Plan a batch here or from the Kits & BOM build planner. Completing a batch deducts the BOM from inventory."
        drawerActions={canWrite ? (r) => <CompleteBatchButton batch={r} onResult={setNotice} onDone={drawer.closeDrawer} /> : undefined}
      />
    </div>
  );
}

function CompleteBatchButton({ batch, onResult, onDone }: { batch: Record<string, unknown>; onResult: (n: NoticeState) => void; onDone: () => void }) {
  const inv = useCollection<Rec>("inventory");
  const products = useCollection<Rec>("products");
  const batches = useCollection<Rec>("kitBatches");
  const book = useBook();
  const parts = useKitParts();
  const [busy, setBusy] = useState(false);
  const status = str(batch.status);
  if (!batch.id || status === "ready" || status === "dispatched") return null;

  async function run() {
    const kit = getKit(batch.kitId);
    const qty = Math.floor(num(batch.qty));
    if (!kit || qty < 1) return onResult({ tone: "bad", text: "Choose a kit and a quantity of at least 1 before completing the batch." });

    // the parts of this kit as saved in Money → Prices & Costs
    const lines = kitLines(kit.id, book, parts);
    if (!lines.length) return onResult({ tone: "bad", text: `${kit.name} has no parts listed yet. Add them in Money → Prices & Costs, then complete the batch.` });

    const index = indexInventory(inv.records);
    const matched: { rec: Rec; need: number }[] = [];
    const missing: string[] = [];
    const short: string[] = [];
    for (const b of lines) {
      const rec = index.get(norm(b.item));
      if (!rec) {
        missing.push(b.item);
        continue;
      }
      const need = b.qty * qty;
      if (num(rec.stockQty) < need) short.push(b.item);
      matched.push({ rec, need });
    }
    const dest = str(batch.destination);
    const product = dest === "Stock" || dest === "Online orders" ? products.records.find((p) => p.kitId === kit.id) : undefined;

    const msg = [
      `Complete this batch of ${qty} × ${kit.name}?`,
      "",
      `• Deducts ${matched.length} of ${lines.length} parts from inventory${missing.length ? ` (${missing.length} have no inventory record and are skipped)` : ""}.`,
      short.length ? `• ${short.length} component${short.length === 1 ? " doesn't" : "s don't"} have enough stock and will drop to 0: ${short.slice(0, 3).join(", ")}${short.length > 3 ? "…" : ""}.` : "",
      product ? `• Adds ${qty} to the shop stock of "${str(product.name)}".` : dest === "Stock" || dest === "Online orders" ? "• No shop product is linked to this kit, so shop stock is unchanged." : "",
    ]
      .filter((l, i, a) => l || (i === 1 && a.length > 2))
      .join("\n");
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      if (matched.length) await inv.saveMany(matched.map(({ rec, need }) => ({ ...rec, stockQty: Math.max(0, num(rec.stockQty) - need) })));
      if (product) await products.save({ ...product, stock: num(product.stock) + qty });
      await batches.save({ ...batch, status: "ready", completedAt: isoDate() });
      onDone();
      onResult({ tone: "ok", text: `Batch complete — ${qty} × ${kit.name} ready. ${matched.length} component line${matched.length === 1 ? "" : "s"} deducted${product ? `, shop stock +${qty}` : ""}.` });
    } catch (e) {
      onResult({ tone: "bad", text: errMsg(e, "Could not complete the batch") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" disabled={busy || inv.loading || products.loading} onClick={run}>
      <PackageCheck className="size-3.5" aria-hidden /> {busy ? "Completing…" : "Complete batch"}
    </Button>
  );
}
