"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { CornerMarks, GridBackdrop } from "@/components/brand/Blueprint";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import { useCollection, useHq, useSettings } from "@/components/hq/data";
import type { BaseRecord } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { gradeBands, joveDayRules, joveDaySchedule, kits, mediaPack, packages, type GradeBand } from "@/lib/content/business";
import { site } from "@/lib/site";
import { amountInWords, cn, formatDate, formatINR, formatNumber, pad2 } from "@/lib/utils";
import { BAND_FIELDS, str } from "./crm";
import { gradeSpan, priceProposal, selectedBands, type PriceLine, type ProposalPricing } from "./pricing";

/* ─────────────────────────── small helpers ─────────────────────────── */

const LABEL = "text-[6.5pt] font-semibold uppercase tracking-[0.2em] text-blueprint";
const BODY = "text-[9pt] leading-[1.5] text-charcoal";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** ₹ with decimals only when the amount really has paise. */
function rupees(v: number) {
  const r = Math.round(v * 100) / 100;
  return formatINR(r, { decimals: !Number.isInteger(r) });
}

function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono tabular-nums", className)}>{children}</span>;
}

/** Compact running header for inner pages (the full Letterhead is used on the first page of each document part). */
function RunningHead({ number, school, section }: { number: string; school: string; section: string }) {
  return (
    <header className="relative mb-5 flex items-end justify-between border-b border-graphite/40 pb-3">
      <Image src="/brand/jove-wordmark.png" alt="JOVE" width={1400} height={669} className="h-auto w-[24mm]" />
      <div className="text-right">
        <p className={LABEL}>{section}</p>
        <p className="mt-0.5 text-[7.5pt] text-charcoal">
          <Mono>{number}</Mono> · {school}
        </p>
      </div>
      <span className="absolute -bottom-[3px] left-0 size-[5px] rounded-full border border-graphite bg-white" aria-hidden />
      <span className="absolute -bottom-[3px] right-0 size-[5px] rounded-full border border-graphite bg-white" aria-hidden />
    </header>
  );
}

function PageTitle({ index, eyebrow, title, lead }: { index: string; eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="mb-4">
      <p className={cn(LABEL, "flex items-center gap-2")}>
        <Mono>{index}</Mono>
        <span className="h-px w-6 bg-graphite/40" aria-hidden />
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-[18pt] font-bold leading-[1.1] tracking-[-0.03em] text-graphite">{title}</h2>
      {lead && <p className={cn(BODY, "mt-2 max-w-[150mm]")}>{lead}</p>}
    </div>
  );
}

function SubHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("mb-2 flex items-center gap-2 text-[7.5pt] font-bold uppercase tracking-[0.18em] text-graphite", className)}>
      <span className="h-[3px] w-4 bg-graphite" aria-hidden />
      {children}
    </h3>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-[3px] grid size-[9px] shrink-0 place-items-center border border-graphite" aria-hidden>
        <span className="size-[3px] bg-graphite" />
      </span>
      <span>{children}</span>
    </li>
  );
}

/* ─────────────────────────── context ─────────────────────────── */

interface Ctx {
  proposal: BaseRecord;
  school: BaseRecord | undefined;
  schoolName: string;
  pricing: ProposalPricing;
  settings: CompanySettings;
  number: string;
  signatory: { name: string; title: string };
  bands: GradeBand[];
}

/* ─────────────────────────── 1 · cover ─────────────────────────── */

