import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { AREAS, areaBySlug, BASE, REACH } from "@/lib/content/areas";
import { gradeBands, joveDayRules, mediaPack } from "@/lib/content/business";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CornerMarks, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { CTASection } from "@/components/site/CTASection";
import { Reveal } from "@/components/site/Reveal";

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = areaBySlug(slug);
  if (!a) return {};
  const title = `Robotics & AI Workshops for Schools in ${a.name}`;
  const description = a.description;
  return { title, description, alternates: { canonical: `/areas/${a.slug}` }, openGraph: { title: `${title} | JOVE`, description } };
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = areaBySlug(slug);
  if (!a) notFound();

  const prices = gradeBands.map((b) => b.pricePerStudent);
  const others = AREAS.filter((x) => x.slug !== a.slug);
  const url = `${site.url}/areas/${a.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `Robotics & AI workshops for schools in ${a.title}`,
      serviceType: "School robotics and AI workshop",
      url,
      provider: { "@type": "EducationalOrganization", name: site.name, url: site.url },
      areaServed: { "@type": "AdministrativeArea", name: `${a.title}, ${BASE.state}` },
      audience: { "@type": "EducationalAudience", educationalRole: "school" },
      offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), description: "Per student, JOVE Day, before GST" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: a.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: "Where we work", item: `${site.url}/areas` },
        { "@type": "ListItem", position: 3, name: a.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
        <GridBackdrop />
        <div className="container-bp relative">
          <Link href="/areas" className="annot inline-flex items-center gap-2 text-blueprint hover:text-graphite">
            <ArrowLeft className="size-3.5" aria-hidden /> Where we work
          </Link>
          <div className="mt-6 grid items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SectionLabel>{`${a.title} · ${REACH[a.reach].label}`}</SectionLabel>
              <h1 className="mt-5 text-[clamp(2.2rem,5.2vw,4.4rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">Robotics &amp; AI workshops for schools in {a.name}</h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-charcoal sm:text-lg">{a.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/packages#estimate" size="lg" arrow>
                  Request a proposal
                </Button>
                <Button href="/contact" variant="secondary" size="lg">
                  Talk to us
                </Button>
              </div>
            </div>
            <aside className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-lift)] lg:col-span-5 sm:p-8">
              <CornerMarks />
              <p className="annot flex items-center gap-2 text-blueprint">
                <MapPin className="size-3.5" aria-hidden /> From {BASE.town}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-charcoal">{REACH[a.reach].line}</p>
              <h2 className="annot mt-6 text-blueprint">Towns we travel to</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {a.towns.map((t) => (
                  <li key={t} className="rounded-full border border-graphite/20 px-3 py-1 text-sm font-semibold text-graphite">
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-blueprint">Your town not listed? Ask us; most schools in the district can be reached.</p>
            </aside>
          </div>
        </div>
      </section>

      <section aria-labelledby="day-title" className="relative border-t border-graphite/10 bg-paper-50 py-20 sm:py-24">
        <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-bp relative grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel index="01">The day</SectionLabel>
            <h2 id="day-title" className="mt-5 text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">
              A JOVE Day at your school in {a.name}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-charcoal">{a.plan}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-charcoal">
              Every JOVE Day includes the {mediaPack.name}: reels, a full-day film and drone shots of your students building, delivered to the school.
            </p>
            <Link href="/programs" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-graphite underline underline-offset-4">
              The full programme, minute by minute <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {gradeBands.map((b, i) => (
              <Reveal as="li" key={b.id} delay={i * 0.06} className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper p-5">
                <p className="annot text-blueprint">{b.grades}</p>
                <p className="mt-1 text-lg font-bold text-graphite">{b.name}</p>
                <p className="mt-1 text-sm text-charcoal">{b.theme}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="cost-title" className="relative py-20 sm:py-24">
        <GridBackdrop vignette={false} className="opacity-60" />
        <div className="container-bp relative grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel index="02">Cost</SectionLabel>
            <h2 id="cost-title" className="mt-5 text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">
              The same prices as everywhere
            </h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-charcoal lg:col-span-7">
            <p>
              A JOVE Day is priced per student by grade group: from <strong className="text-graphite">{formatINR(Math.min(...prices))}</strong> to{" "}
              <strong className="text-graphite">{formatINR(Math.max(...prices))}</strong> per student, before GST, with a minimum of {formatINR(joveDayRules.minimumBilling)} for the day.
            </p>
            <p>Travel and logistics for {a.title} are worked out for your town and written into your proposal, so the full amount is clear before you confirm.</p>
            <Button href="/packages#estimate" variant="secondary" size="md" arrow>
              Work out your estimate
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="relative border-t border-graphite/10 bg-paper-50 py-20 sm:py-24">
        <div className="container-bp relative grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel index="03">Questions</SectionLabel>
            <h2 id="faq-title" className="mt-5 text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">
              Schools in {a.name} ask
            </h2>
          </div>
          <dl className="divide-y divide-graphite/12 border-y border-graphite/12 lg:col-span-8">
            {a.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-[17px] font-bold tracking-[-0.01em] text-graphite">{f.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-charcoal">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="near-title" className="relative py-16">
        <div className="container-bp">
          <h2 id="near-title" className="annot text-blueprint">
            Other districts we work in
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/areas/${o.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-graphite/25 px-4 text-sm font-semibold text-graphite hover:bg-graphite hover:text-paper">
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTASection title={[`Bring JOVE`, `to your school in ${a.name}.`]} primary={{ label: "Request a proposal", href: "/packages#estimate" }} secondary={{ label: "Talk to us", href: "/contact" }} />
    </>
  );
}
