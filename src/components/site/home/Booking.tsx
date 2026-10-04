import { Mail, MessageCircle, Phone } from "lucide-react";
import { ConstructionCircle, SectionLabel } from "@/components/brand/Blueprint";
import { LeadForm } from "@/components/site/LeadForm";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { joveDayRules } from "@/lib/content/business";
import { site, whatsappLink } from "@/lib/site";

const STEPS = [
  { title: "Tell us about your school", body: "Grades, approximate student numbers and a few preferred dates — it takes about two minutes." },
  { title: "A call with a founder", body: "Shivaprasad, our Founder & CEO, calls to understand your goals and suggest the right mix of sessions for each grade." },
  {
    title: "Proposal & date lock",
    body: `Clear per-student pricing by grade (ex-GST, minimum ${joveDayRules.minimumStudents} students). A ${joveDayRules.advancePercent}% advance locks your date; the balance is due within ${joveDayRules.balanceDueDays} days of your JOVE Day.`,
  },
  { title: "JOVE Day — and the film", body: "We arrive at 7:30 am with every kit and the film crew. Your reels and full-day film follow within days." },
];

/** Final booking block: what happens next + the workshop enquiry form. */
export function Booking() {
  const wa = whatsappLink("Hi JOVE, I'd like to book a JOVE Day for our school.");
  const { email, phone } = site.contact;

  return (
    <section id="book" aria-labelledby="book-title" className="relative scroll-mt-24 overflow-hidden bg-paper py-24 sm:py-32">
      <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 opacity-60 mix-blend-multiply" />
      <ConstructionCircle size={720} className="pointer-events-none absolute -right-60 -top-40 text-graphite/[0.07]" />

      <div className="container-bp relative">
        <div className="sketch-frame grid bg-paper-50/85 shadow-[var(--shadow-lift)] lg:grid-cols-12">
          <div className="border-b border-graphite/15 p-6 sm:p-10 lg:col-span-5 lg:border-b-0 lg:border-r lg:p-12">
            <SectionLabel index="11">Book a JOVE Day</SectionLabel>
            <h2 id="book-title" className="mt-5 text-[clamp(2rem,1.2rem+3vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
              <RevealLines lines={["Lock a date", "for your school."]} />
            </h2>
            <Reveal delay={0.1}>
              <p className="mt-5 leading-relaxed text-charcoal">
                Tell us a little about your school and a founder will get back to you with dates, a session plan and a clear quote.
              </p>
            </Reveal>

            <div className="relative mt-10">
              <span aria-hidden className="absolute bottom-3 left-[15px] top-3 w-px bg-graphite/15" />
              <ol className="relative space-y-7">
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={0.1 + i * 0.07} className="relative flex gap-5">
                  <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-graphite bg-paper font-mono text-xs text-graphite">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-graphite">{s.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-charcoal">{s.body}</span>
                  </span>
                </Reveal>
              ))}
              </ol>
            </div>

            {(email || phone || wa) && (
              <div className="mt-10 border-t border-graphite/15 pt-6">
                <p className="annot text-blueprint">Prefer to talk?</p>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-graphite">
                  {phone && (
                    <li>
                      <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:underline">
                        <Phone className="size-4" aria-hidden />
                        {phone}
                      </a>
                    </li>
                  )}
                  {wa && (
                    <li>
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
                        <MessageCircle className="size-4" aria-hidden />
                        WhatsApp
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  )}
                  {email && (
                    <li>
                      <a href={`mailto:${email}`} className="inline-flex items-center gap-2 break-all hover:underline">
                        <Mail className="size-4" aria-hidden />
                        {email}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-10 lg:col-span-7 lg:p-12">
            <p className="annot mb-6 flex items-center justify-between text-blueprint">
              <span>Workshop enquiry</span>
              <span className="font-mono">Form JV-01</span>
            </p>
            <LeadForm kind="workshop" submitLabel="Request dates & a quote" />
          </div>
        </div>
      </div>
    </section>
  );
}
