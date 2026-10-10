"use client";

/**
 * A3 school brochure — "Your school, on film": the free Media Pack every school gets from JOVE's in-house studio.
 *
 * Theme "Cinema": picture-led and editorial. A letterboxed cover, a film strip of the six deliverables across the
 * inside spread, timecode and slate labels in mono. Dark covers; the long text sits on warm paper so it prints cleanly.
 *
 * Geometry: every size is in mm / pt. Sheet = 420 × 296.6 mm, fold at x = 210. Text stays 14 mm clear of the sheet
 * edges and 12 mm clear of the fold; only bands, rules and pictures cross the fold.
 *
 * Honesty: every price, count, duration, minimum and delivery time is read from business.ts / site.ts by import.
 * The only hand-typed figures are picture formats used as frame labels (9:16, 16:9) and the pixel size of the pictures.
 */
import Image from "next/image";
import { Clock, Globe, Mail, Phone, UserRound } from "lucide-react";
import { addOns, gradeBands, joveDayRules, joveDaySchedule, mediaPack } from "@/lib/content/business";
import { site } from "@/lib/site";
import { cn, formatINR } from "@/lib/utils";
import { Wordmark } from "../PrintBits";
import type { Q } from "../util";
import { BrochureShell, Half, Qr, RupeeSign, Spread, useBrochureInfo, useQr, type BrochureInfo } from "./BrochureBits";

/* ───────────────────────────── data (all from business.ts / site.ts) ───────────────────────────── */

const IMG = {
  crew: "/images/studio/media-crew.webp",
  drone: "/images/studio/drone-campus.webp",
  build: "/images/studio/kids-build.webp",
  room: "/images/studio/trainer-class.webp",
} as const;
/** every studio picture is 2400 × 1340 px */
const IMG_RATIO = 2400 / 1340;

const studio = site.studio.name;
const items = mediaPack.items;
const [packName] = mediaPack.name.split(" by ");
const packValue = formatINR(mediaPack.marketValue);

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const word = (n: number) => WORDS[n] ?? String(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pad = (n: number) => String(n).padStart(2, "0");
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

/** JOVE Day price range, per student, ex-GST */
const dayPrices = gradeBands.map((b) => b.pricePerStudent);
const priceFrom = formatINR(Math.min(...dayPrices));
const priceTo = formatINR(Math.max(...dayPrices));
const gradeNumbers = gradeBands.flatMap((b) => (b.grades.match(/\d+/g) ?? []).map(Number));
const gradeSpan = `Grades ${Math.min(...gradeNumbers)}–${Math.max(...gradeNumbers)}`;

/** the two sentences of the usage-rights statement */
const rights = mediaPack.rights.split(/(?<=\.)\s+/).filter(Boolean);

/** paid extras that the studio itself delivers */
const studioAddOns = addOns.filter((a) => a.owner === studio);
const TIER_SEP = " — ";
const tierAddOns = studioAddOns.filter((a) => a.name.includes(TIER_SEP));
const projectAddOns = studioAddOns.filter((a) => !a.name.includes(TIER_SEP));
const tierFamily = tierAddOns[0]?.name.split(TIER_SEP)[0] ?? "";

/** times of day from the JOVE Day schedule, used as timecode on the pictures */
const arrival = joveDaySchedule.find((s) => s.title.startsWith("Team arrival"));
const firstSession = joveDaySchedule.find((s) => s.hall.startsWith("Hall"));
const showcase = joveDaySchedule.find((s) => s.title.startsWith("Showcase"));
const timecode = (t: string | undefined) => (t ? `TC ${t}:00:00` : "");

/**
 * Delivery timeline, built from the `delivery` field of each item.
 * "Within N working days" opens a stage; an item that travels with another one ("With the reels",
 * "In the film + raw selects") joins the stage of the item it names.
 */
const workingDays = (s: string) => {
  const m = /(\d+)\s+working day/i.exec(s);
  return m ? Number(m[1]) : null;
};
interface Stage {
  days: number;
  label: string;
  items: { title: string; note: string }[];
}
const stages: Stage[] = (() => {
  const out: Stage[] = [];
  const timed = items.flatMap((i) => {
    const days = workingDays(i.delivery);
    return days === null ? [] : [{ item: i, days }];
  });
  for (const { item, days } of timed) {
    let stage = out.find((s) => s.days === days);
    if (!stage) {
      stage = { days, label: item.delivery, items: [] };
      out.push(stage);
    }
    stage.items.push({ title: item.title, note: "" });
  }
  out.sort((a, b) => a.days - b.days);
  const keys = (title: string) =>
    title
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.replace(/s$/, ""));
  for (const item of items) {
    if (workingDays(item.delivery) !== null) continue;
    const says = item.delivery.toLowerCase();
    const anchor = timed.find((t) => keys(t.item.title).some((k) => says.includes(k)));
    const stage = out.find((s) => s.days === anchor?.days) ?? out[out.length - 1];
    stage?.items.push({ title: item.title, note: says });
  }
  return out;
})();
const ORDINALS = ["First", "Second", "Third", "Fourth"];
const lastStage = stages[stages.length - 1];

/** which drawing goes in which frame of the strip */
type Kind = "reels" | "film" | "drone" | "photos" | "interview" | "kit" | "other";
const kindOf = (title: string): Kind =>
  /reel/i.test(title) ? "reels" : /drone|aerial/i.test(title) ? "drone" : /photo/i.test(title) ? "photos" : /testimonial|interview/i.test(title) ? "interview" : /caption|posting/i.test(title) ? "kit" : /film/i.test(title) ? "film" : "other";
