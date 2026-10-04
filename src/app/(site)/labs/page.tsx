import type { Metadata } from "next";
import Image from "next/image";
import { Lock, MonitorPlay, Presentation, ShieldCheck, Smartphone, Users } from "lucide-react";
import { labs, proLabs } from "@/lib/content/labs";
import { AnnotationStack, CornerMarks, SectionLabel } from "@/components/brand/Blueprint";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/site/PageHero";
import { CTASection } from "@/components/site/CTASection";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { JourneyDiagram } from "@/components/labs/hub/JourneyDiagram";
import { LabsExplorer } from "@/components/labs/hub/LabsExplorer";
import { ProWaitlist } from "@/components/labs/hub/ProWaitlist";

export const metadata: Metadata = {
  title: "Free Virtual Labs — Robotics, AI & Coding Simulations",
  description:
    "Free online Robotics, AI and coding labs for Grades 1–10. Every lab is a journey — theory, demo, hands-on simulation and a challenge — mirroring JOVE's offline school workshops. No sign-up, works on phones and classroom projectors.",
  alternates: { canonical: "/labs" },
  openGraph: {
    title: "JOVE Virtual Labs — free Robotics & AI journeys",
    description: "Theory → Demo → Hands-on → Challenge. Free, in the browser, for Grades 1–10.",
    images: ["/images/labs/lab-rover.webp"],
  },
};

const minMinutes = Math.min(...labs.map((l) => l.minutes));
const maxMinutes = Math.max(...labs.map((l) => l.minutes));

function HeroAside() {
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper shadow-[var(--shadow-lift)]">
        <CornerMarks />
        <Image src="/images/labs/lab-rover.webp" alt="Pencil blueprint sketch of a planetary rover on a coded grid — illustration for the Code the Rover lab" fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover mix-blend-multiply" />
        <span className="absolute bottom-3 left-3 rounded-full bg-graphite px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-paper">Lab 01 · Code the Rover</span>
      </div>
      <div className="relative -mt-8 ml-6 grid grid-cols-3 overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] sm:ml-10">
        {[
          [String(labs.length), "free labs"],
          ["4", "stages each"],
          [`${minMinutes}–${maxMinutes}`, "minutes"],
        ].map(([v, k], i) => (
          <div key={k} className={i ? "border-l border-graphite/10 px-4 py-3" : "px-4 py-3"}>
            <p className="font-mono text-xl font-bold tabular-nums text-graphite">{v}</p>
            <p className="annot mt-0.5 text-[10px] text-blueprint">{k}</p>
          </div>
        ))}
      </div>
      <div className="absolute -top-3 right-0 hidden -translate-y-full text-blueprint xl:block">
        <AnnotationStack items={["Grades 1–10", "No sign-up", "Phone · laptop · projector"]} align="right" />
      </div>
    </div>
  );
}

const TEACHER_POINTS = [
  { Icon: Presentation, title: "Projector-friendly", body: "Big buttons, high-contrast blueprint graphics and readable code blocks — run a lab on the classroom screen and let students call out the next move." },
  { Icon: Users, title: "Use it in class", body: "Theory as a 10-minute intro, the Demo on the projector, pairs taking turns at the Hands-on, and the quiz as an exit ticket." },
  { Icon: Smartphone, title: "Practice after school", body: "Works on a phone or a shared laptop. Progress is saved in that browser, so students can stop and continue later." },
  { Icon: ShieldCheck, title: "No accounts, no student data", body: "No sign-up and no logins. Lab progress stays on the device — nothing about the student is sent to us." },
];

