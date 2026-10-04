import { GridBackdrop, SectionLabel, Crosshair, DimensionLine } from "@/components/brand/Blueprint";
import { RevealLines, Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

/**
 * Standard hero for inner pages: grid paper, eyebrow, big headline (line reveal), intro, optional aside.
 * `title` is an array of lines so each line can animate in.
 */
export function PageHero({
  eyebrow,
  index,
  title,
  intro,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  index?: string;
  title: React.ReactNode[];
  intro?: React.ReactNode;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-40", className)}>
      <GridBackdrop />
      <Crosshair className="absolute left-[6%] top-28 hidden md:block" />
      <Crosshair className="absolute bottom-10 right-[8%] hidden md:block" size={22} />
      <div className="container-bp relative grid items-end gap-12 lg:grid-cols-12">
        <div className={aside ? "lg:col-span-7" : "lg:col-span-10"}>
          <Reveal>
            <SectionLabel index={index}>{eyebrow}</SectionLabel>
          </Reveal>
          <h1 className="mt-6 text-[clamp(2.4rem,6vw,5.2rem)] font-bold leading-[0.98] tracking-[-0.03em] text-graphite">
            <RevealLines lines={title} />
          </h1>
          {intro && (
            <Reveal delay={0.25}>
              <div className="mt-7 max-w-2xl text-base leading-relaxed text-charcoal sm:text-lg">{intro}</div>
            </Reveal>
          )}
          {children && (
            <Reveal delay={0.35}>
              <div className="mt-9">{children}</div>
            </Reveal>
          )}
        </div>
        {aside && (
          <Reveal delay={0.3} className="lg:col-span-5">
            {aside}
          </Reveal>
        )}
      </div>
      <div className="container-bp relative mt-16">
        <DimensionLine label={eyebrow} />
      </div>
    </section>
  );
}