const FORMAT: Record<Kind, string> = { reels: "Vertical", film: "Film", drone: "Aerial", photos: "Stills", interview: "Interview", kit: "Text + plan", other: "Included" };

const mm = (n: number) => `${n}mm`;

/* ───────────────────────────── drawing primitives (mm-sized, print-safe) ───────────────────────────── */

/**
 * A monochrome picture that fills its (positioned) parent.
 * `bleed` enlarges it by that many percent on every side, to crop past the dark edge baked into the film-crew picture.
 */
function Pic({ src, pos = "50% 50%", sizes = "1400px", bleed = 0, className }: { src: string; pos?: string; sizes?: string; bleed?: number; className?: string }) {
  const img = <Image src={src} alt="" aria-hidden fill sizes={sizes} quality={90} loading="eager" className={cn("object-cover grayscale", className)} style={{ objectPosition: pos }} />;
  if (!bleed) return img;
  return (
    <div className="absolute" style={{ inset: `-${bleed}%` }}>
      {img}
    </div>
  );
}

/** A picture placed by hand: `left`, `top`, `width` in mm inside a clipping parent, so the crop is exact. */
function PlacedPic({ src, left, top, width, sizes }: { src: string; left: number; top: number; width: number; sizes?: string }) {
  return (
    <div className="absolute" style={{ left: mm(left), top: mm(top), width: mm(width), height: mm(width / IMG_RATIO) }}>
      <Pic src={src} sizes={sizes} />
    </div>
  );
}

/** A run of film perforations, `length` mm long and 5.5 mm across. Drawn as vector so it prints sharp. */
function Perfs({ length, vertical, className }: { length: number; vertical?: boolean; className?: string }) {
  const pitch = 4.75;
  const across = 5.5;
  const hole = { along: 2, across: 2.8 };
  const count = Math.floor(length / pitch);
  const start = (length - count * pitch) / 2 + (pitch - hole.along) / 2;
  const inset = (across - hole.across) / 2;
  return (
    <svg
      aria-hidden
      viewBox={vertical ? `0 0 ${across} ${length}` : `0 0 ${length} ${across}`}
      className={cn("block", className)}
      style={{ width: mm(vertical ? across : length), height: mm(vertical ? length : across) }}
      fill="currentColor"
    >
      {Array.from({ length: count }, (_, i) =>
        vertical ? <rect key={i} x={inset} y={start + i * pitch} width={hole.across} height={hole.along} rx={0.45} /> : <rect key={i} x={start + i * pitch} y={inset} width={hole.along} height={hole.across} rx={0.45} />,
      )}
    </svg>
  );
}

/** Viewfinder corner brackets around a positioned box. */
function Brackets({ arm = 5, weight = 0.3, className, style }: { arm?: number; weight?: number; className?: string; style?: React.CSSProperties }) {
  const a = mm(arm);
  const w = mm(weight);
  const base = "absolute border-solid border-current";
  return (
    <span aria-hidden className={cn("pointer-events-none absolute", className)} style={style}>
      <span className={cn(base, "left-0 top-0")} style={{ width: a, height: a, borderTopWidth: w, borderLeftWidth: w }} />
      <span className={cn(base, "right-0 top-0")} style={{ width: a, height: a, borderTopWidth: w, borderRightWidth: w }} />
      <span className={cn(base, "bottom-0 left-0")} style={{ width: a, height: a, borderBottomWidth: w, borderLeftWidth: w }} />
      <span className={cn(base, "bottom-0 right-0")} style={{ width: a, height: a, borderBottomWidth: w, borderRightWidth: w }} />
    </span>
  );
}

/** On-screen-display label, as a camera prints it over the picture: mono on an ink chip, so it reads on any image. */
function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-[1.4mm] bg-ink/80 px-[1.8mm] py-[1mm] font-mono text-[6.8pt] font-medium uppercase leading-none tracking-[0.16em] text-paper", className)}>{children}</span>;
}

/** Small mono eyebrow with a lead-in rule. */
function Kicker({ children, light, className }: { children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <p className={cn("flex items-center gap-[2.2mm] font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em]", light ? "text-paper/70" : "text-charcoal", className)}>
      <span aria-hidden className={cn("h-[0.3mm] w-[7mm] shrink-0", light ? "bg-paper/50" : "bg-graphite/50")} />
      {children}
    </p>
  );
}

const SCRIM = "22 22 22"; // ink

/** The striped top edge of a clapperboard, for the slate-style boxes. */
function ClapperStripes() {
  return <div aria-hidden className="h-[2.4mm]" style={{ background: "repeating-linear-gradient(-55deg, rgb(245 241 232 / 0.85) 0 3mm, rgb(245 241 232 / 0) 3mm 6mm)" }} />;
}

/* ───────────────────────────── outside sheet · front cover (right half) ───────────────────────────── */

