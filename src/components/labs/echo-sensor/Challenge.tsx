"use client";

import { useState } from "react";
import { Check, Dices, Ruler, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Arcs, B, G, HatchDefs, P50 } from "./parts";
import { echoTimeUs, fmt, freshSeed, mulberry32 } from "./physics";

/** The survey robot is a 20 cm cube with one sensor on each face. */
const BODY = 20;

type Wall = "front" | "right" | "back" | "left";
type FieldId = Wall | "width" | "length";

interface Room {
  front: number;
  right: number;
  back: number;
  left: number;
}

const WALLS: { id: Wall; letter: string; name: string }[] = [
  { id: "front", letter: "F", name: "Front sensor" },
  { id: "right", letter: "R", name: "Right sensor" },
  { id: "back", letter: "B", name: "Back sensor" },
  { id: "left", letter: "L", name: "Left sensor" },
];

const EMPTY: Record<FieldId, string> = { front: "", right: "", back: "", left: "", width: "", length: "" };
const FIELD_IDS = Object.keys(EMPTY) as FieldId[];

/** A new random room. Only ever called from a click handler. */
function makeRoom(seed: number): Room {
  const rand = mulberry32(seed);
  const pick = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));
  return { front: pick(90, 380), right: pick(40, 200), back: pick(40, 240), left: pick(40, 200) };
}

function truth(room: Room): Record<FieldId, number> {
  return { ...room, width: room.left + BODY + room.right, length: room.back + BODY + room.front };
}

/** Rounding and the "÷ 58" shortcut are both fine: allow ±1.5 % (at least 1 cm; 2 cm for the two sums). */
function isRight(id: FieldId, answer: string, correct: number) {
  const v = Number.parseFloat(answer.replace(",", "."));
  if (!Number.isFinite(v)) return false;
  const floor = id === "width" || id === "length" ? 2 : 1;
  return Math.abs(v - correct) <= Math.max(floor, correct * 0.015);
}

function RoomMap({ room, reveal }: { room: Room; reveal: boolean }) {
  const L = room.back + BODY + room.front;
  const W = room.left + BODY + room.right;
  const k = Math.min(500 / L, 250 / W);
  const rw = L * k;
  const rh = W * k;
  const rx = (640 - rw) / 2;
  const ry = (380 - rh) / 2;
  const b = Math.max(16, BODY * k);
  const cx = rx + (room.back + BODY / 2) * k;
  const cy = ry + (room.left + BODY / 2) * k;
  // robot faces right: FRONT → right wall of the drawing, LEFT → top, RIGHT → bottom
  const beams: { id: Wall; letter: string; x1: number; y1: number; x2: number; y2: number }[] = [
    { id: "front", letter: "F", x1: cx + b / 2, y1: cy, x2: rx + rw, y2: cy },
    { id: "right", letter: "R", x1: cx, y1: cy + b / 2, x2: cx, y2: ry + rh },
    { id: "back", letter: "B", x1: cx - b / 2, y1: cy, x2: rx, y2: cy },
    { id: "left", letter: "L", x1: cx, y1: cy - b / 2, x2: cx, y2: ry },
  ];
  return (
    <svg viewBox="0 0 640 380" role="img" aria-label="Floor plan of the room with the survey robot inside. Four sensor beams, labelled F, R, B and L, reach the four walls." className="block h-auto w-full select-none">
      <HatchDefs id="echo-room-wall" gap={5} opacity={0.55} />
      <rect x={rx - 12} y={ry - 12} width={rw + 24} height={rh + 24} fill="url(#echo-room-wall)" stroke={G} strokeWidth={1.6} />
      <rect x={rx} y={ry} width={rw} height={rh} fill="#F5F1E8" stroke={G} strokeWidth={2} />
      {beams.map((m) => {
        const mx = (m.x1 + m.x2) / 2;
        const my = (m.y1 + m.y2) / 2;
        const horizontal = m.y1 === m.y2;
        return (
          <g key={m.id}>
            <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={G} strokeWidth={1.5} strokeDasharray="6 5" />
            <circle cx={m.x2} cy={m.y2} r={3.5} fill={G} />
            <circle cx={mx} cy={my} r={16} fill={P50} stroke={G} strokeWidth={1.6} />
            <text x={mx} y={my + 6.5} textAnchor="middle" fontSize={19} fill={G} className="font-mono font-bold">
              {m.letter}
            </text>
            {reveal && (
              <text x={horizontal ? mx : mx + 23} y={horizontal ? my - 23 : my + 6} textAnchor={horizontal ? "middle" : "start"} fontSize={17} fill={G} className="font-mono font-semibold">
                {room[m.id]} cm
              </text>
            )}
          </g>
        );
      })}
      {/* the robot */}
      <rect x={cx - b / 2} y={cy - b / 2} width={b} height={b} rx={3} fill={G} />
      <path d={`M${cx - b * 0.14} ${cy - b * 0.24}L${cx + b * 0.26} ${cy}L${cx - b * 0.14} ${cy + b * 0.24}Z`} fill={P50} />
      <Arcs x={cx + b / 2 + 2} y={cy} n={2} r0={6} gap={5} width={1.2} opacity={0.7} />
      <text x={rx + rw + 20} y={cy + 5} fontSize={14} fill={B} className="font-mono" transform={`rotate(90 ${rx + rw + 20} ${cy})`} textAnchor="middle">
        FRONT
      </text>
      <text x={320} y={370} textAnchor="middle" fontSize={14} fill={B} className="font-mono">
        FLOOR PLAN · ROBOT = {BODY} × {BODY} cm
      </text>
    </svg>
  );
}

