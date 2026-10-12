import type { Metadata } from "next";
import Image from "next/image";
import { Award, ClipboardList, FileSignature, FileText, Film, Lock, Mic, Play, Quote, Star } from "lucide-react";
import { getPublishedTestimonials, type PublicTestimonial } from "@/lib/public-data";
import { site } from "@/lib/site";
import { joveDaySchedule, mediaPack } from "@/lib/content/business";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConstructionCircle, CornerMarks, Crosshair, GridBackdrop, SectionLabel, SpecIndex } from "@/components/brand/Blueprint";
import { PageHero } from "@/components/site/PageHero";
import { CTASection } from "@/components/site/CTASection";
import { LeadForm } from "@/components/site/LeadForm";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { Monogram } from "@/components/site/about/Monogram";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Testimonials — Stories from JOVE Schools",
  description:
    "Consent-backed feedback from principals, teachers, parents and students after every JOVE Day. JOVE launches in October 2026 — our first stories are being written, and we never publish invented testimonials.",
  alternates: { canonical: "/testimonials" },
};

const heading = "text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em]";

/** The Founding Partner Schools programme — same terms as shown on the home page. */
const FOUNDING_SLOTS = 10;
const foundingBenefits = [
  { icon: Lock, title: "Founding-partner pricing, locked for a year", body: "Your per-student rates stay fixed for twelve months from your first JOVE Day." },
  { icon: Film, title: "An extra reel in your Media Pack", body: `One more cinematic reel from ${site.studio.name}, on top of the standard pack.` },
  { icon: Award, title: "Credited as a launch partner", body: "With your permission, your school is named as a founding partner on our website and in our launch film." },
];

const interview = joveDaySchedule.find((s) => /interview/i.test(s.title));
const principalClip = mediaPack.items.find((i) => /testimonial/i.test(i.title));

const feedbackSteps = [
  {
    icon: ClipboardList,
    when: interview ? `JOVE Day · ${interview.time}` : "On the day",
    title: "Feedback forms, before we pack up",
    body: "Teachers and coordinators fill in a short form while the day is still fresh — what worked, what did not, and what we should change next time.",
  },
  {
    icon: Mic,
    when: "On the day",
    title: "A filmed interview with the principal",
    body: principalClip
      ? `${principalClip.detail.replace(/\.$/, "")} — delivered ${principalClip.delivery.toLowerCase()}. It belongs to the school first.`
      : "A short filmed interview that the school can use for its own admissions marketing.",
  },
  {
    icon: FileText,
    when: "After the day",
    title: "A post-workshop report",
    body: "School management receives a written report of the day. If something fell short, it is in the report — along with what we are doing about it.",
  },
  {
    icon: FileSignature,
    when: "Before anything is published",
    title: "Written consent, every time",
    body: "No quote, name or face appears on this page without written consent to publish. For students, that means the school and a parent or guardian.",
  },
];

const principles = [
  "We publish words as they were given — never rewritten to sound better.",
  "We never write our own reviews or borrow someone else's.",
  "Founding-partner benefits do not depend on what a school says about us.",
  "Anyone quoted here can ask us to take their words down.",
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")).toUpperCase() || "J";
}