function FrontCover({ school }: { school: string }) {
  return (
    <Half side="right" className="bg-ink text-paper">
      {/* the picture, letterboxed between two ink bars */}
      <div aria-hidden className="absolute left-[8mm] right-0 top-[36mm] h-[170mm] overflow-hidden">
        <Pic src={IMG.crew} sizes="1800px" className="contrast-[1.06]" />
        <div className="absolute inset-x-0 top-0 h-[9mm]" style={{ background: `linear-gradient(to bottom, rgb(${SCRIM}), rgb(${SCRIM} / 0))` }} />
        <div className="absolute inset-x-0 bottom-0 h-[46mm]" style={{ background: `linear-gradient(to top, rgb(${SCRIM}) 4%, rgb(${SCRIM} / 0.74) 46%, rgb(${SCRIM} / 0))` }} />
        <Brackets className="text-paper/85" style={{ left: "7mm", right: "7mm", top: "7mm", bottom: "48mm" }} />
      </div>

      {/* film-strip edge on the spine */}
      <div aria-hidden className="absolute inset-y-0 left-0 w-[8mm] bg-ink">
        <Perfs vertical length={296.6} className="absolute left-[1.25mm] top-0 text-paper/80" />
        <span className="absolute inset-y-0 right-0 w-[0.2mm] bg-paper/20" />
      </div>

      {/* top bar */}
      <div className="absolute left-[18mm] right-[14mm] top-[12mm] flex items-start justify-between">
        <Wordmark white mm={36} />
        <div className="pt-[1.2mm] text-right font-mono text-[7.2pt] font-medium uppercase leading-none tracking-[0.22em]">
          <p>{packName}</p>
          <p className="mt-[2mm] text-paper/65">by {studio}</p>
          <p className="mt-[2mm] text-paper/65">Free with every JOVE Day</p>
        </div>
      </div>

      {/* camera read-outs over the picture */}
      <p className="absolute left-[19mm] top-[47mm]">
        <Chip>
          <span aria-hidden className="size-[1.7mm] rounded-full bg-paper" />
          Rec · JOVE Day
        </Chip>
      </p>
      {firstSession && (
        <p className="absolute right-[18mm] top-[47mm]">
          <Chip>{timecode(firstSession.time)}</Chip>
        </p>
      )}
      <p className="absolute left-[19mm] top-[150mm]">
        <Chip>Illustration · a JOVE Day session on camera</Chip>
      </p>

      {/* title */}
      <div className="absolute left-[18mm] right-[14mm] top-[188mm]">
        <p className="font-mono text-[7.6pt] font-medium uppercase leading-none tracking-[0.24em] text-paper/80">Every JOVE Day, filmed for your school</p>
        <h1 className="mt-[4.5mm] text-[63pt] font-bold leading-[0.93] tracking-[-0.04em]">
          Your school,
          <br />
          on film.
        </h1>
        <p className="mt-[5.5mm] max-w-[158mm] text-[11pt] leading-[1.42] text-paper/90">
          Our in-house studio, {studio}, films every JOVE Day. Your school keeps the reels, the film and the photographs, at <strong className="font-semibold text-paper">no extra charge</strong>.
        </p>
      </div>

      {/* slate */}
      <div className="absolute bottom-[12mm] left-[18mm] right-[14mm]">
        <ClapperStripes />
        <dl className="grid h-[16mm] grid-cols-[1fr_46mm_31mm] border-paper/40" style={{ borderWidth: "0.25mm", borderTopWidth: 0 }}>
          <SlateCell label={school ? "Prepared for" : "For"} value={school || "Principals and school management"} first />
          <SlateCell label="Studio" value={studio} />
          <SlateCell label="Extra charge" value="None" />
        </dl>
      </div>
    </Half>
  );
}

function SlateCell({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <div className={cn("min-w-0 px-[3mm] pt-[2.4mm]", !first && "border-paper/40")} style={first ? undefined : { borderLeftWidth: "0.25mm" }}>
      <dt className="font-mono text-[6.5pt] font-medium uppercase leading-none tracking-[0.2em] text-paper/60">{label}</dt>
      <dd className="mt-[1.6mm] line-clamp-2 text-[9pt] font-semibold leading-[1.18]">{value}</dd>
    </div>
  );
}

/* ───────────────────────────── outside sheet · back cover (left half) ───────────────────────────── */

function AddOnPrice({ value, unit }: { value: number; unit: string }) {
  return (
    <p className="mt-[1.8mm] flex items-baseline gap-[1.6mm] leading-none">
      <span className="font-mono text-[11pt] font-medium tabular-nums">
        <RupeeSign />
        {formatINR(value).replace(/^[^\d]+/, "")}
      </span>
      <span className="text-[8pt] text-charcoal">per {unit}</span>
    </p>
  );
}

/** a phone line may only break at a slash between two numbers, never inside one */
const phoneLine = (s: string) =>
  s
    .replace(/-/g, "\u2011")
    .split(/\s*\/\s*/)
    .map((part) => part.replace(/ /g, "\u00a0"))
    .join(" / ");

