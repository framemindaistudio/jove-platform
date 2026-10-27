import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Monitor, Play } from "lucide-react";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { BENCH_PROJECTS } from "@/lib/bench/projects";
import { PARTS } from "@/lib/bench/parts";
import { PageHeader } from "@/components/hq/ui";

export const metadata: Metadata = { title: "Practice Lab" };

const KITS = ["Spark", "Explorer", "Builder", "Innovator"] as const;

/** HQ → Practice Lab: every JOVE Day build on the 3D bench, for the team to practise and to project in class. */
export default async function PracticePage() {
  await requireUser(ALL);
  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Practice Lab"
        icon="CircuitBoard"
        description="The builds we teach, on a 3D bench with the same parts as our kits. Wire them pin by pin, switch on, and see what happens. Practise before a JOVE Day, then put it on the projector in full screen."
      />
      <div className="space-y-10">
        {KITS.map((kit) => {
          const list = BENCH_PROJECTS.filter((p) => p.kit === kit);
          if (!list.length) return null;
          return (
            <section key={kit} aria-labelledby={`kit-${kit}`}>
              <h2 id={`kit-${kit}`} className="text-base font-bold text-graphite">
                {kit} Kit · {list[0].audience.split(" · ")[0]}
              </h2>
              <div className="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((p) => {
                  const wires = p.steps.reduce((n, s) => n + (s.wires?.length ?? 0), 0);
                  const parts = [...new Set(p.parts.map((x) => PARTS[x.type].name.replace(/ \(.*\)$/, "")))];
                  return (
                    <article key={p.id} className="flex flex-col rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 shadow-[var(--shadow-paper)]" data-bench={p.id}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="annot text-blueprint">{p.audience}</p>
                        {p.public && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800" title="Also on the public Virtual Labs">
                            <Globe className="size-3" aria-hidden /> Public too
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-lg font-bold leading-snug tracking-[-0.01em] text-graphite">{p.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-charcoal">{p.summary}</p>
                      <p className="mt-2 font-mono text-[11px] text-blueprint">
                        {p.steps.length} steps · {wires} wires{p.code ? " · code" : ""}
                      </p>
                      <p className="mt-1 text-[12px] text-charcoal/80">{parts.join(" · ")}</p>
                      <div className="mt-auto flex flex-wrap gap-2 pt-4">
                        <Link href={`/hq/bench/${p.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-graphite px-3 text-sm font-semibold text-paper hover:bg-ink">
                          <Play className="size-4" aria-hidden /> Practise
                        </Link>
                        <Link href={`/hq/bench/${p.id}?present=1`} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/25 px-3 text-sm font-semibold text-graphite hover:border-graphite" title="Opens with big text; press F or the full-screen button for the projector">
                          <Monitor className="size-4" aria-hidden /> Projector
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
        <section className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 text-sm leading-relaxed text-charcoal">
          <h2 className="text-base font-bold text-graphite">How to use it</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Wire:</strong> click a pin (it turns yellow), then the pin at the other end. The wire the step asks for glows on the bench. Stuck? Press <em>Show me</em>.
            </li>
            <li>
              <strong>Turn it on:</strong> the switch on the battery box, or <em>Run</em> for the Arduino and ESP32. The Checks tab says what is wrong, in the words we use in class.
            </li>
            <li>
              <strong>Projector:</strong> press <kbd>F</kbd> for full screen; <kbd>→</kbd> and <kbd>←</kbd> move between steps. Drag to turn the bench, scroll to zoom.
            </li>
            <li>
              <strong>Free wiring:</strong> every part on the bench, no steps. Let students break the circuit on purpose and explain what happened.
            </li>
            <li>The bench follows the build guides. If a kit&apos;s wiring card shows a different layout, the card wins: tell a founder so the bench can be updated.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
