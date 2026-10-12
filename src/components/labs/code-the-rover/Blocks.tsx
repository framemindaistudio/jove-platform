"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ChevronDown, ChevronUp, CornerUpLeft, CornerUpRight, Lock, Minus, Plus, Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { containerDepth, countBlocks, findBlock, insertBlock, isInside, listOf, makeBlock, moveWithin, relocate, removeBlock, setTimes, type Block, type BlockKind } from "./engine";

/* ───────────────────────── rules ───────────────────────── */

export const MAX_DEPTH = 2; // a Repeat may sit inside one other Repeat
export const DEFAULT_MAX_BLOCKS = 24;
export const MIN_TIMES = 2;
export const MAX_TIMES = 9;
const MIME = "application/x-jove-rover";

export const BLOCK_META: Record<BlockKind, { label: string; hint: string; Icon: typeof ArrowUp }> = {
  forward: { label: "Forward", hint: "Drive 1 square", Icon: ArrowUp },
  left: { label: "Turn Left", hint: "Spin left", Icon: CornerUpLeft },
  right: { label: "Turn Right", hint: "Spin right", Icon: CornerUpRight },
  repeat: { label: "Repeat", hint: "Loop blocks", Icon: Repeat },
};

function repeatDepth(b: Block): number {
  return b.kind === "repeat" ? 1 + Math.max(0, ...b.body.map(repeatDepth)) : 0;
}

export interface PlaceRules {
  allowed: BlockKind[];
  maxBlocks: number;
}

/** Insert a new block. Returns the new program or a friendly reason why not. */
export function tryInsert(program: Block[], kind: BlockKind, container: string | null, index: number, rules: PlaceRules): { program: Block[]; block: Block } | { error: string } {
  if (!rules.allowed.includes(kind)) return { error: `The ${BLOCK_META[kind].label} block unlocks in a later level.` };
  if (countBlocks(program) >= rules.maxBlocks) return { error: `Block limit reached (${rules.maxBlocks}). Can a Repeat make your program shorter?` };
  if (kind === "repeat" && containerDepth(program, container) >= MAX_DEPTH) return { error: "A Repeat can hold another Repeat — but not a third one inside that." };
  const block = makeBlock(kind);
  return { program: insertBlock(program, container, index, block), block };
}

/** Move an existing block to a new place (drag & drop). */
export function tryMove(program: Block[], id: string, container: string | null, index: number): Block[] | null {
  const b = findBlock(program, id);
  if (!b) return null;
  if (container && isInside(program, id, container)) return null;
  if (containerDepth(program, container) + repeatDepth(b) > MAX_DEPTH) return null;
  return relocate(program, id, container, index);
}

function numbering(program: Block[]) {
  const m = new Map<string, number>();
  let n = 0;
  const walk = (list: Block[]) =>
    list.forEach((b) => {
      n += 1;
      m.set(b.id, n);
      if (b.kind === "repeat") walk(b.body);
    });
  walk(program);
  return m;
}

const SHADOW = "shadow-[3px_3px_0_0_rgba(43,43,43,0.9)]";

/* ───────────────────────── palette ───────────────────────── */

