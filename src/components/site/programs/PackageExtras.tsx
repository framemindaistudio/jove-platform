import { Check, Minus } from "lucide-react";
import { addOns, faqs, joveDayRules, mediaPack, packages, type PackageId } from "@/lib/content/business";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { cn, formatINR, pad2 } from "@/lib/utils";
import { CLUB_MIN_STUDENTS, SESSIONS, comparisonRows, priceLabel, savingRange, type MatrixCell } from "./data";
import { KITS_MIN } from "./quote";

/* ── Add-ons table ────────────────────────────────────────────────────── */

const ADDON_GROUPS: { owner: "JOVE" | "FrameMind AI Studio"; title: string; note: string }[] = [
  { owner: "FrameMind AI Studio", title: "Media & marketing", note: "Produced by our in-house film studio" },
  { owner: "JOVE", title: "Learning & infrastructure", note: "Delivered by the JOVE team" },
];

/** Every add-on from business.ts, grouped by who delivers it. Table on desktop, stacked cards on phones. */
export function AddOnsTable() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
      <CornerMarks className="m-2 text-graphite/35" />
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Optional add-ons with prices</caption>
        <thead className="hidden md:table-header-group">
          <tr className="border-b border-graphite/15 bg-paper-100/80">
            <th scope="col" className="annot w-[30%] px-6 py-4 font-normal text-blueprint">
              Add-on
            </th>
            <th scope="col" className="annot px-6 py-4 font-normal text-blueprint">
              What you get
            </th>
            <th scope="col" className="annot w-[18%] px-6 py-4 text-right font-normal text-blueprint">
              Price
            </th>
          </tr>
        </thead>
        {ADDON_GROUPS.map((g) => (
          <tbody key={g.owner} className="block md:table-row-group">
            <tr className="block border-b border-graphite/10 bg-graphite text-paper md:table-row">
              <th scope="colgroup" colSpan={3} className="block px-5 py-3 text-left md:table-cell md:px-6">
                <span className="text-sm font-semibold">{g.title}</span>
                <span className="annot ml-3 text-[10px] text-paper/55">{g.note}</span>
              </th>
            </tr>
            {addOns
              .filter((a) => a.owner === g.owner)
              .map((a) => (
                <tr key={a.id} className="block border-b border-graphite/10 px-5 py-4 last:border-b-0 md:table-row md:px-0 md:py-0">
                  <th scope="row" className="block text-left align-top text-[15px] font-semibold text-graphite md:table-cell md:px-6 md:py-5">
                    {a.name}
                  </th>
                  <td className="mt-1 block align-top text-sm leading-relaxed text-charcoal md:table-cell md:px-6 md:py-5">{a.detail}</td>
                  <td className="mt-2 block align-top font-mono text-sm font-medium text-graphite tabular md:table-cell md:whitespace-nowrap md:px-6 md:py-5 md:text-right">
                    {a.price}
                    <span className="block font-sans text-[11px] font-normal text-blueprint">{a.id === "take-home-kits" ? `incl. GST · min. ${KITS_MIN} kits` : "ex-GST"}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/* ── Comparison matrix ────────────────────────────────────────────────── */

function Cell({ value, dark }: { value: MatrixCell; dark?: boolean }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center">
        <span className={cn("grid size-6 place-items-center rounded-full", dark ? "bg-paper text-graphite" : "bg-graphite text-paper")}>
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
        <span className="sr-only">Included</span>
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center justify-center">
        <Minus className={cn("size-4", dark ? "text-paper/30" : "text-graphite/25")} aria-hidden />
        <span className="sr-only">Not included</span>
      </span>
    );
  if (value === "Add-on")
    return <span className={cn("annot inline-block rounded-full border px-2 py-0.5 text-[10px]", dark ? "border-paper/35 text-paper/70" : "border-graphite/25 text-blueprint")}>Add-on</span>;
  return <span className={cn("text-[13px] leading-snug", dark ? "text-paper" : "text-graphite")}>{value}</span>;
}

/** Features × packages. Scrolls sideways inside its own frame on small screens; the feature column stays pinned. */
export function ComparisonMatrix() {
  const cols = packages.map((p) => p.id) as PackageId[];
  const hiIdx = packages.findIndex((p) => p.highlight);
  return (
    <div className="relative">
      <div className="no-scrollbar overflow-x-auto rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]" tabIndex={0} role="region" aria-label="Package comparison (scrolls sideways on small screens)">
        <table className="w-full min-w-[720px] border-collapse text-left sm:min-w-[860px]">
          <caption className="sr-only">Comparison of JOVE Day, JOVE Quarter, JOVE Year and JOVE Club</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-36 border-b border-graphite/15 bg-paper-100 px-4 py-5 align-bottom sm:w-[24%] sm:px-5">
                <span className="annot text-blueprint">Feature</span>
              </th>
              {packages.map((p, i) => (
                <th key={p.id} scope="col" className={cn("border-b px-4 py-5 text-center align-bottom", i === hiIdx ? "border-paper/10 bg-graphite text-paper" : "border-graphite/15 bg-paper-100")}>
                  {i === hiIdx && <span className="annot mb-2 inline-block rounded-full bg-paper px-2 py-0.5 text-[9px] text-graphite">Recommended</span>}
                  <span className="block text-base font-bold tracking-tight">{p.name}</span>
                  <span className={cn("annot mt-1 block text-[10px] font-normal", i === hiIdx ? "text-paper/55" : "text-blueprint")}>{p.cadence}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, r) => (
              <tr key={row.feature} className="group">
                <th scope="row" className={cn("sticky left-0 z-10 border-b border-graphite/10 px-4 py-4 text-left align-middle sm:px-5", r % 2 ? "bg-paper-100" : "bg-paper-50")}>
                  <span className="block text-sm font-semibold text-graphite">{row.feature}</span>
                  {row.hint && <span className="block text-[11px] font-normal text-blueprint">{row.hint}</span>}
                </th>
                {cols.map((c, i) => (
                  <td key={c} className={cn("border-b px-4 py-4 text-center align-middle", i === hiIdx ? "border-paper/10 bg-graphite" : cn("border-graphite/10", r % 2 ? "bg-paper-100/60" : ""))}>
                    <Cell value={row.cells[c]} dark={i === hiIdx} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="annot mt-3 text-blueprint md:hidden">Swipe sideways to compare all four →</p>
    </div>
  );
}

/* ── Payment terms ────────────────────────────────────────────────────── */

const reelDelivery = mediaPack.items.find((i) => /reels/i.test(i.title))?.delivery ?? "";
const filmDelivery = mediaPack.items.find((i) => /film/i.test(i.title))?.delivery ?? "";

const paySteps = [
  { k: "Book", t: `${joveDayRules.advancePercent}% advance`, d: `Pay ${joveDayRules.advancePercent}% of the workshop fee (incl. GST) to lock your date. Your proposal and invoice come first.` },
  { k: "JOVE Day", t: "We run the day", d: "Kits, trainers, certificates and the film crew arrive with us. You provide halls, tables and power." },
  { k: "Media", t: "Films delivered", d: `Reels & photos ${reelDelivery.toLowerCase()}; the highlight film ${filmDelivery.toLowerCase()}.` },
  { k: `Day + ${joveDayRules.balanceDueDays}`, t: "Balance due", d: `The remaining ${100 - joveDayRules.advancePercent}% within ${joveDayRules.balanceDueDays} days of the JOVE Day.` },
];

const payNotes = [
  { t: "GST extra", d: `Workshop, media and training prices exclude GST; ${joveDayRules.gstPercent}% is added on the tax invoice. Kit MRPs already include GST. Your CA can confirm how it applies to your institution.` },
  { t: "Multi-session packages", d: "JOVE Quarter, Year and Club follow the payment schedule set out in your proposal — agreed with you before anything is booked." },
  { t: "Bank transfer or UPI", d: "Pay against our invoice by bank transfer or UPI. Every payment is acknowledged with a receipt." },
];

export function PaymentTerms() {
  return (
    <div className="space-y-10">
      <ol className="relative grid gap-4 md:grid-cols-4">
        <span aria-hidden className="absolute left-0 right-0 top-[22px] hidden border-t border-dashed border-graphite/30 md:block" />
        {paySteps.map((s, i) => (
          <Reveal as="li" key={s.k} delay={i * 0.08} className="relative">
            <span className={cn("relative grid size-11 place-items-center rounded-full border font-mono text-xs", i === 0 || i === 3 ? "border-graphite bg-graphite text-paper" : "border-graphite/30 bg-paper text-graphite")}>{pad2(i + 1)}</span>
            <p className="annot mt-4 text-blueprint">{s.k}</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-graphite">{s.t}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{s.d}</p>
          </Reveal>
        ))}
      </ol>
      <div className="grid gap-4 md:grid-cols-3">
        {payNotes.map((n, i) => (
          <Reveal key={n.t} delay={i * 0.06}>
            <div className="relative h-full rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
              <p className="text-sm font-semibold text-graphite">{n.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{n.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */

const pickFaq = (needle: RegExp) => faqs.find((f) => needle.test(f.q));
const q = savingRange("jove-quarter");

export const packageFaqs: { q: string; a: string }[] = [
  pickFaq(/pricing calculated/i),
  {
    q: `What if we have fewer than ${joveDayRules.minimumStudents} students?`,
    a: `A JOVE Day is planned for ${joveDayRules.minimumStudents}+ students and billed at a minimum of ${formatINR(joveDayRules.minimumBilling)} (ex-GST), so smaller schools can still book — the estimator shows the top-up. For smaller groups that want regular sessions, JOVE Club starts at ${CLUB_MIN_STUDENTS} students.`,
  },
  {
    q: "How is JOVE Quarter different from booking three JOVE Days?",
    a: `It is ${SESSIONS["jove-quarter"]} JOVE Days that build on each other (Level 1 → 2 → 3), priced at ${priceLabel("jove-quarter").price} per student for the quarter — about ${q.min}–${q.max}% less than three separate days. It adds a teacher orientation, student progress reports with skill badges, an end-of-quarter showcase for parents and priority dates.`,
  },
  pickFaq(/Media Pack/i),
  pickFaq(/kits home/i),
  {
    q: "When do we pay, and is GST included?",
    a: `For a JOVE Day, ${joveDayRules.advancePercent}% of the fee confirms your date and the balance is due within ${joveDayRules.balanceDueDays} days of the workshop. Prices are per student and exclude GST (${joveDayRules.gstPercent}% is added on the invoice); online kit prices include GST.`,
  },
  pickFaq(/need from the school/i),
  pickFaq(/try it before/i),
].filter((f): f is { q: string; a: string } => !!f);

/** Native <details> accordion — works without JavaScript, keyboard-operable out of the box. */
export function PackagesFaq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: packageFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
    <div className="divide-y divide-graphite/12 border-y border-graphite/12">
      {packageFaqs.map((f, i) => (
        <details key={f.q} className="group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-start gap-4 py-5 text-left outline-none focus-visible:bg-graphite/[0.04] [&::-webkit-details-marker]:hidden">
            <span className="mt-1 font-mono text-[11px] text-blueprint">{pad2(i + 1)}</span>
            <span className="flex-1 text-base font-semibold leading-snug text-graphite sm:text-lg">{f.q}</span>
            <span aria-hidden className="relative mt-1.5 size-4 shrink-0">
              <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-graphite" />
              <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-graphite transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="max-w-3xl pb-6 pl-9 pr-8 text-sm leading-relaxed text-charcoal sm:text-base">{f.a}</p>
        </details>
      ))}
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
