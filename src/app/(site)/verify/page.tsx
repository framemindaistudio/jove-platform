import type { Metadata } from "next";
import Link from "next/link";
import { CornerMarks, SectionLabel, SpecIndex } from "@/components/brand/Blueprint";
import { CertificateLookup } from "@/components/site/contact/CertificateLookup";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Verify a Certificate",
  description: "Check that a JOVE certificate is genuine. Enter the certificate ID to see who it was issued to, for which programme and when.",
  alternates: { canonical: "/verify" },
};

/** Little sketch of a certificate with the ID called out. Decorative. */
function CertificateSketch() {
  return (
    <figure className="relative mx-auto w-full max-w-md rounded-[var(--radius-md)] border border-graphite/20 bg-paper-50 p-5 shadow-[var(--shadow-lift)]">
      <CornerMarks />
      <svg viewBox="0 0 400 270" role="img" aria-label="Sketch of a JOVE certificate with the certificate ID printed at the bottom" className="h-auto w-full text-graphite" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="8" y="8" width="384" height="254" rx="4" strokeWidth="1.6" />
        <rect x="20" y="20" width="360" height="230" rx="2" strokeDasharray="3 4" opacity="0.5" />
        <circle cx="200" cy="64" r="22" />
        <circle cx="200" cy="64" r="14" opacity="0.6" />
        <path d="M200 42v44M178 64h44" strokeDasharray="2 3" opacity="0.5" />
        <path d="M120 112h160" strokeWidth="2.4" />
        <path d="M150 134h100M135 152h130" opacity="0.5" />
        <g opacity="0.45">
          <path d="M60 206h80M260 206h80" />
          <path d="M70 214h60M270 214h60" opacity="0.6" />
        </g>
        <rect x="118" y="222" width="164" height="22" rx="2" strokeWidth="1.8" />
        <text x="200" y="237.5" textAnchor="middle" fontFamily="var(--font-mono-jb), monospace" fontSize="11" letterSpacing="2" fill="currentColor" stroke="none">
          JOVE-26-7KQ2M
        </text>
        <path d="M296 233h26l14-34" strokeDasharray="3 3" />
        <circle cx="338" cy="196" r="3" fill="currentColor" />
      </svg>
      <figcaption className="annot mt-3 text-center text-blueprint">Your certificate ID is printed at the bottom</figcaption>
    </figure>
  );
}

const steps = [
  { title: "Find the ID", body: "It is printed along the bottom of every certificate JOVE issues, and looks like JOVE-26-7KQ2M." },
  { title: "Enter it above", body: "Capitals, lowercase and spaces do not matter. We tidy the ID up for you." },
  { title: "Read the result", body: "You will see who the certificate was issued to, the programme, the school and the date, or a clear message if we cannot find it." },
];

export default function VerifyPage() {
  return (
    <>
      <PageHero
        eyebrow="Certificate verification"
        index="01"
        title={["Is this certificate", "the real thing?"]}
        intro="Every certificate JOVE issues after a workshop carries a unique ID. Enter it to confirm who it was issued to, for which programme and when."
        aside={<CertificateSketch />}
      >
        <CertificateLookup className="max-w-xl" />
      </PageHero>

      <section aria-labelledby="how-heading" className="relative pb-24 sm:pb-32">
        <div className="container-bp grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index="01">How it works</SectionLabel>
            </Reveal>
            <h2 id="how-heading" className="sr-only">
              How certificate verification works
            </h2>
            <ol className="mt-8 divide-y divide-graphite/15 border-y border-graphite/15">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 0.08} y={16} className="grid grid-cols-[3rem_1fr] gap-3 py-6">
                  <SpecIndex n={i + 1} className="pt-1.5" />
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.015em] text-graphite">{s.title}</h3>
                    <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-charcoal">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal delay={0.15} className="lg:col-span-5">
            <aside className="relative rounded-[var(--radius-md)] border border-graphite/20 bg-graphite/[0.035] p-6 sm:p-7">
              <CornerMarks />
              <p className="annot text-blueprint">What this page shows</p>
              <p className="mt-3 text-sm leading-relaxed text-charcoal">
                Verification shows only what is printed on the certificate: the student&rsquo;s name, the programme, the school, the grade and the date of issue. Nothing else about a student is public. We process
                children&rsquo;s details only with parental consent given through the school. Read more in our <Link href="/privacy" className="font-semibold text-graphite underline decoration-graphite/40 underline-offset-4 hover:decoration-graphite">Privacy Policy</Link>.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-charcoal">
                Can&rsquo;t find the ID, or think a certificate is not genuine? <Link href="/contact?type=general" className="font-semibold text-graphite underline decoration-graphite/40 underline-offset-4 hover:decoration-graphite">Write to us</Link> and we will check it by hand.
              </p>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
