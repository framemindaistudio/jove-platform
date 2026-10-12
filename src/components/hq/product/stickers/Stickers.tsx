"use client";

/**
 * The four stickers that dress a plain brown kit box: lid label, grade badge, seal and back label.
 * White ground, graphite line work, one family. Everything is sized in millimetres and points so it prints as it previews.
 *
 * Every fact on a sticker is read from the catalogue (src/lib/content/business.ts) or from HQ → Settings; nothing is typed here.
 */
import Image from "next/image";
import { Qr, RupeeSign } from "@/components/hq/printables/brochures/BrochureBits";
import { Mark, Wordmark } from "@/components/hq/printables/PrintBits";
import type { Kit } from "@/lib/content/business";
import { site } from "@/lib/site";
import { cn, formatINR } from "@/lib/utils";
import { BACK_MM, BADGE_MM, SEAL_MM } from "./layout";

const INK = "#2b2b2b";
const mm = (v: number) => `${Math.round(v * 100) / 100}mm`;
const pt = (v: number) => `${Math.round(v * 10) / 10}pt`;
/** points in one millimetre */
const MM_PT = 72 / 25.4;
/** CSS pixels in one millimetre: the round stickers are drawn in pixels so their type sizes are real CSS sizes */
const PX = 96 / 25.4;
/** The largest type, in points, at which `chars` letters of the heavy face fit `avail` mm. */
const fitPt = (avail: number, chars: number, cap: number, perChar = 0.56) => Math.min(cap, (avail / (Math.max(1, chars) * perChar)) * MM_PT);

/** Turns the pencil drawings' own cream paper to white, so only the pencil lines print on the white sticker. */
const PENCIL = "grayscale(1) brightness(1.17) contrast(1.22)";

/* ───────────────────────────── what the data says about a kit ───────────────────────────── */

/** "JOVE Spark Kit" → the name without the brand ("Spark Kit"), split into the word that changes and the word "Kit". */
export function kitWords(kit: Pick<Kit, "name">) {
  const full = kit.name.replace(/^JOVE\s+/i, "");
  const head = full.replace(/\s+Kit$/i, "");
  return { full, head, tail: full.slice(head.length).trim() };
}

/** "Grades 1–2 · Ages 6–8" → its two halves. */
export function kitBand(kit: Pick<Kit, "grades">) {
  const [grades = kit.grades, ages = ""] = kit.grades.split("·").map((s) => s.trim());
  const [word = "", ...rest] = grades.split(/\s+/);
  return { grades, ages, word, range: rest.join(" ") };
}

/** True when the kit's own description or highlights say it needs no soldering. */
export const saysNoSoldering = (kit: Pick<Kit, "description" | "highlights">) => /\b(?:no|zero)\s+soldering\b|\bsolder-free\b/i.test([kit.description, ...kit.highlights].join(" "));

/** The MRP as the catalogue has it, with a drawn rupee sign (neither web font has the glyph). */
function Mrp({ value }: { value: number }) {
  return (
    <>
      <RupeeSign />
      {formatINR(value).replace(/^[^\d]+/, "")}
    </>
  );
}

/* ───────────────────────────── shared furniture ───────────────────────────── */

