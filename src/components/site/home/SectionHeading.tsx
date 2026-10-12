import { SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";

/** Consistent home-page section heading: blueprint eyebrow, line-revealed title, optional intro + action. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  intro,
  light,
  action,
  className,
  id,
}: {
  index: string;
  eyebrow: string;
  title: string[];
  intro?: React.ReactNode;
  light?: boolean;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-12 lg:items-end", className)}>
      <div className="lg:col-span-7">
        <SectionLabel index={index} light={light}>
          {eyebrow}
        </SectionLabel>
        <h2 id={id} className={cn("mt-5 text-[clamp(2rem,1.2rem+3vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.03em]", light ? "text-paper" : "text-graphite")}>
          <RevealLines lines={title} />
        </h2>
      </div>
      {(intro || action) && (
        <Reveal delay={0.15} className="lg:col-span-5 lg:pb-2">
          {intro && <p className={cn("max-w-xl text-base leading-relaxed sm:text-[17px]", light ? "text-paper/70" : "text-charcoal")}>{intro}</p>}
          {action && <div className="mt-6">{action}</div>}
        </Reveal>
      )}
    </div>
  );
}
