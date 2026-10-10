"use client";

/**
 * A3 school brochure: "Packages & Pricing" (theme: Graphite).
 *
 * The price sheet a principal can take into a management meeting. Dark graphite field, warm-paper type,
 * and the tables set on paper-coloured plates so small numbers stay crisp in print.
 *
 *   OUTSIDE  back cover (Media Pack, add-ons, booking, contact)  |  front cover
 *   INSIDE   JOVE Day price table, rules, worked example         |  Day / Quarter / Year compared, JOVE Club
 *
 * Every price, duration, minimum and count is read from src/lib/content/business.ts: nothing is typed here.
 * Geometry is fixed in millimetres on a 5 mm grid that starts 12.5 mm in from every edge and from the fold.
 *
 * Query string (all optional): for, contact, phone, sides (see BrochureBits), and one of its own:
 *   valid = free text, printed on the front cover as "Prices valid until <valid>"; left out when empty.
 */
import { Fragment, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { Award, Check, Clapperboard, Drone, FileText, Globe, Mail, Phone, User, Users, Wrench, type LucideIcon } from "lucide-react";
import { addOns, gradeBands, joveDayRules, kits, mediaPack, packages, type AddOn, type GradeBand, type Package } from "@/lib/content/business";
import { site } from "@/lib/site";
import { cn, formatINR, formatNumber, pad2 } from "@/lib/utils";
import { Wordmark } from "../PrintBits";
import type { Q } from "../util";
import { BrochureShell, Half, Qr, Spread, sessionLength, useBrochureInfo, useQr, type BrochureInfo } from "./BrochureBits";

/* ───────────────────────────── geometry ───────────────────────────── */

/** Margin on every side of an A4 half (sheet edge and fold alike), and the width of the text area between them. */
const M = 12.5;
const W = 185;

const mm = (n: number) => `${n}mm`;
/** An absolutely placed box, in mm from the top-left corner of the half it sits in. */
const at = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  position: "absolute",
  left: mm(x),
  top: mm(y),
  ...(w === undefined ? null : { width: mm(w) }),
  ...(h === undefined ? null : { height: mm(h) }),
});

/* ───────────────────────────── numbers (all from business.ts) ───────────────────────────── */

const dayPrices = gradeBands.map((b) => b.pricePerStudent);
const lowPrice = Math.min(...dayPrices);
const lowBand = gradeBands.find((b) => b.pricePerStudent === lowPrice) ?? gradeBands[0];

const gradeNumbers = gradeBands.flatMap((b) => (b.grades.match(/\d+/g) ?? []).map(Number));
/** "Grades 1–10", from the first and last grade band */
const gradeSpan = `Grades ${Math.min(...gradeNumbers)}–${Math.max(...gradeNumbers)}`;

const pkg = (id: Package["id"]) => packages.find((p) => p.id === id);
const dayPkg = pkg("jove-day") ?? packages[0];
const clubPkg = pkg("jove-club");

/** The three programme lengths that are priced per student by grade band. */
const lengths = (
  [
    { id: "jove-day", unit: "per student", price: (b: GradeBand) => b.pricePerStudent },
    { id: "jove-quarter", unit: "per student, per quarter", price: (b: GradeBand) => b.quarterPricePerStudent },
    { id: "jove-year", unit: "per student, per year", price: (b: GradeBand) => b.yearPricePerStudent },
  ] as const
).flatMap((l) => {
  const p = pkg(l.id);
  return p ? [{ ...l, pkg: p }] : [];
});

/** 75 → "1 h 15 min" · 180 → "3 hours" (the same on every brochure) */
const hoursMinutes = sessionLength;
/** keeps a number on the same line as the word it counts: "2 school teachers", "6 reels" */
const nb = (s: string) => s.replace(/(\d+) (?=[A-Za-z])/g, "$1\u00a0");

/**
 * Worked example: the same number of students in every grade band, the smallest round class size
 * that takes the total above the JOVE Day minimum.
 */
const exPerBand = Math.ceil((joveDayRules.minimumStudents + 1) / gradeBands.length / 10) * 10;
const exRows = gradeBands.map((b) => ({ band: b, amount: exPerBand * b.pricePerStudent }));
const exStudents = exPerBand * gradeBands.length;
const exSum = exRows.reduce((s, r) => s + r.amount, 0);
const exBill = Math.max(exSum, joveDayRules.minimumBilling);
const exAverage = Math.round(exBill / exStudents);
const exAdvance = Math.round((exBill * joveDayRules.advancePercent) / 100);
const exDays = Math.ceil(exStudents / joveDayRules.maxStudentsPerDay);

/* ───────────────────────────── small parts ───────────────────────────── */

/**
 * Text with the rupee sign and the arrow drawn as vectors. The brochure fonts carry neither glyph, and a
 * substitute from the computer's own fonts would look different on every machine that prints this.
 */
function Tx({ children }: { children: string }) {
  // a chain such as "1 → 2 → 3" is kept on one line
  return (
    <>
      {children.split(/(\S+(?: → \S+)+)/).map((chunk, i) =>
        chunk.includes("→") ? (
          <span key={i} className="whitespace-nowrap">
            <Glyphs text={chunk} />
          </span>
        ) : (
          <Glyphs key={i} text={chunk} />
        ),
      )}
    </>
  );
}

function Glyphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/(₹|→)/).map((part, i) => (
        <Fragment key={i}>{part === "₹" ? <RupeeSign /> : part === "→" ? <ArrowSign /> : part}</Fragment>
      ))}
    </>
  );
}

function RupeeSign() {
  return (
    <svg role="img" aria-label="₹" viewBox="0 0 100 140" overflow="visible" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="bevel" className="mr-[0.07em] inline-block h-[0.73em] w-[0.52em] align-baseline">
      <path d="M4 8H96M4 41H96M4 8H36C78 8 78 74 36 74H14L72 138" />
    </svg>
  );
}

function ArrowSign() {
  return (
    <svg role="img" aria-label="to" viewBox="0 0 100 60" overflow="visible" fill="none" stroke="currentColor" strokeWidth="9" className="inline-block h-[0.5em] w-[0.84em] align-baseline">
      <path d="M2 30H94M70 6L96 30L70 54" />
    </svg>
  );
}

const Inr = ({ value }: { value: number }) => <Tx>{formatINR(value)}</Tx>;

/** Mono annotation: column heads, units, sheet furniture. */
function Label({ children, className }: { children: ReactNode; className?: string }) {
  // the line height goes last: tailwind-merge drops an earlier leading-* whenever a font size follows it
  return <span className={cn("block font-mono text-[6.8pt] font-medium uppercase tracking-[0.18em]", className, "leading-[1.25]")}>{children}</span>;
}

/** Section eyebrow on the dark field: "— 01 / JOVE DAY" */
function Eyebrow({ n, children }: { n?: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-[2.5mm] font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.22em] text-paper/70">
      <span aria-hidden className="h-px w-[10mm] bg-paper/55" />
      {n && <span className="text-paper">{n}</span>}
      {n && (
        <span aria-hidden className="text-paper/40">
          /
        </span>
      )}
      <span>{children}</span>
    </p>
  );
}

/** L-shaped corner marks just outside a plate, as on a drawing sheet. */
function Corners({ size = 2.5, gap = 1, className }: { size?: number; gap?: number; className?: string }) {
  const s = { width: mm(size), height: mm(size) };
  const o = mm(-gap);
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 text-paper/60", className)}>
      <span className="absolute border-l border-t border-current" style={{ ...s, left: o, top: o }} />
      <span className="absolute border-r border-t border-current" style={{ ...s, right: o, top: o }} />
      <span className="absolute border-b border-l border-current" style={{ ...s, left: o, bottom: o }} />
      <span className="absolute border-b border-r border-current" style={{ ...s, right: o, bottom: o }} />
    </span>
  );
}

/** Dimension line with end ticks and arrowheads, and a label set into the middle of it. */
function Dimension({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[2.5mm] text-paper/55", className)}>
      <span aria-hidden className="h-[3mm] w-px bg-current" />
      <span aria-hidden className="relative -ml-[2.5mm] h-px flex-1 bg-current">
        <span className="absolute left-0 top-[-0.75mm] border-y-[0.8mm] border-r-[2mm] border-y-transparent border-r-current" />
      </span>
      <Label className="shrink-0 text-paper/75">{children}</Label>
      <span aria-hidden className="relative -mr-[2.5mm] h-px flex-1 bg-current">
        <span className="absolute right-0 top-[-0.75mm] border-y-[0.8mm] border-l-[2mm] border-y-transparent border-l-current" />
      </span>
      <span aria-hidden className="h-[3mm] w-px bg-current" />
    </div>
  );
}

/** The blueprint grid on the dark field: 5 mm minor, 25 mm major, in register with the margins. */
function Field() {
  const line = (alpha: number, dir = "") => `linear-gradient(${dir}rgb(245 241 232 / ${alpha}) 0.25mm, transparent 0.25mm)`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: [line(0.08), line(0.08, "90deg, "), line(0.032), line(0.032, "90deg, ")].join(", "),
        backgroundSize: "25mm 25mm, 25mm 25mm, 5mm 5mm, 5mm 5mm",
        backgroundPosition: `${mm(M)} ${mm(M)}`,
      }}
    />
  );
}

/** Bottom line of a page: a hairline with a note on each side. */
function Footer({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-paper/30 pt-[1.6mm] text-paper/80" style={at(M, 277.5, W)}>
      <Label className="text-[6.5pt]">{left}</Label>
      <Label className="text-[6.5pt]">{right}</Label>
    </div>
  );
}

/* ───────────────────────────── front cover ───────────────────────────── */

