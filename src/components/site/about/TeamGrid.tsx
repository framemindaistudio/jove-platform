import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicMember } from "@/lib/public-data";
import { Reveal } from "@/components/site/Reveal";
import { Monogram } from "./Monogram";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/**
 * "The team": the people in Team & Payroll who agreed to be shown, with their photo, role and one line, and a card to
 * apply. With nobody shown yet, only the invitation appears (no placeholder people).
 */
export function TeamGrid({ members }: { members: PublicMember[] }) {
  return (
    <div className="mt-16" data-team>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="annot text-blueprint">The team</p>
          <h3 className="mt-2 text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">{members.length ? "On the floor with them" : "The team grows with every JOVE Day"}</h3>
        </div>
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((m, i) => (
          <Reveal as="li" key={m.id} delay={Math.min(i, 3) * 0.06}>
            <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
              <div className="relative aspect-[4/5] overflow-hidden border-b border-graphite/10 bg-paper-200">
                {m.photo ? (
                  // served from HQ as a small JPEG, only while they are shown on the website
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt={`Portrait of ${m.name}`} loading="lazy" className="size-full object-cover grayscale" />
                ) : (
                  <div className="grid size-full place-items-center">
                    <Monogram initials={initialsOf(m.name)} size="lg" label={`${m.name}: monogram`} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-lg font-bold leading-tight tracking-[-0.02em] text-graphite">{m.name}</p>
                <p className="mt-1 text-sm font-semibold text-charcoal">{m.role}</p>
                {m.line && <p className="mt-2 text-[13px] leading-relaxed text-charcoal">{m.line}</p>}
              </div>
            </article>
          </Reveal>
        ))}
        <Reveal as="li" delay={0.1}>
          <Link
            href="/careers#apply"
            className="group flex h-full min-h-56 flex-col justify-between rounded-[var(--radius-md)] border border-dashed border-graphite/35 bg-paper/70 p-6 transition-colors hover:border-graphite hover:bg-paper-50"
          >
            <span>
              <span className="annot text-blueprint">We are hiring</span>
              <span className="mt-3 block text-xl font-bold leading-snug tracking-[-0.02em] text-graphite">Join the team</span>
              <span className="mt-2 block text-[13px] leading-relaxed text-charcoal">Trainers, editors and people who love schools. Students are welcome.</span>
            </span>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-graphite">
              Apply to join <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </Reveal>
      </ul>
    </div>
  );
}
