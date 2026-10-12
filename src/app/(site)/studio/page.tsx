import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Clapperboard, FileCheck2, Film, Scissors, Send } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { addOns, joveDayRules, joveDaySchedule, mediaPack, packages } from "@/lib/content/business";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConstructionCircle, CornerMarks, Crosshair, DimensionLine, GridBackdrop, SectionLabel, SketchDivider, SpecIndex } from "@/components/brand/Blueprint";
import { CTASection } from "@/components/site/CTASection";
import { LeadForm } from "@/components/site/LeadForm";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { ParallaxFigure } from "@/components/site/about/ParallaxFigure";
import { StudioHero } from "@/components/site/studio/StudioHero";
import { ReelsShowcase, type Reel } from "@/components/site/studio/ReelsShowcase";
import { DroneBand } from "@/components/site/studio/DroneBand";
import { CountUp } from "@/components/site/studio/CountUp";
import { FaqList, type FaqItem } from "@/components/site/studio/FaqList";

export const metadata: Metadata = {
  title: "Studio — Every JOVE Day Becomes a Film",
  description: `${site.studio.name} is JOVE's in-house cinematic studio. Every JOVE Day ships with reels, a full-day highlight film, drone shots and photos for your school — a Media Pack worth ${formatINR(mediaPack.marketValue)}, included free.`,
  alternates: { canonical: "/studio" },
  openGraph: {
    title: `${site.studio.name} × JOVE — Every JOVE Day becomes a film`,
    description: "Reels, a full-day film and drone shots of your students building robots — included with every JOVE Day.",
    images: [{ url: "/images/studio/media-crew.webp", width: 2400, height: 1340, alt: "Illustration of a film crew filming students as they build robots" }],
  },
};

/* ── data: every number and deliverable comes from business.ts ─────────────── */

const ILLUSTRATIVE = "Illustrative visual — not footage or a photograph of a past JOVE event.";

const slot = (re: RegExp) => joveDaySchedule.find((s) => re.test(s.title));
const setup = slot(/setup/i);
const opening = slot(/opening/i);
const showcase = slot(/showcase/i);
const interview = slot(/interview/i);

const deliveredIn = (days: number) => mediaPack.items.filter((i) => new RegExp(`\\b${days} working`).test(i.delivery)).map((i) => i.title.toLowerCase());
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : (xs[0] ?? ""));

const [reelsItem, filmItem, droneItem] = mediaPack.items;

const heroSpecs = [
  { k: "Reels", v: reelsItem.title },
  { k: "Film", v: filmItem.title },
  { k: "Aerials", v: droneItem.title },
  { k: "Cost to your school", v: "₹0 — included with every JOVE Day" },
];

const advantages = [
  {
    title: "One team, one plan",
    body: "Our media lead works from the same run-of-day as the trainers — so the camera is already at the table when a robot moves for the first time.",
  },
  {
    title: "Shot for your school, not for us",
    body: "Framed and edited for the places you actually use media: your admissions page, the annual-day screen, parent WhatsApp groups and your social handles.",
  },
  {
    title: "Included, not upsold",
    body: `The Media Pack is part of every JOVE Day. No separate quote, no second vendor to brief, no extra invoice — a ${formatINR(mediaPack.marketValue)} production at no cost to the school.`,
  },
];

const phases = [
  {
    icon: FileCheck2,
    name: "Pre-production",
    when: "Before the day",
    points: [
      "Photography and drone permission confirmed with the school",
      "Media consent forms shared for the school to collect",
      "Shot list built around your day plan, campus and crest",
      "Airspace check for your campus location",
    ],
  },
  {
    icon: Clapperboard,
    name: "Shoot day",
    when: setup && interview ? `${setup.time} – ${interview.end}` : "JOVE Day",
    points: [
      `${setup?.time ?? "07:30"} — media rig set up, drone pre-flight checks`,
      `${opening?.time ?? "08:30"} — opening robot + drone show, filmed for the reels`,
      "All day — a dedicated media lead moves between both halls",
      `${showcase?.time ?? "15:20"} — showcase, certificates and the closing drone shot`,
      `${interview?.time ?? "15:50"} — principal interview`,
    ],
  },
  {
    icon: Scissors,
    name: "Edit",
    when: "Working days 1 – 10",
    points: ["Footage backed up on the day", "Selects, music sync and colour grade", "Faces blurred wherever requested", "Captions, hashtags and a posting schedule written"],
  },
  {
    icon: Send,
    name: "Delivery",
    when: "5 & 10 working days",
    points: [`Within 5 working days — ${list(deliveredIn(5))}`, `Within 10 working days — ${list(deliveredIn(10))}`, "Delivered digitally to your school's point of contact"],
  },
];