function Cover({ c }: { c: Ctx }) {
  const { proposal, school, pricing, settings, number, signatory } = c;
  const place = [str(school?.area), str(school?.city)].filter(Boolean).join(", ");
  const board = str(school?.board);
  const span = gradeSpan(proposal);
  const contact = [settings.phone, settings.email, settings.website].filter(Boolean).join("  ·  ");
  const attention = str(school?.principalName) || str(school?.contactName);

  const meta1: [string, string][] = [
    ["Proposal no.", number],
    ["Date", formatDate(str(proposal.date))],
    ["Valid until", formatDate(str(proposal.validUntil))],
    ["Prepared by", signatory.name],
  ];
  const meta2: [string, string][] = [
    ["Package", pricing.pkg.name],
    ["Grades", span || "As scoped"],
    ["Students", pricing.students ? formatNumber(pricing.students) : "—"],
    ["Media Pack", pricing.mediaPacks > 0 ? `${pricing.mediaPacks} × included` : pricing.packageId === "custom" ? "As scoped" : "Per package"],
  ];

  return (
    <A4Page padded={false}>
      <section aria-label="Cover" className="absolute inset-0">
        <div className="paper-grain absolute inset-0 bg-paper" aria-hidden />
        <GridBackdrop />
        <div className="absolute inset-[8mm] flex flex-col border border-graphite/50">
          <CornerMarks size={14} />

          <div className="relative z-10 flex items-start justify-between px-[10mm] pt-[10mm]">
            <Image src="/brand/jove-wordmark.png" alt="JOVE — Journey of Visionation & Excellence" width={1400} height={669} className="h-auto w-[52mm]" priority />
            <div className="text-right">
              <p className={LABEL}>Proposal</p>
              <p className="mt-1 font-mono text-[10pt] font-semibold text-graphite">{number}</p>
            </div>
          </div>

          <div className="relative z-10 px-[10mm] pt-[13mm]">
            <p className={cn(LABEL, "flex items-center gap-2")}>
              <span className="h-px w-8 bg-graphite/50" aria-hidden />
              Proposal for
            </p>
            <h1 className="mt-3 max-w-[150mm] text-[34pt] font-bold leading-[1.04] tracking-[-0.03em] text-graphite">{c.schoolName}</h1>
            {(place || board) && <p className="mt-3 text-[10.5pt] text-charcoal">{[place, board].filter(Boolean).join("  ·  ")}</p>}
            {attention && (
              <p className="mt-1 text-[9pt] text-blueprint">
                Attention: {attention}
                {school?.principalName && str(school.principalName) === attention ? ", Principal" : str(school?.contactRole) ? `, ${str(school?.contactRole)}` : ""}
              </p>
            )}

            <div className="hatch-light mt-8 max-w-[128mm] border-l-[3px] border-graphite bg-paper/70 py-3 pl-4 pr-3">
              <p className={LABEL}>{pricing.pkg.cadence}</p>
              <p className="mt-1 text-[19pt] font-bold leading-none tracking-[-0.02em] text-graphite">{pricing.pkg.name}</p>
              <p className="mt-2 text-[9.5pt] leading-snug text-charcoal">{packages.find((p) => p.id === pricing.packageId)?.headline ?? "A programme designed around your school."}</p>
            </div>
          </div>

          {/* blueprint art — transparent ink so the engineering grid shows through */}
          <div className="relative z-0 min-h-0 flex-1">
            <Image src="/images/hero/hero-arm-ink.webp" alt="" fill sizes="800px" priority className="object-contain object-bottom mix-blend-multiply" />
          </div>

          {/* engineering-drawing title block */}
          <div className="relative z-10 border-t border-graphite/60 bg-paper/90">
            {[meta1, meta2].map((row, ri) => (
              <dl key={ri} className={cn("grid grid-cols-4 divide-x divide-graphite/30", ri === 1 && "border-t border-graphite/30")}>
                {row.map(([k, v]) => (
                  <div key={k} className="px-3.5 py-2">
                    <dt className={LABEL}>{k}</dt>
                    <dd className="mt-0.5 text-[9.5pt] font-semibold leading-tight text-graphite">{v}</dd>
                  </div>
                ))}
              </dl>
            ))}
            <div className="flex items-center justify-between gap-6 border-t border-graphite/60 bg-graphite px-3.5 py-2 text-paper">
              <p className="text-[7.5pt] leading-snug">
                The first school Robotics &amp; AI workshop with its own in-house cinematic film studio — <span className="font-semibold">{site.studio.name}</span>.
              </p>
              {contact && <p className="shrink-0 text-right text-[7pt] text-paper/75">{contact}</p>}
            </div>
          </div>
        </div>
      </section>
    </A4Page>
  );
}

/* ─────────────────────────── 2 · about JOVE ─────────────────────────── */

const WHY_JOVE = [
  { t: "Hands-on, offline-first", d: "Every student builds, tests and takes part. All kits, tools and consumables come with us — nothing for the school to buy." },
  { t: "Designed for each age group", d: "Four grade groups, each with its own curriculum, kit, build and session length — from light-up robot buddies to AI that sees." },
  { t: "A media pack your admissions team can use", d: "Reels, a full-day film and drone shots made by our own studio, with usage rights for the school's marketing." },
  { t: "Founder-led, on site", d: `A team of ${joveDayRules.teamSize.founders + joveDayRules.teamSize.trainers + joveDayRules.teamSize.media} runs every JOVE Day — ${joveDayRules.teamSize.founders} founders, ${joveDayRules.teamSize.trainers} trainers and ${joveDayRules.teamSize.media} media specialist.` },
  { t: "Certificates and a report", d: "Every participating student receives a certificate, and management gets a post-workshop report." },
  { t: "Learning that continues online", d: "Free JOVE Virtual Labs let students revisit every idea — theory, demo, simulation and challenge — from home." },
];

