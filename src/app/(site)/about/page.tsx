import { Fragment } from "react";
import type { Metadata } from "next";
import { BatteryCharging, Camera, GraduationCap, ShieldCheck } from "lucide-react";
import { site } from "@/lib/site";
import { gradeBands, joveDayRules, kits, packages, targets } from "@/lib/content/business";
import { labStages, labs, proLabs } from "@/lib/content/labs";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConstructionCircle, CornerMarks, Crosshair, DimensionLine, GridBackdrop, SectionLabel, SketchDivider, SpecIndex } from "@/components/brand/Blueprint";
import { PageHero } from "@/components/site/PageHero";
import { CTASection } from "@/components/site/CTASection";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { ParallaxFigure } from "@/components/site/about/ParallaxFigure";
import { VisionationDiagram } from "@/components/site/about/VisionationDiagram";
import { ValueFigure } from "@/components/site/about/ValueFigure";
import { brandValues } from "@/components/site/about/values";
import { ModelLoop, type LoopNode } from "@/components/site/about/ModelLoop";
import { FounderAvatar } from "@/components/site/about/FounderAvatar";
import { Roadmap, type RoadmapStep } from "@/components/site/about/Roadmap";

export const metadata: Metadata = {
  title: "About — Our Story, Mission & Founders",
  description:
    "Why JOVE exists, what Journey of Visionation & Excellence means, and the two founders building India's first school Robotics & AI workshop with its own in-house cinematic film studio.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About JOVE — Journey of Visionation & Excellence",
    description: "Hands-on Robotics & AI for Grades 1–10, filmed by our own studio. Our story, mission, values and founders.",
    images: [{ url: "/images/studio/trainer-class.webp", width: 2400, height: 1340, alt: "Illustration of a trainer demonstrating a robotic arm to a class" }],
  },
};

/* ── page data (everything numeric comes from business.ts / labs.ts) ─────────── */

const problems = [
  {
    n: "01",
    problem: "Learning stays on paper.",
    detail: "Robotics and AI often arrive as a chapter to memorise. Without parts on the table, the ideas stay abstract — and curiosity fades before it turns into skill.",
    answer: "Every student builds.",
    answerDetail: `Full-day, grade-wise sessions with a kit at every team station and trainers at every table — from ${gradeBands[0].grades} to ${gradeBands[gradeBands.length - 1].grades}.`,
  },
  {
    n: "02",
    problem: "Innovation stays invisible.",
    detail: "Schools do remarkable work in STEM, but rarely have the crew or the time to capture it. Parents and prospective families seldom get to see it.",
    answer: "Every JOVE Day becomes a film.",
    answerDetail: `Our in-house studio, ${site.studio.name}, delivers reels, a full-day film and drone shots — included with every JOVE Day.`,
  },
  {
    n: "03",
    problem: "A lab needs more than equipment.",
    detail: "Kits change outcomes only when students spend real hours with them, guided by someone who has built the thing before.",
    answer: "We bring the whole system.",
    answerDetail: "Curriculum, trainers, kits and a day plan — and the learning continues at home with free Virtual Labs.",
  },
];

const nameParts = [
  { letter: "J", word: "Journey", body: "Learning is a path, not a period. A child who meets robots in Grade 1 can be training an AI by Grade 10 — so JOVE is built as levels, not one-off events." },
  { letter: "O", word: "The ring & the arm", body: "In our mark, a robotic arm rises out of the O — a mechanical joint drawn like a blueprint. Ideas need a body before they can move the world." },
  { letter: "V", word: "Visionation", body: "Our own word: vision + innovation. Vision is seeing what could be; innovation is making it real. Visionation is the moment a student does both." },
  { letter: "E", word: "Excellence", body: "Not perfection — the habit of doing things properly. Precise sessions, safe kits and films worth sharing, every single time." },
];

