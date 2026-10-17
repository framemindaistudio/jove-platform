import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { AREAS, BASE, REACH } from "@/lib/content/areas";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { CornerMarks, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { PageHero } from "@/components/site/PageHero";
import { CTASection } from "@/components/site/CTASection";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Where We Work — School Robotics & AI Workshops in North Karnataka",
  description: `JOVE is based in ${BASE.town} and brings full-day Robotics & AI workshops to schools in Bagalkot, Vijayapura, Gadag, Koppal, Dharwad and Belagavi districts. See how we reach your town.`,
  alternates: { canonical: "/areas" },
};

export default function AreasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: "Where we work", item: `${site.url}/areas` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow="Where we work"
        title={["JOVE Days across", "North Karnataka."]}
        intro={
          <p>
            We are based in {BASE.town} and take the whole JOVE Day to your campus: robots, kits, trainers and our film crew. These are the districts we travel to. Further away? Ask us; we
            plan longer trips school by school.
          </p>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/packages#estimate" size="lg" arrow>
            Request a proposal
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Talk to us
          </Button>
        </div>
      </PageHero>

      <section aria-labelledby="districts-title" className="relative border-t border-graphite/10 bg-paper-50 py-20 sm:py-28">
        <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-bp relative">
          <SectionLabel index="01">Districts</SectionLabel>
          <h2 id="districts-title" className="mt-5 text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">
            Find your district
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.map((a, i) => (
              <Reveal as="li" key={a.slug} delay={Math.min(i, 3) * 0.06}>
                <Link
                  href={`/areas/${a.slug}`}
                  className="group relative flex h-full flex-col rounded-[var(--radius-lg)] border border-graphite/15 bg-paper p-6 shadow-[var(--shadow-paper)] transition-shadow hover:shadow-[var(--shadow-lift)]"
                >
                  <CornerMarks />
                  <span className="annot text-blueprint">{REACH[a.reach].label}</span>
                  <span className="mt-2 text-2xl font-bold tracking-[-0.02em] text-graphite">{a.title}</span>
                  <span className="mt-3 flex-1 text-sm leading-relaxed text-charcoal">{a.towns.join(" · ")}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-graphite">
                    Workshops in {a.name} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="travel-title" className="relative py-20 sm:py-28">
        <GridBackdrop vignette={false} className="opacity-60" />
        <div className="container-bp relative grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel index="02">Travel</SectionLabel>
            <h2 id="travel-title" className="mt-5 text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">
              How we reach you
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-charcoal">Travel and logistics are worked out for your town and written into your proposal, so the full amount is clear before you confirm.</p>
          </div>
          <ul className="grid gap-4 lg:col-span-8">
            {(Object.keys(REACH) as (keyof typeof REACH)[]).map((k) => (
              <li key={k} className="flex gap-4 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5">
                <MapPin className="mt-0.5 size-5 shrink-0 text-graphite" aria-hidden />
                <span>
                  <span className="block font-bold text-graphite">{REACH[k].label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-charcoal">{REACH[k].line}</span>
                  <span className="mt-1.5 block text-xs text-blueprint">
                    {AREAS.filter((a) => a.reach === k)
                      .map((a) => a.title)
                      .join(", ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTASection />
    </>
  );
}
