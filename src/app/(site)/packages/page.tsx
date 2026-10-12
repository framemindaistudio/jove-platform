import type { Metadata } from "next";
import Image from "next/image";
import { joveDayRules, mediaPack } from "@/lib/content/business";
import { whatsappLink } from "@/lib/site";
import { formatINR, pad2 } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CornerMarks, GridBackdrop } from "@/components/brand/Blueprint";
import { PageHero } from "@/components/site/PageHero";
import { CTASection } from "@/components/site/CTASection";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/programs/SectionHeading";
import { PackageCards } from "@/components/site/programs/PackageCards";
import { QuoteEstimator } from "@/components/site/programs/QuoteEstimator";
import { AddOnsTable, ComparisonMatrix, PackagesFaq, PaymentTerms } from "@/components/site/programs/PackageExtras";
import { ESTIMATOR_ID, priceRange } from "@/components/site/programs/data";

export const metadata: Metadata = {
  title: "Packages & Pricing — JOVE Day, Quarter, Year & Club",
  description: `Transparent per-student pricing for JOVE Robotics & AI workshops, from ${formatINR(priceRange("jove-day").min)} per student. Build an instant, itemised quote for your school — add-ons, GST and the free FrameMind Media Pack included.`,
  alternates: { canonical: "/packages" },
  openGraph: {
    title: "JOVE Packages & Pricing",
    description: "JOVE Day, Quarter, Year and Club — per-student prices, an instant quote estimator and a free cinematic Media Pack with every JOVE Day.",
    images: [{ url: "/images/studio/media-crew.webp", width: 2400, height: 1340, alt: "Illustration of a film crew filming students building robots" }],
  },
};

