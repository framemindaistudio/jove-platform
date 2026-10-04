"use client";

import { Check } from "lucide-react";
import { LabJourney, Quiz, StageHeader, useLab, type QuizQuestion } from "@/components/labs/framework/LabJourney";
import { Challenges } from "./Challenges";
import { KnnDemo } from "./Demo";
import { MlTheory } from "./Theory";
import { Trainer } from "./Trainer";

const QUIZ: QuizQuestion[] = [
  {
    q: "The sorting robot measures each part's length and weight. In machine learning, what are these called?",
    options: ["Labels", "Features", "Epochs", "Boundaries"],
    answer: 1,
    explain: "Features are the measurable properties the machine looks at. The label is the answer (bolt or nut).",
  },
  {
    q: "Why do we lock some examples away as a test set?",
    options: ["To make training faster", "To check the model on examples it has never seen", "Because they are wrong", "To save memory"],
    answer: 1,
    explain: "Only unseen examples tell you whether the model learned the pattern or just memorised the training data.",
  },
  {
    q: "k-NN with k = 3 finds these nearest neighbours: bolt, nut, bolt. What does it predict?",
    options: ["Nut", "Bolt", "It can't decide", "Both"],
    answer: 1,
    explain: "Majority vote: 2 bolts beat 1 nut.",
  },
  {
    q: "A model scores 100% on its training data but only 60% on the test set. What has happened?",
    options: ["It is underpowered", "It has overfitted — it memorised instead of learning the pattern", "The test set is broken", "The learning rate is zero"],
    answer: 1,
    explain: "A big gap between training and test accuracy is the classic sign of overfitting.",
  },
  {
    q: "Why can a single perceptron never learn the XOR pattern?",
    options: ["It needs more epochs", "Its learning rate is too small", "It can only draw one straight line, and XOR needs a bent boundary", "XOR data has too many points"],
    answer: 2,
    explain: "XOR data is not linearly separable — no single straight line puts both bolt corners on one side.",
  },
  {
    q: "In a perceptron, what does the learning rate control?",
    options: ["How many examples it stores", "How far the line is nudged after each mistake", "How many neighbours vote", "The size of the test set"],
    answer: 1,
    explain: "A large learning rate makes big, jumpy corrections; a small one makes slow, careful ones.",
  },
  {
    q: "A face-unlock system was trained mostly on photos of one group of people. What is the most likely result?",
    options: ["It works equally well for everyone", "It works well for that group and worse for everyone else", "It stops working completely", "It becomes faster"],
    answer: 1,
    explain: "This is data bias: the model is least accurate for the people it saw least during training.",
  },
  {
    q: "Your model is 95% accurate overall. What should you check before calling it fair?",
    options: ["Nothing — 95% is high enough", "Its accuracy for each group separately", "How long it took to train", "Whether it used k-NN or a perceptron"],
    answer: 1,
    explain: "A high average can hide a group the model fails badly. Always check accuracy group by group.",
  },
  {
    q: "Someone stuck wrong labels on 20% of your training examples. Which k-NN setting is fooled the most?",
    options: ["k = 1", "k = 7", "k = 11", "They are all fooled equally"],
    answer: 0,
    explain: "With k = 1 a single wrong label decides the answer. More neighbours can outvote it.",
  },
];

function HandsOn() {
  const { progress } = useLab();
  const done = progress.done.includes("hands-on");
  return (
    <div>
      <StageHeader
        index="03"
        kicker="Hands-on"
        title="Train your own classifier"
        intro="You are teaching a sorting robot to tell bolts from nuts. Add examples, pick an algorithm and watch the decision regions redraw themselves. Reach 85% accuracy on the test set — with k-NN or with a perceptron — to complete this stage, then try the noisy-label and bias experiments."
      />
      {done && (
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-graphite px-4 py-2 text-sm font-semibold text-paper">
          <Check className="size-4" aria-hidden /> Hands-on complete — keep experimenting, or take on the Challenge.
        </p>
      )}
      <Trainer mode="lab">
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 text-xs leading-relaxed text-charcoal">
          <p className="annot mb-1.5 text-[10px] text-blueprint">Good to know</p>
          Both features are scaled before any distance is measured, so 1 mm doesn&apos;t count for more than 1 g. With the split on, every third example you add is held back as a test part. The Biased dataset&apos;s test set includes big flange nuts (short but heavy) that its training set never saw.
        </div>
      </Trainer>
    </div>
  );
}

function Challenge() {
  return (
    <div>
      <StageHeader
        index="04"
        kicker="Challenge"
        title="Three datasets, three lessons"
        intro="Real machine-learning engineers spend most of their time on data, not code. Solve the three dataset challenges, then take the quiz — 60% or more unlocks your certificate."
      />
      <Challenges />
      <div className="mt-12">
        <Quiz questions={QUIZ} title="Machine-learning quiz — 9 questions" />
      </div>
    </div>
  );
}

export default function Lab() {
  return <LabJourney slug="teach-the-machine" stages={{ theory: <MlTheory />, demo: <KnnDemo />, handsOn: <HandsOn />, challenge: <Challenge /> }} />;
}
