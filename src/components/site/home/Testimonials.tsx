import { Award, Film, Lock, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import type { PublicTestimonial } from "@/lib/public-data";
import { SectionHeading } from "./SectionHeading";

const SLOTS = 10;

const BENEFITS = [
  { icon: Lock, title: "Founding-partner pricing, locked for a year", body: "Your per-student rates stay fixed for twelve months from your first JOVE Day." },
  { icon: Film, title: "An extra reel in your Media Pack", body: "One more cinematic reel from FrameMind AI Studio, on top of the standard pack." },
  { icon: Award, title: "Featured as a launch partner", body: "With your permission, your school is credited as a founding partner on our website and launch film." },
];

/** Honest panel shown until real, published testimonials exist. */
function FoundingPartners() {
  return (
    <div className="sketch-frame relative bg-paper-50/80 p-6 shadow-[var(--shadow-paper)] sm:p-10 lg:p-14">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <SectionLabel index="09">Founding partner schools</SectionLabel>
          <h2 id="partners-title" className="mt-5 text-[clamp(2rem,1.2rem+3vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
            <RevealLines lines={["Be one of our first", "10 partner schools."]} />
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl leading-relaxed text-charcoal sm:text-[17px]">
              JOVE is launching this season. Rather than show you borrowed praise, we&apos;re inviting ten schools to shape the program with us — and we&apos;ll
              make it worth their while.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-5">
            {BENEFITS.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={0.1 + i * 0.08} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center border border-graphite/25 bg-paper text-graphite">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-graphite">{title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-charcoal">{body}</span>
                </span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.3} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/contact" size="lg" arrow>
              Apply as a founding school
            </Button>
            <span className="text-xs text-blueprint">Founding benefits are confirmed in writing in your proposal.</span>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={0.15}>
            <p className="annot flex items-center justify-between text-blueprint">
              <span>Founding slots</span>
              <span className="font-mono">
                {SLOTS} / {SLOTS} open
              </span>
            </p>
            <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-2">
              {Array.from({ length: SLOTS }, (_, i) => (
                <li
                  key={i}
                  className="relative flex aspect-[5/3] flex-col justify-between border border-dashed border-graphite/30 bg-paper p-3 transition-colors hover:border-graphite/60 hover:bg-paper-200/50"
                >
                  <span className="font-mono text-[11px] text-blueprint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="annot text-graphite/70">Open</span>
                  <span aria-hidden className="hatch-light absolute inset-0" />
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs leading-relaxed text-blueprint">Each slot becomes a partner school once its first JOVE Day is booked.</p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  const v = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span role="img" className="flex gap-0.5" aria-label={`Rated ${v} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-3.5 ${i < v ? "fill-graphite text-graphite" : "text-graphite/25"}`} aria-hidden />
      ))}
    </span>
  );
}

/** Published testimonials (from HQ) — or the founding-partner invitation when there are none yet. */
export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  if (!items.length) {
    return (
      <section aria-labelledby="partners-title" className="relative overflow-hidden bg-paper py-24 sm:py-32">
        <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="container-bp relative">
          <FoundingPartners />
        </div>
      </section>
    );
  }

  const shown = items.slice(0, 6);
  return (
    <section aria-labelledby="testimonials-title" className="relative overflow-hidden bg-paper py-24 sm:py-32">
      <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="container-bp relative">
        <SectionHeading
          id="testimonials-title"
          index="09"
          eyebrow="From our schools"
          title={["What principals", "and teachers say."]}
          action={
            <Button href="/testimonials" variant="secondary" arrow>
              All testimonials
            </Button>
          }
        />
        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {shown.map((t, i) => (
            <Reveal as="li" key={t.id} delay={(i % 3) * 0.08} className={i === 0 && t.featured ? "md:col-span-2 lg:row-span-2" : ""}>
              <figure className="relative flex h-full flex-col rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-paper)] sm:p-8">
                <Quote className="size-6 text-graphite/30" aria-hidden />
                <blockquote className={`mt-4 flex-1 leading-relaxed text-graphite ${i === 0 && t.featured ? "text-xl sm:text-2xl" : ""}`}>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption className="mt-6 flex items-end justify-between gap-4 border-t border-graphite/10 pt-5">
                  <span>
                    <span className="block font-semibold text-graphite">{t.name}</span>
                    {(t.role || t.organisation) && <span className="block text-sm text-charcoal">{[t.role, t.organisation].filter(Boolean).join(", ")}</span>}
                  </span>
                  {typeof t.rating === "number" && t.rating > 0 && <Stars n={t.rating} />}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
