import Link from "next/link";
import { BookOpenText, FlaskConical, LifeBuoy, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Child-safe, low-voltage",
    body: "Every kit runs on AA cells or USB power — low-voltage DC only. No mains electricity, ever, and solder-free builds for the younger grades.",
  },
  {
    icon: BookOpenText,
    title: "Illustrated build guides",
    body: "From an 8-page activity book for Grades 1–2 to a 48-page AI project guide for Grades 9–10 — step by step, written by the JOVE team.",
  },
  {
    icon: FlaskConical,
    title: "A free Virtual Lab with every kit",
    body: "Theory, demo, a hands-on simulation and a challenge in the browser — then the same idea, built for real.",
    href: "/labs",
    cta: "Explore labs",
  },
  {
    icon: LifeBuoy,
    title: "Help from the people who made it",
    body: "Stuck on a step? Message the JOVE team — the same people who design the kits and teach the workshops.",
    href: "/contact",
    cta: "Contact us",
  },
] as const;

/** Four reassurance points shown under the catalog and on product pages. */
export function TrustStrip({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <ul className={cn("grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-graphite/15 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {ITEMS.map((it, i) => {
        const Icon = it.icon;
        return (
          <Reveal as="li" key={it.title} delay={i * 0.06} className={cn("relative flex flex-col bg-paper-50", compact ? "p-5" : "p-6 sm:p-7")}>
            <div className="flex items-center justify-between">
              <span className="relative grid size-11 place-items-center rounded-full border border-graphite/25 text-graphite">
                <span className="absolute inset-1 rounded-full border border-dashed border-graphite/15" aria-hidden />
                <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="font-mono text-xs tracking-widest text-blueprint">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-5 text-base font-bold tracking-[-0.01em] text-graphite">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">{it.body}</p>
            {"href" in it && (
              <Link href={it.href} className="annot mt-4 inline-flex w-fit items-center gap-1.5 text-graphite underline decoration-graphite/30 underline-offset-4 transition-colors hover:decoration-graphite">
                {it.cta} →
              </Link>
            )}
          </Reveal>
        );
      })}
    </ul>
  );
}