const reels: Reel[] = [
  {
    clip: "kids-build",
    title: "The build",
    caption: "Hands on. Heads down. First robot of the day.",
    label: "Illustrative footage, cropped vertically: close-up of students' hands assembling a small robot",
    position: "50% 50%",
  },
  {
    clip: "trainer",
    title: "The spark",
    caption: "The moment the whole class leans in.",
    label: "Illustrative footage, cropped vertically: a trainer demonstrating a robotic arm to a class of excited students",
    position: "42% 50%",
  },
  {
    clip: "drone",
    title: "The scale",
    caption: "One campus. One day. Every student building.",
    label: "Illustrative footage, cropped vertically: aerial view of a school campus with students standing in a circle",
    position: "50% 50%",
  },
];

const studioServices = addOns.filter((a) => a.owner === site.studio.name);
const retainers = studioServices.filter((a) => a.unit === "month");
const films = studioServices.filter((a) => a.unit !== "month");
const features = (detail: string) =>
  detail
    .replace(/\.$/, "")
    .split(/,\s+(?![^(]*\))/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
const tierName = (name: string) => name.split("—").pop()?.trim() ?? name;
const yearPerk = packages.find((p) => p.id === "jove-year")?.includes.find((i) => /Social Media Management/i.test(i));

const faq: FaqItem[] = [
  {
    q: "Who can use the films, reels and photos?",
    a: (
      <>
        <p>{mediaPack.rights}</p>
        <p className="mt-3">In short: it is your school&apos;s media to use. Post it, play it at your annual day, put it on your admissions page.</p>
      </>
    ),
  },
  {
    q: "How is consent handled before filming?",
    a: (
      <p>
        We film only with the school&apos;s permission. Before the day we share a media consent form for the school to circulate and collect from parents, and we ask for the
        list of students who should not be filmed. Our media lead is briefed on that list before the first session starts.
      </p>
    ),
  },
  {
    q: "What if a parent or student does not want to be on camera?",
    a: (
      <p>
        That is completely fine — and it never affects the student&apos;s place in the workshop. Tell us before the day and we frame around those students while shooting.
        Where a student still appears in a shot, their face is blurred in the edit on request.
      </p>
    ),
  },
  {
    q: "Will JOVE post videos of our students on its own channels?",
    a: (
      <p>
        Only within the terms above: JOVE may show the media in its portfolio, with students&apos; faces blurred on request and consent forms collected. If your school would
        prefer that we do not feature it at all, tell us before the day and we will agree it in writing.
      </p>
    ),
  },
  {
    q: "When do we receive everything?",
    a: (
      <ul className="space-y-1.5">
        {mediaPack.items.map((i) => (
          <li key={i.title} className="flex flex-wrap gap-x-2">
            <span className="font-semibold">{i.title}</span>
            <span aria-hidden>—</span>
            <span>{i.delivery.charAt(0).toLowerCase() + i.delivery.slice(1)}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    q: "What if a drone cannot be flown at our campus?",
    a: (
      <p>
        Drone shots are subject to local drone rules and your school&apos;s permission. If your campus is in restricted airspace, the weather is unsafe or you would simply
        rather we did not fly, we replace the aerials with elevated ground shots. Everything else in the Media Pack stays the same.
      </p>
    ),
  },
  {
    q: "Is the Media Pack really free?",
    a: (
      <p>
        Yes. It is included with every JOVE Day (minimum {joveDayRules.minimumStudents} students) at no extra charge. We value it at {formatINR(mediaPack.marketValue)} —
        our estimate of what commissioning a comparable shoot and edit separately would cost.
      </p>
    ),
  },
];

const heading = "text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em]";

export default function StudioPage() {
  const wa = whatsappLink(`Hi JOVE — I'd like to know more about ${site.studio.name} services for our school.`);

  return (
    <>
      {/* 01 — HERO */}
      <StudioHero studioUrl={site.studio.url} specs={heroSpecs} />

      {/* 02 — THE FIRST-OF-ITS-KIND PART */}
      <section aria-labelledby="first-title" className="relative border-t border-graphite/10 bg-paper-50 py-24 sm:py-32">
        <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-bp relative grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <SectionLabel index="02">The first-of-its-kind part</SectionLabel>
            </Reveal>
            <h2 id="first-title" className={`mt-6 text-graphite ${heading}`}>
              <RevealLines lines={["A workshop company", "with a film studio", "inside it."]} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-charcoal sm:text-lg">
                Schools usually hire a workshop team and a videographer separately — and the videographer has never seen the session plan. At JOVE they are one team.{" "}
                {site.studio.name}, founded by our co-founder {site.founders[1].name}, is built into every visit. As far as we know, no other school Robotics &amp; AI workshop
                brings its own cinematic studio.
              </p>
            </Reveal>
            <ol className="mt-10">
              {advantages.map((a, i) => (
                <Reveal as="li" key={a.title} delay={0.1 + i * 0.08} className="grid grid-cols-[36px_1fr] gap-4 border-t border-graphite/12 py-5">
                  <SpecIndex n={i + 1} className="pt-1" />
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.015em] text-graphite">{a.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-charcoal">{a.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal delay={0.15} className="lg:col-span-6">
            <ParallaxFigure
              src="/images/studio/media-crew.webp"
              alt="Black-and-white illustration of a film crew filming students as they build robots at a classroom table"
              sizes="(max-width: 1024px) 100vw, 50vw"
              frameClassName="aspect-[4/3] lg:aspect-[5/6]"
              objectPosition="55% 50%"
              fig="Fig. 01 — Crew on the classroom floor"
              caption={ILLUSTRATIVE}
            />
          </Reveal>
        </div>
      </section>

      {/* 03 — PRODUCTION BOARD */}
      <section aria-labelledby="board-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
        <GridBackdrop dark />
        <ConstructionCircle size={720} className="pointer-events-none absolute -right-64 -top-48 hidden text-paper/[0.06] lg:block" />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="03" light>
                  Production board
                </SectionLabel>
              </Reveal>
              <h2 id="board-title" className={`mt-6 ${heading}`}>
                <RevealLines lines={["From first call sheet", "to final cut."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-base leading-relaxed text-paper/70">
                Every JOVE Day is run like a small film production. Four stages, six deliverables, and two delivery dates your school can plan a launch post around.
              </p>
            </Reveal>
          </div>

          {/* stages */}
          <ol className="relative mt-14 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15 md:grid-cols-2 xl:grid-cols-4">
            {phases.map((p, i) => (
              <Reveal as="li" key={p.name} delay={i * 0.08} className="group relative bg-graphite p-6 transition-colors duration-500 hover:bg-ink sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-full border border-paper/25 transition-colors duration-500 group-hover:border-paper/60">
                    <p.icon className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.18em] text-paper/45">STAGE {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-[-0.02em]">{p.name}</h3>
                <p className="annot mt-1 font-mono text-paper/55">{p.when}</p>
                <ul className="mt-5 space-y-2.5 border-t border-dashed border-paper/20 pt-5">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2.5 text-[14px] leading-relaxed text-paper/70">
                      <span aria-hidden className="mt-[10px] h-px w-3 shrink-0 bg-paper/50" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ol>

          <SketchDivider light className="my-16 sm:my-20" />

          {/* deliverables */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h3 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">What lands in your inbox</h3>
            <p className="annot font-mono text-paper/50">
              {mediaPack.items.length} deliverables · {mediaPack.name}
            </p>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mediaPack.items.map((item, i) => (
              <Reveal as="li" key={item.title} delay={(i % 3) * 0.08}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-ink/50 transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-paper/35">
                  <CornerMarks className="text-paper/40" />
                  {/* slate stripe */}
                  <div aria-hidden className="h-3 w-full bg-[repeating-linear-gradient(115deg,rgb(245_241_232/0.85)_0_16px,transparent_16px_32px)] opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex items-center justify-between border-b border-paper/12 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
                    <span>Deliverable {String(i + 1).padStart(2, "0")}</span>
                    <span>Take 01</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h4 className="text-xl font-bold tracking-[-0.02em]">{item.title}</h4>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-paper/65">{item.detail}</p>
                    <p className="mt-auto flex items-center gap-2 pt-6 text-[13px] font-semibold">
                      <Film className="size-4 text-paper/60" strokeWidth={1.5} aria-hidden />
                      <span className="sr-only">Delivery: </span>
                      {item.delivery}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 — REELS */}
      <section aria-labelledby="reels-title" className="relative overflow-hidden py-24 sm:py-32">
        <GridBackdrop />
        <Crosshair className="absolute right-[7%] top-16 hidden md:block" />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="04">Reels</SectionLabel>
              </Reveal>
              <h2 id="reels-title" className={`mt-6 text-graphite ${heading}`}>
                <RevealLines lines={["Made for the feed", "your parents scroll."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-[15px] leading-relaxed text-charcoal">
                <strong className="font-semibold text-graphite">{reelsItem.title}</strong> with every JOVE Day. {reelsItem.detail} They arrive{" "}
                {reelsItem.delivery.toLowerCase()}, with captions and a posting schedule.
              </p>
            </Reveal>
          </div>
          <div className="mt-12 sm:mt-16">
            <ReelsShowcase reels={reels} note="Illustrative sample framings — not footage of a past JOVE event. Your reels are cut from your own JOVE Day." />
          </div>
        </div>
      </section>

      {/* 05 — DRONE */}
      <DroneBand labelledBy="drone-title">
        <div className="container-bp relative flex min-h-[720px] flex-col justify-end pb-16 pt-40 sm:min-h-[92svh] sm:pb-24">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="05" light>
                  Drone aerials
                </SectionLabel>
              </Reveal>
              <h2 id="drone-title" className="mt-6 text-[clamp(2.4rem,6.4vw,5.6rem)] font-bold leading-[0.96] tracking-[-0.035em]">
                <RevealLines lines={["Your whole school,", "from the sky."]} />
              </h2>
              <Reveal delay={0.2}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/75 sm:text-lg">
                  The shot no phone camera can get: campus establishing shots and a whole-school formation, captured from the air and cut into your highlight film.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.25} className="lg:col-span-5">
              <aside aria-label="Drone compliance" className="relative rounded-[var(--radius-md)] border border-paper/20 bg-ink/65 p-6 backdrop-blur-md sm:p-7">
                <CornerMarks className="text-paper/45" />
                <p className="annot flex items-center justify-between text-paper/55">
                  <span>Drone compliance</span>
                  <span className="font-mono">Pre-flight</span>
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    "We fly only with your school's written permission.",
                    "Flights follow India's DGCA drone rules, including an airspace check for your campus before the day.",
                    `Pre-flight safety checks are part of our ${setup?.time ?? "07:30"} setup, every time.`,
                    "No permission, restricted airspace or unsafe weather? We don't fly — and use elevated ground shots instead.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-[14px] leading-relaxed text-paper/80">
                      <Check className="mt-0.5 size-4 shrink-0 text-paper/60" strokeWidth={1.75} aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-dashed border-paper/20 pt-4 text-xs leading-relaxed text-paper/50">
                  Drone regulations depend on location and change over time. We confirm what applies to your campus before every JOVE Day. {ILLUSTRATIVE}
                </p>
              </aside>
            </Reveal>
          </div>
        </div>
      </DroneBand>

      {/* 06 — WHAT IT'S WORTH */}
      <section aria-labelledby="worth-title" className="relative overflow-hidden border-b border-graphite/10 bg-paper-200/60 py-24 sm:py-32">
        <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-bp relative grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <SectionLabel index="06">What it&apos;s worth</SectionLabel>
            </Reveal>
            <h2 id="worth-title" className="mt-6 text-graphite">
              <span className="sr-only">
                A {formatINR(mediaPack.marketValue)} production, free with every JOVE Day.
              </span>
              <span aria-hidden className="block font-mono text-[clamp(3.4rem,11vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.05em]">
                <CountUp value={mediaPack.marketValue} prefix="₹" />
              </span>
              <span aria-hidden className={`mt-4 block ${heading}`}>
                <RevealLines lines={["of production.", "Free with every JOVE Day."]} />
              </span>
            </h2>
            <DimensionLine className="mt-8 max-w-md" label="MARKET VALUE" />
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-charcoal sm:text-lg">
                A full shoot day with camera and drone, followed by days of editing, is a real production budget. We absorb it — because a school that can
                show its students building robots is a school that books us again.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-blueprint">
                {formatINR(mediaPack.marketValue)} is our estimate of what commissioning a comparable shoot and edit separately would cost. It is included with every
                JOVE Day (minimum {joveDayRules.minimumStudents} students).
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/contact" size="lg" arrow>
                  Book a JOVE Day
                </Button>
                <Button href="/packages" variant="secondary" size="lg">
                  See packages
                </Button>
              </div>
            </Reveal>
          </div>

          {/* estimate sheet */}
          <Reveal delay={0.15} className="lg:col-span-6">
            <div className="relative mx-auto max-w-xl rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-lift)] lg:rotate-[1.2deg]">
              <CornerMarks />
              <div className="flex items-center justify-between border-b border-graphite/12 px-6 py-4">
                <p className="text-sm font-bold tracking-[-0.01em] text-graphite">{mediaPack.name}</p>
                <p className="annot font-mono text-blueprint">Estimate</p>
              </div>
              <table className="w-full text-left text-[14px]">
                <caption className="sr-only">What is included in the Media Pack and what the school pays</caption>
                <thead>
                  <tr className="annot text-blueprint">
                    <th scope="col" className="px-6 pb-2 pt-4 text-left font-medium">
                      Line item
                    </th>
                    <th scope="col" className="px-6 pb-2 pt-4 text-right font-medium">
                      School pays
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mediaPack.items.map((item, i) => (
                    <tr key={item.title} className="border-t border-dashed border-graphite/15">
                      <th scope="row" className="px-6 py-3 text-left font-medium text-graphite">
                        <span className="mr-3 font-mono text-xs text-blueprint">{String(i + 1).padStart(2, "0")}</span>
                        {item.title}
                      </th>
                      <td className="px-6 py-3 text-right font-mono text-charcoal">Included</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-graphite/25">
                    <th scope="row" className="px-6 pt-4 text-left font-medium text-charcoal">
                      Estimated market value
                    </th>
                    <td className="px-6 pt-4 text-right font-mono text-charcoal line-through decoration-graphite/60">{formatINR(mediaPack.marketValue)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-6 pb-5 pt-2 text-left text-lg font-bold text-graphite">
                      With a JOVE Day
                    </th>
                    <td className="px-6 pb-5 pt-2 text-right font-mono text-2xl font-medium text-graphite">₹0</td>
                  </tr>
                </tfoot>
              </table>
              <div aria-hidden className="hatch h-3 rounded-b-[var(--radius-md)] opacity-60" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 07 — STUDIO SERVICES */}
      <section aria-labelledby="services-title" className="relative overflow-hidden py-24 sm:py-32">
        <GridBackdrop vignette={false} className="opacity-70" />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="07">Studio services for schools</SectionLabel>
              </Reveal>
              <h2 id="services-title" className={`mt-6 text-graphite ${heading}`}>
                <RevealLines lines={["Keep the camera", "rolling all year."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-[15px] leading-relaxed text-charcoal">
                The Media Pack covers your JOVE Day. If you want the same crew working on your school&apos;s story every month — or one film that carries your admissions
                season — {site.studio.name} offers these as optional add-ons.
              </p>
            </Reveal>
          </div>

          {/* retainers */}
          <div className="mt-14 flex items-center gap-4">
            <h3 className="annot shrink-0 text-blueprint">Social media management · monthly</h3>
            <span aria-hidden className="h-px flex-1 bg-graphite/15" />
          </div>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {retainers.map((r, i) => (
              <Reveal as="li" key={r.id} delay={i * 0.08}>
                <article className="group relative flex h-full flex-col rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
                  <CornerMarks />
                  <header className="border-b border-graphite/10 p-6">
                    <p className="annot flex items-center justify-between text-blueprint">
                      <span>Tier {String(i + 1).padStart(2, "0")}</span>
                      <span className="font-mono">SMM</span>
                    </p>
                    <h4 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-graphite">{tierName(r.name)}</h4>
                    <p className="mt-4 flex items-baseline gap-2">
                      <span className="font-mono text-[2rem] font-medium leading-none tracking-tight text-graphite">{formatINR(r.priceValue)}</span>
                      <span className="text-sm text-blueprint">/ {r.unit}</span>
                    </p>
                  </header>
                  <ul className="flex-1 space-y-3 p-6">
                    {features(r.detail).map((f) => (
                      <li key={f} className="flex gap-3 text-[14px] leading-relaxed text-charcoal">
                        <Check className="mt-0.5 size-4 shrink-0 text-graphite" strokeWidth={1.75} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="p-6 pt-0">
                    <Button href="#studio-enquiry" variant="secondary" className="w-full">
                      Ask about {tierName(r.name)}
                    </Button>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
          {yearPerk && (
            <Reveal delay={0.1}>
              <p className="mt-5 flex items-start gap-3 rounded-[var(--radius-sm)] border border-dashed border-graphite/30 bg-paper/70 px-5 py-4 text-[14px] leading-relaxed text-charcoal">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-graphite" />
                <span>
                  <strong className="font-semibold text-graphite">JOVE Year partner schools:</strong> {yearPerk.charAt(0).toLowerCase() + yearPerk.slice(1)}.
                </span>
              </p>
            </Reveal>
          )}

          {/* films */}
          <div className="mt-16 flex items-center gap-4">
            <h3 className="annot shrink-0 text-blueprint">Films · per project</h3>
            <span aria-hidden className="h-px flex-1 bg-graphite/15" />
          </div>
          <ul className="mt-6 grid gap-5 lg:grid-cols-2">
            {films.map((f, i) => (
              <Reveal as="li" key={f.id} delay={i * 0.1}>
                <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] bg-graphite text-paper shadow-[var(--shadow-lift)]">
                  <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-70" />
                  <div aria-hidden className="hatch-light absolute inset-y-0 right-0 w-1/3 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />
                  <CornerMarks className="text-paper/40" />
                  <div className="relative flex flex-1 flex-col p-6 sm:p-8">
                    <p className="annot flex items-center justify-between text-paper/50">
                      <span>Film {String(i + 1).padStart(2, "0")}</span>
                      <span className="font-mono">Per {f.unit}</span>
                    </p>
                    <h4 className="mt-3 text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-tight tracking-[-0.025em]">{f.name}</h4>
                    <p className="mt-4 font-mono text-[2.25rem] font-medium leading-none tracking-tight">{formatINR(f.priceValue)}</p>
                    <ul className="mt-7 grid gap-x-6 gap-y-3 border-t border-paper/15 pt-6 sm:grid-cols-2">
                      {features(f.detail).map((x) => (
                        <li key={x} className="flex gap-3 text-[14px] leading-relaxed text-paper/75">
                          <Check className="mt-0.5 size-4 shrink-0 text-paper/60" strokeWidth={1.75} aria-hidden />
                          {x}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-8">
                      <Button href="#studio-enquiry" variant="outline-light" arrow>
                        Enquire about this film
                      </Button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-blueprint">
            Taxes as applicable. Advertising spend for campaigns is extra. A written quote and scope are shared before any work begins.
          </p>
        </div>
      </section>

      {/* 08 — CONSENT, PRIVACY & RIGHTS */}
      <section aria-labelledby="faq-title" className="relative border-y border-graphite/10 bg-paper-50 py-24 sm:py-32">
        <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-bp relative grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <SectionLabel index="08">Consent, privacy &amp; rights</SectionLabel>
              </Reveal>
              <h2 id="faq-title" className="mt-6 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
                <RevealLines lines={["Children first.", "Camera second."]} />
              </h2>
              <Reveal delay={0.2}>
                <p className="mt-6 text-[15px] leading-relaxed text-charcoal">
                  Filming students is a responsibility before it is a feature. Here is exactly how permission, privacy and usage rights work.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-graphite">
                  <Link href="/privacy" className="underline decoration-graphite/30 underline-offset-4 transition-colors hover:decoration-graphite">
                    Privacy policy
                  </Link>
                  <Link href="/about" className="underline decoration-graphite/30 underline-offset-4 transition-colors hover:decoration-graphite">
                    Our commitments
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
          <Reveal delay={0.1} className="lg:col-span-8">
            <FaqList items={faq} group="studio-faq" />
          </Reveal>
        </div>
      </section>

      {/* 09 — ENQUIRY */}
      <section id="studio-enquiry" aria-labelledby="enquiry-title" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
        <GridBackdrop />
        <div className="container-bp relative grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel index="09">Talk to the studio</SectionLabel>
            </Reveal>
            <h2 id="enquiry-title" className={`mt-6 text-graphite ${heading}`}>
              <RevealLines lines={["Tell us the story", "your school wants", "to tell."]} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal">
                Social media management, an admissions film, or questions about the Media Pack — send a note and a founder will call you back within one working day.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="relative mt-10 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-paper)]">
                <CornerMarks />
                <p className="annot text-blueprint">The studio behind JOVE</p>
                <p className="mt-2 text-xl font-bold tracking-[-0.02em] text-graphite">{site.studio.name}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-charcoal">
                  Founded by {site.founders[1].name}, {site.founders[1].role} of JOVE. See the studio&apos;s own site for its wider work.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button href={site.studio.url} external variant="secondary">
                    Visit {site.studio.name} <ArrowUpRight className="size-4" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </Button>
                  {wa && (
                    <Button href={wa} external variant="ghost">
                      WhatsApp us
                      <span className="sr-only">(opens in a new tab)</span>
                    </Button>
                  )}
                </div>
                {(site.contact.email || site.contact.phone) && (
                  <dl className="mt-5 space-y-1.5 border-t border-dashed border-graphite/20 pt-4 text-[14px]">
                    {site.contact.email && (
                      <div className="flex gap-3">
                        <dt className="annot w-14 shrink-0 pt-0.5 text-blueprint">Email</dt>
                        <dd>
                          <a href={`mailto:${site.contact.email}`} className="break-all font-semibold text-graphite underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
                            {site.contact.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {site.contact.phone && (
                      <div className="flex gap-3">
                        <dt className="annot w-14 shrink-0 pt-0.5 text-blueprint">Phone</dt>
                        <dd>
                          <a href={`tel:${site.contact.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-graphite underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
                            {site.contact.phone}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-7">
            <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-lift)] sm:p-10">
              <CornerMarks />
              <p className="annot mb-6 flex items-center justify-between text-blueprint">
                <span>Studio enquiry</span>
                <span className="font-mono">Form S-01</span>
              </p>
              <LeadForm kind="studio" submitLabel="Send studio enquiry" />
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection
        eyebrow="Roll camera"
        title={["Book the day.", "Keep the film."]}
        body="A full day of hands-on Robotics & AI for your students — and reels, a highlight film and drone shots for your school, included."
        primary={{ label: "Book a JOVE Day", href: "/contact" }}
        secondary={{ label: "See packages & pricing", href: "/packages" }}
      />
    </>
  );
}
