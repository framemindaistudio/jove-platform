"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ConstructionCircle, SectionLabel, SketchDivider } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { gradeBands, mediaPack } from "@/lib/content/business";
import { formatINR } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LEAD = "The first school robotics & AI workshop that comes with".split(" ");
const MARK = "its own film studio.".split(" ");

const minStation = Math.min(...gradeBands.map((b) => b.studentsPerStation));
const maxStation = Math.max(...gradeBands.map((b) => b.studentsPerStation));
const minDur = Math.min(...gradeBands.map((b) => b.durationMin));
const maxDur = Math.max(...gradeBands.map((b) => b.durationMin));

const PROOFS = [
  {
    title: "Hands-on for every student",
    body: "No watching from the back row. Small teams work at fully-kitted stations and build, code and test a real robot in every session — kits, tools and consumables included.",
    stat: `1 station : ${minStation}–${maxStation} students`,
  },
  {
    title: "Age-designed for Grades 1–10",
    body: `Four grade bands, four curricula — from light-up cardboard robots in Grade 1 to AI vision robots in Grade 10. Supports CBSE, ICSE & State board outcomes and NEP 2020's experiential learning.`,
    stat: `${gradeBands.length} bands · ${minDur}–${maxDur} min`,
  },
  {
    title: "Cinematic Media Pack, free",
    body: "FrameMind AI Studio, our in-house film studio, shoots the whole day: reels, a full-day highlight film, drone aerials and edited photos for your admissions season.",
    stat: `Worth ${formatINR(mediaPack.marketValue)} · ₹0 extra`,
  },
];

const WORD = "inline-block text-[#bdb7ab] motion-reduce:text-graphite";

/** "First with its own film studio" statement — words ink from blueprint grey to graphite as you scroll. */
export function Manifesto() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words = gsap.utils.toArray<HTMLElement>("[data-ink]");
        gsap.fromTo(
          words,
          { color: "#bdb7ab" },
          {
            color: "#2b2b2b",
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: "[data-statement]", start: "top 82%", end: "bottom 48%", scrub: 0.4 },
          },
        );
        gsap.fromTo(
          "[data-mark]",
          { scaleX: 0 },
          { scaleX: 1, ease: "none", stagger: 0.25, scrollTrigger: { trigger: "[data-statement]", start: "center 72%", end: "bottom 45%", scrub: 0.4 } },
        );
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="jove-manifesto" aria-labelledby="manifesto-title" className="relative overflow-hidden bg-paper py-24 sm:py-32 lg:py-40">
      <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_80%,transparent)]" />
      <ConstructionCircle size={620} className="pointer-events-none absolute -left-48 -top-24 text-graphite/[0.07]" />

      <div className="container-bp relative">
        <div className="flex items-center justify-between gap-6">
          <SectionLabel index="01">A first for schools</SectionLabel>
          <span className="annot hidden font-mono text-blueprint sm:block">Fig. 02 — Positioning</span>
        </div>

        <h2
          id="manifesto-title"
          data-statement
          className="mt-10 max-w-[19ch] text-[clamp(2.1rem,1rem+4.4vw,5.25rem)] font-bold leading-[1.02] tracking-[-0.035em] sm:mt-14"
        >
          {LEAD.map((w, i) => (
            <span key={i}>
              <span data-ink className={WORD}>
                {w}
              </span>{" "}
            </span>
          ))}
          {MARK.map((w, i) => (
            <span key={i}>
              <span className="relative inline-block">
                <span data-ink className={`${WORD} relative z-10`}>
                  {w}
                </span>
                <span data-mark aria-hidden className="hatch absolute -inset-x-[0.06em] bottom-[0.1em] z-0 h-[0.3em] origin-left bg-graphite/[0.06]" />
              </span>
              {i < MARK.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>

        <Reveal className="mt-10 max-w-2xl text-lg leading-relaxed text-charcoal sm:text-xl">
          Robotics workshops exist. School films exist. JOVE is the first to put both in the same day — your students build real robots and AI, and our
          studio turns it into content your school can be proud of.
        </Reveal>

        <SketchDivider className="mt-16 sm:mt-24" />

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-14">
          {PROOFS.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.1} className="relative border-t border-graphite/20 pt-6">
              <span aria-hidden className="absolute -top-[3px] left-0 size-[5px] bg-graphite" />
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-xs tracking-[0.2em] text-blueprint">0{i + 1}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-charcoal">{p.stat}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-graphite sm:text-2xl">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-charcoal">{p.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