export default function LabsPage() {
  return (
    <>
      <PageHero
        eyebrow="Free Virtual Labs"
        index="06"
        title={["Free Virtual Labs.", "From theory to", "hands-on — online."]}
        intro={
          <>
            The same journeys we run in classrooms, now in your browser. Learn the idea, watch it work, drive the simulation yourself, then beat the challenge and earn a certificate. Free, no sign-up — students can keep practising long after the workshop day.
          </>
        }
        aside={<HeroAside />}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="#labs" size="lg" arrow>
            Start a free lab
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Book a JOVE Day
          </Button>
        </div>
      </PageHero>

      <JourneyDiagram />

      <section id="labs" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-28" aria-labelledby="labs-title">
        <div className="bp-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="paper-grain pointer-events-none absolute inset-0" />
        <div className="container-bp relative">
          <div className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="02">Pick a lab</SectionLabel>
              </Reveal>
              <h2 id="labs-title" className="mt-6 text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
                <RevealLines lines={["Six labs.", "Zero cost. Real concepts."]} />
              </h2>
            </div>
            <Reveal delay={0.15} className="lg:col-span-5">
              <p className="text-base leading-relaxed text-charcoal">Filter by topic or grade. Each lab previews a session from our full-day workshops — coding, electronics, robotics and AI — so students meet the ideas before (or after) they build them for real.</p>
            </Reveal>
          </div>
          <LabsExplorer />
        </div>
      </section>

      <section className="relative overflow-hidden bg-graphite py-20 text-paper sm:py-28" aria-labelledby="pro-title">
        <div className="bp-grid-dark absolute inset-0 opacity-70" />
        <div className="container-bp relative grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index="03" light>
                Pro journeys
              </SectionLabel>
            </Reveal>
            <h2 id="pro-title" className="mt-6 text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              <RevealLines lines={["Deeper journeys —", "coming soon."]} />
            </h2>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-paper/70">We&apos;re designing longer, project-based journeys for older students. They&apos;re not live yet — prices shown are planned launch prices and may change. The free labs stay free.</p>
            </Reveal>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {proLabs.map((p, i) => (
                <Reveal as="li" key={p.title} delay={0.05 * i}>
                  <div className="relative flex h-full items-start gap-4 overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/[0.04] p-4">
                    <div className="hatch-light pointer-events-none absolute inset-0 opacity-60" />
                    <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-paper/30">
                      <Lock className="size-4" aria-hidden />
                    </span>
                    <div className="relative min-w-0">
                      <p className="font-semibold leading-snug">{p.title}</p>
                      <p className="mt-1 text-xs text-paper/60">
                        {p.grades} · planned {p.price}
                      </p>
                    </div>
                    <span className="annot relative ml-auto shrink-0 rounded-full border border-paper/25 px-2 py-0.5 text-[9px] text-paper/70">Soon</span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5 lg:pt-16">
            <Reveal delay={0.15}>
              <ProWaitlist />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-28" aria-labelledby="teachers-title">
        <div className="bp-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-bp relative grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel index="04">For teachers</SectionLabel>
            </Reveal>
            <h2 id="teachers-title" className="mt-6 text-[clamp(2rem,4.2vw,3.2rem)] font-bold leading-[1.04] tracking-[-0.03em] text-graphite">
              <RevealLines lines={["Built for the", "classroom screen."]} />
            </h2>
            <Reveal delay={0.1}>
              <p className="mt-5 text-base leading-relaxed text-charcoal">Use any lab as a ready-made lesson — no installs, no logins. It supports the NEP 2020 focus on experiential learning and computational thinking, and pairs well with Atal Tinkering Lab sessions.</p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/labs/code-the-rover" arrow>
                  Try Code the Rover
                </Button>
                <Button href="/programs" variant="secondary">
                  See the full-day programs
                </Button>
              </div>
            </Reveal>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {TEACHER_POINTS.map(({ Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={0.06 * i}>
                <div className="relative h-full rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-6 shadow-[var(--shadow-paper)]">
                  <CornerMarks size={8} />
                  <span className="grid size-11 place-items-center rounded-full border border-graphite/20 bg-paper">
                    <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  <p className="mt-4 text-lg font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal">{body}</p>
                </div>
              </Reveal>
            ))}
            <Reveal as="li" delay={0.3} className="sm:col-span-2">
              <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-md)] border border-dashed border-graphite/25 p-5">
                <MonitorPlay className="size-6 shrink-0" strokeWidth={1.6} aria-hidden />
                <p className="min-w-0 flex-1 text-sm text-charcoal">
                  <strong className="text-graphite">Tip:</strong> press <kbd className="rounded border border-graphite/25 bg-paper px-1.5 py-0.5 font-mono text-xs">F11</kbd> for full screen on a projector, and slow the rover down with the turtle button so the whole class can follow each block.
                </p>
              </div>
            </Reveal>
          </ul>
        </div>
      </section>

      <CTASection
        eyebrow="Want the real thing?"
        title={["Now build it", "with real robots."]}
        body="Every Virtual Lab previews a hands-on session from a full-day JOVE workshop — real kits, real sensors, trained instructors, and our in-house film crew capturing the day for your school."
        primary={{ label: "Book a JOVE Day", href: "/contact" }}
        secondary={{ label: "Explore programs", href: "/programs" }}
      />
    </>
  );
}
