import { SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";

/** Consistent section opener for /programs and /packages: eyebrow, line-revealed h2, intro. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  intro,
  light,
  id,
  className,
  aside,
}: {
  index?: string;
  eyebrow: string;
  title: string[];
  intro?: React.ReactNode;
  light?: boolean;
  id?: string;
  className?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-12 lg:items-end", className)}>
      <div className={aside ? "lg:col-span-7" : "lg:col-span-9"}>
        <Reveal>
          <SectionLabel index={index} light={light}>
            {eyebrow}
          </SectionLabel>
        </Reveal>
        <h2 id={id} className={cn("mt-5 text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1] tracking-[-0.03em]", light ? "text-paper" : "text-graphite")}>
          <RevealLines lines={title} />
        </h2>
        {intro && (
          <Reveal delay={0.15}>
            <div className={cn("mt-5 max-w-2xl text-base leading-relaxed sm:text-lg", light ? "text-paper/70" : "text-charcoal")}>{intro}</div>
          </Reveal>
        )}
      </div>
      {aside && (
        <Reveal delay={0.2} className="lg:col-span-5">
          {aside}
        </Reveal>
      )}
    </div>
  );
}
