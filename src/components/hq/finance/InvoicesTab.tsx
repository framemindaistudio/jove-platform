"use client";

import { useCallback, useMemo, useState } from "react";
import { FilePlus2, Printer, ReceiptText, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/Overlay";
import { joveDayRules } from "@/lib/content/business";
import { OPS, can } from "@/lib/hq/roles";
import type { CompanySettings } from "@/lib/hq/settings";
import { cn, formatINR } from "@/lib/utils";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { nextNumber, useCollection, useHq } from "@/components/hq/data";
import { InvoiceTotalsBox, PaymentsPanel } from "./InvoicePanels";
import { WorkshopInvoiceModal } from "./WorkshopInvoiceModal";
import { writeParams } from "./hooks";
import { addDays, deriveStatus, dueInfo, effectiveDueDate, invoiceMath, invoiceStatus, prepareInvoice, receivables, str, type Ledger, type Rec } from "./finance";

export interface InvoiceIntent {
  /** open this invoice in the drawer on mount */
  id: string | null;
  /** open the "Invoice a workshop" wizard on mount */
  wizard: boolean;
  workshop: string | null;
}

const linkBtn = "inline-flex size-8 items-center justify-center rounded text-blueprint transition-colors hover:bg-graphite/5 hover:text-graphite focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-graphite";

export function InvoicesTab({ ledger, settings, today, intent }: { ledger: Ledger; settings: CompanySettings; today: string; intent: InvoiceIntent }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const inv = useCollection<Rec>("invoices");
  const schools = useCollection<Rec>("schools");
  const workshops = useCollection<Rec>("workshops");
  const { save: saveInvoice, saveMany } = inv;

  const [openId, setOpenId] = useState<string | null>(intent.id);
  const [wizard, setWizard] = useState(intent.wizard);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  const rec = useMemo(() => receivables(ledger, today), [ledger, today]);
  const drafts = useMemo(() => inv.records.filter((r) => invoiceStatus(r) === "draft").length, [inv.records]);

  /** Fill the bill-to block from the linked school/workshop (only blanks), then normalise totals/status/number. */
  const beforeSave = useCallback(
    async (r: Record<string, unknown>) => {
      const next: Record<string, unknown> = { ...r };
      const ws = next.workshopId ? workshops.records.find((w) => w.id === next.workshopId) : undefined;
      if (!next.schoolId && ws?.schoolId) next.schoolId = ws.schoolId;
      const sc = next.schoolId ? schools.records.find((s) => s.id === next.schoolId) : undefined;
      if (sc) {
        if (!str(next.customerName).trim()) next.customerName = str(sc.name);
        if (!str(next.customerAddress).trim()) next.customerAddress = [str(sc.address), str(sc.city)].filter(Boolean).join(", ");
      }
      return prepareInvoice(next, { today, settings, reserveNumber: () => nextNumber("invoice") });
    },
    [today, settings, schools.records, workshops.records],
  );

  const savePayment = useCallback(
    async (next: Record<string, unknown>) => {
      await saveInvoice((await beforeSave(next)) as Rec);
    },
    [beforeSave, saveInvoice],
  );

  const changeOpen = useCallback((id: string | null) => {
    setOpenId(id);
    writeParams({ id });
  }, []);

  const closeWizard = useCallback(() => {
    setWizard(false);
    writeParams({ new: null, workshop: null });
  }, []);

  const createFromWorkshop = useCallback(
    async (record: Record<string, unknown>) => {
      const prepared = await beforeSave(record);
      const saved = await saveInvoice(prepared as Rec);
      setWizard(false);
      setOpenId(saved.id);
      writeParams({ id: saved.id, new: null, workshop: null });
    },
    [beforeSave, saveInvoice],
  );

  /** Stored statuses go stale as dates pass (sent → overdue). Apply the live ones in one commit. */
  const stale = useMemo(
    () =>
      inv.records
        .map((r) => ({ r, to: deriveStatus(r, invoiceMath(r, settings), today) }))
        .filter(({ r, to }) => to !== invoiceStatus(r)),
    [inv.records, settings, today],
  );
  async function syncStatuses() {
    setSyncing(true);
    setSyncError("");
    try {
      await saveMany(stale.map(({ r, to }) => ({ ...r, status: to })));
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Could not update statuses");
    } finally {
      setSyncing(false);
    }
  }

  const columns = useMemo(() => ["number", "date", "customerName", "status", "total"], []);
  const extraColumns = useMemo<ExtraColumn<Rec>[]>(
    () => [
      {
        key: "balance",
        label: "Balance",
        className: "text-right",
        sortValue: (r) => invoiceMath(r, settings).balance,
        render: (r) => {
          const m = invoiceMath(r, settings);
          const settled = m.total > 0 && m.balance < 0.5;
          return <span className={cn("tabular font-semibold", settled && "font-normal text-blueprint")}>{invoiceStatus(r) === "cancelled" ? "—" : formatINR(m.balance)}</span>;
        },
      },
      {
        key: "due",
        label: "Due",
        sortValue: (r) => effectiveDueDate(r) || "9999",
        render: (r) => {
          const d = dueInfo(r, invoiceMath(r, settings), today);
          const date = effectiveDueDate(r);
          return (
            <span className="flex flex-col items-start gap-1">
              <Badge tone={d.tone}>{d.label}</Badge>
              {date && d.key !== "paid" && d.key !== "cancelled" && <span className="tabular text-[11px] text-blueprint">{date}</span>}
            </span>
          );
        },
      },
    ],
    [settings, today],
  );

  const defaults = useMemo(
    () => ({ date: today, dueDate: addDays(today, joveDayRules.balanceDueDays), placeOfSupply: settings.state, gstPercent: joveDayRules.gstPercent, status: "draft", payments: [] }),
    [today, settings.state],
  );

  return (
    <div>
      {/* receivables strip */}
      <dl className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Open invoices" value={String(rec.openCount)} sub={rec.openCount ? `${formatINR(rec.outstanding)} to collect` : "Nothing waiting on payment"} />
        <Stat label="Overdue" value={formatINR(rec.overdue)} sub={rec.overdueCount ? `${rec.overdueCount} invoice${rec.overdueCount === 1 ? "" : "s"} past due` : "None past due"} tone={rec.overdueCount ? "bad" : undefined} />
        <Stat label="Drafts" value={String(drafts)} sub="Not yet issued — excluded from revenue" />
        <Stat label="GST rate" value={`${joveDayRules.gstPercent}%`} sub="CGST + SGST within your state, IGST outside" />
      </dl>

      {syncError && <p className="mb-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{syncError}</p>}

      <CollectionManager<Rec>
        name="invoices"
        columns={columns}
        extraColumns={extraColumns}
        defaults={defaults}
        beforeSave={beforeSave}
        openId={openId}
        onOpenChange={changeOpen}
        newLabel="New invoice"
        emptyText="Create an invoice from a confirmed workshop (one line per grade band, prices from the rate card) or start a blank one."
        toolbar={
          <>
            {canWrite && stale.length > 0 && (
              <ConfirmButton
                onConfirm={syncStatuses}
                message={`Update the status of ${stale.length} invoice${stale.length === 1 ? "" : "s"} (paid / partially paid / overdue) to match payments and due dates? This is saved as one commit.`}
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-graphite/25 bg-paper-50 px-3 text-xs font-semibold hover:bg-graphite/5"
              >
                <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} /> Update {stale.length} status{stale.length === 1 ? "" : "es"}
              </ConfirmButton>
            )}
            {canWrite && (
              <Button variant="secondary" size="sm" className="h-10" onClick={() => setWizard(true)}>
                <FilePlus2 className="size-4" /> From workshop
              </Button>
            )}
          </>
        }
        rowActions={(r) => (
          <span className="inline-flex items-center">
            <a href={`/hq/print/invoice/${r.id}`} target="_blank" rel="noopener noreferrer" className={linkBtn} aria-label={`Print invoice ${str(r.number) || "draft"}`} title="Print / save PDF">
              <Printer className="size-4" />
            </a>
            {invoiceMath(r, settings).payments.length > 0 && (
              <a href={`/hq/print/receipt/${r.id}`} target="_blank" rel="noopener noreferrer" className={linkBtn} aria-label={`Payment receipt for invoice ${str(r.number)}`} title="Payment receipt">
                <ReceiptText className="size-4" />
              </a>
            )}
          </span>
        )}
        drawerExtra={(r) => {
          const rr = r as unknown as Rec;
          const hasEntries = Array.isArray(rr.payments) && rr.payments.length > 0;
          return (
            <>
              <InvoiceTotalsBox r={rr} settings={settings} />
              {hasEntries && <p className="mt-3 text-[11px] text-blueprint">“Amount received” above is recalculated from the payment entries below whenever you save.</p>}
              <PaymentsPanel r={rr} settings={settings} today={today} canWrite={canWrite} onSave={savePayment} />
            </>
          );
        }}
        drawerActions={(r) =>
          r.id ? (
            <span className="flex items-center gap-1">
              <Button href={`/hq/print/invoice/${String(r.id)}`} external variant="ghost" size="sm">
                <Printer className="size-3.5" /> Print
              </Button>
              {invoiceMath(r as unknown as Rec, settings).payments.length > 0 && (
                <Button href={`/hq/print/receipt/${String(r.id)}`} external variant="ghost" size="sm">
                  <ReceiptText className="size-3.5" /> Receipt
                </Button>
              )}
            </span>
          ) : null
        }
      />

      <WorkshopInvoiceModal
        open={wizard}
        onClose={closeWizard}
        workshops={workshops.records}
        schools={schools.records}
        invoices={inv.records}
        settings={settings}
        today={today}
        initialWorkshopId={intent.workshop}
        onCreate={createFromWorkshop}
        onOpenExisting={(id) => {
          setWizard(false);
          changeOpen(id);
        }}
      />
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "bad" }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-4 py-3">
      <dt className="annot text-blueprint">{label}</dt>
      <dd className={cn("tabular mt-1.5 text-xl font-bold leading-none tracking-tight", tone === "bad" && "text-bad")}>{value}</dd>
      <dd className="mt-1.5 text-[11px] text-charcoal">{sub}</dd>
    </div>
  );
}