function BackCover({ info, qrSrc }: { info: BrochureInfo; qrSrc: string }) {
  const contact = [
    info.contactName && { icon: UserRound, text: info.contactName, strong: true },
    info.phone && { icon: Phone, text: phoneLine(info.phone) },
    info.email && { icon: Mail, text: info.email },
    { icon: Globe, text: info.web },
  ].filter((r): r is { icon: typeof Globe; text: string; strong?: boolean } => Boolean(r));
  const reachable = Boolean(info.phone || info.email);

  return (
    <Half side="left" className="bg-paper">
      {/* a close-up strip, level with the cover's top bar */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[36mm] overflow-hidden bg-ink">
        <Pic src={IMG.build} pos="50% 74%" sizes="1800px" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, rgb(${SCRIM} / 0.88) 0%, rgb(${SCRIM} / 0.5) 42%, rgb(${SCRIM} / 0.12) 100%)` }} />
      </div>
      <header className="absolute left-[14mm] right-[14mm] top-0 flex h-[36mm] items-center justify-between">
        <Wordmark white mm={25} />
        <p>
          <Chip>{packName} · rights, extras, booking</Chip>
        </p>
      </header>

      {/* 1 · usage rights */}
      <section className="absolute left-[14mm] right-[14mm] top-[43.5mm]">
        <Kicker>Usage rights</Kicker>
        <h2 className="mt-[3mm] text-[27pt] font-bold leading-none tracking-[-0.035em]">The films are yours to use.</h2>
        <div className="mt-[5.5mm] grid grid-cols-2 gap-[8mm]">
          {rights.map((sentence) => (
            <div key={sentence} className="border-graphite pt-[2.6mm]" style={{ borderTopWidth: "0.35mm" }}>
              <p className="font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em] text-charcoal">{sentence.startsWith("JOVE") ? "What JOVE may do" : "What your school may do"}</p>
              <p className="mt-[2mm] text-[10pt] leading-[1.42]">{sentence}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2 · paid extras from the studio */}
      <section className="absolute left-[14mm] right-[14mm] top-[93mm]">
        <Kicker>Optional · priced separately</Kicker>
        <h3 className="mt-[3mm] text-[17pt] font-bold leading-none tracking-[-0.03em]">Want more from the studio?</h3>
        <p className="mt-[2.6mm] text-[9.5pt] leading-[1.4]">Paid work by {studio}, for schools that want it. None of it is needed to get the free Media Pack.</p>

        {tierAddOns.length > 0 && (
          <>
            <p className="mt-[5mm] flex items-center gap-[2.5mm] font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em]">
              {tierFamily}
              <span aria-hidden className="h-[0.25mm] flex-1 bg-graphite/35" />
            </p>
            <ul className="mt-[2.6mm] grid gap-[5mm]" style={{ gridTemplateColumns: `repeat(${tierAddOns.length}, minmax(0, 1fr))` }}>
              {tierAddOns.map((a) => (
                <li key={a.id}>
                  <p className="text-[10.5pt] font-bold leading-none tracking-[-0.01em]">{a.name.split(TIER_SEP)[1]}</p>
                  <AddOnPrice value={a.priceValue} unit={a.unit} />
                  <p className="mt-[2mm] text-[8.6pt] leading-[1.36] text-charcoal">{a.detail}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        {projectAddOns.length > 0 && (
          <>
            <p className="mt-[5mm] flex items-center gap-[2.5mm] font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em]">
              Films for your school
              <span aria-hidden className="h-[0.25mm] flex-1 bg-graphite/35" />
            </p>
            <ul className="mt-[2.6mm] grid gap-[5mm]" style={{ gridTemplateColumns: `repeat(${projectAddOns.length}, minmax(0, 1fr))` }}>
              {projectAddOns.map((a) => (
                <li key={a.id}>
                  <p className="text-[10.5pt] font-bold leading-none tracking-[-0.01em]">{a.name}</p>
                  <AddOnPrice value={a.priceValue} unit={a.unit} />
                  <p className="mt-[2mm] text-[8.6pt] leading-[1.36] text-charcoal">{a.detail}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* 3 · how to get it */}
      <section className="absolute left-[14mm] right-[14mm] top-[183mm] flex h-[40.5mm] border-graphite" style={{ borderWidth: "0.3mm" }}>
        <div className="min-w-0 flex-1 px-[5mm] pt-[4.6mm]">
          <Kicker>How to get it</Kicker>
          <h3 className="mt-[2.8mm] text-[15pt] font-bold leading-[1.06] tracking-[-0.03em]">It comes with every JOVE Day.</h3>
          <p className="mt-[2.4mm] text-[9.5pt] leading-[1.4]">
            There is nothing to order. Book a JOVE Day, our full-day Robotics and AI workshop for {gradeSpan}, and the filming is part of it.
          </p>
        </div>
        <div className="w-[82mm] shrink-0 border-graphite bg-paper-200 px-[5mm] pt-[4.6mm]" style={{ borderLeftWidth: "0.3mm" }}>
          <p className="font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em] text-charcoal">A JOVE Day costs</p>
          <p className="mt-[2.4mm] text-[22pt] font-bold leading-none tracking-[-0.03em] tabular-nums">
            {priceFrom} – {priceTo}
          </p>
          <p className="mt-[2mm] text-[9.5pt] leading-[1.35]">per student, depending on the grade.</p>
          <p className="mt-[1.4mm] text-[8pt] leading-[1.35] text-charcoal">
            Minimum {joveDayRules.minimumStudents} students and {formatINR(joveDayRules.minimumBilling)} minimum billing. Prices exclude GST. GST is added on the invoice where applicable.
          </p>
        </div>
      </section>

      {/* contact */}
      <footer className="absolute inset-x-0 bottom-0 h-[66mm] bg-ink text-paper">
        <div className="absolute left-[14mm] top-[9mm] w-[134mm]">
          <Kicker light>Fix a date</Kicker>
          <h3 className="mt-[3mm] text-[18pt] font-bold leading-[1.05] tracking-[-0.03em]">Ask for a JOVE Day at your school.</h3>
          <p className="mt-[2.4mm] text-[9.5pt] leading-[1.4] text-paper/85">{reachable ? "Call or write to us, or scan the code to open the studio page on our website." : "Scan the code, or visit our website, to see the studio page and ask for a date."}</p>
          <ul className="mt-[4mm] grid grid-cols-2 gap-x-[6mm] gap-y-[2.4mm]">
            {contact.map(({ icon: Icon, text, strong }) => (
              <li key={text} className="flex min-w-0 items-center gap-[2.2mm]">
                <Icon aria-hidden className="size-[3.6mm] shrink-0 text-paper/70" strokeWidth={1.5} />
                <span className={cn("min-w-0 break-words text-[10.5pt] leading-tight", strong ? "font-bold" : "font-medium")}>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute right-[14mm] top-[9mm] w-[34mm]">
          <div className="bg-white p-[3.5mm]">
            <Qr src={qrSrc} mm={27} label="QR code: the studio page on the JOVE website" />
          </div>
          <p className="mt-[2mm] text-center font-mono text-[6.5pt] font-medium uppercase leading-none tracking-[0.18em] text-paper/70">The studio page</p>
        </div>
        <p className="absolute bottom-[12mm] left-[14mm] right-[14mm] flex items-baseline justify-between font-mono text-[6.8pt] font-medium uppercase leading-none tracking-[0.16em] text-paper/70">
          <span>Images are illustrative.</span>
          <span>{info.legalName}</span>
        </p>
      </footer>

      {/* the cover's ink wraps 3.5 mm round the spine, so a fold that lands a little off never shows a paper edge */}
      <span aria-hidden className="absolute inset-y-0 right-0 w-[3.5mm] bg-ink" />
    </Half>
  );
}

/* ───────────────────────────── inside spread ───────────────────────────── */

/** half of the deliverables on each page of the spread */
const PER_PAGE = Math.ceil(items.length / 2);
const HERO_H = 99;
const STRIP_TOP = 110.5;
const CAPTION_H = 36;
/** top of the lower third of the spread: timeline, filming, uses */
const LOWER_TOP = 204;
const FRAME_H = 32.25;
const STRIP_H = 5.5 + FRAME_H + 5.5;

/** Bands and pictures that run across the fold. No text here. */
function InsideBands() {
  return (
    <>
      {/* hero: ink on the left page, the aerial picture on the right */}
      <div aria-hidden className="absolute inset-x-0 top-0 overflow-hidden bg-ink" style={{ height: mm(HERO_H) }}>
        <PlacedPic src={IMG.drone} left={150} top={-71.8} width={330} sizes="2400px" />
        <div className="absolute inset-y-0" style={{ left: "149mm", width: "84mm", background: `linear-gradient(to right, rgb(${SCRIM}) 6%, rgb(${SCRIM} / 0.7) 48%, rgb(${SCRIM} / 0))` }} />
        <div className="absolute inset-x-0 bottom-0 h-[12mm]" style={{ background: `linear-gradient(to top, rgb(${SCRIM} / 0.55), rgb(${SCRIM} / 0))` }} />
        <Brackets className="text-paper/85" style={{ left: "224mm", right: "14mm", top: "7mm", bottom: "7mm" }} />
      </div>

      {/* the film strip */}
      <div aria-hidden className="absolute inset-x-0 bg-ink" style={{ top: mm(STRIP_TOP), height: mm(STRIP_H) }}>
        <Perfs length={420} className="absolute left-0 top-0 text-paper/85" />
        <Perfs length={420} className="absolute bottom-0 left-0 text-paper/85" />
      </div>

      <span aria-hidden className="absolute left-[14mm] right-[14mm] h-[0.25mm] bg-graphite/30" style={{ top: mm(LOWER_TOP - 5.5) }} />
    </>
  );
}

/** The drawing inside one frame of the strip. */
function FrameArt({ kind }: { kind: Kind }) {
  if (kind === "reels") {
    const shots = [
      { src: IMG.build, pos: "52% 50%", bleed: 0 },
      { src: IMG.room, pos: "42% 50%", bleed: 0 },
      { src: IMG.crew, pos: "74% 50%", bleed: 6 },
    ];
    return (
      <div className="flex h-full justify-between">
        {shots.map((s) => (
          <div key={s.src} className="relative h-full overflow-hidden rounded-[1mm] bg-graphite" style={{ width: mm((FRAME_H * 9) / 16) }}>
            <Pic src={s.src} pos={s.pos} bleed={s.bleed} sizes="500px" />
            <span className="absolute inset-x-[1.6mm] bottom-[1.6mm] h-[0.35mm] bg-paper/70">
              <span className="absolute left-0 top-0 h-full w-1/3 bg-paper" />
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "film") {
    return (
      <div className="relative h-full overflow-hidden bg-graphite">
        <Pic src={IMG.room} sizes="900px" pos="50% 40%" />
        <div className="absolute inset-x-0 bottom-0 h-[10mm]" style={{ background: `linear-gradient(to top, rgb(${SCRIM} / 0.85), rgb(${SCRIM} / 0))` }} />
        <svg viewBox="0 0 10 10" className="absolute bottom-[2.2mm] left-[2.6mm] size-[3.2mm] text-paper" fill="currentColor">
          <path d="M2 1 L9 5 L2 9 Z" />
        </svg>
        <span className="absolute bottom-[3.6mm] left-[8mm] right-[3mm] h-[0.35mm] bg-paper/60">
          <span className="absolute left-0 top-0 h-full w-[38%] bg-paper" />
          <span className="absolute left-[38%] top-1/2 size-[1.5mm] -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
        </span>
      </div>
    );
  }
  if (kind === "drone") {
    return (
      <div className="relative h-full overflow-hidden bg-graphite">
        <Pic src={IMG.drone} sizes="900px" />
        <Brackets arm={3.2} weight={0.25} className="inset-[2.4mm] text-paper/90" />
        <svg viewBox="0 0 12 12" className="absolute left-1/2 top-1/2 size-[6mm] -translate-x-1/2 -translate-y-1/2 text-paper/90" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="6" cy="6" r="2.6" />
          <path d="M6 0v4M6 8v4M0 6h4M8 6h4" />
        </svg>
      </div>
    );
  }
  if (kind === "photos") {
    const prints = [
      { src: IMG.build, pos: "50% 60%", bleed: 0, left: 0.6, top: 7.6, turn: -6 },
      { src: IMG.room, pos: "80% 45%", bleed: 0, left: 14.6, top: 2.4, turn: 3 },
      { src: IMG.crew, pos: "70% 40%", bleed: 6, left: 28.6, top: 9.2, turn: -2 },
    ];
    return (
      <div className="relative h-full">
        {prints.map((p) => (
          <div key={p.src} className="absolute bg-paper-50 p-[1mm] outline outline-[0.15mm] outline-ink/60" style={{ left: mm(p.left), top: mm(p.top), width: "28mm", height: "20mm", transform: `rotate(${p.turn}deg)` }}>
            <div className="relative size-full overflow-hidden">
              <Pic src={p.src} pos={p.pos} bleed={p.bleed} sizes="600px" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "interview") {
    return (
      <div className="hatch-light relative h-full overflow-hidden bg-graphite text-paper">
        {/* rule-of-thirds guides and a seated figure, drawn like a storyboard */}
        <svg viewBox="0 0 57.33 32.25" className="absolute inset-0 size-full" fill="none" stroke="currentColor">
          <path d="M19.1 0v32.25M38.2 0v32.25M0 10.75h57.33M0 21.5h57.33" strokeWidth="0.15" strokeDasharray="0.8 1" opacity="0.45" />
          <circle cx="38.2" cy="11.4" r="4.3" strokeWidth="0.32" fill="rgb(43 43 43)" />
          <path d="M27.4 32.25c0-8.2 4.6-12.6 10.8-12.6s10.8 4.4 10.8 12.6" strokeWidth="0.32" fill="rgb(43 43 43)" />
        </svg>
        <div className="absolute bottom-[3mm] left-[3mm]">
          <p className="bg-paper px-[1.6mm] py-[0.9mm] text-[7pt] font-bold leading-none text-ink">Principal</p>
          <p className="mt-[0.5mm] w-max bg-ink/85 px-[1.6mm] py-[0.8mm] font-mono text-[6.5pt] uppercase leading-none tracking-[0.14em]">Your school</p>
        </div>
      </div>
    );
  }
  if (kind === "kit") {
    const booked = [1, 3, 6, 8, 12, 14, 17, 19];
    return (
      <div className="relative flex h-full gap-[4mm] bg-paper-50 px-[3.6mm] py-[3.6mm] text-graphite">
        <div className="flex-1">
          <p className="font-mono text-[6.5pt] font-medium uppercase leading-none tracking-[0.16em] text-charcoal">Caption</p>
          <div className="mt-[2mm] space-y-[1.5mm]">
            <span className="block h-[1.2mm] w-full bg-graphite/70" />
            <span className="block h-[1.2mm] w-[92%] bg-graphite/70" />
            <span className="block h-[1.2mm] w-[60%] bg-graphite/70" />
          </div>
          <div className="mt-[3.4mm] flex gap-[1.4mm]">
            {[9, 7, 8].map((w, i) => (
              <span key={i} className="flex h-[3.2mm] items-center gap-[0.6mm] rounded-full border-graphite/60 px-[1.1mm] font-mono text-[6.5pt] leading-none" style={{ borderWidth: "0.2mm" }}>
                #<span className="block h-[0.9mm] bg-graphite/55" style={{ width: mm(w - 4.4) }} />
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0">
          <p className="font-mono text-[6.5pt] font-medium uppercase leading-none tracking-[0.16em] text-charcoal">Schedule</p>
          <div className="mt-[2mm] grid grid-cols-5 gap-[0.8mm]">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} className={cn("block size-[3.1mm] border-graphite/60", booked.includes(i) && "bg-graphite")} style={{ borderWidth: "0.2mm" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return <div className="hatch-light h-full bg-graphite" />;
}

/** One page's worth of the strip: its frames and their captions. */
function StripPage({ from }: { from: number }) {
  const page = items.slice(from, from + PER_PAGE);
  const columns = { gridTemplateColumns: `repeat(${PER_PAGE}, minmax(0, 1fr))` };
  return (
    <>
      <div aria-hidden className="absolute grid gap-[6mm]" style={{ ...columns, left: 0, right: 0, top: mm(STRIP_TOP + 5.5), height: mm(FRAME_H) }}>
        {page.map((item) => (
          <FrameArt key={item.title} kind={kindOf(item.title)} />
        ))}
      </div>
      <ul className="absolute grid gap-[6mm]" style={{ ...columns, left: 0, right: 0, top: mm(STRIP_TOP + STRIP_H + 4) }}>
        {page.map((item, i) => (
          <li key={item.title} className="flex flex-col" style={{ height: mm(CAPTION_H) }}>
            <p className="flex items-center justify-between font-mono text-[6.8pt] font-medium uppercase leading-none tracking-[0.18em] text-charcoal">
              <span>
                {pad(from + i + 1)} / {pad(items.length)}
              </span>
              <span>{FORMAT[kindOf(item.title)]}</span>
            </p>
            <h3 className="mt-[2.2mm] text-[11.5pt] font-bold leading-[1.1] tracking-[-0.02em]">{item.title}</h3>
            <p className="mt-[1.4mm] text-[9pt] leading-[1.36]">{item.detail}</p>
            <p className="mt-auto flex items-center gap-[1.6mm] border-graphite/35 pt-[1.8mm] font-mono text-[8pt] font-medium leading-none" style={{ borderTopWidth: "0.25mm" }}>
              <Clock aria-hidden className="size-[3mm] shrink-0 text-charcoal" strokeWidth={1.5} />
              {item.delivery}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Big mono day counter on the timeline, with a two-line label. */
function DayCount({ days, label }: { days: number; label: [string, string] }) {
  return (
    <p className="flex items-end gap-[2.4mm]">
      <span className="font-mono text-[25pt] leading-[0.78] tracking-[-0.06em] tabular-nums">{pad(days)}</span>
      <span className="font-mono text-[7pt] font-medium uppercase leading-[1.3] tracking-[0.2em] text-charcoal">
        {label[0]}
        <br />
        {label[1]}
      </span>
    </p>
  );
}

/** Blueprint dimension line with a centred label. */
function Dimension({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[2.6mm] text-graphite/55", className)}>
      <span aria-hidden className="h-[3.2mm] w-[0.25mm] bg-current" />
      <span aria-hidden className="relative -ml-[2.6mm] h-[0.25mm] flex-1 bg-current">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 border-y-[0.9mm] border-r-[2.2mm] border-y-transparent border-r-current" />
      </span>
      <span className="font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em] text-charcoal">{children}</span>
      <span aria-hidden className="relative -mr-[2.6mm] h-[0.25mm] flex-1 bg-current">
        <span className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[0.9mm] border-l-[2.2mm] border-y-transparent border-l-current" />
      </span>
      <span aria-hidden className="h-[3.2mm] w-[0.25mm] bg-current" />
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <Kicker>{kicker}</Kicker>
      <h3 className="mt-[2.8mm] text-[14pt] font-bold leading-[1.08] tracking-[-0.03em]">{title}</h3>
    </>
  );
}

function InsideLeft() {
  return (
    <Half side="left">
      {/* hero copy */}
      <div className="absolute left-[14mm] top-[16.5mm] w-[166mm] text-paper">
        <Kicker light>Inside the {packName}</Kicker>
        <h2 className="mt-[4.5mm] text-[44pt] font-bold leading-[0.97] tracking-[-0.04em]">
          One JOVE Day.
          <br />
          {cap(word(items.length))} things to keep.
        </h2>
        <div className="mt-[7mm] w-[158mm]">
          <ClapperStripes />
        </div>
        <div className="flex w-[158mm] border-paper/40" style={{ borderWidth: "0.25mm", borderTopWidth: 0 }}>
          <div className="shrink-0 px-[5mm] py-[3.6mm]">
            <p className="flex items-baseline gap-[2.2mm]">
              <span className="text-[9.5pt] text-paper/85">about</span>
              <span className="text-[24pt] font-bold leading-none tracking-[-0.03em] tabular-nums">{packValue}</span>
            </p>
            <p className="mt-[1.8mm] text-[9.5pt] leading-none text-paper/85">typical market value</p>
          </div>
          <div className="hatch-light min-w-0 flex-1 border-paper/40 px-[5mm] py-[3.6mm]" style={{ borderLeftWidth: "0.25mm" }}>
            <p className="text-[15pt] font-bold leading-none tracking-[-0.03em]">No extra charge.</p>
            <p className="mt-[2.2mm] text-[9.5pt] leading-[1.36] text-paper/90">The pack is part of every JOVE Day. There is no separate bill for the filming.</p>
          </div>
        </div>
      </div>

      <p className="absolute left-[14mm] top-[103.6mm] font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em] text-charcoal">
        What is in the pack · {word(items.length)} items, frame by frame
      </p>

      <div className="absolute left-[14mm] top-0 w-[184mm]">
        <StripPage from={0} />
      </div>

      {/* delivery timeline */}
      <section className="absolute left-[14mm] w-[184mm]" style={{ top: mm(LOWER_TOP) }}>
        <SectionHead kicker="Delivery timeline" title="When it reaches you" />
        <div className="relative mt-[5.5mm]">
          <span aria-hidden className="absolute left-0 right-0 top-[1.6mm] h-[0.3mm] bg-graphite/55" />
          <span aria-hidden className="absolute right-0 top-[0.35mm] border-y-[1.4mm] border-l-[2.6mm] border-y-transparent border-l-graphite/70" />
          <ol className="relative grid gap-[6mm]" style={{ gridTemplateColumns: `repeat(${stages.length + 1}, minmax(0, 1fr))` }}>
            <li className="relative pt-[7.5mm]">
              <span aria-hidden className="absolute left-0 top-0 size-[3.5mm] rounded-full bg-graphite" />
              <DayCount days={0} label={["The", "shoot"]} />
              <p className="mt-[2.6mm] text-[11pt] font-bold leading-none tracking-[-0.02em]">JOVE Day</p>
              <p className="mt-[2mm] text-[9pt] leading-[1.36]">We film the whole day, from the opening show to the certificate ceremony.</p>
            </li>
            {stages.map((stage, i) => (
              <li key={stage.days} className="relative pt-[7.5mm]">
                <span aria-hidden className="absolute left-0 top-0 size-[3.5mm] rounded-full border-graphite bg-paper" style={{ borderWidth: "0.5mm" }} />
                <DayCount days={stage.days} label={[ORDINALS[i] ?? "Next", "delivery"]} />
                <p className="mt-[2.6mm] text-[11pt] font-bold leading-none tracking-[-0.02em]">{stage.label}</p>
                <ul className="mt-[2mm] space-y-[0.9mm] text-[9pt] leading-[1.3]">
                  {stage.items.map((it) => (
                    <li key={it.title} className="relative pl-[3.4mm] text-pretty">
                      <span aria-hidden className="absolute left-0 top-[1.35mm] size-[1.3mm] bg-graphite" />
                      {it.title}
                      {it.note && <> <span className="whitespace-nowrap text-charcoal">({it.note})</span></>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
        {lastStage && (
          <Dimension className="mt-[7mm]">
            First delivery within {stages[0].days} working days · the rest within {lastStage.days}
          </Dimension>
        )}
      </section>

      <p className="absolute bottom-[12mm] left-[14mm] font-mono text-[6.6pt] font-medium uppercase leading-none tracking-[0.2em] text-charcoal">{mediaPack.name}</p>
    </Half>
  );
}

function InsideRight({ web }: { web: string }) {
  const crew = joveDayRules.teamSize.media;
  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: crew === 1 ? "Our own film-maker" : "Our own film crew",
      body: (
        <>
          {cap(word(crew))} {plural(crew, "film-maker")} from {studio} {plural(crew, "travels", "travel")} with the JOVE team{arrival ? ` and ${plural(crew, "is", "are")} on campus by ${arrival.time}` : ""}. You do not hire or brief a separate crew.
        </>
      ),
    },
    {
      title: "Consent comes first",
      body: (
        <>
          Parents get a consent form before the day. The rule is short: <strong className="font-semibold">no consent, no camera</strong>.
        </>
      ),
    },
    {
      title: "Faces blurred on request",
      body: <>JOVE may show the media in its own portfolio. Tell us if a student should not be recognised there, and the face is blurred.</>,
    },
    {
      title: "Drone, only with permission",
      body: <>Drone shots are subject to local drone rules and school permission. If either says no, the drone stays on the ground.</>,
    },
  ];
  const uses = [
    { title: "Admissions campaigns", body: "Reels and the film, ready for your admissions season." },
    { title: "Your social media", body: "Vertical reels for the school's Instagram, YouTube and WhatsApp." },
    { title: "School events", body: "Play the highlight film at annual day and at parent meetings." },
  ];

  return (
    <Half side="right">
      {/* read-outs on the aerial picture */}
      <p className="absolute left-[18mm] top-[12.5mm]">
        <Chip>
          <span aria-hidden className="size-[1.7mm] rounded-full bg-paper" />
          Drone · aerial
        </Chip>
      </p>
      {showcase && (
        <p className="absolute right-[18mm] top-[12.5mm]">
          <Chip>{timecode(showcase.time)}</Chip>
        </p>
      )}
      <p className="absolute right-[18mm] top-[83.4mm]">
        <Chip>Illustration · the whole-school formation shot</Chip>
      </p>

      <p className="absolute right-[14mm] top-[103.6mm] font-mono text-[7pt] font-medium uppercase leading-none tracking-[0.2em] text-charcoal">Shot, edited and delivered by {studio}</p>

      <div className="absolute left-[12mm] top-0 w-[184mm]">
        <StripPage from={PER_PAGE} />
      </div>

      {/* how filming works */}
      <section className="absolute left-[12mm] w-[120.67mm]" style={{ top: mm(LOWER_TOP) }}>
        <SectionHead kicker="On the day" title="How filming works on the day" />
        <ol className="mt-[4.6mm] grid grid-cols-2 gap-x-[6mm] gap-y-[3.6mm]">
          {steps.map((s, i) => (
            <li key={s.title} className="border-graphite/35 pt-[2.2mm]" style={{ borderTopWidth: "0.25mm" }}>
              <p className="flex items-baseline gap-[2mm]">
                <span className="font-mono text-[7.5pt] font-medium leading-none text-charcoal">{pad(i + 1)}</span>
                <span className="text-[10pt] font-bold leading-[1.15] tracking-[-0.01em]">{s.title}</span>
              </p>
              <p className="mt-[1.4mm] text-[9pt] leading-[1.36]">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* where to use it */}
      <section className="absolute left-[138.67mm] w-[57.33mm]" style={{ top: mm(LOWER_TOP) }}>
        <SectionHead kicker="After the day" title="Where to use it" />
        <ul className="mt-[4.6mm] space-y-[3mm]">
          {uses.map((u) => (
            <li key={u.title} className="border-graphite/35 pt-[2.2mm]" style={{ borderTopWidth: "0.25mm" }}>
              <p className="text-[10pt] font-bold leading-[1.15] tracking-[-0.01em]">{u.title}</p>
              <p className="mt-[1.2mm] text-[9pt] leading-[1.36]">{u.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="absolute bottom-[12mm] right-[14mm] font-mono text-[6.6pt] font-medium uppercase leading-none tracking-[0.2em] text-charcoal">{web}</p>
    </Half>
  );
}

/* ───────────────────────────── the brochure ───────────────────────────── */

export function StudioBrochure({ q }: { q: Q }) {
  const info = useBrochureInfo(q);
  const qrSrc = useQr(info.link("/studio"));
  return (
    <BrochureShell
      title="Brochure: The free Media Pack"
      q={q}
      ready={info.ready && !!qrSrc}
      outside={
        <Spread className="bg-paper">
          <BackCover info={info} qrSrc={qrSrc} />
          <FrontCover school={info.school} />
        </Spread>
      }
      inside={
        <Spread className="bg-paper">
          <InsideBands />
          <InsideLeft />
          <InsideRight web={info.web} />
        </Spread>
      }
    />
  );
}
