/**
 * Proposal pricing engine — every number comes from src/lib/content/business.ts.
 * Pure functions only: used live in the proposal builder, in the list, and on the printable proposal.
 *
 *  JOVE Day      Σ students × band pricePerStudent  (minimum billing applies)
 *  JOVE Quarter  Σ students × band quarterPricePerStudent
 *  JOVE Year     Σ students × band yearPricePerStudent
 *  JOVE Club     club price × students × months
 *  Custom        add-ons + extra line items only
 *
 *  Discount % applies to the programme fee. Add-ons and extra items are added at their own rates.
 *  GST is added on the ex-GST subtotal.
 */
import { addOns, gradeBands, joveDayRules, kits, mediaPack, packages, type AddOn, type GradeBand, type GradeBandId, type PackageId } from "@/lib/content/business";
import type { LineItem } from "@/lib/hq/collections";
import { formatINR, formatNumber } from "@/lib/utils";
import { BAND_FIELDS } from "./crm";

export type ProposalPackageId = PackageId | "custom";

/* ─────────────────────────── constants derived from business.ts ─────────────────────────── */

const clubPackage = packages.find((p) => p.id === "jove-club");
const yearPackage = packages.find((p) => p.id === "jove-year");

function firstRupees(text: string | undefined) {
  const m = /₹\s?([\d,]+)/.exec(text ?? "");
  return m ? Number(m[1].replace(/,/g, "")) : NaN;
}

/** ₹ per student per month for JOVE Club (from the package price note). */
export const CLUB_PRICE_PER_STUDENT_MONTH = Number.isFinite(firstRupees(clubPackage?.priceNote)) ? firstRupees(clubPackage?.priceNote) : 799;
/** Minimum club size (from the package price note). */
export const CLUB_MIN_STUDENTS = Number(/min\.\s*(\d+)/i.exec(clubPackage?.priceNote ?? "")?.[1]) || 25;
/** JOVE Year includes a discount on Social Media Management add-ons (from the package inclusions). */
export const YEAR_SMM_DISCOUNT_PERCENT = Number(/(\d+)%\s*off\s+social media/i.exec(yearPackage?.includes.join(" ") ?? "")?.[1]) || 0;
/** Minimum teachers per training batch (from the add-on detail). */
export const TEACHER_TRAINING_MIN = Number(/min\.\s*(\d+)\s*teachers/i.exec(addOns.find((a) => a.id === "teacher-training")?.detail ?? "")?.[1]) || 10;
/** Minimum kits for the bulk school price (from the add-on detail). */
export const TAKE_HOME_KITS_MIN = Number(/min\.\s*(\d+)\s*kits/i.exec(addOns.find((a) => a.id === "take-home-kits")?.detail ?? "")?.[1]) || 30;

export const GST_PERCENT = joveDayRules.gstPercent;

export interface PackageChoice {
  id: ProposalPackageId;
  name: string;
  cadence: string;
  priceNote: string;
  /** what the per-student band rate means for this package */
  unit: string;
  /** JOVE Media Packs included */
  mediaPacks: number;
  /** media included, described honestly per package */
  mediaNote: string;
}

export const PACKAGE_CHOICES: PackageChoice[] = [
  ...packages.map((p): PackageChoice => {
    switch (p.id) {
      case "jove-day":
        return { id: p.id, name: p.name, cadence: p.cadence, priceNote: p.priceNote, unit: "per student", mediaPacks: 1, mediaNote: "1 × JOVE Media Pack (reels, full-day film, drone shots, photos)" };
      case "jove-quarter":
        return { id: p.id, name: p.name, cadence: p.cadence, priceNote: p.priceNote, unit: "per student / quarter", mediaPacks: 3, mediaNote: "3 × JOVE Media Pack — one with every JOVE Day" };
      case "jove-year":
        return { id: p.id, name: p.name, cadence: p.cadence, priceNote: p.priceNote, unit: "per student / year", mediaPacks: 0, mediaNote: "Annual showcase film + monthly reels" };
      default:
        return { id: p.id, name: p.name, cadence: p.cadence, priceNote: p.priceNote, unit: "per student / month", mediaPacks: 0, mediaNote: "Monthly project video for parents" };
    }
  }),
  { id: "custom", name: "Custom", cadence: "Tailored scope", priceNote: "Add-ons and custom line items only", unit: "", mediaPacks: 0, mediaNote: "" },
];

