"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { joveDayRules } from "@/lib/content/business";
import { requiredForSchool } from "@/lib/sign/catalog";
import { partyFromSchool } from "@/lib/sign/context";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Label } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { nextNumber, useCollection, useHq, useSettings } from "@/components/hq/data";
import { prepareInvoice } from "@/components/hq/finance/finance";
import { printHref, useDesk, type Desk } from "@/components/hq/sign/desk";
import { formatDate, formatINR, formatNumber } from "@/lib/utils";
import { Notice } from "./bits";
import { addDays, str, todayIso } from "./crm";
import { invoiceFromProposal, SESSIONS, sessionLabel, workshopsFromProposal } from "./booking";
import type { ProposalPricing } from "./pricing";

export interface Booking {
  bookedOn: string;
  workshopIds: string[];
  invoiceId: string;
  invoiceNumber: string;
  signDocIds: string[];
}

export function bookingOf(r: BaseRecord | null | undefined): Booking | null {
  const b = r?.booking;
  return b && typeof b === "object" && !Array.isArray(b) && str((b as Booking).bookedOn) ? (b as Booking) : null;
}

/** The price-per-student boxes on the school papers (src/lib/sign/templates/schools.ts). */
const PRICE_BOX: Record<string, string> = { "g1-2": "p12", "g3-5": "p35", "g6-8": "p68", "g9-10": "p910" };

interface Props {
  proposal: BaseRecord;
  pricing: ProposalPricing;
  school: BaseRecord | undefined;
  onClose: () => void;
  onBooked: (booking: Booking) => Promise<void>;
}

/** Founders get the school's papers made too; others book the workshop and invoice, and a founder makes the papers. */
export function BookingModal(props: Props) {
  const { user } = useHq();
  return can(user, getCollection("signDocs")!.write) ? <WithPapers {...props} /> : <BookingForm {...props} desk={null} />;
}

function WithPapers(props: Props) {
  const desk = useDesk();
  return <BookingForm {...props} desk={desk} />;
}

