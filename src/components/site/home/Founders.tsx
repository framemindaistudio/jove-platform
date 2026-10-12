import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CornerMarks, GridBackdrop } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { site } from "@/lib/site";
import { SectionHeading } from "./SectionHeading";

function hasPhoto(src: string) {
  try {
    return existsSync(path.join(process.cwd(), "public", src));
  } catch {
    return false;
  }
}

/** Blueprint monogram: initials inside drafting circles with a crosshair. */
function Monogram({ initials }: { initials: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full text-paper" aria-hidden>
      <g fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="96" strokeOpacity="0.25" />
        <circle cx="100" cy="100" r="78" strokeOpacity="0.55" strokeDasharray="2 4" />
        <circle cx="100" cy="100" r="62" strokeOpacity="0.85" strokeWidth="1.5" />
        <path d="M100 0 V36 M100 164 V200 M0 100 H36 M164 100 H200" strokeOpacity="0.5" />
        <path d="M30 30 L52 52 M170 30 L148 52 M30 170 L52 148 M170 170 L148 148" strokeOpacity="0.2" />
        <circle cx="100" cy="4" r="2.5" fill="currentColor" stroke="none" />
      </g>
      <text x="100" y="114" textAnchor="middle" fill="currentColor" fontSize="44" fontWeight="700" letterSpacing="-1" style={{ fontFamily: "var(--font-sans)" }}>
        {initials}
      </text>
    </svg>
  );
}

/** The two founders — large blueprint cards with monogram avatars (real photos drop into /public/team). */
export function Founders() {
  return (
    <section aria-labelledby="founders-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
      <GridBackdrop dark />
      <div className="container-bp relative">
        <SectionHeading
          id="founders-title"
          index="08"
          eyebrow="The founders"
          light
          title={["Two founders.", "In the room, every time."]}
          intro="JOVE is founder-led and founder-delivered. Both of us teach on every JOVE Day — one runs the operation, the other runs the camera and the curriculum."
        />

        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-2">
          {site.founders.map((f, i) => {
            const photo = hasPhoto(f.photo);
            const studio = f.id === "chinmay";
            return (
              <Reveal key={f.id} delay={i * 0.12} className="h-full">
                <article className="relative flex h-full flex-col gap-8 rounded-[var(--radius-lg)] border border-paper/15 bg-paper/[0.03] p-6 sm:flex-row sm:p-8 lg:p-10">
                  <CornerMarks className="text-paper/40" />
                  <div className="relative size-36 shrink-0 sm:size-44">
                    {photo ? (
                      <Image src={f.photo} alt={`Portrait of ${f.name}`} fill sizes="176px" className="rounded-full object-cover grayscale" />
                    ) : (
                      <Monogram initials={f.initials} />
                    )}
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-graphite px-2 font-mono text-[10px] tracking-[0.2em] text-paper/50">
                      0{i + 1}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="annot text-paper/50">{f.role}</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{f.name}</h3>
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Focus areas">
                      {f.focus.split("·").map((x) => (
                        <li key={x} className="border border-paper/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-paper/70">
                          {x.trim()}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 leading-relaxed text-paper/70">{f.bio}</p>
                    {studio && (
                      <a
                        href={site.studio.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-6 inline-flex items-center gap-2 self-start border-b border-paper/30 pb-0.5 text-sm font-semibold text-paper transition-colors hover:border-paper"
                      >
                        {site.studio.name}
                        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
