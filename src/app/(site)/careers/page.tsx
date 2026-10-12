import type { Metadata } from "next";
import { Clock, Hammer, HeartHandshake, MessageSquareText, ShieldCheck, Sprout } from "lucide-react";
import { site } from "@/lib/site";
import { gradeBands, joveDayRules, joveDaySchedule, mediaPack, targets } from "@/lib/content/business";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConstructionCircle, CornerMarks, Crosshair, GridBackdrop, SectionLabel, SpecIndex } from "@/components/brand/Blueprint";
import { PageHero } from "@/components/site/PageHero";
import { CTASection } from "@/components/site/CTASection";
import { LeadForm } from "@/components/site/LeadForm";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { ParallaxFigure } from "@/components/site/about/ParallaxFigure";
import { ValueFigure } from "@/components/site/about/ValueFigure";
import { brandValues } from "@/components/site/about/values";

/** Day rate for freelance trainers (per workshop day). */
const TRAINER_DAY_RATE = { min: 1500, max: 2500 };
const dayRate = `${formatINR(TRAINER_DAY_RATE.min)}–${formatINR(TRAINER_DAY_RATE.max)}`;

export const metadata: Metadata = {
  title: "Careers — Build the Future with JOVE",
  description: `Join JOVE as a freelance Robotics & AI trainer (${dayRate} per workshop day), lead trainer, video editor / media intern or school partnerships associate. See the roles, what we look for and our five-step hiring process.`,
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers at JOVE — Build the future with us",
    description: "Teach robotics and AI hands-on in schools, film it with our in-house studio, or bring new schools on board.",
    images: [{ url: "/images/studio/kids-build.webp", width: 2400, height: 1340, alt: "Illustration of students' hands building a small robot" }],
  },
};

const heading = "text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.03em]";

const arrival = joveDaySchedule[0].time;
const wrap = joveDaySchedule[joveDaySchedule.length - 1].end;
const gradeNums = gradeBands.flatMap((g) => g.grades.match(/\d+/g) ?? []).map(Number);
const gradeSpan = `Grade ${Math.min(...gradeNums)} to Grade ${Math.max(...gradeNums)}`;
const deliveryDays = (re: RegExp) => mediaPack.items.find((i) => re.test(i.title))?.delivery.toLowerCase() ?? "";

interface Role {
  id: string;
  code: string;
  title: string;
  team: string;
  type: string;
  where: string;
  pay: string;
  payNote?: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  plus?: string;
}

