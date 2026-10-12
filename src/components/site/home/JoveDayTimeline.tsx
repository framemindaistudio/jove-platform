"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Film } from "lucide-react";
import { GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { joveDayRules, joveDaySchedule, mediaPack } from "@/lib/content/business";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
function span(start: string, end: string) {
  const d = toMin(end) - toMin(start);
  if (d < 60) return `${d} min`;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return m ? `${h} h ${m} m` : `${h} h`;
}

const reelsDelivery = mediaPack.items.find((i) => /reel/i.test(i.title))?.delivery.toLowerCase() ?? "";
const filmDelivery = mediaPack.items.find((i) => /film/i.test(i.title))?.delivery.toLowerCase() ?? "";
const first = joveDaySchedule[0];
const last = joveDaySchedule[joveDaySchedule.length - 1];
const team = joveDayRules.teamSize;
const teamTotal = team.founders + team.trainers + team.media;

/** Horizontal (pinned) on large screens with motion; a vertical timeline everywhere else. */
export function JoveDayTimeline() {
  const scope = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const track = trackRef.current;
        const pin = pinRef.current;
        if (!track || !pin) return;
        const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        gsap.fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: pin, start: "top top", end: () => `+=${distance()}`, scrub: 0.6, invalidateOnRefresh: true } });
        gsap.utils.toArray<HTMLElement>("[data-stop]", track).forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0.28 },
            { opacity: 1, ease: "none", scrollTrigger: { trigger: el, containerAnimation: tween, start: "left 88%", end: "left 58%", scrub: true } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope },
  );

  const header = (
    <div className="container-bp grid gap-8 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7">
        <SectionLabel index="02" light>
          How a JOVE Day works
        </SectionLabel>
        <h2 id="joveday-title" className="mt-5 text-[clamp(2rem,1.2rem+3vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.03em] text-paper">
          <RevealLines lines={["One day. Every grade.", "A whole school buzzing."]} />
        </h2>
      </div>
      <Reveal delay={0.1} className="lg:col-span-5">
        <p className="max-w-xl leading-relaxed text-paper/70 sm:text-[17px]">
          Two halls run in parallel, so every grade group gets its own age-designed session — while our film crew captures the whole day, from the opening
          robot show to the certificate ceremony.
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-paper/15 pt-5 font-mono text-paper">
          <div>
            <dt className="annot text-paper/45">On campus</dt>
            <dd className="mt-1 text-sm tabular-nums">
              {first.time}–{last.end}
            </dd>
          </div>
          <div>
            <dt className="annot text-paper/45">Halls</dt>
            <dd className="mt-1 text-sm">2 in parallel</dd>
          </div>
          <div>
            <dt className="annot text-paper/45">Crew</dt>
            <dd className="mt-1 text-sm">{teamTotal} people</dd>
          </div>
        </dl>
      </Reveal>
    </div>
  );

  return (
    <section ref={scope} aria-labelledby="joveday-title" className="relative bg-graphite text-paper">
      <div ref={pinRef} className="relative flex flex-col justify-center overflow-hidden py-24 sm:py-28 lg:min-h-[100svh] lg:py-20">
        <GridBackdrop dark />
        <div className="relative">{header}</div>

        {/* ── Horizontal blueprint track (lg + motion) ─────────────────── */}
        <div className="relative mt-14 hidden lg:motion-safe:block">
          <span aria-hidden className="absolute inset-x-0 top-[100px] h-px bg-paper/20" />
          <span ref={progressRef} aria-hidden className="absolute inset-x-0 top-[100px] h-px origin-left bg-paper" />
          <ol ref={trackRef} className="relative flex w-max pl-[max(3rem,calc((100vw-1440px)/2+5rem))] pr-[20vw] will-change-transform xl:pl-[max(5rem,calc((100vw-1440px)/2+5rem))]">
            {joveDaySchedule.map((s, i) => (
              <li key={`${s.time}-${s.hall}`} data-stop className="relative w-[300px] shrink-0 pr-10 xl:w-[330px]">
                <div className="flex h-16 items-end gap-3">
                  <span className="font-mono text-[2.6rem] font-medium leading-none tracking-[-0.04em] tabular-nums">{s.time}</span>
                  <span className="pb-1 font-mono text-[11px] text-paper/50">
                    → {s.end} · {span(s.time, s.end)}
                  </span>
                </div>
                <div className="relative mt-6 flex h-6 items-center">
                  <span className="relative z-10 grid size-6 place-items-center rounded-full border border-paper/60 bg-graphite">
                    <span className="size-2 rounded-full bg-paper" />
                  </span>
                  <span className="ml-3 font-mono text-[10px] tracking-[0.2em] text-paper/40">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <span className="annot mt-6 inline-block border border-paper/25 px-2 py-0.5 text-paper/70">{s.hall}</span>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{s.detail}</p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/40">Who · {s.who}</p>
              </li>
            ))}
            <li data-stop className="relative w-[340px] shrink-0">
              <div className="flex h-16 items-end">
                <span className="font-mono text-[2.6rem] font-medium leading-none tracking-[-0.04em]">Cut.</span>
              </div>
              <div className="relative mt-6 flex h-6 items-center">
                <span className="relative z-10 grid size-6 place-items-center rounded-full bg-paper text-graphite">
                  <Film className="size-3.5" aria-hidden />
                </span>
              </div>
              <div className="mt-6 border border-paper/20 bg-paper/[0.04] p-5">
                <h3 className="text-lg font-semibold">That&apos;s a wrap — the edit begins.</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">
                  Reels arrive {reelsDelivery}; the full-day film {filmDelivery}.
                </p>
              </div>
            </li>
          </ol>
          <p className="container-bp annot mt-10 text-paper/40">Keep scrolling — the day moves with you →</p>
        </div>

        {/* ── Vertical timeline (mobile, tablet, reduced motion) ────────── */}
        <ol className="container-bp relative mt-14 lg:motion-safe:hidden">
          {joveDaySchedule.map((s, i) => (
            <Reveal as="li" key={`${s.time}-${s.hall}`} delay={Math.min(i, 3) * 0.05} className="relative grid grid-cols-[1.5rem_1fr] gap-x-4 pb-9 sm:grid-cols-[1.5rem_8.5rem_1fr] sm:gap-x-6">
              <span aria-hidden className="absolute bottom-0 left-[11.5px] top-7 w-px bg-paper/20" />
              <span aria-hidden className="relative z-10 mt-1 grid size-6 place-items-center rounded-full border border-paper/60 bg-graphite">
                <span className="size-2 rounded-full bg-paper" />
              </span>
              <div className="col-start-2 sm:col-start-auto">
                <span className="block font-mono text-2xl font-medium leading-none tabular-nums">{s.time}</span>
                <span className="mt-1 block font-mono text-[11px] text-paper/50">
                  → {s.end} · {span(s.time, s.end)}
                </span>
              </div>
              <div className="col-start-2 mt-3 sm:col-start-auto sm:mt-0">
                <span className="annot inline-block border border-paper/25 px-2 py-0.5 text-paper/70">{s.hall}</span>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-paper/65">{s.detail}</p>
              </div>
            </Reveal>
          ))}
          <Reveal as="li" className="relative grid grid-cols-[1.5rem_1fr] gap-x-4 sm:grid-cols-[1.5rem_8.5rem_1fr] sm:gap-x-6">
            <span aria-hidden className="relative z-10 grid size-6 place-items-center rounded-full bg-paper text-graphite">
              <Film className="size-3.5" aria-hidden />
            </span>
            <span className="col-start-2 font-mono text-2xl font-medium leading-none sm:col-start-auto">Cut.</span>
            <p className="col-start-2 mt-2 text-sm leading-relaxed text-paper/65 sm:col-start-auto sm:mt-0">
              That&apos;s a wrap — reels arrive {reelsDelivery}; the full-day film {filmDelivery}.
            </p>
          </Reveal>
        </ol>
      </div>
    </section>
  );
}