export function RoomSurvey() {
  const [room, setRoom] = useState<Room | null>(null);
  const [answers, setAnswers] = useState<Record<FieldId, string>>(EMPTY);
  const [checked, setChecked] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [best, setBest] = useState(0);

  const newRoom = () => {
    setRoom(makeRoom(freshSeed()));
    setAnswers(EMPTY);
    setChecked(false);
    setRounds((r) => r + 1);
  };

  if (!room) {
    return (
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-8 text-center shadow-[var(--shadow-paper)] sm:p-12">
        <div className="bp-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-xl">
          <Ruler className="mx-auto size-8 text-graphite" aria-hidden />
          <h3 className="mt-4 text-2xl font-bold tracking-tight">Mission: measure the room</h3>
          <p className="mt-3 text-sm leading-relaxed text-charcoal">
            A survey robot with four ultrasonic sensors is dropped somewhere inside a room you have never seen. It sends back four echo times — nothing else. Turn them into distances, then work out how big the room is. Every room is different, so grab a calculator.
          </p>
          <Button onClick={newRoom} className="mt-6">
            <Dices className="size-4" aria-hidden /> Drop the robot in a room
          </Button>
        </div>
      </div>
    );
  }

  const correct = truth(room);
  const results = FIELD_IDS.map((id) => isRight(id, answers[id], correct[id]));
  const score = results.filter(Boolean).length;
  const filled = FIELD_IDS.every((id) => answers[id].trim() !== "");
  const area = (correct.width * correct.length) / 10000;

  const check = () => {
    setChecked(true);
    setBest((prev) => Math.max(prev, score));
  };

  const row = (id: FieldId, label: React.ReactNode, hint: React.ReactNode, i: number) => {
    const ok = results[i];
    return (
      <li key={id} className={cn("grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-[var(--radius-sm)] border px-3 py-2.5", checked ? (ok ? "border-ok/50 bg-ok/5" : "border-bad/50 bg-bad/5") : "border-graphite/12 bg-paper")}>
        <label htmlFor={`echo-room-${id}`} className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold leading-tight text-graphite">{label}</span>
          <span className="mt-1 block font-mono text-xs tabular-nums text-charcoal">{hint}</span>
        </label>
        <span className="flex items-center gap-2">
          <input
            id={`echo-room-${id}`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={answers[id]}
            disabled={checked}
            onChange={(e) => setAnswers((a) => ({ ...a, [id]: e.target.value }))}
            placeholder="?"
            className="h-11 w-24 rounded-[var(--radius-sm)] border border-graphite/25 bg-paper-50 px-3 text-right font-mono text-base font-semibold tabular-nums outline-none transition-colors focus-visible:border-graphite focus-visible:ring-2 focus-visible:ring-graphite/20 disabled:opacity-80"
          />
          <span className="w-6 font-mono text-xs text-blueprint">cm</span>
        </span>
        {checked && (
          <span className={cn("col-span-2 inline-flex items-center gap-1.5 text-xs font-semibold", ok ? "text-ok" : "text-bad")}>
            {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
            {ok ? `Correct — ${fmt(correct[id])} cm` : `Not quite — it is ${fmt(correct[id])} cm`}
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite/10 px-5 py-3">
        <p className="annot text-charcoal">Room survey · room #{rounds}</p>
        <p className="font-mono text-xs tabular-nums text-blueprint">Best so far: {best} / 6</p>
      </div>
      <div className="grid lg:grid-cols-[1fr_380px]">
        <div className="relative flex min-h-[260px] items-center border-b border-graphite/10 bg-paper bp-grid p-2 lg:border-b-0 lg:border-r">
          <RoomMap room={room} reveal={checked} />
        </div>
        <div className="p-5">
          <p className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 px-3 py-2 font-mono text-xs leading-relaxed text-charcoal">
            distance (cm) = 343 × time (s) ÷ 2 × 100
            <br />
            shortcut: time (µs) ÷ 58.3
          </p>
          <ol className="mt-4 space-y-2">
            {WALLS.map((w, i) =>
              row(
                w.id,
                <>
                  <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-graphite font-mono text-[11px] font-bold">{w.letter}</span>
                  {w.name}
                </>,
                <>echo {fmt(Math.round(echoTimeUs(room[w.id])))} µs</>,
                i,
              ),
            )}
            {row("width", "Room width", <>L + robot ({BODY} cm) + R</>, 4)}
            {row("length", "Room length", <>B + robot ({BODY} cm) + F</>, 5)}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            {!checked ? (
              <Button onClick={check} disabled={!filled}>
                Check my survey
              </Button>
            ) : (
              <Button onClick={newRoom}>
                <Dices className="size-4" aria-hidden /> New room
              </Button>
            )}
          </div>
        </div>
      </div>
      <div aria-live="polite" className="border-t border-graphite/10 px-5 py-3 text-sm text-charcoal">
        {!checked ? (
          "Fill in all six boxes (whole centimetres are fine), then check your survey."
        ) : score >= 5 ? (
          <span>
            <strong className="text-ok">{score} / 6 — room surveyed.</strong> It measures {fmt(correct.length)} cm × {fmt(correct.width)} cm, a floor of about <strong>{area.toFixed(1)} m²</strong>. That is exactly how a robot vacuum maps your home.
          </span>
        ) : (
          <span>
            <strong>{score} / 6.</strong> Check the ones marked in red — did you divide by 2, and did you add the robot’s own {BODY} cm for the room size? The right answers are shown above — study them, then try a new room.
          </span>
        )}
      </div>
    </div>
  );
}