const roles: Role[] = [
  {
    id: "trainer",
    code: "R-01",
    title: "Freelance Robotics & AI Trainer",
    team: "Workshop delivery",
    type: "Freelance · per workshop day",
    where: "On site at partner schools",
    pay: `${dayRate} per workshop day`,
    payNote: "Depends on experience and your role on the day.",
    summary: `Run hands-on build sessions for students from ${gradeSpan}, working beside both founders on every JOVE Day.`,
    responsibilities: [
      "Deliver grade-wise sessions from the JOVE session plan — builds, demos and challenges",
      `Be on campus by ${arrival} to set up team stations and kits, and reset them between sessions`,
      "Keep every team building: troubleshoot wiring, sensors and code at the table",
      "Follow the safety SOP and child-protection policy without exception",
      "Check kits out and back in, and report missing or damaged parts after the day",
    ],
    requirements: [
      "An engineering or science student, graduate, or a maker with projects to show",
      "Comfortable with basic electronics and Arduino; block-based coding for younger grades",
      "Clear, patient and warm with children — in English, and ideally a regional language too",
      "Able to travel to schools and work a full day on your feet",
      "Willing to complete background verification before your first workshop",
    ],
    plus: "Nice to have: Python, basic machine-learning concepts, or earlier teaching or volunteering experience.",
  },
  {
    id: "lead-trainer",
    code: "R-02",
    title: "Lead Trainer",
    team: "Workshop delivery",
    type: "Senior freelance · scope to grow",
    where: "On site at partner schools",
    pay: "Discussed on the first call",
    payNote: "Based on experience and the scope you take on.",
    summary: "Own a hall for the day: lead the senior sessions, guide the freelance trainers, and hold the bar on quality and safety.",
    responsibilities: [
      "Lead full sessions independently, including the Grades 6–10 builds with Arduino, sensors and AI vision",
      "Brief and coach freelance trainers before and during the day",
      "Keep the hall running to the published schedule, minute by minute",
      "Run the pre-session kit and safety checks, and sign off the kit count at pack-up",
      "Feed what you learn in the classroom back into the curriculum and session plans",
    ],
    requirements: [
      "Experience teaching robotics, electronics or coding to school students — workshops, clubs or classrooms",
      "Strong hands-on skills: Arduino, sensors, motor drivers; working Python and ML basics",
      "Calm classroom management with large, excited groups",
      "Reliable availability on workshop days, including travel",
      "Background verification and our safety training before you lead",
    ],
    plus: "Nice to have: experience with Atal Tinkering Labs, robotics competitions or curriculum writing.",
  },
  {
    id: "media",
    code: "R-03",
    title: "Video Editor / Media Intern",
    team: site.studio.name,
    type: "Internship or freelance",
    where: "Studio work, plus shoot days at schools",
    pay: "Stipend or project fee — discussed on the first call",
    summary: `Turn a day of footage into the reels and films schools receive — and help ${site.studio.name} capture it on shoot days.`,
    responsibilities: [
      `Edit vertical reels to deadline — ${deliveryDays(/reel/i) || "within 5 working days"} of the JOVE Day`,
      `Assemble and grade the highlight film — ${deliveryDays(/film/i) || "within 10 working days"}`,
      "Assist the media lead on shoot days: second camera, audio, backups",
      "Blur faces wherever requested and follow the consent list for every school",
      "Write captions, organise footage and keep the archive tidy",
    ],
    requirements: [
      "A showreel or portfolio — student and personal work counts",
      "Fluent in at least one editor: Premiere Pro, DaVinci Resolve or similar",
      "A feel for pacing, music sync and clean sound",
      "Dependable with deadlines and careful with other people's footage",
      "Comfortable working around children under the school's and our supervision",
    ],
    plus: "Nice to have: camera or gimbal operation, colour grading, motion graphics.",
  },
  {
    id: "partnerships",
    code: "R-04",
    title: "School Partnerships Associate",
    team: "Growth · works with the CEO",
    type: "Part-time or full-time",
    where: "Calls, school visits and JOVE HQ",
    pay: "Discussed on the first call",
    summary: "Open conversations with schools, book meetings with principals, and help turn a first JOVE Day into a long partnership.",
    responsibilities: [
      "Research and reach out to CBSE, ICSE and State Board schools",
      "Book and prepare meetings and demos with principals and correspondents",
      "Keep every lead, call and follow-up up to date in the JOVE HQ CRM",
      "Prepare proposals with the founder and follow through to a confirmed date",
      "Stay in touch after the workshop — feedback, renewals and JOVE Quarter or Year conversations",
    ],
    requirements: [
      "A confident, courteous speaker — English plus a regional language",
      "Comfortable with phone calls and in-person school visits",
      "Organised: you write things down and follow up when you said you would",
      "Genuine interest in education and in what students get from the day",
      "Honest selling — you never promise what we cannot deliver",
    ],
    plus: "Nice to have: experience in school sales or ed-tech. Not required.",
  },
];

const reasons = [
  {
    title: "Paid per workshop day",
    body: `Freelance trainers earn ${dayRate} for each workshop day. You will know the rate before you agree to a date.`,
  },
  {
    title: "Trained before you teach",
    body: "Session plans, kit handling and safety training come first — and your shadow workshop is paid.",
  },
  {
    title: "Founders on the floor",
    body: `Both founders deliver every JOVE Day. You work in a team of ${joveDayRules.teamSize.founders + joveDayRules.teamSize.trainers + joveDayRules.teamSize.media}, not alone in a classroom.`,
  },
  {
    title: "Every session on film",
    body: "Our in-house studio films each JOVE Day, so you can watch your own sessions back and get better faster.",
  },
];

