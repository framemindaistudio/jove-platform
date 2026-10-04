import type { Metadata } from "next";
import { ChevronDown, MapPin } from "lucide-react";
import { CornerMarks, SectionLabel } from "@/components/brand/Blueprint";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { ContactChannels } from "@/components/site/contact/ContactChannels";
import { ContactForms } from "@/components/site/contact/ContactForms";
import { NextSteps } from "@/components/site/contact/NextSteps";
import { buildContactTabs, parseContactTab } from "@/components/site/contact/tabs";
import { faqs } from "@/lib/content/business";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a JOVE Day for your school, order robotics kits in bulk, talk to our film studio or explore a partnership. A founder replies within one working day.",
  alternates: { canonical: "/contact" },
};

// Quick answers that save a round trip: what happens, pricing, what the school provides, trainer safety.
const FAQ_PICKS = [0, 1, 4, 5];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const { type } = await searchParams;
  const tabs = buildContactTabs();
  const initial = parseContactTab(type);
  const quick = FAQ_PICKS.map((i) => faqs[i]).filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        index="01"
        title={["Let’s build a day", "your school remembers."]}
        intro="Tell us about your school and we will take it from there: a call, a proposal and a date. The full day, the kits, the trainers and the film crew are all ours to arrange."
      >
        <a href="#enquire" className={buttonClass("primary", "lg")}>
          Send an enquiry
        </a>
      </PageHero>

      <section id="enquire" aria-label="Enquiry form" className="relative scroll-mt-24 pb-20 sm:pb-28">
        <div className="container-bp grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="min-w-0 lg:col-span-7">
            <ContactForms tabs={tabs} initial={initial} />
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <ContactChannels />
            </div>
          </Reveal>
        </div>
      </section>

      <NextSteps />

      <section aria-labelledby="area-heading" className="relative py-20 sm:py-28">
        <div className="container-bp grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel index="03">Where we work</SectionLabel>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="relative mt-6 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-paper)] sm:p-7">
                <CornerMarks />
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-graphite/30">
                    <MapPin className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <div>
                    <h2 id="area-heading" className="text-xl font-bold leading-tight tracking-[-0.02em] text-graphite">
                      Based in {site.location}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal">
                      Our team brings the whole JOVE Day to your campus. If your school is far from our base, we will cover travel and logistics in your proposal, so there are no surprises later.
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2 border-t border-dashed border-graphite/25 pt-5 text-sm leading-relaxed text-charcoal">
                  <li>
                    <strong className="font-semibold text-graphite">Workshops:</strong> offline, in your school, for Grades 1 to 10.
                  </li>
                  <li>
                    <strong className="font-semibold text-graphite">Virtual Labs:</strong> free and online, for any student anywhere.
                  </li>
                  <li>
                    <strong className="font-semibold text-graphite">Kits:</strong> shipped across India from our online store.
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index="04">Quick answers</SectionLabel>
            </Reveal>
            <div className="mt-6 divide-y divide-graphite/15 border-y border-graphite/15">
              {quick.map((f) => (
                <details key={f.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-[15px] font-semibold leading-snug tracking-[-0.01em] text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="size-4 shrink-0 text-blueprint transition-transform duration-300 group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="max-w-2xl pb-5 text-sm leading-relaxed text-charcoal">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
