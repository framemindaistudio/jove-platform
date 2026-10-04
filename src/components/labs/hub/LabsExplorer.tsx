"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, GraduationCap, RotateCcw } from "lucide-react";
import { labs, labStages, type LabMeta } from "@/lib/content/labs";
import { readLabProgress } from "@/components/labs/framework/LabJourney";
import { CornerMarks } from "@/components/brand/Blueprint";
import { cn } from "@/lib/utils";

type Progress = ReturnType<typeof readLabProgress>;

/* progress lives in localStorage → read it as an external store (server snapshot = empty, so no hydration mismatch) */
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("focus", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("focus", cb);
  };
};
const snapshot = () => {
  try {
    return JSON.stringify(readLabProgress());
  } catch {
    return "{}";
  }
};
const serverSnapshot = () => "{}";

const GRADE_BANDS = [
  { id: "all", label: "All grades", min: 1, max: 12 },
  { id: "1-2", label: "Grades 1–2", min: 1, max: 2 },
  { id: "3-5", label: "Grades 3–5", min: 3, max: 5 },
  { id: "6-8", label: "Grades 6–8", min: 6, max: 8 },
  { id: "9-10", label: "Grades 9–10", min: 9, max: 10 },
] as const;

function gradeRange(l: LabMeta): [number, number] {
  const m = l.grades.match(/(\d+)\s*[–-]\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [1, 12];
}

export function LabsExplorer() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const progress = useMemo<Progress>(() => {
    try {
      return JSON.parse(raw) as Progress;
    } catch {
      return {};
    }
  }, [raw]);
  const topics = useMemo(() => ["All", ...Array.from(new Set(labs.map((l) => l.topic)))], []);
  const [topic, setTopic] = useState("All");
  const [band, setBand] = useState<(typeof GRADE_BANDS)[number]["id"]>("all");

  const shown = labs.filter((l) => {
    if (topic !== "All" && l.topic !== topic) return false;
    const b = GRADE_BANDS.find((g) => g.id === band) ?? GRADE_BANDS[0];
    const [lo, hi] = gradeRange(l);
    return lo <= b.max && hi >= b.min;
  });
  const completed = labs.filter((l) => progress[l.slug]?.completedAt).length;
  const started = labs.filter((l) => (progress[l.slug]?.done.length ?? 0) > 0).length;

  const chip = (on: boolean) => cn("h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors", on ? "border-graphite bg-graphite text-paper" : "border-graphite/20 bg-paper text-charcoal hover:border-graphite hover:text-graphite");

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-graphite/12 bg-paper-50/80 p-4 backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="annot w-16 shrink-0 text-blueprint">Topic</span>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {topics.map((t) => (
              <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={chip(topic === t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="annot w-16 shrink-0 text-blueprint">Grade</span>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {GRADE_BANDS.map((g) => (
              <button key={g.id} type="button" aria-pressed={band === g.id} onClick={() => setBand(g.id)} className={chip(band === g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-mono text-xs text-charcoal">
          {shown.length} {shown.length === 1 ? "lab" : "labs"} · free · no sign-up
        </p>
        {started > 0 && (
          <p className="inline-flex items-center gap-2 rounded-full border border-graphite/15 bg-paper px-3 py-1.5 text-xs font-semibold text-graphite">
            <Check className="size-3.5" aria-hidden /> Your progress: {completed} of {labs.length} labs completed{started > completed ? ` · ${started - completed} in progress` : ""}
          </p>
        )}
      </div>

      {shown.length ? (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((l) => {
            const p = progress[l.slug];
            const done = p?.done.length ?? 0;
            const complete = !!p?.completedAt;
            const cta = complete ? "Completed" : done > 0 ? `Continue · ${done}/4` : "Start lab";
            return (
              <li key={l.slug}>
                <Link
                  href={`/labs/${l.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-visible:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden border-b border-graphite/10 bg-paper">
                    <Image src={l.image} alt={`${l.title} — blueprint sketch`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover mix-blend-multiply transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                    <CornerMarks size={8} className="text-graphite/50" />
                    <span className="absolute left-3 top-3 rounded-full bg-graphite px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-paper">LAB {String(labs.indexOf(l) + 1).padStart(2, "0")}</span>
                    <span className="absolute right-3 top-3 rounded-full border border-graphite/20 bg-paper/90 px-2.5 py-1 text-[11px] font-semibold text-graphite">{l.topic}</span>
                    {complete && (
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-graphite px-2.5 py-1 text-[11px] font-bold text-paper">
                        <Check className="size-3" aria-hidden /> Certificate unlocked
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="annot text-blueprint">{l.subtitle}</p>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-graphite">{l.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-charcoal">{l.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal">
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="size-3.5" aria-hidden /> {l.grades}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden /> ~{l.minutes} min
                      </span>
                      <span className="font-semibold">{l.level}</span>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Concepts">
                      {l.concepts.map((c) => (
                        <li key={c} className="rounded-full border border-graphite/15 px-2 py-0.5 text-[11px] text-charcoal">
                          {c}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-5">
                      <div className="flex gap-1" aria-hidden>
                        {labStages.map((s) => (
                          <span key={s.id} className={cn("h-1 flex-1 rounded-full", p?.done.includes(s.id) ? "bg-graphite" : "bg-graphite/12")} />
                        ))}
                      </div>
                      <span className={cn("mt-4 inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition-colors", complete ? "border border-graphite text-graphite" : "bg-graphite text-paper group-hover:bg-ink")}>
                        {complete ? <Check className="size-4" aria-hidden /> : null}
                        {cta}
                        {!complete && <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-graphite/25 p-10 text-center">
          <p className="font-semibold">No labs match that combination yet.</p>
          <p className="mt-1 text-sm text-charcoal">More labs are on the way — try another topic or grade.</p>
          <button
            type="button"
            onClick={() => {
              setTopic("All");
              setBand("all");
            }}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-graphite px-4 text-sm font-semibold hover:bg-graphite hover:text-paper"
          >
            <RotateCcw className="size-4" aria-hidden /> Show all labs
          </button>
        </div>
      )}
    </div>
  );
}