/** The thin dashed line to cut along. Its outer edge is the edge of the sticker. */
function CutLine({ w, h, round }: { w: number; h: number; round?: boolean }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${w} ${h}`} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={0.2} strokeDasharray="1.8 1.3">
      {round ? <circle cx={w / 2} cy={h / 2} r={w / 2 - 0.1} /> : <rect x={0.1} y={0.1} width={w - 0.2} height={h - 0.2} />}
    </svg>
  );
}

/** Drawing paper: a 5 mm grid with a heavier line every 25 mm, drawn as real lines (CSS gradient grids vanish in a PDF). */
function Grid({ w, h }: { w: number; h: number }) {
  let minor = "";
  let major = "";
  for (let i = 1; i * 5 < w; i++) {
    const d = `M${i * 5} 0V${h}`;
    if (i % 5 === 0) major += d;
    else minor += d;
  }
  for (let i = 1; i * 5 < h; i++) {
    const d = `M0 ${i * 5}H${w}`;
    if (i % 5 === 0) major += d;
    else minor += d;
  }
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" fill="none" stroke={INK}>
      <path d={minor} strokeWidth={0.12} strokeOpacity={0.085} />
      <path d={major} strokeWidth={0.15} strokeOpacity={0.17} />
    </svg>
  );
}

/** Corner marks, as on a drawing frame. */
function Corners({ arm = 3.4, weight = 0.3 }: { arm?: number; weight?: number }) {
  const s = { width: mm(arm), height: mm(arm), borderColor: INK, borderStyle: "solid" as const };
  const b = mm(weight);
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-0 top-0" style={{ ...s, borderWidth: `${b} 0 0 ${b}` }} />
      <span className="absolute right-0 top-0" style={{ ...s, borderWidth: `${b} ${b} 0 0` }} />
      <span className="absolute bottom-0 left-0" style={{ ...s, borderWidth: `0 0 ${b} ${b}` }} />
      <span className="absolute bottom-0 right-0" style={{ ...s, borderWidth: `0 ${b} ${b} 0` }} />
    </span>
  );
}

/* ───────────────────────────── 1 · lid label ───────────────────────────── */

/** The pencil drawing of the kit's project, shown whole, with its frame marks and an honest caption. */
function Drawing({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("relative min-h-0 min-w-0 flex-1", className)} style={style}>
      <Image src={src} alt="" aria-hidden fill sizes="1200px" quality={90} loading="eager" className="object-contain mix-blend-multiply" style={{ filter: PENCIL }} />
      <Corners />
      <p className="absolute bottom-0 right-0 bg-white font-mono text-[6pt] font-medium uppercase leading-none tracking-[0.16em] text-charcoal" style={{ padding: "0.7mm 1mm 0.5mm 1.2mm" }}>
        Illustration only
      </p>
    </div>
  );
}

/** The brand line, stacked the way it is on the JOVE logo sheet. */
function Pillars({ size }: { size: number }) {
  return (
    <div className="flex text-charcoal" style={{ gap: mm(1.6) }}>
      <span aria-hidden className="relative shrink-0 bg-graphite/70" style={{ width: "0.22mm" }}>
        <span className="absolute left-[-0.7mm] top-0 bg-graphite/70" style={{ width: "1.6mm", height: "0.22mm" }} />
        <span className="absolute bottom-0 left-[-0.7mm] bg-graphite/70" style={{ width: "1.6mm", height: "0.22mm" }} />
      </span>
      <ul className="grid font-mono font-medium uppercase leading-none tracking-[0.16em]" style={{ fontSize: pt(size), gap: mm(size * 0.42), padding: `${mm(0.9)} 0` }}>
        {site.tagline.split("·").map((word) => (
          <li key={word}>{word.trim()}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * LID LABEL — the brand face of the box. `w` × `h` is the cut size, taken from the kit's own box.
 * A label that is close to square stacks the drawing above the name; a wide one puts them side by side.
 */
export function LidLabel({ kit, image, w, h }: { kit: Kit; image?: string; w: number; h: number }) {
  const rim = 2.5; // white left between the cut line and the printed frame, so a wobbly cut never bites into the design
  const W = w - 2 * rim;
  const H = h - 2 * rim;
  const stack = w / h < 1.3;
  const { full, head, tail } = kitWords(kit);
  const { grades, ages } = kitBand(kit);
  const pad = stack ? W * 0.042 : W * 0.04;
  const bandH = stack ? H * 0.15 : H * 0.17;
  const side = W * 0.44; // text column of a wide label

  return (
    <div className="relative overflow-hidden bg-white text-graphite" style={{ width: mm(w), height: mm(h) }}>
      <div className="absolute flex flex-col overflow-hidden border-solid border-graphite" style={{ inset: mm(rim), borderWidth: "0.5mm" }}>
        <Grid w={W} h={H} />

        {stack ? (
          <>
            <div className="relative flex min-h-0 flex-1" style={{ padding: `${mm(pad)} ${mm(pad)} 0`, gap: mm(pad * 0.8) }}>
              <div className="flex shrink-0 flex-col justify-between" style={{ width: mm(W * 0.25), paddingBottom: mm(1) }}>
                <Wordmark mm={W * 0.25} />
                <Pillars size={Math.max(6, W * 0.047)} />
              </div>
              {image && <Drawing src={image} />}
            </div>
            <div className="relative" style={{ padding: `${mm(pad * 0.55)} ${mm(pad)} ${mm(pad * 0.75)}` }}>
              <p className="whitespace-nowrap font-extrabold leading-[0.98] tracking-[-0.035em]" style={{ fontSize: pt(fitPt(W - 2 * pad, full.length, W * 0.42)) }}>
                {head} <span className="font-light">{tail}</span>
              </p>
              <p className="font-semibold leading-[1.15] tracking-[-0.005em]" style={{ fontSize: pt(Math.max(9, W * 0.078)), marginTop: mm(1.2) }}>
                {kit.project}
              </p>
            </div>
          </>
        ) : (
          <div className="relative flex min-h-0 flex-1">
            <div className="flex shrink-0 flex-col justify-between" style={{ width: mm(side), padding: `${mm(pad)} 0 ${mm(pad * 0.85)} ${mm(pad)}` }}>
              <Wordmark mm={side * 0.46} />
              <div>
                <p className="whitespace-nowrap font-extrabold leading-[0.9] tracking-[-0.035em]" style={{ fontSize: pt(fitPt(side - pad - 1, head.length, W * 0.3)) }}>
                  {head}
                  <br />
                  <span className="font-light">{tail}</span>
                </p>
                <p className="font-semibold leading-[1.15] tracking-[-0.005em]" style={{ fontSize: pt(Math.max(8.5, W * 0.064)), marginTop: mm(1.8) }}>
                  {kit.project}
                </p>
              </div>
            </div>
            {image && <Drawing src={image} style={{ margin: `${mm(pad)} ${mm(pad)} ${mm(pad * 0.85)} ${mm(pad * 0.6)}` }} />}
          </div>
        )}

        {/* the grade band: who the kit is for, readable from across a shop */}
        <div className="relative flex shrink-0 items-center bg-graphite text-white" style={{ height: mm(bandH), padding: `0 ${mm(pad)}`, gap: mm(bandH * 0.24) }}>
          <span className="whitespace-nowrap font-extrabold uppercase leading-none tracking-[0.01em]" style={{ fontSize: pt(bandH * 0.47 * MM_PT) }}>
            {grades}
          </span>
          <span aria-hidden className="shrink-0 bg-white/55" style={{ width: "0.3mm", height: mm(bandH * 0.5) }} />
          <span className="whitespace-nowrap font-mono font-medium uppercase leading-none tracking-[0.1em]" style={{ fontSize: pt(bandH * 0.25 * MM_PT) }}>
            {ages}
          </span>
          <span className="ml-auto whitespace-nowrap font-mono uppercase leading-none tracking-[0.14em] text-white/80" style={{ fontSize: pt(Math.max(6.2, bandH * 0.125 * MM_PT)) }}>
            {kit.sku}
          </span>
        </div>
      </div>
      <CutLine w={w} h={h} />
    </div>
  );
}

/* ───────────────────────────── 2 · grade badge ───────────────────────────── */

/** GRADE BADGE — a round sticker that says who the kit is for at a glance. */
export function GradeBadge({ kit }: { kit: Kit }) {
  const d = BADGE_MM;
  const c = (d / 2) * PX;
  const { word, range, ages } = kitBand(kit);
  const arc = 17.1 * PX;
  const id = `badge-arc-${kit.id}`;
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180;
    const long = i % 6 === 0;
    const r1 = (long ? 19.5 : 20.1) * PX;
    const r2 = 20.9 * PX;
    const p = (r: number) => `${(c + r * Math.sin(a)).toFixed(2)} ${(c - r * Math.cos(a)).toFixed(2)}`;
    return `M${p(r1)}L${p(r2)}`;
  }).join("");

  return (
    <div className="relative bg-white" style={{ width: mm(d), height: mm(d) }}>
      <svg aria-hidden className="absolute inset-0 size-full" viewBox={`0 0 ${d * PX} ${d * PX}`} fill="none">
        <circle cx={c} cy={c} r={22.6 * PX} fill={INK} />
        <circle cx={c} cy={c} r={21.5 * PX} stroke="#fff" strokeWidth={0.3 * PX} />
        <path d={ticks} stroke="#fff" strokeOpacity={0.7} strokeWidth={0.18 * PX} />
      </svg>
      <svg className="absolute inset-0 size-full" viewBox={`0 0 ${d * PX} ${d * PX}`} role="img" aria-label={kit.name}>
        <defs>
          <path id={id} d={`M${c - arc} ${c}A${arc} ${arc} 0 0 1 ${c + arc} ${c}`} />
        </defs>
        <text fill="#fff" fontSize="6.6pt" fontWeight={700} letterSpacing="0.24em" textAnchor="middle" style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase" }}>
          <textPath href={`#${id}`} startOffset="50%">
            {kit.name}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white" style={{ paddingTop: mm(5.4) }}>
        <span className="font-mono text-[8pt] font-medium uppercase leading-none tracking-[0.34em]" style={{ marginRight: "-0.34em" }}>
          {word}
        </span>
        <span className="whitespace-nowrap font-extrabold leading-none tracking-[-0.04em]" style={{ fontSize: pt(range.length > 3 ? 37 : 44), marginTop: mm(0.6) }}>
          {range}
        </span>
        <span className="font-mono text-[8.4pt] font-medium uppercase leading-none tracking-[0.14em]" style={{ marginTop: mm(1.5) }}>
          {ages}
        </span>
      </div>
      <CutLine w={d} h={d} round />
    </div>
  );
}

