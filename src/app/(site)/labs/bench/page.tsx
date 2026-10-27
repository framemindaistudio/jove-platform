import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { publicBenchProjects } from "@/lib/bench/projects";
import { GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { PublicBench } from "@/components/bench/PublicBench";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "3D Bench — Build Real Circuits in Your Browser",
  description: "Wire a battery, LEDs, a motor and an Arduino on a 3D workbench, with the same parts as JOVE's school kits. Switch on and see it work. Free, no sign-up.",
  alternates: { canonical: "/labs/bench" },
};

export default function BenchLabPage() {
  // only the builds marked public are sent to this page; the rest stay in JOVE HQ
  const projects = publicBenchProjects();
  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-28 sm:pt-32">
        <GridBackdrop />
        <div className="container-bp relative">
          <Link href="/labs" className="annot inline-flex items-center gap-2 text-blueprint hover:text-graphite">
            <ArrowLeft className="size-3.5" /> All Virtual Labs
          </Link>
          <div className="mt-6 max-w-3xl">
            <SectionLabel>Virtual Lab · 3D Bench</SectionLabel>
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
        secondary={{ label: "More Virtual Labs", href: "/labs" }}
      />
    </>
  );
}