export function packageChoice(id: unknown): PackageChoice {
  return PACKAGE_CHOICES.find((p) => p.id === id) ?? PACKAGE_CHOICES[0];
}

export function packageName(id: unknown) {
  return PACKAGE_CHOICES.find((p) => p.id === id)?.name ?? (id ? String(id) : "—");
}

/** Per-student band rate for a package (club = per month). */
export function bandRate(band: GradeBand, pkg: ProposalPackageId) {
  switch (pkg) {
    case "jove-day":
      return band.pricePerStudent;
    case "jove-quarter":
      return band.quarterPricePerStudent;
    case "jove-year":
      return band.yearPricePerStudent;
    case "jove-club":
      return CLUB_PRICE_PER_STUDENT_MONTH;
    default:
      return 0;
  }
}

/* ─────────────────────────── add-ons ─────────────────────────── */

export function addOnById(id: string): AddOn | undefined {
  return addOns.find((a) => a.id === id);
}

export function defaultAddOnQty(a: AddOn) {
  if (a.unit === "teacher") return TEACHER_TRAINING_MIN;
  return 1;
}

/** List rate for an add-on in a given package (JOVE Year gets its SMM discount). */
export function addOnListRate(a: AddOn, pkg: ProposalPackageId) {
  if (pkg === "jove-year" && a.id.startsWith("smm-") && YEAR_SMM_DISCOUNT_PERCENT > 0) return Math.round(a.priceValue * (1 - YEAR_SMM_DISCOUNT_PERCENT / 100));
  return a.priceValue;
}

export function unitLabel(unit: string, qty: number) {
  const plural = qty === 1 ? "" : "s";
  switch (unit) {
    case "month":
      return `month${plural}`;
    case "teacher":
      return `teacher${plural}`;
    case "kit":
      return `kit${plural}`;
    case "project":
      return qty === 1 ? "project" : "projects";
    default:
      return unit;
  }
}

/* ─────────────────────────── the maths ─────────────────────────── */

export interface PriceLine {
  key: string;
  kind: "band" | "minimum" | "addon" | "kit" | "extra";
  label: string;
  detail?: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  bandId?: GradeBandId;
}

export interface ProposalPricing {
  packageId: ProposalPackageId;
  pkg: PackageChoice;
  months: number;
  students: number;
  bands: { band: GradeBand; students: number }[];
  bandLines: PriceLine[];
  minimumLine: PriceLine | null;
  programmeFee: number;
  discountPercent: number;
  discount: number;
  programmeNet: number;
  addOnLines: PriceLine[];
  addOnsTotal: number;
  extraLines: PriceLine[];
  extrasTotal: number;
  subtotal: number;
  gstPercent: number;
  gst: number;
  grandTotal: number;
  /** programme fee after discount ÷ students (per the package's unit) */
  perStudent: number;
  mediaPacks: number;
  mediaValue: number;
  advance: number;
  balance: number;
  warnings: string[];
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

function mapOf(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, num(x)]));
}

/** Number of months for a JOVE Club proposal (defaults to 1). */
export function clubMonths(p: Record<string, unknown>) {
  return Math.max(1, Math.round(num(p.months)) || 1);
}