const mrps = kits.map((k) => k.mrp);
const loopNodes: LoopNode[] = [
  { n: "01", mode: "Offline · at school", title: "JOVE Day", line: `Full-day, hands-on sessions for ${gradeBands[0].grades.replace("Grades ", "Grades ")}… up to Grade 10.`, href: "/programs" },
  { n: "02", mode: "Studio · FrameMind", title: "Media Pack", line: "Reels, a full-day film and drone shots — free.", href: "/studio" },
  { n: "03", mode: "Online · free", title: "Virtual Labs", line: labStages.map((s) => s.label).join(" → "), href: "/labs" },
  { n: "04", mode: "Online · at home", title: "Kit Store", line: `Kits from ${formatINR(Math.min(...mrps))} to ${formatINR(Math.max(...mrps))} to keep building.`, href: "/shop" },
];
loopNodes[0].line = "Full-day, hands-on sessions for Grades 1–10, in your school.";

const founderRoles: Record<string, { area: string; detail: string }[]> = {
  shivaprasad: [
    { area: "School partnerships & closing", detail: "Every principal conversation, proposal and signed agreement." },
    { area: "Marketing", detail: "Campaigns, school outreach and the JOVE brand in the field." },
    { area: "Business operations", detail: "Scheduling, SOPs and the team that makes each JOVE Day run." },
    { area: "Finance", detail: "Pricing, invoices, payments and accounts." },
    { area: "Transport & travel", detail: "Vehicles, routes and stays — team and kits on campus by 7:30 am." },
    { area: "Vendors", detail: "Kit components, printing and procurement." },
  ],
  chinmay: [
    { area: `${site.studio.name}`, detail: "Founder of the in-house studio behind every reel, film and drone shot." },
    { area: "Brand & content", detail: "The JOVE identity, social media and storytelling." },
    { area: "Curriculum design", detail: "Grade-wise sessions, kit projects and the Virtual Labs journeys." },
    { area: "Technology", detail: "The website, Virtual Labs and JOVE HQ — the company's operating system." },
  ],
};

const teamOnSite = joveDayRules.teamSize.founders + joveDayRules.teamSize.trainers + joveDayRules.teamSize.media;

const commitments = [
  {
    icon: ShieldCheck,
    title: "Child safety & verified trainers",
    body: "Every JOVE trainer is background-verified, trained on our safety SOP and child-protection policy, and works under a founder's supervision on the day.",
  },
  {
    icon: BatteryCharging,
    title: "Low-voltage, child-safe kits",
    body: "Student build stations run on low-voltage battery packs with age-graded parts and tools. Kits are checked out, checked in and inspected after every session.",
  },
  {
    icon: Camera,
    title: "Consent-first media",
    body: "We film only with the school's permission and collect consent forms before the day. Students' faces are blurred on request — and the school controls how its media is used.",
  },
  {
    icon: GraduationCap,
    title: "NEP 2020-aligned",
    body: "Experiential, hands-on, coding-from-early-grades learning — supporting CBSE, ICSE and State Board outcomes and the Atal Tinkering Lab framework.",
  },
];