function About({ c, page }: { c: Ctx; page: string }) {
  return (
    <A4Page>
      <section aria-label="About JOVE">
        <Letterhead settings={c.settings} docTitle="About JOVE" docMeta={<span className="font-mono">{c.number}</span>} />

        <p className="text-[10.5pt] font-semibold leading-snug tracking-[-0.01em] text-graphite">
          {site.name} — {site.expansion} — brings full-day Robotics, AI &amp; ML workshops into schools, for Grades 1–10.
        </p>
        <p className={cn(BODY, "mt-2")}>
          Our workshops are offline-first and project-based: students leave having built something that moves, senses or thinks — learning by doing, in the spirit of NEP 2020.
        </p>

        {/* the media pack */}
        <div className="relative mt-4 overflow-hidden rounded-[var(--radius-md)] bg-ink text-paper">
          <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="relative grid grid-cols-[1fr_56mm]">
            <div className="p-5">
              <p className="text-[6.5pt] font-semibold uppercase tracking-[0.2em] text-paper/60">The difference</p>
              <h3 className="mt-1 text-[14pt] font-bold leading-[1.1] tracking-[-0.02em]">Every school gets its own film crew.</h3>
              <p className="mt-2 text-[8.5pt] leading-[1.5] text-paper/80">
                JOVE is the first school workshop company with its own in-house cinematic studio. {mediaPack.name} is produced by {site.studio.name}, founded by our co-founder Chinmay R M.
              </p>
            </div>
            <div className="relative min-h-[34mm] border-l border-paper/20">
              <Image src="/images/studio/media-crew.webp" alt="" fill sizes="320px" className="object-cover grayscale" />
              <span className="absolute bottom-1 right-1.5 text-[5.5pt] uppercase tracking-[0.15em] text-paper/70">Illustration</span>
            </div>
          </div>
          <ul className="relative grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-paper/20 px-5 py-3">
            {mediaPack.items.map((m, i) => (
              <li key={m.title} className="break-inside-avoid">
                <p className="flex items-baseline gap-2 text-[8.5pt] font-bold">
                  <Mono className="text-[7pt] font-normal text-paper/50">{pad2(i + 1)}</Mono>
                  {m.title}
                </p>
                <p className="mt-0.5 text-[7.5pt] leading-[1.45] text-paper/70">{m.detail}</p>
              </li>
            ))}
          </ul>
          <p className="relative border-t border-paper/20 bg-paper/10 px-5 py-2 text-[8pt] font-semibold">
            Indicative market value {formatINR(mediaPack.marketValue)} — included free with every JOVE Day.
          </p>
        </div>

        {/* why us */}
        <SubHeading className="mt-5">Why schools choose JOVE</SubHeading>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
          {WHY_JOVE.map((w, i) => (
            <li key={w.t} className="break-inside-avoid border-t border-graphite/25 pt-2">
              <p className="flex items-baseline gap-2 text-[8.5pt] font-bold text-graphite">
                <Mono className="text-[7pt] font-normal text-blueprint">{pad2(i + 1)}</Mono>
                {w.t}
              </p>
              <p className="mt-0.5 text-[8pt] leading-[1.45] text-charcoal">{w.d}</p>
            </li>
          ))}
        </ul>

        {/* founders */}
        <SubHeading className="mt-5">Who you will work with</SubHeading>
        <ul className="grid grid-cols-2 gap-4">
          {site.founders.map((f) => (
            <li key={f.id} className="flex items-start gap-3 break-inside-avoid rounded-[var(--radius-sm)] border border-graphite/20 p-2.5">
              <span className="grid size-[11mm] shrink-0 place-items-center rounded-full border border-graphite font-mono text-[9pt] font-semibold text-graphite" aria-hidden>
                {f.initials}
              </span>
              <div className="min-w-0">
                <p className="text-[9pt] font-bold leading-tight text-graphite">{f.name}</p>
                <p className="text-[7.5pt] font-medium text-charcoal">{f.role}</p>
                <p className="mt-1 text-[7pt] leading-snug text-blueprint">{f.focus}</p>
              </div>
            </li>
          ))}
        </ul>
        <PrintFooter note={page} />
      </section>
    </A4Page>
  );
}

/* ─────────────────────────── 3 · programme ─────────────────────────── */

function BandCard({ band, students, wide, club }: { band: GradeBand; students: number; wide: boolean; club: boolean }) {
  const kit = kits.find((k) => k.id === band.kitId);
  const sessionMin = club ? 60 : band.durationMin;
  return (
    <article className={cn("break-inside-avoid rounded-[var(--radius-sm)] border border-graphite/30 bg-white", wide && "col-span-2")} aria-label={`${band.name}, ${band.grades}`}>
      <header className="flex items-stretch gap-3 border-b border-graphite/25 bg-paper-50">
        <div className="relative w-[24mm] shrink-0 border-r border-graphite/20 bg-paper">
          <Image src={band.image} alt="" width={1600} height={1195} sizes="160px" className="h-full w-full object-cover mix-blend-multiply" />
        </div>
        <div className="min-w-0 flex-1 py-2 pr-3">
          <p className={LABEL}>
            {band.grades} · <Mono>{formatNumber(students)}</Mono> students
          </p>
          <h3 className="mt-0.5 text-[12pt] font-bold leading-tight tracking-[-0.02em] text-graphite">{band.name}</h3>
          <p className="text-[8pt] font-medium text-charcoal">
            {band.theme}
            {wide && <span className="italic text-blueprint"> — {band.tagline}</span>}
          </p>
        </div>
        <div className="shrink-0 border-l border-graphite/20 px-3 py-2 text-right">
          <p className={LABEL}>Session</p>
          <p className="mt-0.5 font-mono text-[11pt] font-semibold leading-none text-graphite">{sessionMin}′</p>
        </div>
      </header>
      <div className={cn("grid gap-x-5 gap-y-2 p-2.5", wide && "grid-cols-2")}>
        <div>
          <p className={cn(LABEL, "mb-1.5")}>Students will</p>
          <ul className="space-y-0.5 text-[7.8pt] leading-[1.4] text-charcoal">
            {band.outcomes.map((o) => (
              <Check key={o}>{o}</Check>
            ))}
          </ul>
        </div>
        <div>
          <p className={cn(LABEL, "mb-1.5")}>The session</p>
          <ol className="space-y-0.5 text-[7.8pt] leading-[1.4] text-charcoal">
            {band.activities.map((a, i) => (
              <li key={a.title} className="flex gap-2">
                <Mono className="w-3.5 shrink-0 text-[7pt] text-blueprint">{pad2(i + 1)}</Mono>
                <span className="min-w-0 flex-1">{a.title}</span>
                <Mono className="shrink-0 text-[7pt] text-blueprint">{a.minutes}′</Mono>
              </li>
            ))}
          </ol>
        </div>
        <p className={cn("border-t border-dashed border-graphite/25 pt-2 text-[7pt] leading-snug text-blueprint", wide && "col-span-2")}>
          <span className="font-semibold text-charcoal">Skills:</span> {band.skills.join(" · ")}
          {kit && (
            <>
              {"  ·  "}
              <span className="font-semibold text-charcoal">Kit:</span> {kit.name} ({band.studentsPerStation} per station)
            </>
          )}
        </p>
      </div>
    </article>
  );
}

