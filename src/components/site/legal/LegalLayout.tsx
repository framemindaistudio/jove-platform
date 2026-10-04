import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Crosshair, CornerMarks, GridBackdrop, SectionLabel, SketchDivider, SpecIndex } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { LegalToc } from "./LegalToc";

export const LEGAL_UPDATED = "2 October 2026";

export const legalPages = [
  { href: "/privacy", label: "Privacy Policy", blurb: "How we handle data — especially children's data" },
  { href: "/terms", label: "Terms of Service", blurb: "Website, workshops, bookings & payments" },
  { href: "/refund-policy", label: "Refund & Cancellation", blurb: "Rescheduling, cancellations & kit returns" },
  { href: "/shipping-policy", label: "Shipping Policy", blurb: "Dispatch, delivery & damaged parcels" },
] as const;

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/**
 * Shared shell for /privacy, /terms, /refund-policy and /shipping-policy:
 * hero with plain-words summary, sticky table of contents, numbered sections, related-policy links.
 */
export function LegalLayout({
  index,
  eyebrow,
  title,
  intro,
  summaryTitle = "In plain words",
  summary,
  sections,
  current,
  figure,
}: {
  index: string;
  eyebrow: string;
  title: string[];
  intro: string;
  summaryTitle?: string;
  summary: string[];
  sections: LegalSection[];
  current: (typeof legalPages)[number]["href"];
  /** Optional visual placed above the first section (e.g. the cancellation timeline). */
  figure?: React.ReactNode;
}) {
  const related = legalPages.filter((p) => p.href !== current);

  return (
    <>
      <section className="relative overflow-hidden pb-14 pt-32 sm:pb-20 sm:pt-40">
        <GridBackdrop />
        <Crosshair className="absolute left-[6%] top-28 hidden md:block" />
        <div className="container-bp relative grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index={index}>{eyebrow}</SectionLabel>
            </Reveal>
            <h1 className="mt-6 text-[clamp(2.3rem,5.5vw,4.6rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">
              <RevealLines lines={title} />
            </h1>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-charcoal sm:text-lg">{intro}</p>
            </Reveal>
            <Reveal delay={0.3}>
              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-charcoal">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-blueprint" aria-hidden />
                  <dt className="sr-only">Last updated</dt>
                  <dd>
                    <span className="annot mr-2 text-blueprint">Last updated</span>
                    <time dateTime="2026-10-02" className="font-mono text-[13px] text-graphite">
                      {LEGAL_UPDATED}
                    </time>
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-blueprint" aria-hidden />
                  <dt className="sr-only">Applies to</dt>
                  <dd>
                    <span className="annot mr-2 text-blueprint">Applies to</span>
                    <span className="text-graphite">India</span>
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.3} className="lg:col-span-5">
            <div className="relative rounded-[var(--radius-md)] border border-graphite/20 bg-paper-50/90 p-6 shadow-[var(--shadow-paper)] backdrop-blur-[2px] sm:p-7">
              <CornerMarks />
              <p className="annot text-blueprint">{summaryTitle}</p>
              <ul className="mt-4 space-y-3">
                {summary.map((s, i) => (
                  <li key={i} className="grid grid-cols-[2rem_1fr] gap-2 text-[15px] leading-relaxed text-graphite">
                    <SpecIndex n={i + 1} className="pt-[0.2em]" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-dashed border-graphite/25 pt-4 text-xs leading-relaxed text-blueprint">
                This summary is a convenience. The full text below is what applies.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-20 sm:pb-28">
        <div className="container-bp grid gap-10 lg:grid-cols-12 lg:gap-14">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <LegalToc items={sections.map((s) => ({ id: s.id, title: s.title }))} />
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-9 xl:col-span-8">
            {figure}
            <article className={figure ? "mt-14" : ""}>
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-heading`}
                  className="scroll-mt-28 border-t border-graphite/15 py-9 first:border-t-0 first:pt-0 sm:py-11"
                >
                  <div className="flex items-baseline gap-4">
                    <SpecIndex n={i + 1} />
                    <h2 id={`${s.id}-heading`} className="text-[1.45rem] font-bold leading-tight tracking-[-0.02em] text-graphite sm:text-[1.65rem]">
                      {s.title}
                    </h2>
                  </div>
                  <div className="mt-5 sm:pl-10">{s.body}</div>
                </section>
              ))}
            </article>

            <SketchDivider className="my-12" />

            <nav aria-label="Other policies" className="print:hidden">
              <p className="annot text-blueprint">Related policies</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      className="group relative flex h-full flex-col justify-between gap-6 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5 shadow-[var(--shadow-paper)] transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-lift)]"
                    >
                      <span>
                        <span className="block text-[15px] font-bold tracking-[-0.01em] text-graphite">{p.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-blueprint">{p.blurb}</span>
                      </span>
                      <ArrowUpRight className="size-4 text-blueprint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-graphite" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm leading-relaxed text-charcoal">
                Questions about this page? <Link href="/contact" className="font-semibold text-graphite underline decoration-graphite/40 underline-offset-4 hover:decoration-graphite">Write to us</Link> and a founder will reply.
              </p>
            </nav>
          </div>
        </div>
      </section>
    </>
  );
}