const traits = [
  { icon: HeartHandshake, title: "Patience with children", body: "You enjoy the fortieth “why?” as much as the first — and you kneel down to table height to answer it." },
  { icon: Hammer, title: "Hands that have built things", body: "A robot, a circuit, a short film, a sales pipeline. Show us something you made, not just a certificate." },
  { icon: MessageSquareText, title: "Clarity over jargon", body: "You can explain a sensor to a seven-year-old and a neural network to a fifteen-year-old without a slide." },
  { icon: Clock, title: "Punctual to the minute", body: `Our team is on campus at ${arrival} and packs up around ${wrap}. A school's timetable does not wait for us.` },
  { icon: ShieldCheck, title: "Safety without being asked", body: "You notice the loose wire, the blocked exit and the child sitting alone — before anyone points it out." },
  { icon: Sprout, title: "Coachable and curious", body: "You ask for feedback after a session, take it well, and come back better the next week." },
];

const steps = [
  { title: "Apply", time: "About 2 minutes", body: "Fill in the form on this page. Tell us what you have built, taught or filmed, and add links if you have them." },
  { title: "Short call", time: "15 minutes", body: "A phone or video call with a founder — your background, your availability and your questions. If your profile fits, we call within a week." },
  { title: "Demo class", time: "20 minutes", body: "Teach us one concept as if we were a Grade 6 class. We are looking for clarity and warmth, not polish." },
  { title: "Paid shadow workshop", time: "One JOVE Day", body: "Join a real JOVE Day beside the founders. You assist at the stations, we pay you for the day, and both sides see if it fits." },
  { title: "Onboarding & safety training", time: "Before you lead", body: "Session plans, kit handling, the safety SOP, our child-protection policy and background verification — all before you run a session." },
];