export function Palette({ allowed, disabledReason, onAdd, targetLabel }: { allowed: BlockKind[]; disabledReason?: string | null; onAdd: (k: BlockKind) => void; targetLabel: string }) {
  const kinds: BlockKind[] = ["forward", "left", "right", "repeat"];
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="annot text-charcoal">Blocks</p>
        <p className="text-[11px] text-blueprint">
          Tap to add to <strong className="font-semibold text-graphite">{targetLabel}</strong>
          <span className="hidden sm:inline"> · or drag</span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {kinds.map((k) => {
          const { label, hint, Icon } = BLOCK_META[k];
          const locked = !allowed.includes(k);
          const disabled = locked || !!disabledReason;
          const dark = k === "repeat";
          return (
            <button
              key={k}
              type="button"
              draggable={!disabled}
              onDragStart={(e) => {
                e.dataTransfer.setData(MIME, JSON.stringify({ kind: k }));
                e.dataTransfer.setData("text/plain", label);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onAdd(k)}
              disabled={disabled}
              title={locked ? "Unlocks in a later level" : (disabledReason ?? hint)}
              className={cn(
                SHADOW,
                "flex min-h-14 items-center gap-2.5 rounded-[12px] border-2 border-graphite px-2.5 py-2 text-left transition-transform duration-200 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
                dark ? "bg-graphite text-paper" : k === "forward" ? "bg-paper text-graphite" : "bg-paper-100 text-graphite",
              )}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border-2", dark ? "border-paper/70" : "border-graphite")}>
                {locked ? <Lock className="size-4" aria-hidden /> : <Icon className="size-5" strokeWidth={2.4} aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-sm font-bold leading-tight">{label}</span>
                <span className={cn("block truncate text-[11px]", dark ? "text-paper/65" : "text-blueprint")}>{locked ? "Unlocks later" : hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── program editor / viewer ───────────────────────── */

interface EditorProps {
  program: Block[];
  /** omit for a read-only listing */
  onChange?: (p: Block[]) => void;
  activeId?: string;
  errorId?: string;
  loopIters?: Map<string, string>;
  target?: string | null;
  onTarget?: (c: string | null) => void;
  /** editing disabled (e.g. while the rover is driving) */
  locked?: boolean;
  rules?: PlaceRules;
  onNotice?: (msg: string) => void;
  className?: string;
}

export function ProgramEditor({ program, onChange, activeId, errorId, loopIters, target = null, onTarget, locked, rules, onNotice, className }: EditorProps) {
  const editable = !!onChange && !locked;
  const nums = useMemo(() => numbering(program), [program]);
  const [dropAt, setDropAt] = useState<{ c: string | null; i: number } | null>(null);

  const accepts = (e: React.DragEvent) => editable && Array.from(e.dataTransfer.types).includes(MIME);

  const handleDrop = (e: React.DragEvent, c: string | null, i: number) => {
    if (!accepts(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setDropAt(null);
    let data: { kind?: BlockKind; id?: string } = {};
    try {
      data = JSON.parse(e.dataTransfer.getData(MIME) || "{}");
    } catch {
      return;
    }
    if (data.kind && rules) {
      const r = tryInsert(program, data.kind, c, i, rules);
      if ("error" in r) onNotice?.(r.error);
      else {
        onChange?.(r.program);
        if (r.block.kind === "repeat") onTarget?.(r.block.id);
      }
    } else if (data.id) {
      const next = tryMove(program, data.id, c, i);
      if (next) onChange?.(next);
      else onNotice?.("That block can't go there.");
    }
  };

  const over = (e: React.DragEvent, c: string | null, i: number) => {
    if (!accepts(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === "copy" ? "copy" : "move";
    if (!dropAt || dropAt.c !== c || dropAt.i !== i) setDropAt({ c, i });
  };

  const half = (e: React.DragEvent, i: number) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY > r.top + r.height / 2 ? i + 1 : i;
  };

  const rowDnd = (b: Block, c: string | null, i: number) =>
    editable
      ? {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            e.stopPropagation();
            e.dataTransfer.setData(MIME, JSON.stringify({ id: b.id }));
            e.dataTransfer.setData("text/plain", BLOCK_META[b.kind].label);
            e.dataTransfer.effectAllowed = "move";
          },
          onDragEnd: () => setDropAt(null),
          onDragOver: (e: React.DragEvent) => over(e, c, half(e, i)),
          onDrop: (e: React.DragEvent) => handleDrop(e, c, half(e, i)),
        }
      : {};

  const indicator = (c: string | null, i: number) => (dropAt && dropAt.c === c && dropAt.i === i ? <div aria-hidden className="my-1 h-1 rounded-full bg-graphite" /> : null);

  const ctrlBtn = (light: boolean) =>
    cn(
      "grid size-8 place-items-center rounded-[6px] transition-colors disabled:opacity-25",
      light ? "text-paper/80 hover:bg-paper/15 hover:text-paper" : "text-charcoal hover:bg-graphite/10 hover:text-graphite",
    );

  const controls = (b: Block, i: number, len: number, light: boolean) =>
    editable ? (
      <span className="ml-auto flex shrink-0 items-center">
        <button type="button" className={ctrlBtn(light)} disabled={i === 0} onClick={() => onChange?.(moveWithin(program, b.id, -1))} aria-label={`Move block ${nums.get(b.id)} (${BLOCK_META[b.kind].label}) up`}>
          <ChevronUp className="size-4" />
        </button>
        <button type="button" className={ctrlBtn(light)} disabled={i === len - 1} onClick={() => onChange?.(moveWithin(program, b.id, 1))} aria-label={`Move block ${nums.get(b.id)} (${BLOCK_META[b.kind].label}) down`}>
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          className={ctrlBtn(light)}
          onClick={() => {
            if (target && (target === b.id || isInside(program, b.id, target))) onTarget?.(null);
            onChange?.(removeBlock(program, b.id));
          }}
          aria-label={`Remove block ${nums.get(b.id)} (${BLOCK_META[b.kind].label})`}
        >
          <X className="size-4" />
        </button>
      </span>
    ) : null;

  const endSlot = (c: string | null, empty: boolean) => {
    if (!onChange) return empty ? <p className="px-2 py-1 text-xs italic text-blueprint">(empty)</p> : null;
    const isTarget = target === c;
    const len = listOf(program, c).length;
    return (
      <button
        type="button"
        disabled={locked}
        onClick={() => onTarget?.(c)}
        onDragOver={(e) => over(e, c, len)}
        onDrop={(e) => handleDrop(e, c, len)}
        aria-pressed={isTarget}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-dashed px-3 text-center text-xs font-semibold transition-colors disabled:opacity-50",
          empty ? "min-h-14" : "min-h-10",
          isTarget ? "border-graphite bg-graphite/[0.06] text-graphite" : "border-graphite/25 text-blueprint hover:border-graphite/50 hover:text-graphite",
        )}
      >
        <Plus className="size-3.5 shrink-0" aria-hidden />
        {isTarget ? (empty ? "New blocks go here — tap or drag one in" : "New blocks go here") : c === null ? "Add blocks to the main program" : "Add blocks inside this Repeat"}
      </button>
    );
  };

  const renderList = (blocks: Block[], c: string | null): React.ReactNode => (
    <ol className="space-y-2">
      {blocks.map((b, i) => {
        const { label, Icon } = BLOCK_META[b.kind];
        const active = activeId === b.id;
        const error = errorId === b.id;
        const n = nums.get(b.id);
        if (b.kind !== "repeat") {
          const tone = error ? "border-bad bg-bad/10 text-bad shadow-[3px_3px_0_0_rgba(180,40,40,0.55)]" : active ? cn("border-graphite bg-graphite text-paper -translate-y-0.5", SHADOW) : cn("border-graphite text-graphite", SHADOW, b.kind === "forward" ? "bg-paper" : "bg-paper-100");
          return (
            <li key={b.id}>
              {indicator(c, i)}
              <div {...rowDnd(b, c, i)} aria-current={active ? "step" : undefined} className={cn("flex min-h-12 items-center gap-2.5 rounded-[12px] border-2 py-1.5 pl-2.5 pr-1 transition-all duration-200", tone, editable && "cursor-grab active:cursor-grabbing")}>
                <span className={cn("w-5 text-center font-mono text-[10px]", active && !error ? "text-paper/70" : "text-blueprint")}>{n}</span>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2", error ? "border-bad" : active ? "border-paper" : "border-graphite")}>
                  <Icon className="size-4" strokeWidth={2.6} aria-hidden />
                </span>
                <span className="whitespace-nowrap text-sm font-bold">{label}</span>
                {active && !error && <span className="annot hidden text-[9px] text-paper/70 sm:inline lg:hidden xl:inline">running</span>}
                {error && <span className="annot text-[9px]">bug here?</span>}
                {controls(b, i, blocks.length, active && !error)}
              </div>
            </li>
          );
        }
        const iter = loopIters?.get(b.id);
        return (
          <li key={b.id}>
            {indicator(c, i)}
            <div className={cn("overflow-hidden rounded-[12px] border-2 border-graphite bg-paper-50", SHADOW, iter && "ring-2 ring-graphite ring-offset-2 ring-offset-paper")}>
              <div {...rowDnd(b, c, i)} className={cn("flex min-h-12 flex-wrap items-center gap-2 bg-graphite py-1.5 pl-2.5 pr-1 text-paper", editable && "cursor-grab active:cursor-grabbing")}>
                <span className="w-5 text-center font-mono text-[10px] text-paper/60">{n}</span>
                <Icon className="size-4" strokeWidth={2.6} aria-hidden />
                <span className="text-sm font-bold">Repeat</span>
                {editable ? (
                  <span className="flex items-center rounded-full border border-paper/40">
                    <button type="button" className="grid size-7 place-items-center rounded-full hover:bg-paper/15 disabled:opacity-30" disabled={b.times <= MIN_TIMES} onClick={() => onChange?.(setTimes(program, b.id, b.times - 1))} aria-label={`Repeat block ${n}: one time fewer`}>
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-sm font-bold tabular-nums" aria-live="polite">
                      {b.times}
                    </span>
                    <button type="button" className="grid size-7 place-items-center rounded-full hover:bg-paper/15 disabled:opacity-30" disabled={b.times >= MAX_TIMES} onClick={() => onChange?.(setTimes(program, b.id, b.times + 1))} aria-label={`Repeat block ${n}: one time more`}>
                      <Plus className="size-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="rounded-full border border-paper/40 px-2 font-mono text-sm font-bold">{b.times}</span>
                )}
                <span className="text-sm font-semibold">times</span>
                {iter && <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-graphite">loop {iter}</span>}
                {controls(b, i, blocks.length, true)}
              </div>
              <div className="relative py-2 pl-5 pr-2">
                <span aria-hidden className="absolute bottom-0 left-0 top-0 w-2.5 bg-graphite" />
                {renderList(b.body, b.id)}
              </div>
              <div aria-hidden className="h-3 w-28 rounded-br-[10px] bg-graphite" />
            </div>
          </li>
        );
      })}
      <li>
        {indicator(c, blocks.length)}
        {endSlot(c, blocks.length === 0)}
      </li>
    </ol>
  );

  return (
    <div className={className} onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setDropAt(null)}>
      {renderList(program, null)}
    </div>
  );
}
