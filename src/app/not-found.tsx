import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, FlaskConical, Home, Layers, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CornerMarks, Crosshair, DimensionLine, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page could not be found.",
  robots: { index: false, follow: false },
};

const links: { href: string; label: string; note: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", note: "Back to the start of the blueprint", icon: Home },
  { href: "/programs", label: "Programs", note: "Full-day workshops, Grades 1 to 10", icon: Layers },
  { href: "/labs", label: "Virtual Labs", note: "Free robotics and AI journeys", icon: FlaskConical },
  { href: "/contact", label: "Contact", note: "Book a JOVE Day or ask us anything", icon: CalendarCheck },
];

/** Pure-CSS entrance (no hydration needed, so the 404 copy is never hidden while JS loads). */
const RISE_CSS = `@keyframes nf-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.nf-rise{animation:nf-rise .9s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}
@media (prefers-reduced-motion:reduce){.nf-rise{animation:none}}`;

const rise = (delay: number): React.CSSProperties => ({ ["--d" as string]: `${delay}s` });

/**
 * Root 404: renders inside the root layout only (no site navbar/footer), so it carries its own minimal header.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-paper">
      <style>{RISE_CSS}</style>
      <GridBackdrop />
      <Crosshair className="absolute left-[5%] top-28 hidden md:block" />
      <Crosshair className="absolute bottom-16 right-[6%] hidden md:block" size={22} />

      <header className="relative z-10 border-b border-graphite/10">
        <div className="container-bp flex h-16 items-center justify-between sm:h-20">
          <Logo variant="wordmark" href="/" priority className="w-[112px] sm:w-[136px]" />
          <Link href="/contact" className={buttonClass("secondary", "sm", "hidden sm:inline-flex")}>
            Contact us
          </Link>
        </div>
      </header>

      <main id="main" className="relative z-10 flex flex-1 items-center py-12 sm:py-16">
        <div className="container-bp grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div className="nf-rise">
              <SectionLabel index="ERROR 404">Sheet not found</SectionLabel>
            </div>
            <h1 className="nf-rise mt-6 text-[clamp(2.4rem,6vw,4.8rem)] font-bold leading-[0.98] tracking-[-0.03em] text-graphite" style={rise(0.08)}>
              This page wandered
              <br />
              off the blueprint.
            </h1>
            <p className="nf-rise mt-6 max-w-lg text-base leading-relaxed text-charcoal sm:text-lg" style={rise(0.2)}>
              The link may be old, or the address mistyped. Our little robot has been looking for it everywhere. Try one of these instead.
            </p>

            <ul className="mt-9 grid gap-3 sm:grid-cols-2">
              {links.map((l, i) => (
                <li key={l.href} className="nf-rise" style={rise(0.3 + i * 0.06)}>
                  <Link
                    href={l.href}
                    className="group relative flex h-full items-start gap-4 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50/90 p-4 shadow-[var(--shadow-paper)] transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-graphite/25 text-graphite transition-colors group-hover:bg-graphite group-hover:text-paper">
                      <l.icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold tracking-[-0.01em] text-graphite">{l.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-blueprint">{l.note}</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-blueprint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-graphite" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="nf-rise lg:col-span-6" style={rise(0.15)}>
            <figure className="relative mx-auto w-full max-w-xl">
              <div className="relative rounded-[var(--radius-md)] border border-graphite/20 bg-paper-50 p-3 shadow-[var(--shadow-lift)] sm:p-4">
                <CornerMarks size={14} />
                <Image
                  src="/images/misc/lost-robot.webp"
                  alt="Pencil sketch of a small robot standing on a blueprint map, looking lost"
                  width={1600}
                  height={1195}
                  priority
                  sizes="(min-width: 1024px) 560px, (min-width: 640px) 576px, 92vw"
                  quality={85}
                  className="h-auto w-full rounded-[var(--radius-sm)]"
                />
                <p aria-hidden className="absolute right-6 top-5 font-mono text-[clamp(2.4rem,7vw,4.2rem)] font-medium leading-none tracking-[-0.04em] text-graphite/20 sm:right-8 sm:top-7">
                  404
                </p>
              </div>
              <figcaption className="mt-4">
                <DimensionLine label="Location unknown" />
              </figcaption>
            </figure>
          </div>
        </div>
      </main>
    </div>
  );
}
