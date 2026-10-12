import { Crosshair } from "@/components/brand/Blueprint";

const TOPICS = [
  "Robotics",
  "Artificial Intelligence",
  "Machine Learning",
  "Sensors",
  "Coding",
  "Drones",
  "Computer Vision",
  "Electronics",
  "Automation",
  "IoT",
  "Engineering Design",
  "Responsible AI",
];

const SUB = ["Sense", "Think", "Act", "Build", "Test", "Improve", "Film", "Share"];

function Row({ items, big, reverse }: { items: string[]; big?: boolean; reverse?: boolean }) {
  const run = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <li key={`${t}-${i}`} className="flex shrink-0 items-center">
          <span
            className={
              big
                ? "px-6 text-[clamp(1.6rem,3.2vw,2.75rem)] font-bold uppercase leading-none tracking-[-0.02em] text-paper sm:px-9"
                : "px-5 font-mono text-xs uppercase tracking-[0.3em] text-paper/45 sm:px-7"
            }
          >
            {t}
          </span>
          <Crosshair size={big ? 26 : 16} className="shrink-0 text-paper/35" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: big ? "48s" : "60s", animationDirection: reverse ? "reverse" : "normal" }}
      >
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}

/** Graphite topic band with two counter-scrolling marquees. */
export function Marquee() {
  return (
    <section aria-label="What students learn at JOVE" className="relative overflow-hidden bg-graphite py-8 sm:py-10">
      <div aria-hidden className="bp-grid-dark pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative space-y-5">
        <Row items={TOPICS} big />
        <Row items={[...SUB, ...SUB, ...SUB]} reverse />
      </div>
      <p className="sr-only">Topics covered: {TOPICS.join(", ")}.</p>
    </section>
  );
}