export default function PackagesPage() {
  const whatsappBase = whatsappLink("");

  return (
    <>
      <PageHero
        eyebrow="Packages & pricing"
        index="01"
        title={["Clear pricing.", "Per student.", "Film included."]}
        intro={
          <>
            Four ways to bring JOVE to your campus — from a single full-day festival to a year-long Robotics &amp; AI programme. Prices are per student and exclude GST. Kits, certificates and our studio&apos;s Media Pack come with every JOVE Day.
          </>
        }
        aside={
          <figure className="relative overflow-hidden rounded-[var(--radius-lg)] bg-graphite text-paper shadow-[var(--shadow-lift)]">
            <div className="relative aspect-[16/9]">
              <Image src="/images/studio/media-crew.webp" alt="Black-and-white illustration of a film crew recording students as they build robots" fill sizes="(max-width: 1024px) 100vw, 40vw" quality={75} preload className="object-cover" />
              <div aria-hidden className="absolute inset-0 bg-linear-to-t from-graphite via-graphite/30 to-transparent" />
              <span className="annot absolute right-3 top-3 rounded-[var(--radius-sm)] bg-graphite/70 px-2 py-1 text-[9px] text-paper/80 backdrop-blur-sm">Illustrative image</span>
            </div>
            <CornerMarks className="m-3 text-paper/40" />
            <figcaption className="relative -mt-10 px-5 pb-5">
              <p className="annot text-paper/60">Free with every JOVE Day</p>
              <p className="mt-1 text-xl font-bold tracking-tight">{mediaPack.name}</p>
              <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs text-paper/75 sm:grid-cols-2">
                {mediaPack.items.map((m, i) => (
                  <li key={m.title} className="flex gap-2">
                    <span className="font-mono text-paper/40">{pad2(i + 1)}</span>
                    {m.title}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-paper/15 pt-3 font-mono text-sm">
                ≈ {formatINR(mediaPack.marketValue)} <span className="font-sans text-xs text-paper/55">typical market value, included</span>
              </p>
            </figcaption>
          </figure>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button href={`#${ESTIMATOR_ID}`} size="lg" arrow>
            Build your quote
          </Button>
          <Button href="#compare" variant="secondary" size="lg">
            Compare packages
          </Button>
        </div>
      </PageHero>

      {/* Packages */}
      <section aria-labelledby="packages-title" className="relative overflow-hidden border-t border-graphite/10 bg-paper-200/50 py-24 sm:py-28">
        <div aria-hidden className="bp-grid absolute inset-0 opacity-50" />
        <div className="container-bp relative">
          <SectionHeading
            index="02"
            eyebrow="Packages"
            id="packages-title"
            title={["Start with a day.", "Stay for the year."]}
            intro={`Most schools start with a JOVE Day (minimum ${joveDayRules.minimumStudents} students). We recommend JOVE Quarter when you want progress students can feel — three levels that build month on month.`}
          />
          <div className="mt-14">
            <PackageCards />
          </div>
        </div>
      </section>

      {/* Estimator */}
      <section id={ESTIMATOR_ID} aria-labelledby="estimate-title" className="relative scroll-mt-20 overflow-clip py-24 sm:py-28">
        <GridBackdrop />
        <div className="container-bp relative">
          <SectionHeading
            index="03"
            eyebrow="Quote estimator"
            id="estimate-title"
            title={["Your quote,", "itemised in a minute."]}
            intro="Pick a package, enter students by grade group and add what you need. Every line updates live — GST, minimums and savings included."
          />
          <div className="mt-14">
            <QuoteEstimator whatsappBase={whatsappBase} />
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section aria-labelledby="addons-title" className="relative overflow-hidden border-t border-graphite/10 bg-paper-200/50 py-24 sm:py-28">
        <div aria-hidden className="bp-grid absolute inset-0 opacity-50" />
        <div className="container-bp relative">
          <SectionHeading
            index="04"
            eyebrow="Add-ons"
            id="addons-title"
            title={["Go further,", "on your terms."]}
            intro="Year-round social media and films from FrameMind AI Studio, teacher training, take-home kits and a permanent lab — add any of them to any package."
          />
          <Reveal className="mt-14">
            <AddOnsTable />
          </Reveal>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" aria-labelledby="compare-title" className="relative scroll-mt-20 overflow-hidden bg-graphite py-24 text-paper sm:py-28">
        <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-80" />
        <div className="container-bp relative">
          <SectionHeading light index="05" eyebrow="Compare" id="compare-title" title={["Every package,", "side by side."]} intro="What each package includes, line by line." />
          <Reveal className="mt-14">
            <ComparisonMatrix />
          </Reveal>
        </div>
      </section>

      {/* Payment terms */}
      <section aria-labelledby="terms-title" className="relative overflow-hidden py-24 sm:py-28">
        <GridBackdrop />
        <div className="container-bp relative">
          <SectionHeading
            index="06"
            eyebrow="Payment terms"
            id="terms-title"
            title={["Simple terms.", "No surprises."]}
            intro={`${joveDayRules.advancePercent}% to book, the balance within ${joveDayRules.balanceDueDays} days of your JOVE Day, GST shown separately on every invoice.`}
          />
          <div className="mt-14">
            <PaymentTerms />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="relative overflow-hidden border-t border-graphite/10 bg-paper-200/50 py-24 sm:py-28">
        <div aria-hidden className="bp-grid absolute inset-0 opacity-50" />
        <div className="container-bp relative grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading index="07" eyebrow="FAQ" id="faq-title" title={["Questions", "schools ask."]} className="lg:block" />
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-charcoal">Something not covered here? Send your estimate with a note, or ask us directly — a founder replies.</p>
              <div className="mt-6">
                <Button href="/contact" variant="secondary" arrow>
                  Ask a question
                </Button>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <PackagesFaq />
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Ready when you are"
        title={["Pick a date.", "We'll bring the rest."]}
        body="Send us your estimate or just your student numbers — we'll come back with a formal proposal, available dates and everything your coordinator needs."
        primary={{ label: "Book a JOVE Day", href: "/contact" }}
        secondary={{ label: "Explore the programs", href: "/programs" }}
      />
    </>
  );
}
