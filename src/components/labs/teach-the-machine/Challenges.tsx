"use client";

import { useCallback, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Trainer, TRAINER, type TrainerMode } from "./Trainer";

const TABS: { mode: TrainerMode; n: string; title: string; brief: string; need: string[] }[] = [
  {
    mode: "diet",
    n: "01",
    title: "Small data, smart data",
    brief: "The 24 ringed parts are a test set — the machine never learns from them. The training set is empty. Tap to add training examples (choose Bolt or Nut first) and reach 90% test accuracy with no more than 12. Where you place them matters more than how many you use.",
    need: ["diet"],
  },
  {
    mode: "noise",
    n: "02",
    title: "Beat the noise",
    brief: "About one training label in five is wrong — look for bolts sitting deep in nut territory. With k = 1 the machine trusts every liar. You can't fix the data, so fix the model: find a k that reaches 95% on the honest test set.",
    need: ["k"],
  },
  {
    mode: "xor",
    n: "03",
    title: "The XOR wall",
    brief: "First train a perceptron on the Clean dataset — easy. Then load the XOR pattern and train it for 20 epochs. Watch the line thrash about and never settle. Finally hand the same data to k-NN.",
    need: ["line", "wall", "bend"],
  },
];

const WHY: Record<TrainerMode, { after: string; title: string; body: React.ReactNode } | null> = {
  lab: null,
  diet: {
    after: "diet",
    title: "Why so few examples are enough",
    body: "The boundary is decided by the examples nearest to where the two groups meet. A handful of well-chosen, correctly labelled examples that cover both groups can beat a mountain of careless ones. Quality and coverage first — quantity second.",
  },
  noise: {
    after: "k",
    title: "Why a bigger k helps",
    body: "With k = 1, every wrong label plants a little island of wrong answers around itself — the model has overfitted the noise. A bigger k lets the honest neighbours outvote the liar. Push k too high, though, and far-away parts start voting on things they know nothing about.",
  },
  xor: {
    after: "wall",
    title: "Why the perceptron fails on XOR",
    body: (
      <>
        A perceptron can only draw <strong>one straight line</strong>. In the XOR pattern the bolts sit in two opposite corners and the nuts in the other two — whichever way you place a single line, at least one corner ends up on the wrong side, so it can never beat 75%. The data is <strong>not linearly separable</strong>. You need a boundary that can bend: k-NN manages it, and so does a neural network — many perceptrons stacked in layers, each adding one more line.
      </>
    ),
  },
};

export function Challenges() {
  const [tab, setTab] = useState<TrainerMode>("diet");
  const [done, setDone] = useState<Partial<Record<TrainerMode, string[]>>>({});

  const onDone = useCallback((ids: string[]) => setDone((prev) => ((prev[tab]?.length ?? 0) >= ids.length ? prev : { ...prev, [tab]: ids })), [tab]);

  const solved = (t: (typeof TABS)[number]) => t.need.every((id) => done[t.mode]?.includes(id));
  const current = TABS.find((t) => t.mode === tab) ?? TABS[0];
  const why = WHY[tab];
  const count = TABS.filter(solved).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Dataset challenges" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
          {TABS.map((t) => {
            const ok = solved(t);
            return (
              <button
                key={t.mode}
                role="tab"
                type="button"
                id={`ttm-tab-${t.mode}`}
                aria-selected={tab === t.mode}
                aria-controls="ttm-challenge"
                onClick={() => setTab(t.mode)}
                className={cn("flex shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)] border px-3.5 py-2 text-left text-sm font-semibold transition-colors", tab === t.mode ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-charcoal hover:border-graphite/60")}
              >
                <span className={cn("grid size-6 place-items-center rounded-full border font-mono text-[10px]", tab === t.mode ? "border-paper/60" : "border-graphite/30")}>{ok ? <Check className="size-3.5" aria-label="solved" /> : t.n}</span>
                {t.title}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-xs text-blueprint">{count} / 3 solved</p>
      </div>

      <div id="ttm-challenge" role="tabpanel" aria-labelledby={`ttm-tab-${tab}`}>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-charcoal">
          <strong className="text-graphite">{TRAINER[tab].title}.</strong> {current.brief}
        </p>
        <Trainer key={tab} mode={tab} onDone={onDone} initialDone={done[tab]}>
          {why && done[tab]?.includes(why.after) && (
            <div className="rounded-[var(--radius-md)] bg-graphite p-4 text-paper">
              <p className="annot text-[10px] text-paper/60">Explained</p>
              <p className="mt-1 text-sm font-bold">{why.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-paper/85">{why.body}</p>
            </div>
          )}
          {solved(current) && (
            <p className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-graphite px-3 py-2.5 text-sm font-semibold text-graphite">
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> Challenge solved.{count < 3 ? " Pick the next one above." : " All three done — take the quiz below."}
            </p>
          )}
        </Trainer>
      </div>
    </div>
  );
}
