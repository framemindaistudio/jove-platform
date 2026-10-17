/**
 * "Book it": an accepted proposal becomes the workshop dates, the draft invoice and the school's papers.
 * Pure functions only; the modal in BookingModal.tsx saves what these build.
 *
 * One invoice covers the whole proposal, with the advance stated on it. The advance is recorded against it as a
 * payment (with its receipt) when it arrives, so the same fee is never invoiced twice.
 */
import { joveDayRules } from "@/lib/content/business";
import type { BaseRecord, LineItem } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { formatINR, formatNumber } from "@/lib/utils";
import { addDays, BAND_FIELDS, str } from "./crm";
import type { PriceLine, ProposalPackageId, ProposalPricing } from "./pricing";
import { titleFor } from "../workshops/logic";

/** Workshop days a package is booked as (Quarter = 3 JOVE Days, Year = 8 sessions; a Club books its first session). */
export const SESSIONS: Record<ProposalPackageId, number> = { "jove-day": 1, "jove-quarter": 3, "jove-year": 8, "jove-club": 1, custom: 1 };

export function sessionLabel(pkg: ProposalPackageId, i: number) {
  const n = SESSIONS[pkg];
  if (pkg === "jove-club") return "First club session";
  if (n === 1) return "Workshop date";
  return `${pkg === "jove-quarter" ? "JOVE Day" : "Session"} ${i + 1} of ${n}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The programme fee shared across the planned sessions; the first one takes the rounding. */
export function sessionShares(programmeNet: number, sessions: number) {
  const each = Math.floor(programmeNet / sessions);
  return Array.from({ length: sessions }, (_, i) => (i === 0 ? programmeNet - each * (sessions - 1) : each));
}

export function workshopsFromProposal(
  proposal: BaseRecord,
  p: ProposalPricing,
  school: BaseRecord | undefined,
  dates: string[],
  startTime: string,
): Record<string, unknown>[] {
  const planned = SESSIONS[p.packageId];
  const shares = sessionShares(p.programmeNet, planned);
  const name = str(school?.name);
  const contact = str(school?.contactName) || str(school?.principalName);
  const role = str(school?.contactName) ? str(school?.contactRole) : str(school?.principalName) ? "Principal" : "";
  return dates
    .map((date, i) => ({ date, i }))
    .filter(({ date }) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .map(({ date, i }) => ({
      title: `${titleFor(p.packageId, name)}${planned > 1 ? ` · ${sessionLabel(p.packageId, i)}` : ""}`,
      schoolId: str(proposal.schoolId),
      package: p.packageId,
      date,
      startTime: startTime || "07:30",
      status: "tentative",
      ...Object.fromEntries(p.bands.map(({ band, students }) => [BAND_FIELDS[band.id], students || ""])),
      agreedAmount: shares[i] || "",
      mediaPack: i < p.mediaPacks,
      distanceKm: Number(school?.distanceKm) > 0 ? Number(school?.distanceKm) : "",
      schoolContact: contact ? (role ? `${contact} (${role})` : contact) : "",
      schoolContactPhone: str(school?.phone),
      proposalId: proposal.id,
      notes: `Booked from proposal ${str(proposal.number)}${planned > 1 ? ` (${sessionLabel(p.packageId, i).toLowerCase()})` : ""}. Tentative until the ${joveDayRules.advancePercent}% advance arrives.`,
    }));
}

const lineText = (pkgName: string, l: PriceLine) =>
  l.kind === "band" ? `${pkgName}: ${l.label}${l.detail ? ` (${l.detail})` : ""}` : `${l.label}${l.detail && l.kind !== "addon" ? ` (${l.detail})` : ""}`;

/** The draft invoice for the whole proposal: the same lines, discount and GST as the proposal. */
export function invoiceFromProposal(
  proposal: BaseRecord,
  p: ProposalPricing,
  school: BaseRecord | undefined,
  settings: Pick<CompanySettings, "state" | "sacCode">,
  ctx: { today: string; workshopId: string; lastDate: string },
): Record<string, unknown> {
  const sac = settings.sacCode || undefined;
  const lines = [...p.bandLines, ...(p.minimumLine ? [p.minimumLine] : []), ...p.addOnLines, ...p.extraLines].filter((l) => l.amount !== 0);
  const items: LineItem[] = lines.map((l) => ({ description: lineText(p.pkg.name, l), qty: l.qty, rate: l.rate, sac }));
  const dueBase = ctx.lastDate && ctx.lastDate > ctx.today ? ctx.lastDate : ctx.today;
  const notes = [
    `As per proposal ${str(proposal.number)}: ${p.pkg.name}${p.students ? ` for ${formatNumber(p.students)} students` : ""}.`,
    `Advance of ${formatINR(p.advance)} (${joveDayRules.advancePercent}% of the total) confirms the date${SESSIONS[p.packageId] > 1 ? "s" : ""}; the balance of ${formatINR(p.balance)} is due within ${joveDayRules.balanceDueDays} days of the workshop.`,
    p.mediaPacks ? `Includes ${p.mediaPacks} JOVE Media Pack${p.mediaPacks > 1 ? "s" : ""} at no extra cost.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    date: ctx.today,
    dueDate: addDays(dueBase, joveDayRules.balanceDueDays),
    schoolId: str(proposal.schoolId),
    workshopId: ctx.workshopId,
    proposalId: proposal.id,
    customerName: str(school?.name),
    customerAddress: [str(school?.address), str(school?.city)].filter(Boolean).join(", "),
    customerGstin: str(school?.gstin),
    placeOfSupply: settings.state,
    gstPercent: p.gstPercent,
    discount: p.discount ? round2(p.discount) : "",
    items,
    status: "draft",
    notes,
    payments: [],
  };
}
