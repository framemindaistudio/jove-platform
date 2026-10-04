import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDownRight } from "lucide-react";
import { gradeBands, joveDayRules, mediaPack } from "@/lib/content/business";
import { formatINR, formatNumber, pad2 } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CornerMarks, GridBackdrop } from "@/components/brand/Blueprint";
import { PageHero } from "@/components/site/PageHero";
import { CTASection } from "@/components/site/CTASection";
import { Reveal } from "@/components/site/Reveal";
import { BandTrack, type TrackItem } from "@/components/site/programs/BandTrack";
import { BandSection } from "@/components/site/programs/BandSection";
import { DaySchedule } from "@/components/site/programs/DaySchedule";
import { BringProvide } from "@/components/site/programs/BringProvide";
import { CurriculumAlignment, SafetyPanel } from "@/components/site/programs/Assurance";
import { SectionHeading } from "@/components/site/programs/SectionHeading";
import { DAY_END, DAY_SPAN, DAY_START, TEAM_ON_SITE, dayBlocks, fmtDuration, gradeRange, toClock } from "@/components/site/programs/data";

export const metadata: Metadata = {
  title: "Programs — Robotics & AI Workshops for Grades 1–10",
  description:
    "Four age-specific, hands-on Robotics & AI sessions for Grades 1–10 — minute-by-minute run sheets, learning outcomes, kits, free Virtual Labs and a full JOVE Day plan for your campus, filmed by our in-house studio.",
  alternates: { canonical: "/programs" },
  openGraph: {
    title: "JOVE Programs — Little Inventors to AI Innovators",
    description: "Hands-on Robotics & AI for Grades 1–10, one full day on your campus, with reels, a full-day film and drone shots for your school.",
    images: [{ url: "/images/age/age-3.webp", width: 1600, height: 1195, alt: "Pencil blueprint sketch of an Arduino obstacle-avoiding robot car" }],
  },
};

const durations = gradeBands.map((b) => b.durationMin);
const facts = [
  { k: "Grades", v: "1 – 10", s: `${gradeBands.length} age-specific groups` },
  { k: "Session length", v: `${fmtDuration(Math.min(...durations))} – ${fmtDuration(Math.max(...durations))}`, s: "planned to the minute" },
  { k: "One JOVE Day", v: `${toClock(DAY_START)} – ${toClock(DAY_END)}`, s: `up to ${formatNumber(joveDayRules.maxStudentsPerDay)} students` },
  { k: "Media Pack", v: "Included", s: `≈ ${formatINR(mediaPack.marketValue)} market value` },
];