/* ───────────────────────────── 3 · seal ───────────────────────────── */

/** SEAL — closes the lid flap. Stick it half on the lid and half on the front, across the edge. */
export function Seal() {
  const d = SEAL_MM;
  const c = (d / 2) * PX;
  const top = 12.2 * PX; // baseline of the words over the top: letters stand outwards
  const bottom = 14.5 * PX; // baseline of the line under the mark: letters stand inwards
  return (
    <div className="relative bg-white text-graphite" style={{ width: mm(d), height: mm(d) }}>
      <svg aria-hidden className="absolute inset-0 size-full" viewBox={`0 0 ${d * PX} ${d * PX}`} fill="none" stroke={INK}>
        <circle cx={c} cy={c} r={16.35 * PX} strokeWidth={0.7 * PX} />
        <circle cx={c} cy={c} r={10.6 * PX} strokeWidth={0.2 * PX} strokeDasharray={`${0.9 * PX} ${0.9 * PX}`} strokeOpacity={0.7} />
        {/* where the edge of the lid goes */}
        <path d={`M${c - 16 * PX} ${c}h${-1.6 * PX}M${c + 16 * PX} ${c}h${1.6 * PX}`} strokeWidth={0.3 * PX} />
        <circle cx={c - 13.4 * PX} cy={c} r={0.45 * PX} fill={INK} stroke="none" />
        <circle cx={c + 13.4 * PX} cy={c} r={0.45 * PX} fill={INK} stroke="none" />
      </svg>
      <Mark mm={11.2} className="absolute left-1/2 top-1/2" style={{ transform: "translate(-52%, -54%)" }} />
      <svg className="absolute inset-0 size-full" viewBox={`0 0 ${d * PX} ${d * PX}`} role="img" aria-label="Sealed at JOVE. Broken seal? Tell us first.">
        <defs>
          <path id="seal-top" d={`M${c - top} ${c}A${top} ${top} 0 0 1 ${c + top} ${c}`} />
          <path id="seal-bottom" d={`M${c - bottom} ${c}A${bottom} ${bottom} 0 0 0 ${c + bottom} ${c}`} />
        </defs>
        <text fill={INK} fontSize="7.4pt" fontWeight={800} letterSpacing="0.16em" textAnchor="middle" style={{ fontFamily: "var(--font-sans)" }}>
          <textPath href="#seal-top" startOffset="50%">
            SEALED AT JOVE
          </textPath>
        </text>
        <text fill={INK} fontSize="6pt" fontWeight={600} letterSpacing="0.06em" textAnchor="middle" style={{ fontFamily: "var(--font-sans)" }}>
          <textPath href="#seal-bottom" startOffset="50%">
            Broken seal? Tell us first.
          </textPath>
        </text>
      </svg>
      <CutLine w={d} h={d} round />
    </div>
  );
}

