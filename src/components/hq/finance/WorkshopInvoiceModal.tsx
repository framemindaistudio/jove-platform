"use client";

import { useId, useMemo, useState } from "react";
import { AlertTriangle, FilePlus2, Loader2 } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import type { LineItem } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { formatINR } from "@/lib/utils";
import { fmtDate, invoiceFromWorkshop, invoiceMath, str, type Rec } from "./finance";

/**
 * "Invoice a workshop" — pick a workshop, review the lines built from the
 * business.ts prices (one line per booked grade band + minimum-billing
 * adjustment), then create a DRAFT invoice and open it for editing.
 */
export function WorkshopInvoiceModal({
  open,
  onClose,
  workshops,
  schools,
  invoices,
  settings,
  today,
  initialWorkshopId,
  onCreate,
  onOpenExisting,
}: {
  open: boolean;
  onClose: () => void;
  workshops: Rec[];
  schools: Rec[];
  invoices: Rec[];
  settings: CompanySettings;
  today: string;
  initialWorkshopId: string | null;
  onCreate: (record: Record<string, unknown>) => Promise<void>;
  onOpenExisting: (id: string) => void;
}) {
  const selectId = useId();
  const [picked, setPicked] = useState<string>(initialWorkshopId ?? "");
  const [includeAdvance, setIncludeAdvance] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const sorted = useMemo(() => [...workshops].filter((w) => str(w.status) !== "cancelled").sort((a, b) => str(b.date).localeCompare(str(a.date))), [workshops]);
  const invoicedBy = useMemo(() => {
    const m = new Map<string, Rec[]>();
    for (const inv of invoices) {
      const wid = str(inv.workshopId);
      if (wid && str(inv.status) !== "cancelled") m.set(wid, [...(m.get(wid) ?? []), inv]);
    }
    return m;
  }, [invoices]);

  const workshop = sorted.find((w) => w.id === picked);
  const school = workshop ? schools.find((s) => s.id === str(workshop.schoolId)) : undefined;
  const draft = useMemo(() => (workshop ? invoiceFromWorkshop(workshop, school, settings, today, { includeAdvance }) : null), [workshop, school, settings, today, includeAdvance]);
  const math = useMemo(() => (draft ? invoiceMath(draft.record as Rec, settings) : null), [draft, settings]);
  const existing = workshop ? (invoicedBy.get(workshop.id) ?? []) : [];

  async function create() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    try {
      await onCreate(draft.record);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the invoice");
    } finally {
      setBusy(false);
    }
  }

  const items = (draft?.record.items ?? []) as LineItem[];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invoice a workshop"
      size="max-w-2xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={create} disabled={!draft || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />} Create draft invoice
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Workshop" htmlFor={selectId} help="Lines come from the booked student counts and the standard per-student prices. You can edit everything before issuing.">
          <Select id={selectId} value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="">Choose a workshop…</option>
            {sorted.map((w) => (
              <option key={w.id} value={w.id}>
                {str(w.title) || "Untitled"} · {fmtDate(w.date)} · {str(w.status) || "tentative"}
                {invoicedBy.has(w.id) ? " · already invoiced" : ""}
              </option>
            ))}
          </Select>
        </Field>

        {!sorted.length && <p className="rounded border border-graphite/15 bg-graphite/[0.04] px-3 py-2 text-sm text-charcoal">No workshops exist yet. Add one under Workshops first — or close this and create an invoice by hand.</p>}

        {existing.length > 0 && (
          <div className="rounded-[var(--radius-sm)] border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-charcoal">
            <p className="flex items-center gap-2 font-semibold text-graphite">
              <AlertTriangle className="size-4 text-warn" aria-hidden /> This workshop already has {existing.length === 1 ? "an invoice" : `${existing.length} invoices`}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {existing.map((inv) => (
                <li key={inv.id}>
                  <button type="button" onClick={() => onOpenExisting(inv.id)} className="inline-flex items-center gap-2 rounded border border-graphite/20 bg-paper px-2.5 py-1 text-xs font-semibold hover:bg-graphite/5">
                    {str(inv.number) || "Draft"} <Badge tone={statusTone(inv.status)}>{str(inv.status) || "draft"}</Badge>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">Open it instead, or continue only if this is a genuinely separate invoice (for example a second instalment).</p>
          </div>
        )}

        {draft && math && workshop && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50">
              <div className="flex items-center justify-between gap-3 border-b border-graphite/10 px-4 py-2.5">
                <p className="truncate text-sm font-semibold">{str(draft.record.customerName) || "No school linked"}</p>
                <span className="annot text-blueprint">Draft lines</span>
              </div>
              {items.length ? (
                <div className="overflow-x-auto" data-lenis-prevent>
                  <table className="w-full min-w-[460px] text-sm">
                    <thead>
                      <tr className="annot text-left text-[10px] text-blueprint">
                        <th scope="col" className="px-4 py-2 font-medium">Description</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Qty</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Rate</th>
                        <th scope="col" className="px-4 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-t border-graphite/[0.07]">
                          <td className="px-4 py-2">{it.description}</td>
                          <td className="tabular px-2 py-2 text-right">{it.qty}</td>
                          <td className="tabular px-2 py-2 text-right">{formatINR(it.rate)}</td>
                          <td className="tabular px-4 py-2 text-right font-medium">{formatINR(it.qty * it.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-4 py-5 text-sm text-charcoal">No lines could be built. The draft will open empty so you can type them in.</p>
              )}
              <dl className="space-y-1 border-t border-dashed border-graphite/20 px-4 py-3 text-sm">
                <Row k="Subtotal" v={formatINR(math.subtotal, { decimals: true })} />
                {math.discount > 0 && <Row k="Discount (to match the agreed amount)" v={`− ${formatINR(math.discount, { decimals: true })}`} />}
                <Row k={math.inter ? `IGST @ ${math.gstPercent}%` : `CGST + SGST @ ${math.gstPercent}%`} v={formatINR(math.gst, { decimals: true })} />
                <Row k="Invoice total" v={formatINR(math.total, { decimals: true })} strong />
                {math.paid > 0 && <Row k="Advance recorded as received" v={`− ${formatINR(math.paid, { decimals: true })}`} />}
                {math.paid > 0 && <Row k="Balance due" v={formatINR(math.balance, { decimals: true })} strong />}
              </dl>
            </div>

            {draft.advance > 0 && (
              <Checkbox
                checked={includeAdvance}
                onChange={(e) => setIncludeAdvance(e.target.checked)}
                label={<span>Record the {formatINR(draft.advance)} advance already received on the workshop as a payment on this invoice</span>}
              />
            )}

            {draft.minimumApplied > 0 && <p className="text-xs text-charcoal">A minimum-billing adjustment of {formatINR(draft.minimumApplied)} was added — the booked students come to {formatINR(draft.computedSubtotal)}, below the JOVE Day minimum.</p>}

            {draft.warnings.length > 0 && (
              <ul className="space-y-1.5">
                {draft.warnings.map((w) => (
                  <li key={w} className="flex gap-2 rounded border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-charcoal">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden /> {w}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-blueprint">Created as a draft with place of supply {settings.state || "your state"} and due date {fmtDate(draft.record.dueDate as string)}. Change the place of supply for inter-state schools (IGST).</p>
          </div>
        )}
        {err && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p>}
      </div>
    </Modal>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "pt-1 font-bold" : "text-charcoal"}`}>
      <dt>{k}</dt>
      <dd className="tabular">{v}</dd>
    </div>
  );
}