function QuoteCard({ t }: { t: PublicTestimonial }) {
  const dark = !!t.featured;
  const rating = t.rating ? Math.max(1, Math.min(5, Math.round(Number(t.rating)))) : 0;
  const localPhoto = t.photo && t.photo.startsWith("/") ? t.photo : null;
  const video = t.videoUrl && /^https?:\/\//i.test(t.videoUrl) ? t.videoUrl : null;
  const meta = [t.role, t.organisation].filter(Boolean).join(" · ");

  return (
    <figure
      className={cn(
        "relative rounded-[var(--radius-md)] border p-6 sm:p-7",
        dark ? "border-graphite bg-graphite text-paper shadow-[var(--shadow-lift)]" : "border-graphite/15 bg-paper-50 text-graphite shadow-[var(--shadow-paper)]",
      )}
    >
      <CornerMarks className={dark ? "text-paper/40" : undefined} />
      <div className="flex items-center justify-between">
        <Quote className={cn("size-7", dark ? "text-paper/40" : "text-graphite/30")} strokeWidth={1.25} aria-hidden />
        {rating > 0 && (
          <p className="flex items-center gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn("size-3.5", i < rating ? "fill-current" : "opacity-30")} strokeWidth={1.5} aria-hidden />
            ))}
          </p>
        )}
      </div>
      <blockquote className={cn("mt-5 text-[17px] font-medium leading-relaxed tracking-[-0.005em]", dark ? "text-paper" : "text-graphite")}>
        <p>&ldquo;{t.quote}&rdquo;</p>
      </blockquote>
      {video && (
        <a
          href={video}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4",
            dark ? "decoration-paper/40 hover:decoration-paper" : "decoration-graphite/30 hover:decoration-graphite",
          )}
        >
          <Play className="size-4" strokeWidth={1.5} aria-hidden />
          Watch the clip
          <span className="sr-only"> from {t.name} (opens in a new tab)</span>
        </a>
      )}
      <figcaption className={cn("mt-6 flex items-center gap-3.5 border-t border-dashed pt-5", dark ? "border-paper/20" : "border-graphite/20")}>
        {localPhoto ? (
          <span className="relative block size-12 shrink-0 overflow-hidden rounded-full border border-current/20">
            <Image src={localPhoto} alt="" fill sizes="48px" quality={75} className="object-cover grayscale" />
          </span>
        ) : (
          <Monogram initials={initialsOf(t.name)} size="sm" tone={dark ? "light" : "dark"} />
        )}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold">{t.name}</span>
          {meta && <span className={cn("block text-[13px] leading-snug", dark ? "text-paper/60" : "text-charcoal")}>{meta}</span>}
          {t.date && <span className={cn("annot mt-1 block font-mono", dark ? "text-paper/45" : "text-blueprint")}>{formatDate(t.date, { day: undefined })}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export default async function TestimonialsPage() {
  const testimonials = await getPublishedTestimonials();
  const has = testimonials.length > 0;
  const idx = has ? { stories: "02", blank: "", founding: "", process: "03", share: "04" } : { stories: "", blank: "02", founding: "03", process: "04", share: "05" };

  return (
    <>
      {/* 01 — HERO */}
      <PageHero
        eyebrow="Testimonials"
        index="01"
        title={has ? ["In their", "own words."] : ["Our first stories", "are being written."]}
        intro={
          has ? (
            <p>
              Feedback from the principals, teachers, parents and students we have worked with — published with their written consent, and in their own words.
            </p>
          ) : (
            <>
              <p>
                JOVE launches in October 2026. We have not yet run a JOVE Day for a partner school — so there are no testimonials here, and we will not invent any.
              </p>
              <p className="mt-4">
                This page fills up the honest way: one school, one day and one piece of real feedback at a time. Here is how that will work — and how your school can be
                among the first.
              </p>
            </>
          )
        }
        aside={
          <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-lift)] sm:p-8">
            <CornerMarks />
            <p className="annot flex items-center justify-between text-blueprint">
              <span>Record sheet</span>
              <span className="font-mono">T-01</span>
            </p>
            <dl className="mt-5 divide-y divide-dashed divide-graphite/20">
              <div className="flex items-baseline justify-between gap-4 pb-4">
                <dt className="text-sm text-charcoal">Published stories</dt>
                <dd className="font-mono text-4xl font-medium tracking-tight text-graphite">{String(testimonials.length).padStart(2, "0")}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-sm text-charcoal">Invented or borrowed</dt>
                <dd className="font-mono text-4xl font-medium tracking-tight text-graphite">00</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-4">
                <dt className="text-sm text-charcoal">Consent to publish</dt>
                <dd className="text-sm font-semibold text-graphite">Written, every time</dd>
              </div>
            </dl>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          {has ? (
            <Button href="/contact" size="lg" arrow>
              Book a JOVE Day
            </Button>
          ) : (
            <Button href="#founding" size="lg" arrow>
              Become a founding partner
            </Button>
          )}
          <Button href="#share" variant="secondary" size="lg">
            Share your experience
          </Button>
        </div>
      </PageHero>

      {has ? (
        /* STORIES */
        <section aria-labelledby="stories-title" className="relative border-t border-graphite/10 bg-paper-50 py-24 sm:py-32">
          <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
          <div className="container-bp relative">
            <Reveal>
              <SectionLabel index={idx.stories}>Stories</SectionLabel>
            </Reveal>
            <h2 id="stories-title" className={`mt-6 text-graphite ${heading}`}>
              <RevealLines lines={["What schools,", "parents and students say."]} />
            </h2>
            <ul className="mt-14 columns-1 gap-6 sm:columns-2 xl:columns-3">
              {testimonials.map((t) => (
                <li key={t.id} className="mb-6 break-inside-avoid">
                  <QuoteCard t={t} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <>
          {/* AN HONEST BLANK PAGE */}
          <section aria-labelledby="blank-title" className="relative overflow-hidden border-t border-graphite/10 bg-paper-50 py-24 sm:py-32">
            <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
            <div className="container-bp relative grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-6">
                <Reveal>
                  <SectionLabel index={idx.blank}>An honest blank page</SectionLabel>
                </Reveal>
                <h2 id="blank-title" className={`mt-6 text-graphite ${heading}`}>
                  <RevealLines lines={["No borrowed praise.", "No invented quotes."]} />
                </h2>
                <Reveal delay={0.2}>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-charcoal sm:text-lg">
                    A new company has two choices for a page like this: fill it with stock quotes, or leave it empty until it has earned something to say. We chose the
                    second. When you read a testimonial here, it will have a real name, a real school and written consent behind it.
                  </p>
                </Reveal>
                <ul className="mt-8 space-y-3">
                  {principles.map((p, i) => (
                    <Reveal as="li" key={p} delay={0.15 + i * 0.06} className="flex gap-4 border-t border-graphite/12 pt-3 text-[15px] leading-relaxed text-graphite">
                      <SpecIndex n={i + 1} className="pt-1" />
                      {p}
                    </Reveal>
                  ))}
                </ul>
              </div>

              {/* reserved slots */}
              <Reveal delay={0.15} className="lg:col-span-6">
                <div aria-hidden className="relative mx-auto max-w-lg pb-6 pt-4">
                  {[
                    { who: "Principal · Founding Partner School", rot: "-rotate-2", pad: "mr-10 sm:mr-20" },
                    { who: "Teacher · STEM coordinator", rot: "rotate-1", pad: "ml-8 sm:ml-16 -mt-6" },
                    { who: "Parent · Student", rot: "-rotate-1", pad: "mr-4 sm:mr-10 -mt-6" },
                  ].map((s, i) => (
                    <div key={s.who} className={cn("relative rounded-[var(--radius-md)] border border-dashed border-graphite/35 bg-paper p-6 shadow-[var(--shadow-paper)]", s.rot, s.pad)}>
                      <div className="flex items-center justify-between">
                        <Quote className="size-6 text-graphite/25" strokeWidth={1.25} />
                        <span className="annot font-mono text-blueprint">Reserved · {String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-5 space-y-2.5">
                        <span className="hatch block h-2.5 w-full rounded-full opacity-50" />
                        <span className="hatch block h-2.5 w-11/12 rounded-full opacity-50" />
                        <span className="hatch block h-2.5 w-2/3 rounded-full opacity-50" />
                      </div>
                      <div className="mt-6 flex items-center gap-3 border-t border-dashed border-graphite/20 pt-4">
                        <span className="size-9 rounded-full border border-dashed border-graphite/35" />
                        <span className="annot text-charcoal">{s.who}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs leading-relaxed text-blueprint">Placeholders, not quotes. These spaces are waiting for real feedback.</p>
              </Reveal>
            </div>
          </section>

          {/* FOUNDING PARTNER SCHOOLS */}
          <section id="founding" aria-labelledby="founding-title" className="relative scroll-mt-24 overflow-hidden bg-graphite py-24 text-paper sm:py-32">
            <GridBackdrop dark />
            <ConstructionCircle size={720} className="pointer-events-none absolute -right-60 -top-44 hidden text-paper/[0.06] lg:block" />
            <div className="container-bp relative">
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-6">
                  <Reveal>
                    <SectionLabel index={idx.founding} light>
                      Founding Partner Schools
                    </SectionLabel>
                  </Reveal>
                  <h2 id="founding-title" className={`mt-6 ${heading}`}>
                    <RevealLines lines={["Be one of our first", `${FOUNDING_SLOTS} partner schools.`]} />
                  </h2>
                  <Reveal delay={0.2}>
                    <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
                      We are inviting {FOUNDING_SLOTS} schools to run the first JOVE Days with us and help shape the programme. The first stories on this page will be
                      theirs — and we intend to make being early worth it.
                    </p>
                  </Reveal>

                  <Reveal delay={0.25}>
                    <ol aria-label={`${FOUNDING_SLOTS} founding partner places`} className="mt-10 grid max-w-md grid-cols-5 gap-3">
                      {Array.from({ length: FOUNDING_SLOTS }, (_, i) => (
                        <li
                          key={i}
                          className="grid aspect-square place-items-center rounded-full border border-dashed border-paper/35 font-mono text-sm text-paper/70 transition-colors duration-500 hover:border-paper hover:text-paper"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </li>
                      ))}
                    </ol>
                    <p className="annot mt-4 text-paper/45">Founding places · launch season 2026–27</p>
                  </Reveal>

                  <Reveal delay={0.3}>
                    <div className="mt-10 flex flex-wrap gap-3">
                      <Button href="/contact" variant="light" size="lg" arrow>
                        Apply as a founding partner
                      </Button>
                      <Button href="/packages" variant="outline-light" size="lg">
                        See packages
                      </Button>
                    </div>
                  </Reveal>
                </div>

                <div className="lg:col-span-6">
                  <ul className="grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15">
                    {foundingBenefits.map((b, i) => (
                      <Reveal as="li" key={b.title} delay={i * 0.08} className="group flex gap-5 bg-graphite p-6 transition-colors duration-500 hover:bg-ink sm:p-7">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-paper/25 transition-colors duration-500 group-hover:border-paper/60">
                          <b.icon className="size-5" strokeWidth={1.5} aria-hidden />
                        </span>
                        <div>
                          <p className="font-mono text-[11px] tracking-[0.15em] text-paper/45">FP-{String(i + 1).padStart(2, "0")}</p>
                          <h3 className="mt-1 text-lg font-bold leading-snug">{b.title}</h3>
                          <p className="mt-2 text-[14px] leading-relaxed text-paper/65">{b.body}</p>
                        </div>
                      </Reveal>
                    ))}
                  </ul>
                  <Reveal delay={0.2}>
                    <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-paper/25 p-6">
                      <p className="annot text-paper/50">What we ask in return</p>
                      <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-paper/75">
                        {[
                          "Candid feedback after the day — especially the critical kind.",
                          "A short filmed interview with the principal, if they are willing.",
                          "Permission to film the day, with consent forms collected first.",
                        ].map((x) => (
                          <li key={x} className="flex gap-2.5">
                            <span aria-hidden className="mt-[10px] h-px w-3 shrink-0 bg-paper/50" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* HOW WE COLLECT FEEDBACK */}
      <section aria-labelledby="process-title" className="relative overflow-hidden py-24 sm:py-32">
        <GridBackdrop />
        <Crosshair className="absolute right-[7%] top-16 hidden md:block" />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index={idx.process}>How feedback is collected</SectionLabel>
              </Reveal>
              <h2 id="process-title" className={`mt-6 text-graphite ${heading}`}>
                <RevealLines lines={["After every JOVE Day,", "we ask. Then we listen."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-[15px] leading-relaxed text-charcoal">
                Feedback is built into the day plan, not chased afterwards. It improves the next session first — and only becomes a testimonial if the person who gave
                it says so in writing.
              </p>
            </Reveal>
          </div>

          <ol className="relative mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {feedbackSteps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.08}>
                <article className="group relative flex h-full flex-col rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] sm:p-7">
                  <CornerMarks />
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-full bg-graphite text-paper">
                      <s.icon className="size-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.18em] text-blueprint">STEP {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="annot mt-6 font-mono text-blueprint">{s.when}</p>
                  <h3 className="mt-2 text-xl font-bold leading-snug tracking-[-0.02em] text-graphite">{s.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-charcoal">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </ol>

          {has && (
            <ul className="mt-10 grid gap-x-10 gap-y-3 border-t border-graphite/15 pt-8 md:grid-cols-2">
              {principles.map((p, i) => (
                <li key={p} className="flex gap-4 text-[15px] leading-relaxed text-graphite">
                  <SpecIndex n={i + 1} className="pt-1" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* SHARE YOUR EXPERIENCE */}
      <section id="share" aria-labelledby="share-title" className="relative scroll-mt-24 overflow-hidden border-t border-graphite/10 bg-paper-200/60 py-24 sm:py-32">
        <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-bp relative grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel index={idx.share}>Share your experience</SectionLabel>
            </Reveal>
            <h2 id="share-title" className={`mt-6 text-graphite ${heading}`}>
              <RevealLines lines={["Tried something", "from JOVE?", "Tell us."]} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal">
                A Virtual Lab your child finished, a kit you built at home, a JOVE Day at your school — praise and criticism are equally welcome. It goes straight to
                the founders.
              </p>
              <ul className="mt-8 space-y-3 text-[14px] leading-relaxed text-charcoal">
                {[
                  "Tell us who you are (parent, teacher, student, principal) in the message.",
                  "Nothing you send is published without your written permission.",
                  "If something went wrong, say so plainly — we would rather know.",
                ].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span aria-hidden className="mt-[10px] h-px w-4 shrink-0 bg-graphite/50" />
                    {x}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-7">
            <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-lift)] sm:p-10">
              <CornerMarks />
              <p className="annot mb-6 flex items-center justify-between text-blueprint">
                <span>Feedback</span>
                <span className="font-mono">Form F-01</span>
              </p>
              <LeadForm kind="contact" submitLabel="Share your experience" />
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection
        eyebrow={has ? "Next step" : "Write the first story"}
        title={has ? ["Bring JOVE", "to your school."] : ["Your school could", "be the first quote."]}
        body="A full day of hands-on Robotics & AI for Grades 1–10 — with reels, a highlight film and drone shots for your school, included."
        primary={{ label: "Book a JOVE Day", href: "/contact" }}
        secondary={{ label: "See how a JOVE Day runs", href: "/programs" }}
      />
    </>
  );
}