const yearPkg = packages.find((p) => p.id === "jove-year");
const roadmap: RoadmapStep[] = [
  {
    when: "Q4 2026",
    period: "Oct – Dec 2026",
    status: "Now · Launch",
    current: true,
    title: "Launch & our first partner schools",
    goals: [
      "First JOVE Days with our Founding Partner Schools",
      `Target cadence: ${targets.workshopsPerMonth} JOVE Days a month — one school a week`,
      "Free Virtual Labs and the JOVE kit store open to every family",
      "The full Media Pack delivered with every JOVE Day",
    ],
  },
  {
    when: "H1 2027",
    period: "Jan – Jun 2027",
    status: "Next",
    title: "Programmes that stay all year",
    goals: [
      "JOVE Quarter and JOVE Year partnerships",
      "After-school JOVE Clubs on partner campuses",
      "Teacher training & certification",
      yearPkg?.includes.find((i) => /Robotics Corner/i.test(i)) ?? "Robotics Corners on JOVE Year campuses",
    ],
  },
  {
    when: "H2 2027",
    period: "Jul – Dec 2027",
    status: "Planned",
    title: "JOVE Robo League & Pro online courses",
    goals: [
      "JOVE Robo League — an inter-school robotics competition",
      `Pro Virtual Labs — paid deep-dives like “${proLabs[0]?.title ?? "Neural Networks Deep Dive"}”`,
      `Target: ${targets.yearOneSchools} partner schools in our first year`,
      "Summer & winter robotics camps",
    ],
  },
  {
    when: "2028 →",
    period: "Beyond",
    status: "Horizon",
    title: "Expansion",
    goals: [
      "New cities, served by trained JOVE trainer teams",
      "Turnkey Robotics & AI labs and Atal Tinkering Lab mentoring",
      "CSR-funded JOVE Days in government schools",
      "Curriculum licensing for partner organisations",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      {/* 01 — HERO */}
      <PageHero
        eyebrow="About JOVE"
        index="01"
        title={["From textbook", "to toolbox."]}
        intro={
          <>
            <p>
              <strong className="font-semibold text-graphite">JOVE — {site.expansion}</strong> brings full-day, hands-on Robotics, AI &amp; Machine Learning
              workshops to schools for Grades 1–10, and films every one of them with our own in-house cinematic studio.
            </p>
            <p className="mt-4">We launch in October 2026 with one promise: every student builds something real.</p>
          </>
        }
        aside={
          <div className="relative">
            <ParallaxFigure
              src="/images/hero/hero-arm.webp"
              alt="Pencil sketch of a six-axis robotic arm drawn on warm engineering paper"
              sizes="(max-width: 1024px) 100vw, 40vw"
              frameClassName="aspect-[4/3]"
              objectPosition="80% 50%"
              imageClassName="mix-blend-multiply"
              strength={5}
              priority
              fig="Fig. 01 — Six-axis arm"
              caption="Pencil study · blueprint series"
            />
            <dl className="mt-6 grid grid-cols-3 divide-x divide-graphite/15 border-y border-graphite/15">
              {[
                ["Founded", "2026"],
                ["Grades", "1 – 10"],
                ["Model", "Offline-first"],
              ].map(([k, v]) => (
                <div key={k} className="px-3 py-3 first:pl-0">
                  <dt className="annot text-blueprint">{k}</dt>
                  <dd className="mt-1 text-sm font-semibold text-graphite">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button href="#founders" size="lg" arrow>
            Meet the founders
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Book a JOVE Day
          </Button>
        </div>
      </PageHero>

      {/* 02 — WHY JOVE EXISTS */}
      <section aria-labelledby="why-title" className="relative border-t border-graphite/10 bg-paper-50 py-24 sm:py-32">
        <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-bp relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <Reveal>
                  <SectionLabel index="02">Why JOVE exists</SectionLabel>
                </Reveal>
                <h2 id="why-title" className="mt-6 text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
                  <RevealLines lines={["Robotics is in", "the textbook.", "It belongs in", "their hands."]} />
                </h2>
                <Reveal delay={0.2}>
                  <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal sm:text-lg">
                    Most students meet robots and AI as a diagram or a video. Few get to wire a motor, read a sensor or train a model themselves — and the
                    brilliant things schools do rarely travel beyond the campus gate. JOVE was started to fix both.
                  </p>
                </Reveal>
              </div>
            </div>

            <ol className="space-y-5 lg:col-span-7">
              {problems.map((p, i) => (
                <Reveal as="li" key={p.n} delay={i * 0.08}>
                  <article className="group relative grid overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper shadow-[var(--shadow-paper)] transition-shadow duration-500 hover:shadow-[var(--shadow-lift)] sm:grid-cols-2">
                    <CornerMarks />
                    <div className="relative p-6 sm:p-7">
                      <p className="annot flex items-center gap-2 text-blueprint">
                        <SpecIndex n={p.n} /> Problem
                      </p>
                      <h3 className="mt-3 text-xl font-bold tracking-[-0.02em] text-graphite">{p.problem}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-charcoal">{p.detail}</p>
                    </div>
                    <div className="relative border-t border-dashed border-graphite/25 bg-graphite p-6 text-paper sm:border-l sm:border-t-0 sm:p-7">
                      <div aria-hidden className="hatch-light pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                      <p className="annot relative flex items-center gap-2 text-paper/55">
                        <span aria-hidden className="h-px w-5 bg-paper/50" /> JOVE&apos;s answer
                      </p>
                      <h3 className="relative mt-3 text-xl font-bold tracking-[-0.02em]">{p.answer}</h3>
                      <p className="relative mt-2 text-[14px] leading-relaxed text-paper/70">{p.answerDetail}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal className="mt-20 sm:mt-28">
            <ParallaxFigure
              src="/images/studio/trainer-class.webp"
              alt="Black-and-white illustration of a trainer demonstrating a small robotic arm to a crowd of excited school students in uniform"
              sizes="(max-width: 1440px) 100vw, 1280px"
              frameClassName="aspect-[4/3] sm:aspect-[16/8] lg:aspect-[21/9]"
              objectPosition="50% 45%"
              fig="Fig. 02 — The energy we design for"
              caption="Illustrative visual — not a photograph of a past JOVE event."
            />
          </Reveal>
        </div>
      </section>

      {/* 03 — THE NAME */}
      <section aria-labelledby="name-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
        <GridBackdrop dark />
        <ConstructionCircle size={760} className="pointer-events-none absolute -left-60 -top-40 hidden text-paper/[0.06] lg:block" />
        <div className="container-bp relative">
          <Reveal>
            <SectionLabel index="03" light>
              The name
            </SectionLabel>
          </Reveal>
          <div className="mt-8 grid items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 id="name-title" className="text-[clamp(2.5rem,6.6vw,6rem)] font-bold leading-[0.95] tracking-[-0.04em]">
                <span className="sr-only">Journey of Visionation &amp; Excellence</span>
                <span aria-hidden>
                  <RevealLines
                    lines={[
                      <Fragment key="journey">
                        J<span className="text-transparent opacity-70 [-webkit-text-stroke:1px_var(--color-paper)]">ourney</span>
                      </Fragment>,
                      <Fragment key="visionation">
                        <span className="text-transparent opacity-70 [-webkit-text-stroke:1px_var(--color-paper)]">of</span> V<span className="text-transparent opacity-70 [-webkit-text-stroke:1px_var(--color-paper)]">isionation</span>
                      </Fragment>,
                      <Fragment key="excellence">
                        <span className="text-transparent opacity-70 [-webkit-text-stroke:1px_var(--color-paper)]">&amp;</span> E<span className="text-transparent opacity-70 [-webkit-text-stroke:1px_var(--color-paper)]">xcellence</span>
                      </Fragment>,
                    ]}
                  />
                </span>
              </h2>
              <Reveal delay={0.25}>
                <p className="mt-8 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
                  <strong className="font-semibold text-paper">Visionation</strong> is a word we made up, because nothing else described what we teach. Vision
                  without innovation stays a daydream; innovation without vision is just assembly. Visionation is the moment between them — when a Grade 4
                  student sketches a light-seeking car, builds it, and watches it chase a torch across the floor.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.15} className="lg:col-span-5">
              <div className="relative rounded-[var(--radius-lg)] border border-paper/15 bg-ink/40 p-5 sm:p-8">
                <CornerMarks className="text-paper/40" />
                <p className="annot mb-3 flex items-center justify-between text-paper/45">
                  <span>Fig. 03 — Definition</span>
                  <span className="font-mono">vi·sion·a·tion</span>
                </p>
                <VisionationDiagram />
                <p className="mt-2 text-center font-mono text-xs text-paper/55">vision + innovation = visionation</p>
              </div>
            </Reveal>
          </div>

          <SketchDivider light className="my-16 sm:my-20" />

          <dl className="grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            {nameParts.map((p, i) => (
              <Reveal key={p.letter} delay={i * 0.07} className="group relative bg-graphite p-6 transition-colors duration-500 hover:bg-ink sm:p-7">
                <dt>
                  <span aria-hidden className="block text-6xl font-bold leading-none tracking-[-0.05em] text-paper/90 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1">
                    {p.letter}
                  </span>
                  <span className="annot mt-4 block text-paper/55">{p.word}</span>
                </dt>
                <dd className="mt-3 text-[14px] leading-relaxed text-paper/70">{p.body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* 04 — MISSION & VISION */}
      <section aria-labelledby="mv-title" className="relative overflow-hidden py-24 sm:py-32">
        <GridBackdrop />
        <Crosshair className="absolute right-[7%] top-16 hidden md:block" />
        <div className="container-bp relative">
          <Reveal>
            <SectionLabel index="04">Mission &amp; vision</SectionLabel>
          </Reveal>
          <h2 id="mv-title" className="sr-only">
            Our mission and vision
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              {
                k: "Mission",
                tag: "What we do, every day",
                text: "To put real robotics and AI into the hands of every student from Grade 1 to Grade 10 — through full-day, hands-on workshops that schools are proud to show the world.",
              },
              {
                k: "Vision",
                tag: "The India we're building toward",
                text: "An India where every child has built, coded and tested a machine before leaving school — and believes they can engineer the future, not just use it.",
              },
            ].map((s, i) => (
              <Reveal key={s.k} delay={i * 0.12}>
                <article className="relative h-full overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-7 shadow-[var(--shadow-paper)] sm:p-10">
                  <CornerMarks />
                  <div aria-hidden className="hatch pointer-events-none absolute -right-10 -top-10 size-40 rotate-12 rounded-[var(--radius-md)] opacity-50" />
                  <div className="relative flex items-center gap-4">
                    <span className="grid size-12 place-items-center rounded-full bg-graphite text-lg font-bold text-paper">{s.k[0]}</span>
                    <div>
                      <h3 className="text-2xl font-bold tracking-[-0.02em] text-graphite">{s.k}</h3>
                      <p className="annot text-blueprint">{s.tag}</p>
                    </div>
                  </div>
                  <DimensionLine className="relative mt-7" label={`${s.k.toUpperCase()} · 01`} />
                  <p className="relative mt-7 text-[clamp(1.25rem,2.2vw,1.75rem)] font-semibold leading-snug tracking-[-0.015em] text-graphite">{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — VALUES */}
      <section aria-labelledby="values-title" className="relative border-y border-graphite/10 bg-paper-200/60 py-24 sm:py-32">
        <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-bp relative">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <Reveal>
                <SectionLabel index="05">Our values</SectionLabel>
              </Reveal>
              <h2 id="values-title" className="mt-6 text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
                <RevealLines lines={["Four words on our logo.", "Four promises in", "every session."]} />
              </h2>
            </div>
            <Reveal delay={0.2}>
              <p className="max-w-sm text-[15px] leading-relaxed text-charcoal">
                Precision, Learning, Innovation, Automation — printed beside our mark like notes on a drawing. Here is what each one means when we walk into
                your school.
              </p>
            </Reveal>
          </div>

          <ul className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {brandValues.map((v, i) => (
              <Reveal as="li" key={v.key} delay={i * 0.08}>
                <article className="group relative flex h-full flex-col rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
                  <CornerMarks />
                  <header className="flex items-center justify-between border-b border-graphite/10 px-5 py-3">
                    <span className="annot text-blueprint">
                      Spec <span className="font-mono">{v.n}</span>
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.15em] text-blueprint">JOVE / {v.title.slice(0, 4).toUpperCase()}</span>
                  </header>
                  <div className="relative mx-5 mt-5 overflow-hidden rounded-[var(--radius-sm)] border border-dashed border-graphite/20 bg-paper px-4 py-3">
                    <div aria-hidden className="bp-grid-fine absolute inset-0 opacity-80" />
                    <ValueFigure value={v.key} className="relative mx-auto h-28 w-auto transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-6 pt-5">
                    <h3 className="text-2xl font-bold tracking-[-0.025em] text-graphite">{v.title}</h3>
                    <p className="mt-1 font-mono text-[12px] text-blueprint">{v.spec}</p>
                    <p className="mt-4 text-[14px] leading-relaxed text-charcoal">{v.body}</p>
                    <div className="mt-auto pt-5">
                      <div className="border-t border-dashed border-graphite/20 pt-4">
                        <p className="annot text-blueprint">In the session</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-graphite">{v.classroom}</p>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 06 — THE MODEL */}
      <section aria-labelledby="model-title" className="relative overflow-hidden bg-ink py-24 text-paper sm:py-32">
        <GridBackdrop dark />
        <div className="container-bp relative grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel index="06" light>
                How JOVE works
              </SectionLabel>
            </Reveal>
            <h2 id="model-title" className="mt-6 text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              <RevealLines lines={["Offline-first.", "Online, always on."]} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-paper/70">
                The real learning happens with real parts, in your school hall, with a trainer at the table. Everything online exists to extend that day — never
                to replace it.
              </p>
            </Reveal>
            <ul className="mt-10 space-y-5">
              {[
                { k: "Offline", t: "JOVE Days in schools", d: "Full-day, grade-wise sessions for Grades 1–10 — and JOVE Quarter, Year & Club programmes for schools that want more." },
                { k: "Studio", t: "Every day becomes a film", d: `${site.studio.name} turns each JOVE Day into reels, a highlight film and drone shots for the school.` },
                { k: "Online", t: "Virtual Labs & kit store", d: `${labs.length} free Virtual Labs (${labStages.map((s) => s.label.toLowerCase()).join(" → ")}) and take-home kits to keep building.` },
              ].map((r, i) => (
                <Reveal as="li" key={r.k} delay={0.1 + i * 0.08} className="grid grid-cols-[84px_1fr] gap-4 border-t border-paper/15 pt-5">
                  <span className="annot pt-1 text-paper/50">{r.k}</span>
                  <div>
                    <p className="font-semibold">{r.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-paper/60">{r.d}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal delay={0.1} className="lg:col-span-7">
            <ModelLoop nodes={loopNodes} />
          </Reveal>
        </div>
        <div className="container-bp relative mt-16">
          <dl className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15 md:grid-cols-4">
            <CornerMarks className="text-paper/40" />
            {[
              { k: "Grade bands", v: `${gradeBands.length}`, s: gradeBands.map((g) => g.name).join(" · ") },
              { k: "Free Virtual Labs", v: `${labs.length}`, s: "Theory to challenge, in the browser" },
              { k: "JOVE kits", v: `${kits.length}`, s: `${formatINR(Math.min(...mrps))} – ${formatINR(Math.max(...mrps))} MRP` },
              { k: "Team at every JOVE Day", v: `${teamOnSite}`, s: "2 founders · 2 trainers · 1 media lead" },
            ].map((s) => (
              <div key={s.k} className="bg-ink px-5 py-6">
                <dt className="annot text-paper/45">{s.k}</dt>
                <dd>
                  <span className="mt-2 block font-mono text-3xl font-medium tracking-tight">{s.v}</span>
                  <span className="mt-1 block text-xs leading-snug text-paper/55">{s.s}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 07 — FOUNDERS */}
      <section id="founders" aria-labelledby="founders-title" className="relative scroll-mt-24 py-24 sm:py-32">
        <GridBackdrop vignette={false} className="opacity-70" />
        <div className="container-bp relative">
          <div className="max-w-3xl">
            <Reveal>
              <SectionLabel index="07">Founders</SectionLabel>
            </Reveal>
            <h2 id="founders-title" className="mt-6 text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
              <RevealLines lines={["Two founders.", "On the floor at", "every JOVE Day."]} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-charcoal sm:text-lg">
                JOVE is founder-led by design. Between them, Shivaprasad and Chinmay own every part of the company — and both of them teach.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {site.founders.map((f, i) => (
              <Reveal key={f.id} delay={i * 0.12}>
                <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-lift)]">
                  <CornerMarks />
                  <header className="relative flex flex-col gap-6 border-b border-graphite/10 p-6 sm:flex-row sm:items-center sm:p-8">
                    <div aria-hidden className="hatch-dense pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-[0.18] [mask-image:linear-gradient(to_left,black,transparent)]" />
                    <FounderAvatar name={f.name} initials={f.initials} photo={f.photo} />
                    <div className="relative">
                      <p className="annot text-blueprint">
                        <span className="font-mono">F-0{i + 1}</span> · {i === 0 ? "Operations & growth" : "Studio, brand & technology"}
                      </p>
                      <h3 className="mt-2 text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">{f.name}</h3>
                      <p className="mt-1 font-semibold text-charcoal">{f.role}</p>
                    </div>
                  </header>
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <p className="text-[15px] leading-relaxed text-charcoal">{f.bio}</p>
                    <p className="annot mt-8 text-blueprint">Owns</p>
                    <ul className="mt-3 divide-y divide-graphite/10 border-y border-graphite/10">
                      {(founderRoles[f.id] ?? []).map((r, j) => (
                        <li key={r.area} className="grid grid-cols-[28px_1fr] gap-3 py-3 sm:grid-cols-[28px_200px_1fr]">
                          <SpecIndex n={j + 1} className="pt-0.5" />
                          <span className="text-[14px] font-semibold text-graphite">{r.area}</span>
                          <span className="col-start-2 text-[13px] leading-relaxed text-charcoal sm:col-start-3">{r.detail}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-6 flex items-center gap-2 text-[13px] text-charcoal">
                      <span aria-hidden className="size-1.5 rounded-full bg-graphite" />
                      Also delivers workshops on every JOVE Day.
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-[var(--radius-md)] border border-dashed border-graphite/30 bg-paper/70 px-6 py-5 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-[14px] leading-relaxed text-charcoal">
                <strong className="font-semibold text-graphite">Shared on every JOVE Day:</strong> both founders are part of the {teamOnSite}-person team on
                campus — {joveDayRules.teamSize.founders} founders, {joveDayRules.teamSize.trainers} trainers and {joveDayRules.teamSize.media} media lead.
              </p>
              <Button href="/careers" variant="secondary" size="sm" arrow>
                Join the team
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 08 — COMMITMENTS */}
      <section aria-labelledby="commit-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
        <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-80" />
        <div aria-hidden className="hatch-light absolute inset-y-0 right-0 hidden w-1/4 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)] lg:block" />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="08" light>
                  Our commitments
                </SectionLabel>
              </Reveal>
              <h2 id="commit-title" className="mt-6 text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em]">
                <RevealLines lines={["Non-negotiables,", "for every school."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-base leading-relaxed text-paper/70">
                Before excitement, before the films — safety, consent and sound pedagogy. These hold on every JOVE Day, in every school, for every grade.
              </p>
            </Reveal>
          </div>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            {commitments.map((c, i) => (
              <Reveal as="li" key={c.title} delay={i * 0.08} className="group relative bg-graphite p-6 transition-colors duration-500 hover:bg-ink sm:p-7">
                <span className="grid size-12 place-items-center rounded-full border border-paper/25 transition-colors duration-500 group-hover:border-paper/60">
                  <c.icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <p className="mt-6 font-mono text-[11px] tracking-[0.15em] text-paper/45">C-{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-lg font-bold leading-snug">{c.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-paper/65">{c.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 09 — ROADMAP */}
      <section aria-labelledby="roadmap-title" className="relative overflow-hidden py-24 sm:py-32">
        <GridBackdrop />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="09">Roadmap</SectionLabel>
              </Reveal>
              <h2 id="roadmap-title" className="mt-6 text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
                <RevealLines lines={["Where we're", "headed."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-[15px] leading-relaxed text-charcoal">
                These are <strong className="font-semibold text-graphite">goals, not achievements</strong>. We&apos;re a new company, and we would rather show
                you a plan than a claim. We&apos;ll update this page as we go.
              </p>
            </Reveal>
          </div>
          <div className="mt-14 max-w-5xl">
            <Roadmap steps={roadmap} />
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Join the journey"
        title={["Be one of our", "first schools."]}
        body="We're booking our launch term now. Bring a full day of hands-on Robotics & AI to your students — and a film of it to share with every parent."
        primary={{ label: "Book a JOVE Day", href: "/contact" }}
        secondary={{ label: "Explore programmes", href: "/programs" }}
      />
    </>
  );
}
