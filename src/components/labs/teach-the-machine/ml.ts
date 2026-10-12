/**
 * Teach the Machine — the learning algorithms, written from scratch.
 *
 * The sorting robot looks at two FEATURES of each part: its length and its weight.
 * Both are scaled so that one unit means the same distance on either axis:
 *   x = length ÷ 45 mm   (0 … 4/3  → 0–60 mm)
 *   y = weight ÷ 40 g    (0 … 1    → 0–40 g)
 * LABELS: 0 = bolt, 1 = nut.
 */

export const XMAX = 4 / 3;
export const MM = 45; // millimetres per x unit
export const GRAMS = 40; // grams per y unit

export type Label = 0 | 1;
export type Algo = "knn" | "perceptron";

export interface Sample {
  x: number;
  y: number;
  label: Label;
  /** Held back for testing when the train/test split is on. */
  test: boolean;
  /** Added by the learner (not part of a preset). */
  user?: boolean;
  /** The label was deliberately corrupted by the "noisy labels" experiment. */
  flipped?: boolean;
}

export const CLASS = [
  { name: "bolt", plural: "bolts", Name: "Bolt", Plural: "Bolts" },
  { name: "nut", plural: "nuts", Name: "Nut", Plural: "Nuts" },
] as const;

/* ───────────────────────── seeded randomness (same data for every learner) ───────────────────────── */

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function blob(r: () => number, n: number, cx: number, cy: number, sd: number, label: Label, nTest: number): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const u = Math.max(1e-9, r());
    const v = r();
    const m = Math.sqrt(-2 * Math.log(u)) * sd;
    out.push({ x: clamp(cx + m * Math.cos(2 * Math.PI * v), 0.04, XMAX - 0.04), y: clamp(cy + m * Math.sin(2 * Math.PI * v), 0.04, 0.96), label, test: i >= n - nTest });
  }
  return out;
}

export type PresetId = "clean" | "overlap" | "biased" | "xor" | "blank" | "diet" | "noisy";

export const PRESET_INFO: Record<PresetId, { name: string; blurb: string }> = {
  clean: { name: "Clean", blurb: "Bolts are long and heavy, nuts are short and light. Two tidy groups." },
  overlap: { name: "Overlapping", blurb: "Stubby bolts and chunky nuts overlap in the middle — no boundary can be perfect." },
  biased: { name: "Biased", blurb: "Collected in a hurry: lots of bolts, only four nuts — all small ones. The test set is fair and includes big flange nuts." },
  xor: { name: "XOR pattern", blurb: "Bolts in two opposite corners, nuts in the other two. No single straight line separates them." },
  blank: { name: "Blank", blurb: "An empty table. Every example is yours to add." },
  diet: { name: "Test set only", blurb: "24 hidden-away test parts. The training set is empty — you supply it." },
  noisy: { name: "Noisy labels", blurb: "A tired helper stuck the wrong label on about one training part in five." },
};

/** Flip the labels of roughly `frac` of the (not yet flipped) training samples. Test labels stay honest. */
export function addNoise(samples: Sample[], seed: number, frac = 0.2): Sample[] {
  const r = rng(seed * 7919 + 13);
  const idx = samples.map((s, i) => (!s.test && !s.flipped ? i : -1)).filter((i) => i >= 0);
  const want = Math.max(1, Math.round(idx.length * frac));
  const pick = new Set<number>();
  while (pick.size < Math.min(want, idx.length)) pick.add(idx[Math.floor(r() * idx.length)]);
  return samples.map((s, i) => (pick.has(i) ? { ...s, label: (1 - s.label) as Label, flipped: true } : s));
}

export function makePreset(id: PresetId): Sample[] {
  switch (id) {
    case "clean": {
      const r = rng(11);
      return [...blob(r, 20, 0.9, 0.66, 0.085, 0, 6), ...blob(r, 20, 0.43, 0.34, 0.085, 1, 6)];
    }
    case "overlap": {
      const r = rng(23);
      return [...blob(r, 24, 0.8, 0.6, 0.13, 0, 8), ...blob(r, 24, 0.53, 0.42, 0.13, 1, 8)];
    }
    case "biased": {
      const r = rng(37);
      const train = [...blob(r, 18, 0.95, 0.56, 0.1, 0, 0), ...blob(r, 4, 0.3, 0.25, 0.05, 1, 0)];
      const test = [...blob(r, 8, 0.95, 0.56, 0.1, 0, 8), ...blob(r, 4, 0.3, 0.25, 0.05, 1, 4), ...blob(r, 4, 0.5, 0.82, 0.05, 1, 4)];
      return [...train, ...test];
    }
    case "xor": {
      const r = rng(41);
      return [...blob(r, 10, 0.36, 0.74, 0.07, 0, 3), ...blob(r, 10, 0.97, 0.26, 0.07, 0, 3), ...blob(r, 10, 0.36, 0.26, 0.07, 1, 3), ...blob(r, 10, 0.97, 0.74, 0.07, 1, 3)];
    }
    case "diet": {
      const r = rng(53);
      return [...blob(r, 12, 0.9, 0.64, 0.1, 0, 12), ...blob(r, 12, 0.45, 0.36, 0.1, 1, 12)];
    }
    case "noisy": {
      const r = rng(67);
      return addNoise([...blob(r, 30, 0.86, 0.63, 0.105, 0, 10), ...blob(r, 30, 0.48, 0.38, 0.105, 1, 10)], 3, 0.22);
    }
    default:
      return [];
  }
}