export default function CareersPage() {
  return (
    <>
      {/* 01 — HERO */}
      <PageHero
        eyebrow="Careers"
        index="01"
        title={["Build the future", "with JOVE."]}
        intro={
          <>
            <p>
              We take real robots and real AI into schools, put them in the hands of students from {gradeSpan}, and film the whole day. We are looking for the people
              who will stand at those tables with us.
            </p>
            <p className="mt-4">JOVE launches in October 2026. Join early, and help shape how it is done.</p>
          </>
        }
        aside={
          <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-lift)] sm:p-8">
            <CornerMarks />
            <p className="annot flex items-center justify-between text-blueprint">
              <span>Hiring sheet</span>
              <span className="font-mono">Launch · Oct 2026</span>
            </p>
            <dl className="mt-5 divide-y divide-dashed divide-graphite/20">
              <div className="flex items-baseline justify-between gap-4 pb-4">
                <dt className="text-sm text-charcoal">Open roles</dt>
                <dd className="font-mono text-4xl font-medium tracking-tight text-graphite">{String(roles.length).padStart(2, "0")}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4">
                <dt className="text-sm text-charcoal">Freelance trainer</dt>
                <dd className="text-right">
                  <span className="font-mono text-xl font-medium tracking-tight text-graphite">{dayRate}</span>
                  <span className="block text-xs text-blueprint">per workshop day</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-sm text-charcoal">Hiring steps</dt>
                <dd className="text-sm font-semibold text-graphite">{steps.length} — including a paid shadow day</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-4">
                <dt className="text-sm text-charcoal">Based in</dt>
                <dd className="text-sm font-semibold text-graphite">{site.location}</dd>
              </div>
            </dl>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button href="#roles" size="lg" arrow>
            See open roles
          </Button>
          <Button href="#apply" variant="secondary" size="lg">
            Apply now
          </Button>
        </div>
      </PageHero>

      {/* 02 — WHY JOVE */}
      <section aria-labelledby="why-title" className="relative border-t border-graphite/10 bg-paper-50 py-24 sm:py-32">
        <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-bp relative grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <ParallaxFigure
              src="/images/studio/kids-build.webp"
              alt="Black-and-white close-up illustration of students' hands assembling a small robot on a classroom table"
              sizes="(max-width: 1024px) 100vw, 50vw"
              frameClassName="aspect-[4/3] lg:aspect-[5/6]"
              fig="Fig. 01 — Where the work happens"
              caption="Illustrative visual — not a photograph of a past JOVE event."
            />
          </Reveal>
          <div className="lg:col-span-6">
            <Reveal>
              <SectionLabel index="02">Why work with us</SectionLabel>
            </Reveal>
            <h2 id="why-title" className={`mt-6 text-graphite ${heading}`}>
              <RevealLines lines={["The best seat in", "the classroom is", "next to the robot."]} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-charcoal sm:text-lg">
                A JOVE Day is loud, fast and full of first times — the first motor that spins, the first sensor that reacts, the first model that recognises an object. Your
                job is to make sure every student gets one of those moments.
              </p>
            </Reveal>
            <ul className="mt-10 grid gap-x-8 sm:grid-cols-2">
              {reasons.map((r, i) => (
                <Reveal as="li" key={r.title} delay={0.1 + i * 0.07} className="border-t border-graphite/12 py-5">
                  <p className="flex items-center gap-3">
                    <SpecIndex n={i + 1} />
                    <span className="text-[17px] font-bold tracking-[-0.015em] text-graphite">{r.title}</span>
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-charcoal">{r.body}</p>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={0.3}>
              <p className="mt-6 rounded-[var(--radius-sm)] border border-dashed border-graphite/30 bg-paper/70 px-5 py-4 text-[14px] leading-relaxed text-charcoal">
                <strong className="font-semibold text-graphite">An honest note:</strong> we are a new company. Our target is {targets.workshopsPerMonth} JOVE Days a month —
                one school a week — so freelance work begins as a few days a month and grows as our calendar fills. We will tell you plainly what the work and pay look
                like before you commit to anything.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 03 — OPEN ROLES */}
      <section id="roles" aria-labelledby="roles-title" className="relative scroll-mt-24 py-24 sm:py-32">
        <GridBackdrop vignette={false} className="opacity-70" />
        <Crosshair className="absolute right-[7%] top-16 hidden md:block" />
        <div className="container-bp relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <Reveal>
                  <SectionLabel index="03">Open roles</SectionLabel>
                </Reveal>
                <h2 id="roles-title" className="mt-6 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.03em] text-graphite">
                  <RevealLines lines={["Four roles.", "One team."]} />
                </h2>
                <Reveal delay={0.2}>
                  <p className="mt-6 text-[15px] leading-relaxed text-charcoal">
                    Every role touches a JOVE Day — at the stations, behind the camera or in the principal&apos;s office weeks before.
                  </p>
                  <nav aria-label="Open roles" className="mt-8">
                    <ul className="flex flex-wrap gap-2 lg:block lg:space-y-0 lg:border-b lg:border-graphite/15">
                      {roles.map((r) => (
                        <li key={r.id}>
                          <a
                            href={`#role-${r.id}`}
                            className="group flex items-center gap-3 rounded-full border border-graphite/25 px-4 py-2 text-[13px] font-semibold text-graphite transition-colors hover:bg-graphite hover:text-paper lg:rounded-none lg:border-0 lg:border-t lg:border-graphite/15 lg:px-0 lg:py-3.5 lg:text-[15px] lg:hover:bg-transparent lg:hover:text-ink"
                          >
                            <span className="font-mono text-xs text-blueprint transition-colors group-hover:text-paper/70 lg:group-hover:text-graphite">{r.code}</span>
                            <span className="lg:flex-1">{r.title}</span>
                            <span aria-hidden className="hidden h-px w-5 bg-graphite/40 transition-all duration-500 ease-[var(--ease-out-expo)] group-hover:w-9 group-hover:bg-graphite lg:block" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </Reveal>
              </div>
            </div>

            <ul className="space-y-6 lg:col-span-8">
              {roles.map((r, i) => (
                <Reveal as="li" key={r.id} delay={Math.min(i, 2) * 0.06}>
                  <article
                    id={`role-${r.id}`}
                    aria-labelledby={`role-${r.id}-title`}
                    className="relative scroll-mt-28 rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-shadow duration-500 hover:shadow-[var(--shadow-lift)]"
                  >
                    <CornerMarks />
                    <header className="relative overflow-hidden rounded-t-[var(--radius-lg)] border-b border-graphite/10 p-6 sm:p-8">
                      <div aria-hidden className="hatch-dense pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-[0.14] [mask-image:linear-gradient(to_left,black,transparent)]" />
                      <p className="annot relative flex flex-wrap items-center gap-x-3 gap-y-1 text-blueprint">
                        <span className="font-mono">{r.code}</span>
                        <span aria-hidden className="h-px w-5 bg-graphite/30" />
                        <span>{r.team}</span>
                      </p>
                      <h3 id={`role-${r.id}-title`} className="relative mt-3 text-[clamp(1.5rem,2.8vw,2.1rem)] font-bold leading-tight tracking-[-0.03em] text-graphite">
                        {r.title}
                      </h3>
                      <p className="relative mt-3 max-w-2xl text-[15px] leading-relaxed text-charcoal">{r.summary}</p>
                      <dl className="relative mt-6 grid gap-px overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-graphite/12 sm:grid-cols-3">
                        {[
                          ["Type", r.type],
                          ["Where", r.where],
                          ["Pay", r.pay],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-paper px-4 py-3">
                            <dt className="annot text-blueprint">{k}</dt>
                            <dd className="mt-1 text-[13.5px] font-semibold leading-snug text-graphite">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      {r.payNote && <p className="relative mt-2 text-xs text-blueprint">{r.payNote}</p>}
                    </header>
                    <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
                      {[
                        { label: "What you'll do", items: r.responsibilities },
                        { label: "What you'll need", items: r.requirements },
                      ].map((col) => (
                        <div key={col.label}>
                          <h4 className="annot text-blueprint">{col.label}</h4>
                          <ul className="mt-4 space-y-3">
                            {col.items.map((x) => (
                              <li key={x} className="flex gap-3 text-[14px] leading-relaxed text-charcoal">
                                <span aria-hidden className="mt-[10px] h-px w-3 shrink-0 bg-graphite/50" />
                                {x}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <footer className="flex flex-col items-start justify-between gap-4 border-t border-dashed border-graphite/20 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
                      <p className="max-w-xl text-[13px] leading-relaxed text-blueprint">{r.plus}</p>
                      <Button href="#apply" size="md" arrow className="shrink-0">
                        Apply<span className="sr-only"> for {r.title}</span>
                      </Button>
                    </footer>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 04 — WHAT WE LOOK FOR */}
      <section aria-labelledby="traits-title" className="relative border-y border-graphite/10 bg-paper-200/60 py-24 sm:py-32">
        <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="04">What we look for</SectionLabel>
              </Reveal>
              <h2 id="traits-title" className={`mt-6 text-graphite ${heading}`}>
                <RevealLines lines={["Skills can be taught.", "These cannot."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-[15px] leading-relaxed text-charcoal">
                We can teach you the session plan and the kit. We hire for the things that are harder to train — and we look for them in every step of the process.
              </p>
            </Reveal>
          </div>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {traits.map((t, i) => (
              <Reveal as="li" key={t.title} delay={(i % 3) * 0.08}>
                <article className="group relative h-full rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] sm:p-7">
                  <CornerMarks />
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-full border border-graphite/25 text-graphite transition-colors duration-500 group-hover:bg-graphite group-hover:text-paper">
                      <t.icon className="size-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.18em] text-blueprint">T-{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-[-0.02em] text-graphite">{t.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-charcoal">{t.body}</p>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 05 — HIRING PROCESS */}
      <section aria-labelledby="process-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
        <GridBackdrop dark />
        <ConstructionCircle size={720} className="pointer-events-none absolute -left-60 -top-44 hidden text-paper/[0.06] lg:block" />
        <div className="container-bp relative">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="05" light>
                  The hiring process
                </SectionLabel>
              </Reveal>
              <h2 id="process-title" className={`mt-6 ${heading}`}>
                <RevealLines lines={["Five steps.", "No surprises."]} />
              </h2>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="text-base leading-relaxed text-paper/70">
                You will always know which step you are on and what comes next. For studio and partnerships roles, the demo class becomes a short edit test or a mock
                school pitch.
              </p>
            </Reveal>
          </div>

          <div className="relative mt-16">
            <span aria-hidden className="absolute bottom-6 left-[21px] top-6 w-px bg-paper/20 lg:bottom-auto lg:left-6 lg:right-6 lg:top-[21px] lg:h-px lg:w-auto" />
          <ol className="relative grid gap-y-10 lg:grid-cols-5 lg:gap-x-6">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.09} className="relative grid grid-cols-[44px_1fr] gap-x-5 lg:block">
                <span
                  className={
                    i === 3
                      ? "relative z-10 grid size-11 place-items-center rounded-full bg-paper font-mono text-sm font-medium text-graphite shadow-[var(--shadow-lift)]"
                      : "relative z-10 grid size-11 place-items-center rounded-full border border-paper/35 bg-graphite font-mono text-sm text-paper"
                  }
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="lg:mt-7 lg:pr-2">
                  <p className="annot font-mono text-paper/50">{s.time}</p>
                  <h3 className="mt-1.5 text-xl font-bold leading-snug tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-paper/65">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          </div>
        </div>
      </section>

      {/* 06 — VALUES */}
      <section aria-labelledby="values-title" className="relative overflow-hidden py-24 sm:py-32">
        <GridBackdrop />
        <div className="container-bp relative">
          <div className="max-w-3xl">
            <Reveal>
              <SectionLabel index="06">How we work</SectionLabel>
            </Reveal>
            <h2 id="values-title" className={`mt-6 text-graphite ${heading}`}>
              <RevealLines lines={["Four words on our logo.", "Four habits in our team."]} />
            </h2>
          </div>
          <ul className="relative mt-14 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-graphite/15 sm:grid-cols-2 xl:grid-cols-4">
            {brandValues.map((v, i) => (
              <Reveal as="li" key={v.key} delay={i * 0.08} className="group bg-paper-50 p-6 transition-colors duration-500 hover:bg-paper sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs tracking-widest text-blueprint">{v.n}</span>
                  <ValueFigure value={v.key} className="h-16 w-auto opacity-80 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105" />
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.025em] text-graphite">{v.title}</h3>
                <p className="mt-1 font-mono text-[12px] text-blueprint">{v.spec}</p>
                <p className="mt-4 border-t border-dashed border-graphite/20 pt-4 text-[14px] leading-relaxed text-charcoal">{v.atWork}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 07 — APPLY */}
      <section id="apply" aria-labelledby="apply-title" className="relative scroll-mt-24 overflow-hidden border-t border-graphite/10 bg-paper-50 py-24 sm:py-32">
        <div aria-hidden className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-bp relative grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionLabel index="07">Apply</SectionLabel>
            </Reveal>
            <h2 id="apply-title" className={`mt-6 text-graphite ${heading}`}>
              <RevealLines lines={["Step one", "starts here."]} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal">
                One form for every role. A founder reads each application personally — and if your profile fits, you will hear from us within a week.
              </p>
              <ul className="mt-8 space-y-3 text-[14px] leading-relaxed text-charcoal">
                {[
                  "Applying for the studio or partnerships role? Write the role in the first line of your message.",
                  "Add links — a project, a showreel, a GitHub or a class you have taught.",
                  "Students are welcome. Tell us your college, year and when you are free.",
                ].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span aria-hidden className="mt-[10px] h-px w-4 shrink-0 bg-graphite/50" />
                    {x}
                  </li>
                ))}
              </ul>
              {site.contact.email && (
                <p className="mt-8 text-[14px] text-charcoal">
                  Prefer email?{" "}
                  <a
                    href={`mailto:${site.contact.email}?subject=${encodeURIComponent("Careers at JOVE")}`}
                    className="break-all font-semibold text-graphite underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite"
                  >
                    {site.contact.email}
                  </a>
                </p>
              )}
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-7">
            <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper p-6 shadow-[var(--shadow-lift)] sm:p-10">
              <CornerMarks />
              <p className="annot mb-6 flex items-center justify-between text-blueprint">
                <span>Application</span>
                <span className="font-mono">Form C-01</span>
              </p>
              <LeadForm kind="trainer" submitLabel="Send application" />
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection
        eyebrow="Know a school?"
        title={["Not job hunting?", "Bring JOVE to a school."]}
        body="If your school — or your child's — should have a full day of hands-on Robotics & AI, introduce us. We will take it from there."
        primary={{ label: "Book a JOVE Day", href: "/contact" }}
        secondary={{ label: "About JOVE", href: "/about" }}
      />
    </>
  );
}