function Programme({ c, page, index }: { c: Ctx; page: string; index: string }) {
  const { pricing, bands, proposal } = c;
  const club = pricing.packageId === "jove-club";
  const grid = bands.length > 2;
  return (
    <A4Page>
      <section aria-label="Programme">
        <RunningHead number={c.number} school={c.schoolName} section="Programme" />
        <PageTitle
          index={index}
          eyebrow="Programme"
          title="What your students will do"
          lead={`${pricing.pkg.name} — ${pricing.pkg.cadence.toLowerCase()}. Every grade group gets its own curriculum, kit and build.`}
        />
        <div className={cn("grid gap-3", grid ? "grid-cols-2" : "grid-cols-1")}>
          {bands.map((b, i) => (
            <BandCard key={b.id} band={b} students={num(proposal[BAND_FIELDS[b.id]])} wide={!grid || (bands.length === 3 && i === 2)} club={club} />
          ))}
        </div>
        <p className="mt-3 text-[7.5pt] leading-snug text-blueprint">
          Every student receives a JOVE certificate. Session plans are indicative and fine-tuned with your coordinator.
        </p>
        <PrintFooter note={page} />
      </section>
    </A4Page>
  );
}

/* ─────────────────────────── 4 · day plan / format ─────────────────────────── */

function RunOfShow({ c, page, index }: { c: Ctx; page: string; index: string }) {
  const { pricing, bands, proposal } = c;
  const isDayLike = pricing.packageId === "jove-day" || pricing.packageId === "jove-quarter";
  const pkgData = packages.find((p) => p.id === pricing.packageId);
  const selectedGrades = new Set<string>(bands.map((b) => b.grades));
  const allBandGrades = new Set<string>(gradeBands.map((b) => b.grades));
  const needsOverflow = bands.some((b) => num(proposal[BAND_FIELDS[b.id]]) > b.maxPerSession);
  const rows = joveDaySchedule.filter((r) => {
    if (allBandGrades.has(r.who)) return selectedGrades.has(r.who);
    if (r.title === "Overflow batch") return needsOverflow;
    return true;
  });
  const selectedAddOns = pricing.addOnLines.filter((l) => l.kind === "addon");

  return (
    <A4Page>
      <section aria-label={isDayLike ? "Run of show" : "How the programme runs"}>
        <RunningHead number={c.number} school={c.schoolName} section={isDayLike ? "A JOVE Day" : "Format"} />
        {isDayLike ? (
          <>
            <PageTitle
              index={index}
              eyebrow="Run of show"
              title="A JOVE Day, hour by hour"
              lead={
                pricing.packageId === "jove-quarter"
                  ? "Each of your three JOVE Days follows this run of show, with the curriculum levelling up every month."
                  : "One day, the whole school. The plan below shows the sessions for the grade groups in this proposal."
              }
            />
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">JOVE Day schedule</caption>
              <thead>
                <tr className="border-y border-graphite bg-paper-50">
                  <th scope="col" className={cn(LABEL, "w-[26mm] px-2 py-1 font-semibold")}>Time</th>
                  <th scope="col" className={cn(LABEL, "w-[17mm] px-2 py-1 font-semibold")}>Where</th>
                  <th scope="col" className={cn(LABEL, "px-2 py-1 font-semibold")}>Session</th>
                  <th scope="col" className={cn(LABEL, "w-[27mm] px-2 py-1 text-right font-semibold")}>Who</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.time}-${r.title}`} className="break-inside-avoid border-b border-graphite/15 align-top">
                    <td className="px-2 py-1 font-mono text-[7.8pt] tabular-nums text-graphite">
                      {r.time}–{r.end}
                    </td>
                    <td className="px-2 py-1 text-[7.8pt] text-charcoal">{r.hall}</td>
                    <td className="px-2 py-1">
                      <p className="text-[8.5pt] font-semibold leading-snug text-graphite">{r.title}</p>
                      <p className="text-[7.5pt] leading-snug text-charcoal">{r.detail}</p>
                    </td>
                    <td className="px-2 py-1 text-right text-[7.5pt] text-charcoal">{r.who}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[7.5pt] leading-snug text-blueprint">
              Timings are indicative. A detailed run sheet — halls, power, stations and arrival time — is agreed with your coordinator once the date is confirmed.
            </p>
          </>
        ) : (
          <>
            <PageTitle
              index={index}
              eyebrow="Format"
              title="How the programme runs"
              lead={pkgData ? `${pkgData.headline} ${pkgData.idealFor}` : "A scope tailored to your school, built from the add-ons and items listed in the investment section."}
            />
            {pkgData && (
              <>
                <SubHeading>What is included — {pkgData.name}</SubHeading>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt] leading-[1.45] text-charcoal">
                  {pkgData.includes.map((x) => (
                    <Check key={x}>{x}</Check>
                  ))}
                </ul>
              </>
            )}
            {selectedAddOns.length > 0 && (
              <>
                <SubHeading className="mt-5">Selected add-ons</SubHeading>
                <ul className="space-y-2">
                  {selectedAddOns.map((l) => (
                    <li key={l.key} className="break-inside-avoid border-t border-graphite/20 pt-1.5">
                      <p className="text-[8.5pt] font-semibold text-graphite">{l.label}</p>
                      {l.detail && <p className="text-[7.5pt] leading-snug text-charcoal">{l.detail}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {/* media delivery */}
        <SubHeading className="mt-5">{isDayLike ? "What we film, and when you receive it" : "The JOVE Media Pack (available with JOVE Day and Quarter)"}</SubHeading>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Media Pack deliverables and delivery times</caption>
          <tbody>
            {mediaPack.items.map((m) => (
              <tr key={m.title} className="break-inside-avoid border-b border-graphite/15 align-top">
                <th scope="row" className="w-[52mm] px-2 py-1 text-[8pt] font-semibold text-graphite">{m.title}</th>
                <td className="px-2 py-1 text-[7.5pt] leading-snug text-charcoal">{m.detail}</td>
                <td className="w-[32mm] px-2 py-1 text-right text-[7.5pt] text-graphite">{m.delivery}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[7.5pt] leading-snug text-blueprint">
          <span className="font-semibold text-charcoal">Rights:</span> {mediaPack.rights}
        </p>

        <figure className="relative mt-4 h-[22mm] overflow-hidden rounded-[var(--radius-sm)] border border-graphite/25">
          <Image src="/images/studio/drone-campus.webp" alt="" fill sizes="720px" className="object-cover grayscale" />
          <figcaption className="absolute bottom-1 right-2 bg-white/80 px-1.5 text-[5.5pt] uppercase tracking-[0.15em] text-charcoal">Illustration</figcaption>
        </figure>
        <PrintFooter note={page} />
      </section>
    </A4Page>
  );
}

/* ─────────────────────────── 5 · investment ─────────────────────────── */

function LineRow({ line, n, dense }: { line: PriceLine; n: number; dense: boolean }) {
  const py = dense ? "py-0.5" : "py-1";
  return (
    <tr className="break-inside-avoid border-b border-graphite/15 align-top">
      <td className={cn(py, "pl-1 pr-2 font-mono text-[7pt] text-blueprint")}>{pad2(n)}</td>
      <td className={cn(py, "pr-3")}>
        <p className="text-[8.6pt] font-semibold leading-snug text-graphite">{line.label}</p>
        {line.detail && !dense && <p className="text-[7pt] leading-snug text-charcoal">{line.detail}</p>}
      </td>
      <td className={cn(py, "whitespace-nowrap pr-3 text-right text-[8.3pt] tabular-nums text-charcoal")}>
        {formatNumber(line.qty)}
        {line.unit && <span className="ml-1 text-[7pt] text-blueprint">{line.unit}</span>}
      </td>
      <td className={cn(py, "whitespace-nowrap pr-3 text-right text-[8.3pt] tabular-nums text-charcoal")}>{rupees(line.rate)}</td>
      <td className={cn(py, "whitespace-nowrap pr-1 text-right text-[8.6pt] font-semibold tabular-nums text-graphite")}>{rupees(line.amount)}</td>
    </tr>
  );
}

function GroupRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="break-inside-avoid">
      <th colSpan={5} scope="colgroup" className="bg-graphite px-2 py-1 text-left text-[6.8pt] font-semibold uppercase tracking-[0.2em] text-paper">
        {children}
      </th>
    </tr>
  );
}

function Investment({ c, page }: { c: Ctx; page: string }) {
  const { pricing: p, school, settings } = c;
  let n = 0;
  const bankLines = [
    settings.bankAccountName && ["Account name", settings.bankAccountName],
    settings.bankName && ["Bank", settings.bankName],
    settings.bankAccountNumber && ["Account no.", settings.bankAccountNumber],
    settings.bankIfsc && ["IFSC", settings.bankIfsc],
    settings.upiId && ["UPI", settings.upiId],
  ].filter(Boolean) as [string, string][];
  const place = [str(school?.address), str(school?.area), str(school?.city)].filter(Boolean).join(", ");
  const hasLines = p.bandLines.length + p.addOnLines.length + p.extraLines.length + (p.minimumLine ? 1 : 0) > 0;
  const multi = p.packageId !== "jove-day" && p.packageId !== "custom";
  /* Long tables drop the grey detail lines so the investment still fits one A4 sheet. */
  const allLines = [...p.bandLines, ...(p.minimumLine ? [p.minimumLine] : []), ...p.addOnLines, ...p.extraLines];
  const groups = [p.bandLines.length > 0 || p.minimumLine, p.addOnLines.length > 0, p.extraLines.length > 0].filter(Boolean).length;
  const estimate = allLines.reduce((h, l) => h + (l.detail ? (l.detail.length > 110 ? 12 : 9.5) : 5.5), 0) + groups * 5 + (p.discount > 0 ? 5.5 : 0);
  const dense = estimate > 96;

  return (
    <A4Page>
      <section aria-label="Investment">
        <Letterhead
          settings={settings}
          docTitle="Investment"
          docMeta={
            <>
              <p className="font-mono font-semibold text-graphite">{c.number}</p>
              <p>{formatDate(str(c.proposal.date))}</p>
            </>
          }
        />

        <div className="grid grid-cols-[1fr_auto] gap-6 rounded-[var(--radius-sm)] border border-graphite/25 bg-paper-50 px-4 py-2">
          <div className="min-w-0">
            <p className={LABEL}>Prepared for</p>
            <p className="mt-0.5 text-[11pt] font-bold leading-tight text-graphite">{c.schoolName}</p>
            {place && <p className="text-[8pt] text-charcoal">{place}</p>}
            {!!(school?.contactName || school?.principalName) && (
              <p className="mt-0.5 text-[8pt] text-charcoal">
                {[str(school?.principalName) || str(school?.contactName), str(school?.phone)].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <dl className="grid grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-0.5 text-right text-[8pt]">
            <dt className="text-blueprint">Package</dt>
            <dd className="font-semibold text-graphite">{p.pkg.name}</dd>
            <dt className="text-blueprint">Students</dt>
            <dd className="font-semibold tabular-nums text-graphite">{p.students ? formatNumber(p.students) : "—"}</dd>
            <dt className="text-blueprint">Valid until</dt>
            <dd className="font-semibold text-graphite">{formatDate(str(c.proposal.validUntil))}</dd>
          </dl>
        </div>

        <table className="mt-4 w-full border-collapse text-left">
          <caption className="sr-only">Investment breakdown, amounts in Indian rupees excluding GST</caption>
          <colgroup>
            <col className="w-[7mm]" />
            <col />
            <col className="w-[24mm]" />
            <col className="w-[21mm]" />
            <col className="w-[26mm]" />
          </colgroup>
          <thead>
            <tr className="border-b border-graphite">
              <th scope="col" className={cn(LABEL, "py-1 pl-1 text-left font-semibold")}>#</th>
              <th scope="col" className={cn(LABEL, "py-1 text-left font-semibold")}>Description</th>
              <th scope="col" className={cn(LABEL, "py-1 pr-3 text-right font-semibold")}>Qty</th>
              <th scope="col" className={cn(LABEL, "py-1 pr-3 text-right font-semibold")}>Rate (₹)</th>
              <th scope="col" className={cn(LABEL, "py-1 pr-1 text-right font-semibold")}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(p.bandLines.length > 0 || p.minimumLine) && (
              <>
                <GroupRow>
                  Programme — {p.pkg.name}
                  {p.packageId === "jove-club" ? ` · ${p.months} month${p.months === 1 ? "" : "s"}` : ""}
                </GroupRow>
                {p.bandLines.map((l) => (
                  <LineRow key={l.key} line={l} n={++n} dense={dense} />
                ))}
                {p.minimumLine && <LineRow line={p.minimumLine} n={++n} dense={dense} />}
                {p.discount > 0 && (
                  <tr className="break-inside-avoid border-b border-graphite/15">
                    <td />
                    <td className="py-1.5 pr-3 text-[8.8pt] font-semibold text-graphite">
                      Less: discount <span className="font-normal text-charcoal">({p.discountPercent}% on the programme fee of {rupees(p.programmeFee)})</span>
                    </td>
                    <td />
                    <td />
                    <td className="whitespace-nowrap py-1.5 pr-1 text-right text-[8.8pt] font-semibold tabular-nums text-graphite">− {rupees(p.discount)}</td>
                  </tr>
                )}
              </>
            )}
            {p.addOnLines.length > 0 && (
              <>
                <GroupRow>Add-ons</GroupRow>
                {p.addOnLines.map((l) => (
                  <LineRow key={l.key} line={l} n={++n} dense={dense} />
                ))}
              </>
            )}
            {p.extraLines.length > 0 && (
              <>
                <GroupRow>Additional items</GroupRow>
                {p.extraLines.map((l) => (
                  <LineRow key={l.key} line={l} n={++n} dense={dense} />
                ))}
              </>
            )}
            {!hasLines && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[8.5pt] text-blueprint">
                  No priced items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* totals */}
        <div className="mt-3 flex items-start justify-between gap-6">
          <div className="max-w-[78mm] space-y-2.5">
            {p.students > 0 && p.packageId !== "custom" && (
              <div className="break-inside-avoid rounded-[var(--radius-sm)] border border-graphite/25 px-3 py-2">
                <p className={LABEL}>Average per student</p>
                <p className="mt-0.5 text-[12pt] font-bold tabular-nums text-graphite">
                  {rupees(p.perStudent)} <span className="text-[7.5pt] font-medium text-blueprint">{p.pkg.unit}</span>
                </p>
                <p className="text-[7pt] text-blueprint">Programme fee after discount, excluding GST.</p>
              </div>
            )}
            {p.mediaPacks > 0 ? (
              <div className="hatch-light break-inside-avoid rounded-[var(--radius-sm)] border border-graphite/40 px-3 py-2">
                <p className={LABEL}>Included at no charge</p>
                <p className="mt-0.5 text-[8.5pt] font-semibold leading-snug text-graphite">
                  {p.mediaPacks} × JOVE Media Pack by {site.studio.name}
                </p>
                <p className="text-[7.3pt] leading-snug text-charcoal">
                  Indicative market value {formatINR(p.mediaValue)} ({formatINR(mediaPack.marketValue)} each) — complimentary.
                </p>
              </div>
            ) : (
              p.pkg.mediaNote && (
                <div className="break-inside-avoid rounded-[var(--radius-sm)] border border-graphite/25 px-3 py-2">
                  <p className={LABEL}>Media included</p>
                  <p className="mt-0.5 text-[8pt] leading-snug text-graphite">{p.pkg.mediaNote}</p>
                </div>
              )
            )}
          </div>
          <dl className="w-[78mm] shrink-0 break-inside-avoid text-[8.8pt]">
            {(p.discount > 0 || p.addOnLines.length > 0 || p.extraLines.length > 0) && p.bandLines.length > 0 && (
              <div className="flex justify-between border-b border-graphite/15 py-0.5">
                <dt className="text-charcoal">Programme{p.discount > 0 ? " (after discount)" : ""}</dt>
                <dd className="tabular-nums text-graphite">{rupees(p.programmeNet)}</dd>
              </div>
            )}
            {p.addOnsTotal > 0 && (
              <div className="flex justify-between border-b border-graphite/15 py-0.5">
                <dt className="text-charcoal">Add-ons</dt>
                <dd className="tabular-nums text-graphite">{rupees(p.addOnsTotal)}</dd>
              </div>
            )}
            {p.extrasTotal > 0 && (
              <div className="flex justify-between border-b border-graphite/15 py-0.5">
                <dt className="text-charcoal">Additional items</dt>
                <dd className="tabular-nums text-graphite">{rupees(p.extrasTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between border-b border-graphite/40 py-1 font-semibold">
              <dt className="text-graphite">Subtotal (excl. GST)</dt>
              <dd className="tabular-nums text-graphite">{rupees(p.subtotal)}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/15 py-0.5">
              <dt className="text-charcoal">GST @ {p.gstPercent}%</dt>
              <dd className="tabular-nums text-graphite">{rupees(p.gst)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between bg-graphite px-3 py-1.5 text-paper">
              <dt className="text-[7pt] font-semibold uppercase tracking-[0.18em]">Total payable</dt>
              <dd className="text-[14pt] font-bold tabular-nums">{rupees(p.grandTotal)}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-1.5 text-right text-[7pt] leading-snug text-blueprint">Rupees {amountInWords(Math.round(p.grandTotal))} only</p>

        {/* payment */}
        <SubHeading className="mt-4">Payment terms</SubHeading>
        <div className="grid grid-cols-2 gap-4">
          <div className="break-inside-avoid rounded-[var(--radius-sm)] border border-graphite/30 px-3 py-1.5">
            <p className={LABEL}>{joveDayRules.advancePercent}% advance — to confirm the date</p>
            <p className="mt-0.5 text-[12pt] font-bold tabular-nums text-graphite">{rupees(p.advance)}</p>
          </div>
          <div className="break-inside-avoid rounded-[var(--radius-sm)] border border-graphite/30 px-3 py-1.5">
            <p className={LABEL}>Balance — within {joveDayRules.balanceDueDays} days of the workshop</p>
            <p className="mt-0.5 text-[12pt] font-bold tabular-nums text-graphite">{rupees(p.balance)}</p>
          </div>
        </div>
        <p className="mt-2 text-[7.5pt] leading-snug text-blueprint">
          All amounts in Indian rupees; GST at {p.gstPercent}% is added to the subtotal. {multi && "For multi-session programmes a different instalment schedule can be agreed in writing before confirmation. "}
          {settings.gstin ? `GSTIN ${settings.gstin}.` : ""}
        </p>
        {bankLines.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 rounded-[var(--radius-sm)] bg-paper-50 px-3 py-1.5 text-[7.5pt]" aria-label="Bank and UPI details">
            {bankLines.map(([k, v]) => (
              <li key={k}>
                <span className="text-blueprint">{k}: </span>
                <span className="font-mono font-semibold text-graphite">{v}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[7.8pt] text-charcoal">Bank and UPI details are shared with the confirmation.</p>
        )}
        <PrintFooter note={page} />
      </section>
    </A4Page>
  );
}

/* ─────────────────────────── 6 · terms & acceptance ─────────────────────────── */

const SCHOOL_PROVIDES = [
  "A coordinator teacher for the day, and a date agreed in advance",
  "Two halls or large rooms (plus the assembly area) with tables or benches for building stations",
  "Power points with extension boards, a projector or screen and a sound system for the opening show",
  "Permission for photography, filming and drone flights, and parent consent forms for students",
  "Access for the JOVE team to set up from early morning, and drinking water for students and team",
  "Final grade-wise student numbers before the workshop, so kits are prepared for every child",
];

const NEXT_STEPS = [
  { t: "Accept & sign", d: "Sign this proposal below and share a copy with us." },
  { t: "Confirm the date", d: `Pay the ${joveDayRules.advancePercent}% advance and we block your date.` },
  { t: "Plan together", d: "Your coordinator and we agree halls, timings and student numbers." },
  { t: "Experience JOVE", d: `Your JOVE Day runs; media is delivered; balance due within ${joveDayRules.balanceDueDays} days.` },
];

function Terms({ c, page, index }: { c: Ctx; page: string; index: string }) {
  const { pricing: p, proposal, settings, signatory } = c;
  const notes = str(proposal.notes).trim();
  const terms = [
    `This proposal is valid until ${formatDate(str(proposal.validUntil))}. Prices are in Indian rupees and exclude GST, which is charged at ${p.gstPercent}%.`,
    `${joveDayRules.advancePercent}% advance confirms the date; the balance is due within ${joveDayRules.balanceDueDays} days of the workshop.`,
    p.packageId === "jove-day"
      ? `A JOVE Day is billed at a minimum of ${formatINR(joveDayRules.minimumBilling)} excluding GST (about ${joveDayRules.minimumStudents} students) and hosts up to ${joveDayRules.maxStudentsPerDay} students in a day.`
      : "Final student numbers are confirmed with the school before each session; billing follows the confirmed numbers.",
    "Drone filming is subject to local drone rules and the school's permission. Student photographs and film are used only with parental consent, and faces are blurred on request.",
    "Dates can be rescheduled by mutual agreement. Cancellation and rescheduling terms are confirmed in writing along with the advance.",
    "Tax treatment of this engagement should be confirmed by the school's accountant.",
  ];
  return (
    <A4Page>
      <section aria-label="Terms and acceptance">
        <RunningHead number={c.number} school={c.schoolName} section="Terms & acceptance" />
        <PageTitle index={index} eyebrow="Next steps" title="Making it happen" />

        <div className="grid grid-cols-2 gap-6">
          <div>
            <SubHeading>What the school provides</SubHeading>
            <ul className="space-y-1.5 text-[8pt] leading-[1.45] text-charcoal">
              {SCHOOL_PROVIDES.map((x) => (
                <Check key={x}>{x}</Check>
              ))}
            </ul>
          </div>
          <div>
            <SubHeading>Next steps</SubHeading>
            <ol className="space-y-2">
              {NEXT_STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-2.5">
                  <span className="grid size-[6mm] shrink-0 place-items-center rounded-full border border-graphite font-mono text-[7.5pt] font-semibold text-graphite" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[8.5pt] font-bold leading-tight text-graphite">{s.t}</p>
                    <p className="text-[7.8pt] leading-snug text-charcoal">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <SubHeading className="mt-6">Terms</SubHeading>
        <ol className="space-y-1 text-[7.8pt] leading-[1.45] text-charcoal">
          {terms.map((t, i) => (
            <li key={i} className="flex gap-2">
              <Mono className="w-4 shrink-0 text-[7pt] text-blueprint">{pad2(i + 1)}</Mono>
              <span>{t}</span>
            </li>
          ))}
        </ol>

        {notes && (
          <div className="mt-4 break-inside-avoid border-l-[3px] border-graphite bg-paper-50 px-3 py-2">
            <p className={LABEL}>Notes &amp; special terms</p>
            <p className="mt-1 whitespace-pre-line text-[8pt] leading-[1.5] text-graphite">{notes}</p>
          </div>
        )}

        <SubHeading className="mt-7">Acceptance</SubHeading>
        <p className="mb-3 text-[8pt] leading-snug text-charcoal">
          By signing, the school accepts this proposal ({c.number}) for <span className="font-semibold text-graphite">{p.pkg.name}</span> at a total of{" "}
          <span className="font-semibold text-graphite">{rupees(p.grandTotal)}</span> including GST.
        </p>
        <div className="grid grid-cols-2 gap-8">
          {[
            { head: "For the school", name: c.schoolName, sub: "Name · Designation" },
            { head: `For ${settings.brandName || "JOVE"}`, name: signatory.name, sub: signatory.title },
          ].map((b) => (
            <div key={b.head} className="break-inside-avoid">
              <p className={LABEL}>{b.head}</p>
              <p className="mt-0.5 min-h-[8mm] text-[8.5pt] font-semibold leading-tight text-graphite">{b.name}</p>
              <p className="text-[7.5pt] text-blueprint">{b.sub}</p>
              <div className="mt-9 border-b border-graphite" aria-hidden />
              <p className="mt-1 text-[7pt] uppercase tracking-[0.18em] text-blueprint">Signature &amp; seal</p>
              <div className="mt-6 flex items-end gap-3" aria-hidden>
                <span className="text-[7pt] uppercase tracking-[0.18em] text-blueprint">Date</span>
                <span className="h-px flex-1 bg-graphite" />
              </div>
            </div>
          ))}
        </div>
        <PrintFooter note={page} />
      </section>
    </A4Page>
  );
}

/* ─────────────────────────── the document ─────────────────────────── */

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="no-print w-full max-w-md rounded-[var(--radius-md)] border border-graphite/20 bg-paper p-6 text-center">
      <p className="text-sm font-semibold text-graphite">{title}</p>
      <p className="mt-1 text-sm text-charcoal">{body}</p>
    </div>
  );
}

export function ProposalPrint({ id }: { id: string }) {
  const proposals = useCollection("proposals");
  const schools = useCollection("schools");
  const { settings, loading: settingsLoading } = useSettings();
  const { store } = useHq();

  const proposal = proposals.records.find((r) => r.id === id);
  const school = proposal ? schools.records.find((s) => s.id === proposal.schoolId) : undefined;
  const pricing = useMemo(() => (proposal ? priceProposal(proposal) : null), [proposal]);

  const schoolName = str(school?.name) || "Your school";
  const number = proposal ? str(proposal.number) || "Draft proposal" : "";

  /* "Save as PDF" proposes the page title as the file name */
  useEffect(() => {
    if (!proposal) return;
    const prev = document.title;
    document.title = `${number} — Proposal for ${schoolName}`.replace(/[\\/:*?"<>|]+/g, "-");
    return () => {
      document.title = prev;
    };
  }, [proposal, number, schoolName]);

  if (proposals.loading || schools.loading || settingsLoading) {
    return (
      <PrintShell title="Proposal" back="/hq/proposals">
        <Notice title="Preparing your proposal…" body="Loading the proposal, school and company details." />
      </PrintShell>
    );
  }
  if (!proposal || !pricing) {
    return (
      <PrintShell title="Proposal" back="/hq/proposals">
        <Notice title="Proposal not found" body="It may have been deleted, or the link is out of date." />
      </PrintShell>
    );
  }

  const bands = selectedBands(proposal);
  const founder = site.founders[0];
  const signatory = { name: settings.signatoryName || founder.name, title: settings.signatoryTitle || founder.role };
  const c: Ctx = { proposal, school, schoolName, pricing, settings, number, signatory, bands };

  /* page numbering — the cover is page 1 */
  const hasProg = bands.length > 0;
  const total = hasProg ? 6 : 5;
  const mk = (n: number) => ({ page: `${number} · Page ${n} of ${total}`, index: pad2(n - 1) });
  const pAbout = mk(2);
  const pProg = hasProg ? mk(3) : null;
  const pRun = mk(hasProg ? 4 : 3);
  const pInvest = mk(hasProg ? 5 : 4);
  const pTerms = mk(hasProg ? 6 : 5);

  return (
    <PrintShell
      title={`${number} · ${schoolName}`}
      back={`/hq/proposals/${proposal.id}`}
      toolbar={
        <>
          <Badge tone={statusTone(str(proposal.status))} dot>
            {str(proposal.status) || "draft"}
          </Badge>
          <Button size="sm" variant="secondary" href={`/hq/proposals/${proposal.id}`}>
            {store.writable ? "Edit proposal" : "Open proposal"}
          </Button>
        </>
      }
    >
      <Cover c={c} />
      <About c={c} page={pAbout.page} />
      {pProg && <Programme c={c} page={pProg.page} index={pProg.index} />}
      <RunOfShow c={c} page={pRun.page} index={pRun.index} />
      <Investment c={c} page={pInvest.page} />
      <Terms c={c} page={pTerms.page} index={pTerms.index} />
    </PrintShell>
  );
}
