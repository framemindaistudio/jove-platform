"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Award, Check, Lock, RotateCcw } from "lucide-react";
import { getLab, labStages, type LabMeta, type LabStage } from "@/lib/content/labs";
import { Button } from "@/components/ui/Button";
import { CornerMarks } from "@/components/brand/Blueprint";
import { cn } from "@/lib/utils";
import { LabCertificate } from "./LabCertificate";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAB JOURNEY FRAMEWORK
 *  Every Virtual Lab = 4 stages:  Theory → Demo → Hands-on → Challenge
 *
 *  Usage (in src/components/labs/<slug>/Lab.tsx):
 *
 *    export default function Lab() {
 *      return <LabJourney slug="code-the-rover" stages={{ theory: <Theory/>, demo: <Demo/>, handsOn: <HandsOn/>, challenge: <Challenge/> }} />;
 *    }
 *
 *  Inside any stage component:
 *    const { completeStage, setScore, progress } = useLab();
 *    completeStage("hands-on")        // unlocks/ticks a stage (Theory & Demo auto-complete on "Next")
 *    setScore(8, 10)                  // record the challenge score; ≥ 60% completes the lab
 *
 *  Progress persists in localStorage ("jove-labs-progress").
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface LabStageContent {
  theory: React.ReactNode;
  demo: React.ReactNode;
  handsOn: React.ReactNode;
  challenge: React.ReactNode;
}

interface LabProgress {
  done: LabStage[];
  score?: number;
  total?: number;
  completedAt?: string;
}

interface LabCtx {
  lab: LabMeta;
  stage: LabStage;
  progress: LabProgress;
  completeStage: (s: LabStage) => void;
  setScore: (score: number, total: number) => void;
  goTo: (s: LabStage) => void;
  next: () => void;
}

const Ctx = createContext<LabCtx | null>(null);
export function useLab() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLab must be used inside <LabJourney>");
  return c;
}