/* ───────────────────────────── 4 · back label ───────────────────────────── */

export interface BackFacts {
  /** "October 2026" ("" until the browser knows today's date) */
  packed: string;
  /** batch number as typed; "" prints a line to write on */
  batch: string;
  /** country of origin as typed; "" prints nothing */
  origin: string;
  /** who packs and markets the kit: the legal name, with the address when HQ → Settings has one */
  packer: string;
  /** customer care contacts that exist: phone, email */
  care: string[];
  /** QR code of the kit's page on the public shop (a data URL, "" until it is drawn) */
  qr: string;
  /** the same address in words, without "https://" */
  url: string;
  /** true for the kits of the two youngest grade bands */
  withAdult: boolean;
}

function Fact({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={className}>
      <span className="font-bold">{label}</span> {children}
    </p>
  );
}

/** BACK LABEL — what is inside and the declarations a packaged product carries. One size for every kit. */
export function BackLabel({ kit, facts }: { kit: Kit; facts: BackFacts }) {
  const { w, h } = BACK_MM;
  const rim = 2;
  const { grades, ages } = kitBand(kit);
  const safety = ["Small parts. Not for children under 3 years.", facts.withAdult && "Use with an adult.", saysNoSoldering(kit) && "No soldering needed."].filter(Boolean).join(" ");

  return (
    <div className="relative overflow-hidden bg-white text-graphite" style={{ width: mm(w), height: mm(h) }}>
      <div className="absolute flex flex-col overflow-hidden border-solid border-graphite" style={{ inset: mm(rim), borderWidth: "0.4mm" }}>
        {/* what it is */}
        <header className="flex shrink-0 items-center border-solid border-graphite" style={{ gap: mm(3), padding: `${mm(1.6)} ${mm(3.2)}`, borderBottomWidth: "0.4mm" }}>
          <Wordmark mm={21} className="shrink-0" />
          <span aria-hidden className="shrink-0 self-stretch bg-graphite/40" style={{ width: "0.2mm" }} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5pt] font-extrabold leading-none tracking-[-0.02em]">{kit.name}</p>
            <p className="mt-[1mm] text-[7pt] font-semibold leading-[1.15]">{kit.project}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.12em]">{kit.sku}</p>
            <p className="mt-[1.3mm] text-[8pt] font-extrabold uppercase leading-none tracking-[0.02em]">{grades}</p>
            <p className="mt-[0.9mm] text-[7pt] font-semibold leading-none">{ages}</p>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 text-[6.8pt] leading-[1.27]">
          {/* what is inside, and how to use it safely */}
          <div className="flex min-w-0 flex-1 flex-col" style={{ padding: `${mm(2.2)} ${mm(3)} ${mm(2.4)} ${mm(3.2)}` }}>
            <p>
              <span className="font-bold">Net quantity:</span> 1 kit. <span className="font-bold">In the box:</span>
            </p>
            <ul className="mt-[0.7mm]">
              {kit.inTheBox.map((item) => (
                <li key={item} className="flex" style={{ gap: mm(1.4) }}>
                  <span aria-hidden className="shrink-0 bg-graphite" style={{ width: mm(1), height: mm(1), marginTop: mm(0.95) }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-solid border-graphite" style={{ borderTopWidth: "0.25mm", paddingTop: mm(1.4) }}>
              <Fact label="Warning:">{safety}</Fact>
              {kit.aaCells !== null && <Fact label="Batteries:">Do not short-circuit, recharge or mix old and new cells. Remove cells after use.</Fact>}
            </div>
          </div>

          {/* the declarations */}
          <div className="flex shrink-0 flex-col border-solid border-graphite/45" style={{ width: mm(59), borderLeftWidth: "0.2mm", padding: `${mm(2.2)} ${mm(3.2)} ${mm(2.4)} ${mm(3)}` }}>
            <p className="leading-none">
              <span className="whitespace-nowrap font-mono text-[14pt] font-medium leading-none tracking-[-0.04em]">
                <span className="font-sans text-[8pt] font-extrabold tracking-[0.04em]">MRP </span>
                <Mrp value={kit.mrp} />
              </span>{" "}
              <span className="whitespace-nowrap text-[6.8pt]">(inclusive of all taxes)</span>
            </p>
            <div className="mt-[1.6mm] border-solid border-graphite/45" style={{ borderTopWidth: "0.2mm", paddingTop: mm(1.4) }}>
              <Fact label="Packed:">{facts.packed}</Fact>
              {facts.batch ? (
                <Fact label="Batch:" className="break-all">
                  {facts.batch}
                </Fact>
              ) : (
                <p className="flex items-end" style={{ gap: mm(1) }}>
                  <span className="font-bold">Batch:</span>
                  <span aria-hidden className="mb-[0.5mm] flex-1 border-b border-dotted border-graphite" style={{ borderBottomWidth: "0.25mm" }} />
                </p>
              )}
              {facts.origin && <Fact label="Country of origin:">{facts.origin}</Fact>}
              <Fact label="Packed and marketed by:" className="mt-[1.1mm]">
                {facts.packer}
              </Fact>
              {facts.care.length > 0 && (
                <Fact label="Customer care:" className="mt-[1.1mm] break-words">
                  {facts.care.join(" · ")}
                </Fact>
              )}
            </div>
            <div className="mt-auto flex items-end" style={{ gap: mm(2.2), paddingTop: mm(1.2) }}>
              <Qr src={facts.qr} mm={15.5} label={`QR code that opens ${facts.url}`} />
              <p className="min-w-0 flex-1">
                <span className="font-bold">Scan for the kit page</span>
                <br />
                <span className="break-all font-mono text-[6.5pt] leading-[1.2] tracking-[-0.02em]">{facts.url}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <CutLine w={w} h={h} />
    </div>
  );
}