/* ───────────────────────── k-nearest neighbours ───────────────────────── */

/** Indices of the k training samples closest to (x, y), nearest first. */
export function nearest(train: Sample[], x: number, y: number, k: number): number[] {
  return train
    .map((s, i) => ({ i, d: (s.x - x) ** 2 + (s.y - y) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((n) => n.i);
}

/** Majority vote among the k nearest training samples (a tie goes to the single nearest one). */
export function knnPredict(train: Sample[], x: number, y: number, k: number): Label | null {
  const n = train.length;
  if (!n) return null;
  const kk = Math.min(k, n);
  const bd: number[] = new Array(kk).fill(Infinity);
  const bl: number[] = new Array(kk).fill(0);
  for (let i = 0; i < n; i++) {
    const s = train[i];
    const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
    if (d >= bd[kk - 1]) continue;
    let j = kk - 1;
    while (j > 0 && bd[j - 1] > d) {
      bd[j] = bd[j - 1];
      bl[j] = bl[j - 1];
      j--;
    }
    bd[j] = d;
    bl[j] = s.label;
  }
  let nuts = 0;
  for (let j = 0; j < kk; j++) nuts += bl[j];
  if (nuts * 2 === kk) return bl[0] as Label;
  return nuts * 2 > kk ? 1 : 0;
}

/* ───────────────────────── perceptron ───────────────────────── */

export interface Perceptron {
  w1: number;
  w2: number;
  b: number;
}
/** An untrained model: a line drawn before seeing any data. */
export const UNTRAINED: Perceptron = { w1: -0.3, w2: 1, b: 0.3 };

export const perceptronScore = (p: Perceptron, x: number, y: number) => p.w1 * (x - XMAX / 2) + p.w2 * (y - 0.5) + p.b;
export const perceptronPredict = (p: Perceptron, x: number, y: number): Label => (perceptronScore(p, x, y) >= 0 ? 0 : 1);

/**
 * One epoch = one pass over the training data in a shuffled order.
 * Whenever a sample is on the wrong side of the line, the line is nudged towards it.
 * Returns the model after every nudge (for the animation) and the final model.
 */
export function trainEpoch(p: Perceptron, train: Sample[], lr: number, epoch: number): { p: Perceptron; steps: { p: Perceptron; i: number }[] } {
  const r = rng(epoch * 104729 + train.length * 31 + 7);
  const order = train.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  let cur = p;
  const steps: { p: Perceptron; i: number }[] = [];
  for (const i of order) {
    const s = train[i];
    const want = s.label === 0 ? 1 : -1;
    if (want * perceptronScore(cur, s.x, s.y) > 0) continue;
    cur = { w1: cur.w1 + lr * want * (s.x - XMAX / 2), w2: cur.w2 + lr * want * (s.y - 0.5), b: cur.b + lr * want * 0.5 };
    steps.push({ p: cur, i });
  }
  return { p: cur, steps };
}

/* ───────────────────────── evaluation ───────────────────────── */

export type Classifier = (x: number, y: number) => Label | null;

export interface Metrics {
  nTrain: number;
  nTest: number;
  /** Accuracy on the data the model learned from. */
  trainAcc: number | null;
  /** Accuracy on held-back test data (null when the split is off or there is no test data). */
  testAcc: number | null;
  /** Accuracy per class on the evaluated set (test set if split, else everything): [bolts, nuts]. */
  byClass: [number | null, number | null];
  /** Indices (into samples) that the model gets wrong in the evaluated set. */
  wrong: number[];
}

export function trainingSet(samples: Sample[], split: boolean): Sample[] {
  return split ? samples.filter((s) => !s.test) : samples;
}

export function makeClassifier(algo: Algo, train: Sample[], k: number, p: Perceptron): Classifier {
  if (algo === "perceptron") return (x, y) => perceptronPredict(p, x, y);
  const hasBoth = train.some((s) => s.label === 0) && train.some((s) => s.label === 1);
  return hasBoth ? (x, y) => knnPredict(train, x, y, k) : () => null;
}

export function evaluate(samples: Sample[], split: boolean, classify: Classifier): Metrics {
  let nTrain = 0;
  let nTest = 0;
  let okTrain = 0;
  let okTest = 0;
  const cls = [
    [0, 0],
    [0, 0],
  ];
  const wrong: number[] = [];
  samples.forEach((s, i) => {
    const isTest = split && s.test;
    const ok = classify(s.x, s.y) === s.label;
    if (isTest) {
      nTest++;
      if (ok) okTest++;
    } else {
      nTrain++;
      if (ok) okTrain++;
    }
    if (isTest || !split) {
      cls[s.label][0]++;
      if (ok) cls[s.label][1]++;
      else wrong.push(i);
    }
  });
  return {
    nTrain,
    nTest,
    trainAcc: nTrain ? okTrain / nTrain : null,
    testAcc: split && nTest ? okTest / nTest : null,
    byClass: [cls[0][0] ? cls[0][1] / cls[0][0] : null, cls[1][0] ? cls[1][1] / cls[1][0] : null],
    wrong,
  };
}

export const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
