import type { Metadata } from "next";
import { publicBenchProjects } from "@/lib/bench/projects";
import { GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { PublicBench } from "@/components/bench/PublicBench";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "Free Virtual Labs — Build Real Circuits on a 3D Bench",
  description: "Wire a battery, LEDs, a motor and an Arduino on a 3D workbench, with the same parts as JOVE's school kits. Switch on and see it work. Free, no sign-up, works on the classroom projector.",
  alternates: { canonical: "/labs" },
  openGraph: { title: "JOVE Virtual Labs — a free 3D electronics bench", description: "Same parts as our school kits. Wire it, switch on, see it work." },
};

export default function LabsPage() {
  // only the builds marked public are sent to this page; the rest stay in JOVE HQ
  const projects = publicBenchProjects();
  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-28 sm:pt-32">
        <GridBackdrop />
        <div className="container-bp relative">
          <div className="max-w-3xl">
            <SectionLabel>Virtual Labs · free</SectionLabel>
            <h1 className="mt-5 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[0.98] tracking-[-0.03em]">Build it on the bench.</h1>
            <p className="mt-5 max-w-xl leading-relaxed text-charcoal">
              The same batteries, LEDs, motors and Arduino as our school kits, on a 3D workbench. Click a pin, then another, to run a wire. Switch on and watch it glow, spin and blink. Drag to turn the bench, scroll to zoom.
            </p>
          </div>
        </div>
      </section>
      <section className="container-bp relative pb-24">
        <PublicBench projects={projects} />
      </section>
      <CTASection
        eyebrow="Want the real thing?"
        title={["Now build it", "with your hands."]}
        body="In a JOVE workshop every student builds these with real kits, then takes on the bigger builds: cars that chase light and robots that decide for themselves."
        primary={{ label: "Bring JOVE to your school", href: "/contact" }}
        secondary={{ label: "See the programs", href: "/programs" }}
      />
    </>
  );
}
