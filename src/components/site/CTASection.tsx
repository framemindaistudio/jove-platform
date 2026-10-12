import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SectionLabel, CornerMarks } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "./Reveal";

/** Dark closing call-to-action band used at the bottom of most pages. */
export function CTASection({
  eyebrow = "Next step",
  title = ["Bring JOVE", "to your school."],
  body = "One call. A date on your calendar. A full day your students will talk about for years — and the films to prove it.",
  primary = { label: "Book a JOVE Day", href: "/contact" },
  secondary = { label: "Try a Virtual Lab", href: "/labs" },
}: {
  eyebrow?: string;
  title?: string[];
  body?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
      <div className="bp-grid-dark absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute -right-24 top-1/2 hidden w-[620px] -translate-y-1/2 opacity-[0.18] lg:block">
        <Image src="/brand/jove-mark-white.png" alt="" width={1024} height={1178} className="h-auto w-full" />
      </div>
      <div className="container-bp relative">
        <div className="relative max-w-3xl">
          <Reveal>
            <SectionLabel light>{eyebrow}</SectionLabel>
          </Reveal>
          <h2 className="mt-6 text-[clamp(2.4rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.03em]">
            <RevealLines lines={title} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">{body}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href={primary.href} variant="light" size="lg" arrow>
                {primary.label}
              </Button>
              <Button href={secondary.href} variant="outline-light" size="lg">
                {secondary.label}
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
      <div className="container-bp relative mt-20">
        <div className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15 sm:grid-cols-4">
          <CornerMarks className="text-paper/40" />
          {[
            ["Grades", "1 – 10"],
            ["Hands-on", "Every student"],
            ["Media Pack", "Reels · Film · Drone"],
            ["Booking to day", "≈ 2 weeks"],
          ].map(([k, v]) => (
            <div key={k} className="bg-graphite px-5 py-6">
              <p className="annot text-paper/45">{k}</p>
              <p className="mt-2 text-lg font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