export function priceProposal(p: Record<string, unknown>): ProposalPricing {
  const packageId = (PACKAGE_CHOICES.some((c) => c.id === p.packageId) ? p.packageId : "jove-day") as ProposalPackageId;
  const pkg = packageChoice(packageId);
  const months = packageId === "jove-club" ? clubMonths(p) : 1;
  const warnings: string[] = [];

  const bands = gradeBands.map((band) => ({ band, students: Math.max(0, Math.round(num(p[BAND_FIELDS[band.id]]))) }));
  const students = bands.reduce((s, b) => s + b.students, 0);

  /* programme */
  const bandLines: PriceLine[] =
    packageId === "custom"
      ? []
      : bands
          .filter((b) => b.students > 0)
          .map(({ band, students: n }) => {
            const rate = bandRate(band, packageId);
            const qty = n * months;
            return {
              key: `band-${band.id}`,
              kind: "band" as const,
              bandId: band.id,
              label: `${band.name} — ${band.grades}`,
              detail:
                packageId === "jove-club"
                  ? `${formatNumber(n)} students × ${months} month${months === 1 ? "" : "s"} · after-school club`
                  : `${band.theme} · ${band.durationMin}-minute session${packageId === "jove-quarter" ? " · 3 levels" : packageId === "jove-year" ? " · 8 sessions" : ""}`,
              qty,
              unit: packageId === "jove-club" ? "student-months" : "students",
              rate,
              amount: qty * rate,
            };
          });

  const bandTotal = bandLines.reduce((s, l) => s + l.amount, 0);
  let minimumLine: PriceLine | null = null;
  if (packageId === "jove-day" && students > 0 && bandTotal < joveDayRules.minimumBilling) {
    const gap = joveDayRules.minimumBilling - bandTotal;
    minimumLine = {
      key: "minimum",
      kind: "minimum",
      label: "Minimum billing adjustment",
      detail: `A JOVE Day is billed at a minimum of ${formatINR(joveDayRules.minimumBilling)} (≈ ${joveDayRules.minimumStudents} students)`,
      qty: 1,
      unit: "lot",
      rate: gap,
      amount: gap,
    };
  }
  const programmeFee = bandTotal + (minimumLine?.amount ?? 0);
  const discountPercent = Math.min(100, Math.max(0, num(p.discountPercent)));
  const discount = Math.round((programmeFee * discountPercent) / 100);
  const programmeNet = programmeFee - discount;

  /* add-ons */
  const selected = Array.isArray(p.addOns) ? (p.addOns as unknown[]).map(String) : [];
  const qtyMap = mapOf(p.addOnQty);
  const rateMap = mapOf(p.addOnRate);
  const addOnLines: PriceLine[] = [];
  for (const id of selected) {
    const a = addOnById(id);
    if (!a) continue;
    if (a.id === "take-home-kits") {
      let kitCount = 0;
      for (const { band, students: n } of bands) {
        if (!n) continue;
        const kit = kits.find((k) => k.id === band.kitId);
        if (!kit) continue;
        const rate = Math.round(kit.schoolPrice / (1 + GST_PERCENT / 100));
        kitCount += n;
        addOnLines.push({
          key: `kit-${band.id}`,
          kind: "kit",
          bandId: band.id,
          label: `Take-home ${kit.name}`,
          detail: `${band.grades} · bulk school price ${formatINR(kit.schoolPrice)} incl. GST (MRP ${formatINR(kit.mrp)})`,
          qty: n,
          unit: "kits",
          rate,
          amount: n * rate,
        });
      }
      if (!kitCount) warnings.push("Take-home kits are priced per student — add student numbers to include them.");
      else if (kitCount < TAKE_HOME_KITS_MIN) warnings.push(`Take-home kits need a minimum of ${TAKE_HOME_KITS_MIN} kits for the bulk school price.`);
      continue;
    }
    const qty = Math.max(1, Math.round(qtyMap[id] || defaultAddOnQty(a)));
    const listRate = addOnListRate(a, packageId);
    const rate = id in rateMap && rateMap[id] > 0 ? rateMap[id] : listRate;
    const yearDeal = packageId === "jove-year" && a.id.startsWith("smm-") && YEAR_SMM_DISCOUNT_PERCENT > 0;
    addOnLines.push({
      key: `addon-${a.id}`,
      kind: "addon",
      label: a.name,
      detail: [a.owner === "FrameMind AI Studio" ? "by FrameMind AI Studio" : "", yearDeal ? `${YEAR_SMM_DISCOUNT_PERCENT}% JOVE Year discount applied` : "", a.detail].filter(Boolean).join(" · "),
      qty,
      unit: unitLabel(a.unit, qty),
      rate,
      amount: qty * rate,
    });
    if (a.id === "teacher-training" && qty < TEACHER_TRAINING_MIN) warnings.push(`Teacher training runs for a minimum of ${TEACHER_TRAINING_MIN} teachers.`);
    if (a.id === "lab-setup" && rate === a.priceValue) warnings.push(`Lab setup is quoted "${a.price}" — adjust the rate to the scoped amount after the site visit.`);
  }
  const addOnsTotal = addOnLines.reduce((s, l) => s + l.amount, 0);

  /* extra line items */
  const extras: LineItem[] = Array.isArray(p.extraItems) ? (p.extraItems as LineItem[]) : [];
  const extraLines: PriceLine[] = extras
    .filter((it) => it && (String(it.description ?? "").trim() || num(it.qty) || num(it.rate)))
    .map((it, i) => ({
      key: `extra-${i}`,
      kind: "extra" as const,
      label: String(it.description ?? "").trim() || "Additional item",
      qty: num(it.qty),
      unit: "",
      rate: num(it.rate),
      amount: round2(num(it.qty) * num(it.rate)),
    }));
  const extrasTotal = round2(extraLines.reduce((s, l) => s + l.amount, 0));

  /* totals */
  const subtotal = round2(Math.max(0, programmeNet + addOnsTotal + extrasTotal));
  const gst = Math.round((subtotal * GST_PERCENT) / 100);
  const grandTotal = round2(subtotal + gst);
  const perStudent = students ? Math.round(programmeNet / students / (packageId === "jove-club" ? months : 1)) : 0;
  const advance = Math.round((grandTotal * joveDayRules.advancePercent) / 100);
  const mediaPacks = pkg.mediaPacks;

  /* sanity checks */
  if (packageId !== "custom" && !students) warnings.push("Add student numbers for at least one grade band.");
  if (packageId === "jove-day" && students > 0 && students < joveDayRules.minimumStudents)
    warnings.push(`${formatNumber(students)} students is below the ${joveDayRules.minimumStudents}-student minimum — the ${formatINR(joveDayRules.minimumBilling)} minimum billing applies.`);
  if (packageId === "jove-day" && students > joveDayRules.maxStudentsPerDay)
    warnings.push(`${formatNumber(students)} students is more than one JOVE Day can host (${joveDayRules.maxStudentsPerDay}). Plan a second day.`);
  if (packageId !== "custom" && packageId !== "jove-club")
    for (const { band, students: n } of bands)
      if (n > band.maxPerSession) warnings.push(`${band.grades}: ${formatNumber(n)} students is more than one session (${band.maxPerSession}) — an overflow batch is needed.`);
  if (packageId === "jove-club" && students > 0 && students < CLUB_MIN_STUDENTS) warnings.push(`JOVE Club runs with a minimum of ${CLUB_MIN_STUDENTS} students.`);
  if (discountPercent >= 25) warnings.push(`A ${discountPercent}% discount is unusually high — confirm with the founders before sending.`);

  return {
    packageId,
    pkg,
    months,
    students,
    bands,
    bandLines,
    minimumLine,
    programmeFee,
    discountPercent,
    discount,
    programmeNet,
    addOnLines,
    addOnsTotal,
    extraLines,
    extrasTotal,
    subtotal,
    gstPercent: GST_PERCENT,
    gst,
    grandTotal,
    perStudent,
    mediaPacks,
    mediaValue: mediaPacks * mediaPack.marketValue,
    advance,
    balance: round2(grandTotal - advance),
    warnings,
  };
}

/** Bands that have students on a proposal (used by the printable programme pages). */
export function selectedBands(p: Record<string, unknown>) {
  return gradeBands.filter((b) => num(p[BAND_FIELDS[b.id]]) > 0);
}

/** "Grades 1–10" style span for the selected bands. */
export function gradeSpan(p: Record<string, unknown>) {
  const sel = selectedBands(p);
  if (!sel.length) return "";
  const first = sel[0].grades.replace(/^Grades\s*/, "").split("–")[0];
  const last = sel[sel.length - 1].grades.replace(/^Grades\s*/, "").split("–").pop();
  return `Grades ${first}–${last}`;
}