function FrontCover({ info, valid }: { info: BrochureInfo; valid: string }) {
  const schoolSize = info.school.length > 64 ? "text-[10pt]" : info.school.length > 36 ? "text-[11.5pt]" : "text-[14pt]";
  // the hero figure is set as large as its number of characters allows ("₹249" today)
  const heroSize = formatINR(lowPrice).length <= 4 ? "text-[132pt]" : "text-[100pt]";
  return (
    <Half side="right" className="text-paper">
      {/* the brand mark as a faint drawing behind the title */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div style={at(102, -18, 152, 175)}>
          <Image src="/brand/jove-mark-white.png" alt="" fill sizes="1400px" quality={90} loading="eager" className="object-contain opacity-[0.1]" />
        </div>
      </div>

      <div style={at(M, M)}>
        <Wordmark white mm={52} />
      </div>
      <div className="text-right text-paper/70" style={at(M + 95, M + 1, 90)}>
        <Label className="text-paper">Price sheet</Label>
        <Label className="mt-[1.4mm]">Robotics · AI · Machine Learning</Label>
        <Label className="mt-[1.4mm]">{gradeSpan}</Label>
      </div>

      <div style={at(M, 68, W)}>
        <Eyebrow>For principals and school management</Eyebrow>
        <h1 className="mt-[5mm] text-[56pt] font-bold leading-[0.94] tracking-[-0.035em]">
          Packages
          <br />
          &amp; Pricing
        </h1>
        <p className="mt-[6mm] max-w-[112mm] text-[10.5pt] leading-[1.45] text-paper/85">
          Per-student pricing for full-day Robotics, AI and Machine Learning workshops in your school. Workshop kits, certificates and the filming are included.
        </p>
      </div>

      {/* the price, dimensioned like a part on a drawing */}
      <div style={at(M, 147, W)}>
        <Label className="tracking-[0.32em] text-paper/70">From</Label>
        <div className="mt-[2mm] flex items-start gap-[7mm]">
          <p className={cn(heroSize, "font-mono font-medium leading-[0.8] tracking-[-0.04em] tabular-nums")}>
            <Inr value={lowPrice} />
          </p>
          <div className="pt-[1.5mm]">
            <p className="text-[14pt] font-semibold leading-tight tracking-[-0.01em]">per student</p>
            <p className="mt-[1.4mm] text-[9.5pt] leading-snug text-paper/80">
              {dayPkg.name}, {lowBand.grades}
            </p>
            <Label className="mt-[2.6mm] text-paper/80">Excl. GST</Label>
          </div>
        </div>
      </div>
      <div style={at(M, 197.5, W)}>
        <Dimension>{`${dayPkg.name} · price per student by grade group`}</Dimension>
      </div>

      <div className="grid border border-paper/45" style={{ ...at(M, 205, W, 22.5), gridTemplateColumns: `repeat(${gradeBands.length}, 1fr)` }}>
        {gradeBands.map((b, i) => (
          <div key={b.id} className={cn("flex flex-col justify-between px-[3.5mm] py-[3mm]", i > 0 && "border-l border-paper/45", b.id === lowBand.id && "bg-paper text-graphite")}>
            <Label className={b.id === lowBand.id ? "text-charcoal" : "text-paper/70"}>{b.grades}</Label>
            <p className="font-mono text-[19pt] font-medium leading-none tracking-[-0.02em] tabular-nums">
              <Inr value={b.pricePerStudent} />
            </p>
          </div>
        ))}
      </div>

      {/* title block */}
      <div className="border border-paper/45" style={at(M, 243, W, 39.5)}>
        <Corners />
        <div className="flex h-[25.4mm]">
          <div className="flex min-w-0 flex-1 flex-col justify-center px-[4mm]">
            <Label className="text-paper/80">{info.school ? "Prepared for" : "Inside"}</Label>
            {info.school ? (
              <p className={cn(schoolSize, "mt-[1.6mm] font-bold leading-[1.15] tracking-[-0.015em]")}>{info.school}</p>
            ) : (
              <p className="mt-[1.6mm] max-w-[120mm] text-[11.5pt] font-semibold leading-[1.25] tracking-[-0.01em]">Prices by grade group, programme lengths, add-ons and payment terms.</p>
            )}
          </div>
          {valid && (
            <div className="flex w-[58mm] shrink-0 flex-col justify-center border-l border-paper/45 px-[4mm]">
              <Label className="text-paper/80">Prices valid until</Label>
              <p className="mt-[1.6mm] font-mono text-[11pt] font-medium leading-tight">{valid}</p>
            </div>
          )}
        </div>
        <div className="flex h-[13.5mm] items-center justify-between border-t border-paper/45 px-[4mm] text-paper/70">
          <Label>{packages.map((p) => p.name).join(" · ")}</Label>
          <Label>Per student · excl. GST</Label>
        </div>
      </div>
    </Half>
  );
}

/* ───────────────────────────── back cover ───────────────────────────── */

/** One add-on: name and price on a line, what it is underneath. */
function AddOnRow({ title, addOn, first }: { title: string; addOn: AddOn; first?: boolean }) {
  return (
    <div className={cn("py-[1.3mm]", !first && "border-t border-graphite/20")}>
      <div className="flex items-baseline justify-between gap-[3mm]">
        <p className="text-balance text-[8.5pt] font-semibold leading-[1.25] tracking-[-0.005em]">{title}</p>
        <p className="shrink-0 whitespace-nowrap font-mono text-[9.5pt] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">
          <Tx>{addOn.price}</Tx>
        </p>
      </div>
      <p className="mt-[0.5mm] text-[8pt] leading-[1.3] text-charcoal">{nb(addOn.detail)}</p>
    </div>
  );
}

/** The add-ons of one owner. Tiers of the same service ("Name — Tier") are listed under one heading. */
function AddOnList({ items }: { items: AddOn[] }) {
  const groups: { name: string; rows: { tier: string; addOn: AddOn }[] }[] = [];
  for (const addOn of items) {
    const [name, tier = ""] = addOn.name.split(" — ");
    const last = groups[groups.length - 1];
    if (last && tier && last.name === name) last.rows.push({ tier, addOn });
    else groups.push({ name, rows: [{ tier, addOn }] });
  }
  return (
    <>
      {groups.map((g, gi) =>
        g.rows.length > 1 ? (
          <div key={g.name} className={cn("pt-[1.3mm]", gi > 0 && "border-t border-graphite/20")}>
            <p className="text-[8.5pt] font-semibold leading-[1.25] tracking-[-0.005em]">{g.name}</p>
            <div className="mt-[0.4mm] border-l border-graphite/40 pl-[2.6mm]">
              {g.rows.map((r, i) => (
                <AddOnRow key={r.addOn.id} title={r.tier} addOn={r.addOn} first={i === 0} />
              ))}
            </div>
          </div>
        ) : (
          <AddOnRow key={g.rows[0].addOn.id} title={g.rows[0].addOn.name} addOn={g.rows[0].addOn} first={gi === 0} />
        ),
      )}
    </>
  );
}

/** Add-ons and payment terms on one paper plate. */
function PriceList() {
  const head = "flex h-[6.8mm] items-end border-b border-graphite pb-[1.3mm]";
  const terms = [
    { figure: `${joveDayRules.advancePercent}%`, text: "advance to confirm the date" },
    { figure: `${joveDayRules.balanceDueDays} days`, text: `after the ${dayPkg.name} to pay the balance` },
    { figure: "+ GST", text: "added on the invoice where applicable" },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-[7mm] bg-paper px-[5mm] pb-[2.4mm] text-graphite" style={at(M, 121, W, 87)}>
      <Corners />
      <div>
        <div className={head}>
          <Label>Add-ons · by {site.studio.name}</Label>
        </div>
        <AddOnList items={addOns.filter((a) => a.owner === site.studio.name)} />
      </div>
      <div className="flex flex-col">
        <div className={head}>
          <Label>Add-ons · by {site.name}</Label>
        </div>
        <AddOnList items={addOns.filter((a) => a.owner !== site.studio.name)} />
        <p className="border-t border-graphite/20 pt-[1.5mm] text-[8pt] leading-[1.3] text-charcoal">Add-ons are optional. Tell us which ones you want and we list them on your quote.</p>
        <div className="mt-auto">
          <div className={head}>
            <Label>Payment terms</Label>
          </div>
          <ul className="mt-[1.6mm] space-y-[0.9mm] text-[8.5pt] leading-[1.3]">
            {terms.map((t) => (
              <li key={t.figure} className="flex items-baseline gap-[2.5mm]">
                <span className="w-[15mm] shrink-0 font-mono text-[9.5pt] font-medium tracking-[-0.02em] text-ink">{t.figure}</span>
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BackCover({ info, qrSrc }: { info: BrochureInfo; qrSrc: string }) {
  const steps = [
    { title: "Send us your numbers", text: "Students in each grade group, and the dates that suit your calendar." },
    { title: "Confirm the date", text: `We send a written, itemised quote. A ${joveDayRules.advancePercent}% advance holds the date.` },
    { title: "We run the day", text: "Consent forms go to parents first. We bring the kits, the trainers and our film studio." },
  ];
  const contact: { icon: LucideIcon; label: string; value: string }[] = [];
  if (info.contactName) contact.push({ icon: User, label: "Ask for", value: info.contactName });
  if (info.phone) contact.push({ icon: Phone, label: "Phone", value: info.phone });
  if (info.email) contact.push({ icon: Mail, label: "Email", value: info.email });
  contact.push({ icon: Globe, label: "Web", value: info.web });

  return (
    <Half side="left" className="text-paper">
      {/* the film crew at work, fading into the field */}
      <div aria-hidden className="absolute right-0 top-0 h-[72mm] w-[122mm] overflow-hidden">
        <Image src="/images/studio/media-crew.webp" alt="" fill sizes="2000px" quality={90} loading="eager" className="object-cover object-left opacity-75" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#2b2b2b_0%,rgb(43_43_43/0)_36%,rgb(43_43_43/0)_80%,rgb(43_43_43/0.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[24mm] bg-[linear-gradient(180deg,rgb(43_43_43/0)_0%,#2b2b2b_100%)]" />
      </div>

      <div style={at(M, M + 1, 92)}>
        <Eyebrow>Free with every {dayPkg.name}</Eyebrow>
        <h2 className="mt-[4mm] text-[21pt] font-bold leading-[1.05] tracking-[-0.03em]">Every {dayPkg.name} is filmed by our own studio.</h2>
        <p className="mt-[3.5mm] text-[9.5pt] leading-[1.45] text-paper/90">
          {site.studio.name}, our in-house studio, films the day and hands your school the edited media. It is included with every {dayPkg.name} at no extra charge.
        </p>
        <div className="mt-[4mm] flex items-center gap-[3.5mm]">
          <p className="flex shrink-0 items-baseline gap-[2mm] bg-paper px-[3mm] pb-[1.9mm] pt-[2.3mm] text-graphite">
            <span className="text-[8.5pt] leading-none">about</span>
            <span className="font-mono text-[19pt] font-medium leading-none tracking-[-0.03em] text-ink tabular-nums">
              <Inr value={mediaPack.marketValue} />
            </span>
          </p>
          <p className="text-[8.5pt] leading-[1.3] text-paper/85">
            <strong className="block font-semibold text-paper">typical market value</strong>
            Your school pays nothing extra.
          </p>
        </div>
      </div>

      {/* what is in the Media Pack */}
      <div style={at(M, 76, W)}>
        <Label className="border-b border-paper/40 pb-[1.4mm] text-paper/70">{mediaPack.name} · what your school receives</Label>
        <ul className="grid grid-cols-3 gap-x-[5mm]">
          {mediaPack.items.map((item, i) => (
            <li key={item.title} className={cn("flex h-[10.6mm] gap-[2mm] pt-[2.1mm]", i >= 3 && "border-t border-paper/20")}>
              <span className="font-mono text-[6.8pt] font-medium leading-[1.7] text-paper/80">{pad2(i + 1)}</span>
              <span>
                <span className="block text-[9pt] font-semibold leading-[1.2] tracking-[-0.005em]">{item.title}</span>
                <Label className="mt-[0.8mm] text-[7pt] tracking-[0.05em] text-paper/70">{item.delivery}</Label>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[8pt] leading-[1.38] text-paper/75" style={at(M, 106, W)}>
        Drone shots are subject to local drone rules and school permission. Consent forms go to parents first: <strong className="font-semibold text-paper">no consent, no camera</strong>. {mediaPack.rights}
      </p>

      <PriceList />

      {/* booking */}
      <div style={at(M, 213, W)}>
        <Label className="border-b border-paper/40 pb-[1.4mm] text-paper/70">How to book</Label>
        <ol className="mt-[2.6mm] grid grid-cols-3 gap-x-[5mm]">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-[2.6mm]">
              <span className="font-mono text-[15pt] font-medium leading-[0.92] text-paper/55">{i + 1}</span>
              <span>
                <span className="block text-[9pt] font-semibold leading-tight">{s.title}</span>
                <span className="mt-[0.8mm] block text-balance text-[8pt] leading-[1.34] text-paper/80">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* contact */}
      <div className="flex items-stretch border border-paper/45" style={at(M, 240, W, 33)}>
        <Corners />
        <div className="flex w-[54mm] shrink-0 flex-col justify-center px-[4mm]">
          <p className="text-[14pt] font-bold leading-none tracking-[-0.02em]">Talk to us</p>
          <p className="mt-[2mm] text-[8pt] leading-[1.34] text-paper/80">Tell us how many students you have in each grade group. We reply with a written quote.</p>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-[1.9mm] border-l border-paper/30 px-[4mm]">
          {contact.map((c) => (
            <li key={c.label} className="flex items-center gap-[2.2mm]">
              <c.icon aria-hidden strokeWidth={1.5} className="size-[3.4mm] shrink-0 text-paper/70" />
              <Label className="w-[12mm] shrink-0 text-[6.5pt] tracking-[0.12em] text-paper/80">{c.label}</Label>
              <span className={cn(contact.some((x) => x.value.length > 24) ? "text-[8pt]" : contact.length === 1 ? "text-[12pt]" : "text-[9.5pt]", "min-w-0 break-words font-medium leading-tight")}>{c.value}</span>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-[3mm] pr-[3mm]">
          <p className="w-[22mm] text-right text-[7.5pt] font-medium leading-[1.3] text-paper/85">Build an itemised quote for your school online</p>
          <span className="block bg-paper p-[3mm]">
            <Qr src={qrSrc} mm={21} label="QR code: packages and pricing on the JOVE website" />
          </span>
        </div>
      </div>

      <Footer left="Images are illustrative." right={info.legalName} />
    </Half>
  );
}

/* ───────────────────────────── inside, left: JOVE Day ───────────────────────────── */

const includeIcon = (text: string): LucideIcon => {
  const t = text.toLowerCase();
  if (/media|reel|film|photo/.test(t)) return Clapperboard;
  if (/certificate/.test(t)) return Award;
  if (/kit|tool/.test(t)) return Wrench;
  if (/report/.test(t)) return FileText;
  if (/show|drone/.test(t)) return Drone;
  if (/session|grade/.test(t)) return Users;
  return Check;
};

function InsideDay() {
  const cols = "grid-cols-[31mm_1fr_25mm_42mm]";
  const rules = [
    { figure: formatNumber(joveDayRules.minimumStudents), head: "students minimum", note: `for one ${dayPkg.name}` },
    { figure: formatINR(joveDayRules.minimumBilling), head: "minimum billing", note: "before GST" },
    { figure: formatNumber(joveDayRules.maxStudentsPerDay), head: "students in one day", note: "above that, we plan a second day" },
  ];
  return (
    <Half side="left" className="text-paper">
      <div style={at(M, M + 1, W)}>
        <Eyebrow n="01">
          {dayPkg.name} · {dayPkg.cadence}
        </Eyebrow>
        <h2 className="mt-[4.5mm] max-w-[150mm] text-[25pt] font-bold leading-[1.04] tracking-[-0.03em]">One full day on your campus. One price per student.</h2>
        <p className="mt-[3.5mm] max-w-[158mm] text-[9.5pt] leading-[1.45] text-paper/85">
          Each grade group gets its own hands-on session, built for that age. You pay for the students who take part. Prices are per student and exclude GST.
        </p>
      </div>

      <div style={at(M, 55.2, W)}>
        <Dimension>{`${gradeSpan} · ${gradeBands.length} sessions in one day`}</Dimension>
      </div>

      {/* price table */}
      <div className="bg-paper text-graphite" style={at(M, 62, W, 82)}>
        <Corners />
        <div className={cn("grid h-[8mm] items-center border-b border-graphite px-[5mm] text-charcoal", cols)}>
          <Label>Grades</Label>
          <Label>Session · what students build</Label>
          <Label>Length</Label>
          <Label className="text-right">Price per student</Label>
        </div>
        {gradeBands.map((b, i) => {
          const kit = kits.find((k) => k.id === b.kitId);
          return (
            <div key={b.id} className={cn("grid h-[18.5mm] items-center px-[5mm]", cols, i > 0 && "border-t border-graphite/20")}>
              <p className="text-[11pt] font-bold leading-none tracking-[-0.015em]">{b.grades}</p>
              <div className="pr-[4mm]">
                <p className="text-[11pt] font-semibold leading-none tracking-[-0.015em]">{b.name}</p>
                {kit && <p className="mt-[1.5mm] text-[8pt] leading-[1.28] text-charcoal">{kit.project}</p>}
              </div>
              <p className="font-mono text-[9pt] leading-none text-charcoal">{hoursMinutes(b.durationMin)}</p>
              <p className="text-right font-mono text-[25pt] font-medium leading-none tracking-[-0.03em] text-ink tabular-nums">
                <Inr value={b.pricePerStudent} />
              </p>
            </div>
          );
        })}
      </div>

      {/* what the price includes */}
      <div style={at(M, 149, W)}>
        <Label className="border-b border-paper/40 pb-[1.4mm] text-paper/70">Included in the price · workshop kits stay with JOVE</Label>
        <ul className="mt-[3mm] grid grid-cols-3 gap-x-[5mm] gap-y-[2.5mm]">
          {dayPkg.includes.map((text) => {
            const Icon = includeIcon(text);
            return (
              <li key={text} className="flex h-[12mm] items-start gap-[2.6mm]">
                <span className="grid size-[8.5mm] shrink-0 place-items-center border border-paper/45">
                  <Icon aria-hidden strokeWidth={1.5} className="size-[4.4mm]" />
                </span>
                <span className="text-[8.5pt] leading-[1.3] text-paper/90">
                  <Tx>{text}</Tx>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* booking rules */}
      <div className="grid grid-cols-3 border-y border-paper/40" style={at(M, 187, W, 23)}>
        {rules.map((r, i) => (
          <div key={r.head} className={cn("flex flex-col justify-center", i > 0 && "border-l border-paper/25 pl-[5mm]")}>
            <p className="font-mono text-[20pt] font-medium leading-none tracking-[-0.03em] tabular-nums">
              <Tx>{r.figure}</Tx>
            </p>
            <p className="mt-[1.8mm] text-[8.5pt] font-semibold leading-[1.28]">
              {r.head}
              <span className="block font-normal text-paper/75">{r.note}</span>
            </p>
          </div>
        ))}
      </div>

      {/* worked example */}
      <div className="flex bg-paper text-graphite" style={at(M, 214, W, 59)}>
        <Corners />
        <div className="min-w-0 flex-1 px-[5mm] pt-[3.6mm]">
          <div className="flex items-baseline justify-between border-b border-graphite pb-[1.6mm]">
            <Label className="text-graphite">Worked example</Label>
            <Label className="text-charcoal">An illustration, not a quote</Label>
          </div>
          <p className="mt-[2.6mm] text-[9pt] font-semibold leading-tight">
            {formatNumber(exPerBand)} students in each grade group: {formatNumber(exStudents)} students, {exDays === 1 ? `one ${dayPkg.name}` : `${exDays} days`}.
          </p>
          <div className="mt-[2.4mm]">
            {exRows.map((r) => (
              <div key={r.band.id} className="grid h-[6.1mm] grid-cols-[30mm_1fr_30mm] items-center border-t border-graphite/20 text-[8.5pt]">
                <span>{r.band.grades}</span>
                <span className="font-mono text-[8.5pt] text-charcoal tabular-nums">
                  {formatNumber(exPerBand)} × <Inr value={r.band.pricePerStudent} />
                </span>
                <span className="text-right font-mono text-[9.5pt] font-medium text-ink tabular-nums">
                  <Inr value={r.amount} />
                </span>
              </div>
            ))}
            <div className="grid h-[7.8mm] grid-cols-[1fr_30mm] items-center border-t border-graphite text-[9pt] font-semibold">
              <span>
                {formatNumber(exStudents)} students{exBill > exSum ? " · minimum billing applies" : ""}
              </span>
              <span className="text-right font-mono text-[10.5pt] font-medium text-ink tabular-nums">
                <Inr value={exBill} />
              </span>
            </div>
          </div>
          <p className="mt-[0.6mm] border-t border-graphite/20 pt-[1.6mm] text-[8pt] leading-tight text-charcoal">Your quote is worked out the same way, from your own student numbers.</p>
        </div>
        <div className="flex w-[62mm] shrink-0 flex-col justify-between bg-ink px-[5mm] py-[4mm] text-paper">
          <div>
            <Label className="text-paper/65">Example total</Label>
            <p className="mt-[2.6mm] font-mono text-[26pt] font-medium leading-none tracking-[-0.035em] tabular-nums">
              <Inr value={exBill} />
            </p>
            <p className="mt-[2mm] text-[8.5pt] font-semibold leading-tight">+ GST where applicable</p>
            <p className="mt-[2.4mm] text-balance text-[8pt] leading-[1.3] text-paper/75">
              {exBill > exSum ? "The minimum billing applies: " : "Above the minimum billing of "}
              <Inr value={joveDayRules.minimumBilling} />.
            </p>
          </div>
          <dl className="space-y-[1.3mm] border-t border-paper/30 pt-[2.4mm] text-[8pt] leading-tight text-paper/80">
            <div className="flex items-baseline justify-between gap-[2mm]">
              <dt>Average per student</dt>
              <dd className="font-mono text-[9pt] font-medium text-paper tabular-nums">
                <Inr value={exAverage} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-[2mm]">
              <dt>{joveDayRules.advancePercent}% advance to confirm</dt>
              <dd className="font-mono text-[9pt] font-medium text-paper tabular-nums">
                <Inr value={exAdvance} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <Footer left={`${dayPkg.name} · ${gradeSpan}`} right="GST is added on the invoice where applicable" />
    </Half>
  );
}

/* ───────────────────────────── inside, right: programme lengths ───────────────────────────── */

function InsideLengths() {
  const cols = "grid-cols-[35mm_50mm_50mm_50mm]";
  const hi = lengths.findIndex((l) => l.pkg.highlight);
  const dark = (i: number) => i === hi;
  const [clubPrice = "", ...clubRest] = clubPkg ? clubPkg.priceNote.split(" · ") : [];
  const club = /^(₹[\d,]+)\s+(.*)$/.exec(clubPrice);

  return (
    <Half side="right" className="text-paper">
      <div style={at(M, M + 1, W)}>
        <Eyebrow n="02">Programme lengths</Eyebrow>
        <h2 className="mt-[4.5mm] max-w-[150mm] text-[25pt] font-bold leading-[1.04] tracking-[-0.03em]">Book a day, a quarter or the whole year.</h2>
        <p className="mt-[3.5mm] max-w-[158mm] text-[9.5pt] leading-[1.45] text-paper/85">
          Start with one {dayPkg.name}, or book a programme that runs through the term or the academic year. Every price below is per student, by grade group, and excludes GST.
        </p>
      </div>

      <div className="bg-paper text-graphite" style={at(M, 62, W, 174)}>
        <Corners />
        {/* the recommended column, and its tab above the plate */}
        {hi >= 0 && (
          <>
            <div aria-hidden className="absolute inset-y-0 bg-ink" style={{ left: mm(35 + hi * 50), width: mm(50) }} />
            <div className="absolute flex h-[5mm] items-center justify-center bg-paper" style={{ left: mm(35 + hi * 50), width: mm(50), top: mm(-5) }}>
              <Label className="text-graphite">Recommended</Label>
            </div>
          </>
        )}

        <div className="relative">
          {/* names */}
          <div className={cn("grid h-[38mm]", cols)}>
            <div className="flex flex-col justify-between px-[4mm] pb-[3mm] pt-[4.6mm]">
              <Label className="text-charcoal">Programme</Label>
              <Label className="text-charcoal">Price per student</Label>
            </div>
            {lengths.map((l, i) => (
              <div key={l.id} className={cn("flex flex-col px-[4mm] pb-[3mm] pt-[4mm]", dark(i) ? "text-paper" : "border-l border-graphite/20")}>
                <p className="text-[14pt] font-bold leading-none tracking-[-0.02em]">{l.pkg.name}</p>
                <Label className={cn("mt-[2mm] text-[6.5pt] tracking-[0.04em]", dark(i) ? "text-paper/70" : "text-charcoal")}>{l.pkg.cadence}</Label>
                <p className={cn("mt-[2mm] text-[8pt] leading-[1.32]", dark(i) ? "text-paper/85" : "text-charcoal")}>{l.pkg.headline}</p>
                <Label className={cn("mt-auto text-right text-[7pt] tracking-[0.05em]", dark(i) ? "text-paper/75" : "text-charcoal")}>{l.unit}</Label>
              </div>
            ))}
          </div>

          {/* prices */}
          {gradeBands.map((b) => (
            <div key={b.id} className={cn("grid h-[14mm]", cols)}>
              <div className="flex flex-col justify-center border-t border-graphite/25 px-[4mm]">
                <p className="text-[10pt] font-bold leading-none tracking-[-0.015em]">{b.grades}</p>
                <p className="mt-[1.3mm] text-[8pt] leading-none text-charcoal">{b.name}</p>
              </div>
              {lengths.map((l, i) => (
                <div key={l.id} className={cn("flex items-center justify-end border-t px-[5mm]", dark(i) ? "border-paper/25 text-paper" : "border-l border-graphite/25 border-l-graphite/20 text-ink")}>
                  <p className="font-mono text-[19pt] font-medium leading-none tracking-[-0.03em] tabular-nums">
                    <Inr value={l.price(b)} />
                  </p>
                </div>
              ))}
            </div>
          ))}

          {/* what each one includes */}
          <div className={cn("grid h-[64mm]", cols)}>
            <div className="border-t border-graphite px-[4mm] pt-[3.4mm]">
              <Label className="text-charcoal">Includes</Label>
            </div>
            {lengths.map((l, i) => (
              <ul key={l.id} className={cn("space-y-[1.15mm] border-t px-[4mm] pt-[3mm] text-[8pt] leading-[1.3]", dark(i) ? "border-paper/50 text-paper/90" : "border-l border-graphite border-l-graphite/20")}>
                {l.pkg.includes.map((text) => (
                  <li key={text} className="flex gap-[1.6mm]">
                    <span aria-hidden className={cn("mt-[1.25mm] size-[1mm] shrink-0", dark(i) ? "bg-paper/70" : "bg-graphite/70")} />
                    <span>
                      <Tx>{nb(text)}</Tx>
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>

          {/* who it suits */}
          <div className={cn("grid h-[16mm]", cols)}>
            <div className="border-t border-graphite/25 px-[4mm] pt-[3mm]">
              <Label className="text-charcoal">Suits</Label>
            </div>
            {lengths.map((l, i) => (
              <p key={l.id} className={cn("border-t px-[4mm] pt-[2.6mm] text-[8pt] leading-[1.3]", dark(i) ? "border-paper/25 text-paper/90" : "border-l border-graphite/25 border-l-graphite/20 text-charcoal")}>
                {l.pkg.idealFor}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* JOVE Club */}
      {clubPkg && (
        <div className="flex border border-paper/45" style={at(M, 240, W, 33)}>
          <Corners />
          <div className="flex w-[58mm] shrink-0 flex-col justify-center px-[4mm]">
            <Label className="text-paper/65">{clubPkg.cadence}</Label>
            <p className="mt-[1.8mm] text-[14pt] font-bold leading-none tracking-[-0.02em]">{clubPkg.name}</p>
            <p className="mt-[2mm] text-[8.5pt] leading-[1.32] text-paper/85">{clubPkg.headline}</p>
          </div>
          <div className="flex w-[50mm] shrink-0 flex-col justify-center border-l border-paper/30 px-[4mm]">
            {club ? (
              <>
                <p className="font-mono text-[22pt] font-medium leading-none tracking-[-0.03em] tabular-nums">
                  <Tx>{club[1]}</Tx>
                </p>
                <p className="mt-[1.8mm] text-[8.5pt] font-semibold leading-tight">{club[2]}</p>
                {clubRest.length > 0 && <p className="mt-[0.8mm] text-[8pt] leading-tight text-paper/75">{clubRest.join(" · ")}</p>}
              </>
            ) : (
              <p className="text-[9.5pt] font-semibold leading-snug">
                <Tx>{clubPkg.priceNote}</Tx>
              </p>
            )}
          </div>
          <ul className="flex min-w-0 flex-1 flex-col justify-center gap-[1.2mm] border-l border-paper/30 px-[4mm] text-[8pt] leading-[1.3] text-paper/90">
            {clubPkg.includes.map((text) => (
              <li key={text} className="flex gap-[1.6mm]">
                <span aria-hidden className="mt-[1.25mm] size-[1mm] shrink-0 bg-paper/70" />
                <span>
                  <Tx>{text}</Tx>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Footer left={`Programmes · ${gradeSpan}`} right="GST is added on the invoice where applicable" />
    </Half>
  );
}

/* ───────────────────────────── the brochure ───────────────────────────── */

export function PricingBrochure({ q }: { q: Q }) {
  const info = useBrochureInfo(q);
  const qrSrc = useQr(info.link("/packages"), "#2b2b2b", "#f5f1e8");
  const valid = (q.valid ?? "").trim();

  return (
    <BrochureShell
      title="Brochure: Packages and pricing"
      q={q}
      ready={info.ready && !!qrSrc}
      outside={
        <Spread className="bg-graphite text-paper">
          <Field />
          <BackCover info={info} qrSrc={qrSrc} />
          <FrontCover info={info} valid={valid} />
        </Spread>
      }
      inside={
        <Spread className="bg-graphite text-paper">
          <Field />
          <InsideDay />
          <InsideLengths />
        </Spread>
      }
    />
  );
}