export default function ProgramsPage() {
  const items: TrackItem[] = gradeBands.map((b, i) => ({ id: b.id, index: pad2(i + 1), grades: b.grades, range: gradeRange(b), name: b.name }));
  const blocks = dayBlocks();

  return (
    <>
      <PageHero
        eyebrow="Programs"
        index="01"
        title={["Every grade", "builds", "something real."]}
        intro={
          <>
            Every JOVE session is age-specific, hands-on and planned to the minute — from a glowing cardboard robot in Grade 1 to an AI that sees in Grade 10. Each one ends with a working build, a certificate, and footage from our own film studio.
          </>
        }
        aside={
          <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50/90 p-2 shadow-[var(--shadow-lift)] backdrop-blur-sm">
            <CornerMarks className="text-graphite/40" />
            <p className="annot px-4 pb-1 pt-3 text-blueprint">Programme index · JOVE Day prices</p>
            <ul>
              {gradeBands.map((b, i) => (
                <li key={b.id} className="border-t border-graphite/10 first:border-t-0">
                  <a href={`#${b.id}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[var(--radius-sm)] px-4 py-3.5 transition-colors hover:bg-graphite/[0.04]">
                    <span className="font-mono text-[11px] text-blueprint">{pad2(i + 1)}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[15px] font-semibold text-graphite">
                        {b.name}
                        <ArrowDownRight className="size-3.5 text-blueprint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      </span>
                      <span className="block truncate text-xs text-blueprint">
                        {b.grades} · {fmtDuration(b.durationMin)} · {b.theme}
                      </span>
                    </span>
                    <span className="text-right font-mono text-sm text-graphite tabular">
                      {formatINR(b.pricePerStudent)}
                      <span className="block font-sans text-[10px] text-blueprint">per student</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="border-t border-graphite/10 px-4 py-3 text-[11px] text-blueprint">Ex-GST · kits, certificates &amp; Media Pack included</p>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/packages#estimate" size="lg" arrow>
            Estimate for your school
          </Button>
          <Button href="#jove-day" variant="secondary" size="lg">
            See the day plan
          </Button>
        </div>
      </PageHero>

      {/* quick facts */}
      <section aria-label="At a glance" className="relative bg-graphite text-paper">
        <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-70" />
        <dl className="container-bp relative grid grid-cols-2 lg:grid-cols-4">
          {facts.map((f, i) => (
            <Reveal key={f.k} delay={i * 0.06} className="border-paper/10 py-7 pr-4 [&:nth-child(n+3)]:border-t lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0 lg:[&:nth-child(n+3)]:border-t-0">
              <dt className="annot text-paper/50">{f.k}</dt>
              <dd className="mt-2 font-mono text-lg font-medium tracking-tight sm:text-2xl">{f.v}</dd>
              <dd className="mt-1 text-xs text-paper/55">{f.s}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <BandTrack items={items}>
        {gradeBands.map((band, i) => (
          <BandSection key={band.id} band={band} n={i} total={gradeBands.length} />
        ))}
      </BandTrack>

      {/* A JOVE Day on your campus */}
      <section id="jove-day" aria-labelledby="jove-day-title" className="relative scroll-mt-20 overflow-hidden bg-graphite py-24 text-paper sm:py-32">
        <div aria-hidden className="absolute inset-0 opacity-[0.12]">
          <Image src="/images/studio/drone-campus.webp" alt="" fill sizes="100vw" quality={60} className="object-cover grayscale" />
        </div>
        <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-80" />
        <div className="container-bp relative">
          <SectionHeading
            light
            index="02"
            eyebrow="A JOVE Day on your campus"
            id="jove-day-title"
            title={["Two halls in parallel.", "The whole school, one day."]}
            intro={`Hall A runs the senior sessions, Hall B the junior ones, and the whole school gathers for the opening show and the closing ceremony. ${TEAM_ON_SITE} people from JOVE run the day; our film crew captures all of it.`}
            aside={
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15">
                {[
                  ["Team on site", `${TEAM_ON_SITE} people`],
                  ["On campus", `${toClock(DAY_START)} – ${toClock(DAY_END)}`],
                  ["Minimum", `${formatNumber(joveDayRules.minimumStudents)} students`],
                  ["Capacity", `${formatNumber(joveDayRules.maxStudentsPerDay)} / day`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-graphite px-4 py-4">
                    <dt className="annot text-paper/50">{k}</dt>
                    <dd className="mt-1.5 font-mono text-lg tracking-tight">{v}</dd>
                  </div>
                ))}
              </dl>
            }
          />
          <div className="mt-14">
            <DaySchedule blocks={blocks} start={DAY_START} span={DAY_SPAN} />
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-paper/55">
            A sample day for a full Grades 1–10 booking. We adapt the halls, batches and timings to your timetable — schools with larger grade groups get an overflow batch in the afternoon.
          </p>
        </div>
      </section>

      {/* Bring vs provide */}
      <section aria-labelledby="bring-title" className="relative overflow-hidden py-24 sm:py-32">
        <GridBackdrop />
        <div className="container-bp relative">
          <SectionHeading
            index="03"
            eyebrow="Logistics"
            id="bring-title"
            title={["What we bring.", "What your school provides."]}
            intro="We arrive self-sufficient. Your coordinator's checklist is short — and we share it with the confirmation."
          />
          <div className="mt-14">
            <BringProvide />
          </div>
        </div>
      </section>

      {/* Curriculum alignment */}
      <section aria-labelledby="align-title" className="relative overflow-hidden border-t border-graphite/10 bg-paper-200/60 py-24 sm:py-32">
        <div aria-hidden className="bp-grid absolute inset-0 opacity-50" />
        <div className="container-bp relative">
          <SectionHeading
            index="04"
            eyebrow="Curriculum alignment"
            id="align-title"
            title={["Built around what", "your students already learn."]}
            intro="Sessions are designed to support NEP 2020's push for experiential learning and coding, board science and computer outcomes, and the Atal Tinkering Lab way of working."
          />
          <div className="mt-14">
            <CurriculumAlignment />
          </div>
        </div>
      </section>

      {/* Safety */}
      <section aria-labelledby="safety-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
        <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-80" />
        <div className="container-bp relative">
          <SectionHeading light index="05" eyebrow="Safety" id="safety-title" title={["Safe by design.", "Supervised all day."]} intro="Children's safety comes before every build, every shot and every drone flight." />
          <div className="mt-14">
            <SafetyPanel />
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Next step"
        title={["See what your", "JOVE Day costs."]}
        body="Enter your students by grade group and get an instant, itemised estimate — then send it to us for a formal proposal."
        primary={{ label: "Estimate your quote", href: "/packages#estimate" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />
    </>
  );
}