const KEY = "jove-labs-progress";
function readAll(): Record<string, LabProgress> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function writeOne(slug: string, p: LabProgress) {
  try {
    const all = readAll();
    all[slug] = p;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}
/** For the hub page: progress for every lab. */
export function readLabProgress(): Record<string, LabProgress> {
  if (typeof window === "undefined") return {};
  return readAll();
}

const order: LabStage[] = ["theory", "demo", "hands-on", "challenge"];

export function LabJourney({ slug, stages }: { slug: string; stages: LabStageContent }) {
  const lab = getLab(slug) as LabMeta;
  const [stage, setStage] = useState<LabStage>("theory");
  const [progress, setProgress] = useState<LabProgress>({ done: [] });
  const [certOpen, setCertOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = readAll()[lab.slug];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved progress once
    if (p) setProgress(p);
  }, [lab.slug]);

  const persist = useCallback(
    (fn: (p: LabProgress) => LabProgress) =>
      setProgress((prev) => {
        const next = fn(prev);
        writeOne(lab.slug, next);
        return next;
      }),
    [lab.slug],
  );

  const completeStage = useCallback((s: LabStage) => persist((p) => (p.done.includes(s) ? p : { ...p, done: [...p.done, s] })), [persist]);

  const setScore = useCallback(
    (score: number, total: number) =>
      persist((p) => {
        const passed = total > 0 && score / total >= 0.6;
        const best = p.score !== undefined && p.total ? Math.max(p.score / p.total, score / total) : score / total;
        return {
          ...p,
          score: best === score / total ? score : p.score,
          total: best === score / total ? total : p.total,
          done: passed && !p.done.includes("challenge") ? [...p.done, "challenge"] : p.done,
          completedAt: passed ? p.completedAt ?? new Date().toISOString() : p.completedAt,
        };
      }),
    [persist],
  );

  const goTo = useCallback((s: LabStage) => {
    setStage(s);
    const top = topRef.current;
    if (top) {
      const y = top.getBoundingClientRect().top + window.scrollY - 90;
      const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number) => void } }).__lenis;
      if (lenis) lenis.scrollTo(y);
      else window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  const next = useCallback(() => {
    const i = order.indexOf(stage);
    if (stage === "theory" || stage === "demo") completeStage(stage);
    if (i < order.length - 1) goTo(order[i + 1]);
  }, [stage, completeStage, goTo]);

  const value = useMemo(() => ({ lab, stage, progress, completeStage, setScore, goTo, next }), [lab, stage, progress, completeStage, setScore, goTo, next]);
  const content: Record<LabStage, React.ReactNode> = { theory: stages.theory, demo: stages.demo, "hands-on": stages.handsOn, challenge: stages.challenge };
  const completed = !!progress.completedAt;
  const idx = order.indexOf(stage);

  return (
    <Ctx.Provider value={value}>
      <div ref={topRef} className="relative">
        {/* stepper */}
        <div className="sticky top-[60px] z-30 -mx-4 border-y border-graphite/10 bg-paper/90 px-4 backdrop-blur-md sm:mx-0 sm:rounded-[var(--radius-md)] sm:border">
          <ol className="no-scrollbar flex overflow-x-auto">
            {labStages.map((s, i) => {
              const active = s.id === stage;
              const done = progress.done.includes(s.id);
              return (
                <li key={s.id} className="min-w-[9rem] flex-1">
                  <button onClick={() => goTo(s.id)} className={cn("group relative flex w-full items-center gap-3 px-3 py-3 text-left transition-colors sm:px-4", active ? "text-graphite" : "text-blueprint hover:text-graphite")}>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-semibold transition-colors", active ? "border-graphite bg-graphite text-paper" : done ? "border-graphite/60 bg-paper text-graphite" : "border-graphite/25")}>
                      {done && !active ? <Check className="size-4" /> : s.index}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{s.label}</span>
                      <span className="hidden truncate text-[11px] text-blueprint md:block">{s.blurb}</span>
                    </span>
                    {active && <motion.span layoutId="lab-stage-bar" className="absolute inset-x-3 -bottom-px h-0.5 bg-graphite" />}
                    {i < labStages.length - 1 && <span className="absolute right-0 top-1/2 hidden h-6 w-px -translate-y-1/2 bg-graphite/10 sm:block" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* stage content */}
        <div className="relative mt-8 min-h-[50vh]">
          <AnimatePresence mode="wait">
            <motion.div key={stage} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              {content[stage]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* nav */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-graphite/10 pt-6">
          <Button variant="ghost" onClick={() => idx > 0 && goTo(order[idx - 1])} disabled={idx === 0}>
            <ArrowLeft className="size-4" /> Previous
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            {completed ? (
              <Button onClick={() => setCertOpen(true)}>
                <Award className="size-4" /> Get my certificate
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 text-xs text-blueprint">
                <Lock className="size-3.5" /> Score 60%+ in the Challenge to unlock your certificate
              </span>
            )}
            {idx < order.length - 1 && (
              <Button variant="secondary" onClick={next}>
                Next: {labStages[idx + 1].label} <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
        {progress.done.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Reset your progress for this lab?")) persist(() => ({ done: [] }));
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-blueprint hover:text-graphite"
          >
            <RotateCcw className="size-3" /> Reset progress
          </button>
        )}
      </div>
      <LabCertificate open={certOpen} onClose={() => setCertOpen(false)} lab={lab} score={progress.score} total={progress.total} completedAt={progress.completedAt} />
    </Ctx.Provider>
  );
}

/* ───────────────────────── building blocks for lab authors ───────────────────────── */

/** Stage heading: "01 · Theory — How sensors see" */
export function StageHeader({ index, kicker, title, intro }: { index: string; kicker: string; title: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <header className="mb-8 max-w-3xl">
      <p className="annot flex items-center gap-2 text-blueprint">
        <span className="font-mono">{index}</span>
        <span className="h-px w-6 bg-graphite/30" />
        {kicker}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-graphite sm:text-4xl">{title}</h2>
      {intro && <p className="mt-3 text-base leading-relaxed text-charcoal">{intro}</p>}
    </header>
  );
}

/** A concept card for the Theory stage. `figure` can be an <svg> diagram. */
export function ConceptCard({ n, title, children, figure, className }: { n?: number; title: string; children: React.ReactNode; figure?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-6", className)}>
      <CornerMarks size={8} />
      {figure && <div className="mb-5 overflow-hidden rounded-[var(--radius-sm)] border border-graphite/10 bg-paper bp-grid-fine p-3">{figure}</div>}
      <div className="flex items-baseline gap-3">
        {n !== undefined && <span className="font-mono text-xs text-blueprint">{String(n).padStart(2, "0")}</span>}
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-charcoal">{children}</div>
    </div>
  );
}

/** Highlighted "Key idea" callout. */
export function KeyIdea({ children, title = "Key idea" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="relative my-6 overflow-hidden rounded-[var(--radius-md)] bg-graphite p-6 text-paper">
      <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-60" />
      <p className="annot relative text-paper/55">{title}</p>
      <div className="relative mt-2 text-lg font-semibold leading-snug">{children}</div>
    </div>
  );
}

/** Simulation layout: big stage on the left, controls + readouts on the right. */
export function SimPanel({ title, stage, controls, footer, className }: { title?: React.ReactNode; stage: React.ReactNode; controls?: React.ReactNode; footer?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-graphite/10 px-5 py-3">
          <p className="annot text-charcoal">{title}</p>
          <span className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full border border-graphite/30" />
            ))}
          </span>
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="relative min-h-[320px] border-b border-graphite/10 bg-paper bp-grid lg:border-b-0 lg:border-r">{stage}</div>
        {controls && <div className="space-y-5 p-5">{controls}</div>}
      </div>
      {footer && <div className="border-t border-graphite/10 px-5 py-3">{footer}</div>}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, unit, onChange, disabled }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="annot text-charcoal">{label}</span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-graphite" />
    </label>
  );
}

export function Readout({ label, value, unit, className }: { label: string; value: React.ReactNode; unit?: string; className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3 py-2", className)}>
      <p className="annot text-[10px] text-blueprint">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-blueprint">{unit}</span>}
      </p>
    </div>
  );
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index into options
  explain?: string;
}

/** Multiple-choice quiz that reports the score to the journey (completes the lab at ≥ 60%). */
export function Quiz({ questions, title = "Final quiz" }: { questions: QuizQuestion[]; title?: string }) {
  const { setScore } = useLab();
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = picked.reduce<number>((s, p, i) => s + (p === questions[i].answer ? 1 : 0), 0);

  return (
    <div className="rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-xl font-bold">{title}</h3>
        {submitted && (
          <p className="font-mono text-sm">
            Score: <strong>{score}</strong> / {questions.length} {score / questions.length >= 0.6 ? "· Passed ✓" : "· Try again"}
          </p>
        )}
      </div>
      <ol className="mt-6 space-y-7">
        {questions.map((qq, qi) => (
          <li key={qi}>
            <p className="font-semibold">
              <span className="mr-2 font-mono text-xs text-blueprint">Q{qi + 1}</span>
              {qq.q}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {qq.options.map((o, oi) => {
                const chosen = picked[qi] === oi;
                const correct = submitted && oi === qq.answer;
                const wrong = submitted && chosen && oi !== qq.answer;
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setPicked((p) => p.map((x, i) => (i === qi ? oi : x)))}
                    className={cn(
                      "rounded-[var(--radius-sm)] border px-4 py-2.5 text-left text-sm transition-colors",
                      chosen && !submitted && "border-graphite bg-graphite text-paper",
                      !chosen && !submitted && "border-graphite/20 hover:border-graphite/50",
                      correct && "border-ok bg-ok/10 text-ok",
                      wrong && "border-bad bg-bad/10 text-bad",
                      submitted && !correct && !wrong && "border-graphite/10 opacity-60",
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            {submitted && qq.explain && <p className="mt-2 text-xs text-charcoal">💡 {qq.explain}</p>}
          </li>
        ))}
      </ol>
      <div className="mt-8 flex gap-3">
        {!submitted ? (
          <Button
            disabled={picked.some((p) => p === null)}
            onClick={() => {
              setSubmitted(true);
              setScore(score, questions.length);
            }}
          >
            Submit answers
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              setSubmitted(false);
              setPicked(questions.map(() => null));
            }}
          >
            <RotateCcw className="size-4" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}

/** Mission checklist for hands-on stages. */
export function Missions({ items }: { items: { id: string; label: string; done: boolean }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((m, i) => (
        <li key={m.id} className={cn("flex items-start gap-3 rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-colors", m.done ? "border-graphite bg-graphite text-paper" : "border-graphite/15")}>
          <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[10px]", m.done ? "border-paper bg-paper text-graphite" : "border-graphite/30")}>{m.done ? <Check className="size-3" /> : i + 1}</span>
          <span>{m.label}</span>
        </li>
      ))}
    </ul>
  );
}