function BookingForm({ proposal, pricing: p, school, onClose, onBooked, desk }: Props & { desk: Desk | null }) {
  const { user } = useHq();
  const { settings, loading: settingsLoading } = useSettings();
  const workshops = useCollection("workshops");
  const invoices = useCollection("invoices");
  const activities = useCollection("activities");
  const today = todayIso();
  const planned = SESSIONS[p.packageId];
  const canInvoice = can(user, getCollection("invoices")!.write);
  const preferred = /^\d{4}-\d{2}-\d{2}$/.test(str(proposal.preferredDate)) && str(proposal.preferredDate) >= today ? str(proposal.preferredDate) : "";

  const [dates, setDates] = useState<string[]>(() => Array.from({ length: planned }, (_, i) => (i === 0 ? preferred : "")));
  const [startTime, setStartTime] = useState("07:30");
  const [makeInvoice, setMakeInvoice] = useState(canInvoice);
  const [makePapers, setMakePapers] = useState(!!desk);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booking | null>(null);

  const papers = useMemo(() => {
    if (!desk || !school) return [];
    const have = new Set(desk.docs.filter((d) => d.partyKind === "school" && d.partyId === school.id && d.status !== "void").map((d) => d.template));
    return requiredForSchool().filter((t) => !have.has(t.id));
  }, [desk, school]);

  const filled = dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const ready = !!dates[0] && !settingsLoading && (!desk || desk.ready);

  async function book() {
    if (!dates[0]) {
      setError(`Choose the ${sessionLabel(p.packageId, 0).toLowerCase()}.`);
      return;
    }
    setBusy(true);
    setError("");
    const result: Booking = { bookedOn: today, workshopIds: [], invoiceId: "", invoiceNumber: "", signDocIds: [] };
    const made: string[] = [];
    try {
      const drafts = workshopsFromProposal(proposal, p, school, dates, startTime);
      const savedWs = await workshops.saveMany(drafts);
      result.workshopIds = savedWs.map((w) => w.id);
      made.push(`${savedWs.length} workshop date${savedWs.length === 1 ? "" : "s"}`);
      const first = savedWs[0];
      const lastDate = [...filled].sort().at(-1) ?? dates[0];

      if (makeInvoice && canInvoice) {
        const draft = invoiceFromProposal(proposal, p, school, settings, { today, workshopId: first.id, lastDate });
        const ready = await prepareInvoice(draft, { today, settings, reserveNumber: () => nextNumber("invoice") });
        const inv = await invoices.save(ready);
        result.invoiceId = inv.id;
        result.invoiceNumber = str(inv.number);
        made.push(`draft invoice ${str(inv.number)}`);
      }

      if (makePapers && desk && school && papers.length) {
        const party = partyFromSchool(school);
        // the papers state the proposal's total, so the first workshop's share of it is left out of their sources
        const docs = await desk.make(papers.map((template) => ({ template, party, sources: { school, workshop: { ...first, agreedAmount: "" }, proposal }, workshopId: first.id, proposalId: proposal.id })));
        // the per-student price boxes default to JOVE Day prices; a booked proposal knows the agreed ones
        const rates = Object.fromEntries(p.bandLines.filter((l) => l.bandId && l.kind === "band").map((l) => [PRICE_BOX[l.bandId!], String(l.rate)]));
        if (p.packageId !== "jove-day" && p.packageId !== "custom" && Object.keys(rates).length) {
          for (const d of docs) {
            if (Object.keys(rates).some((k) => k in (d.values ?? {}))) await desk.save({ ...d, values: { ...d.values, ...Object.fromEntries(Object.entries(rates).filter(([k]) => k in (d.values ?? {}))) } });
          }
        }
        result.signDocIds = docs.map((d) => d.id);
        made.push(`${docs.length} paper${docs.length === 1 ? "" : "s"} to sign`);
      }

      if (school) {
        await activities
          .save({
            schoolId: school.id,
            type: "Note",
            date: today,
            summary: `Booked from proposal ${str(proposal.number)}: ${made.join(", ")}`,
            details: filled.map((d, i) => `${sessionLabel(p.packageId, i)}: ${formatDate(d)}`).join("\n"),
            nextStep: `Collect the ${joveDayRules.advancePercent}% advance (${formatINR(p.advance)}) to confirm the date`,
            nextDate: addDays(today, 2),
            by: user.name,
          })
          .catch(() => undefined);
      }
      await onBooked(result);
      setDone(result);
    } catch (e) {
      // whatever was made stays recorded on the proposal, so pressing again cannot book it twice
      if (result.workshopIds.length) await onBooked(result).catch(() => undefined);
      setError(`${e instanceof Error ? e.message : "Something went wrong"}.${made.length ? ` Already made: ${made.join(", ")}.` : ""}`);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="Booked" size="max-w-xl" footer={<Button size="sm" onClick={onClose}>Done</Button>}>
        <BookingLinks booking={done} />
        <p className="mt-4 text-sm text-charcoal">
          The workshop{done.workshopIds.length === 1 ? " is" : "s are"} <strong>tentative</strong> until the {joveDayRules.advancePercent}% advance of <strong>{formatINR(p.advance)}</strong> arrives. Record it on the invoice under Record payment, then mark the workshop confirmed.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="Book this programme"
      size="max-w-xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={book} disabled={busy || !ready}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CalendarCheck className="size-4" aria-hidden />} Book it
          </Button>
        </>
      }
    >
      <p className="text-sm text-charcoal">
        <strong>{str(school?.name) || "This school"}</strong> · {p.pkg.name}
        {p.students ? ` · ${formatNumber(p.students)} students` : ""} · {formatINR(p.grandTotal)} incl. GST
      </p>

      <fieldset className="mt-5">
        <legend className="annot mb-2 text-charcoal">{planned > 1 ? "Workshop dates" : "Workshop date"}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {dates.map((d, i) => (
            <div key={i}>
              <Label htmlFor={`bk-date-${i}`}>
                {sessionLabel(p.packageId, i)}
                {i === 0 && <span className="ml-0.5 text-bad">*</span>}
              </Label>
              <Input id={`bk-date-${i}`} type="date" value={d} onChange={(e) => setDates((all) => all.map((x, j) => (j === i ? e.target.value : x)))} />
            </div>
          ))}
          <div>
            <Label htmlFor="bk-time">Team reports at</Label>
            <Input id="bk-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>
        {planned > 1 && <p className="mt-2 text-[11px] text-blueprint">Leave a date empty if it is not fixed yet, and add that workshop later under Workshops.</p>}
        {p.packageId === "jove-club" && <p className="mt-2 text-[11px] text-blueprint">The club&apos;s weekly sessions are planned under Workshops once the first one is fixed.</p>}
      </fieldset>

      <div className="mt-5 space-y-2.5 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 text-sm">
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
          <span>
            {filled.length || 1} workshop{filled.length > 1 ? "s" : ""}, <strong>tentative</strong> until the advance arrives, with the students, contact and agreed fee filled in.
          </span>
        </p>
        {canInvoice ? (
          <Checkbox
            className="items-start"
            checked={makeInvoice}
            onChange={(e) => setMakeInvoice(e.target.checked)}
            label={`A draft invoice for the proposal (${formatINR(p.grandTotal)}), stating the ${joveDayRules.advancePercent}% advance of ${formatINR(p.advance)} that confirms the date`}
          />
        ) : (
          <p className="text-xs text-blueprint">The invoice is made in Finance by someone with access to it.</p>
        )}
        {desk ? (
          papers.length ? (
            <Checkbox
              className="items-start"
              checked={makePapers}
              onChange={(e) => setMakePapers(e.target.checked)}
              label={`The school's ${papers.length} paper${papers.length === 1 ? "" : "s"} to sign, filled in: ${papers.map((t) => t.name).join(", ")}`}
            />
          ) : (
            <p className="text-xs text-blueprint">The school&apos;s papers to sign are already made in Documents to Sign.</p>
          )
        ) : (
          <p className="text-xs text-blueprint">A founder makes the school&apos;s papers to sign in Documents to Sign.</p>
        )}
      </div>
      {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
    </Modal>
  );
}

/** Links to everything a booking made. */
export function BookingLinks({ booking }: { booking: Booking }) {
  const { user } = useHq();
  const seeInvoice = can(user, getCollection("invoices")!.read);
  const seePapers = can(user, getCollection("signDocs")!.read);
  const link = "inline-flex items-center gap-1.5 text-sm font-semibold text-graphite underline-offset-4 hover:underline";
  return (
    <ul className="space-y-2">
      {booking.workshopIds.map((id, i) => (
        <li key={id}>
          <Link href={`/hq/workshops/${id}`} className={link}>
            Workshop{booking.workshopIds.length > 1 ? ` ${i + 1}` : ""} <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </li>
      ))}
      {booking.invoiceId && seeInvoice && (
        <li>
          <Link href={`/hq/finance?id=${encodeURIComponent(booking.invoiceId)}`} className={link}>
            Invoice {booking.invoiceNumber} (draft) <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </li>
      )}
      {booking.signDocIds.length > 0 && seePapers && (
        <li>
          <Link href={printHref(booking.signDocIds, "schools")} className={link}>
            Print the {booking.signDocIds.length} papers to sign <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </li>
      )}
    </ul>
  );
}
