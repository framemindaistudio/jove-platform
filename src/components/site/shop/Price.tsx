import { cn, formatINR } from "@/lib/utils";
import { savingsPct } from "./catalog";

const SIZES = {
  sm: { now: "text-lg", was: "text-xs", save: "text-[10px] px-1.5" },
  md: { now: "text-2xl", was: "text-sm", save: "text-[10px] px-2" },
  lg: { now: "text-[2.6rem] leading-none", was: "text-base", save: "text-[11px] px-2.5" },
} as const;

/** Price with optional compare-at strikethrough and a "save x%" tag (only when compareAt is genuinely higher). */
export function Price({ price, compareAt, size = "md", light, className }: { price: number; compareAt?: number; size?: keyof typeof SIZES; light?: boolean; className?: string }) {
  const pct = savingsPct(price, compareAt);
  const s = SIZES[size];
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <span className={cn("tabular font-bold tracking-[-0.02em]", s.now, light ? "text-paper" : "text-graphite")}>
        {pct !== null && <span className="sr-only">Now </span>}
        {formatINR(price)}
      </span>
      {pct !== null && compareAt && (
        <>
          <s className={cn("tabular", s.was, light ? "text-paper/50" : "text-blueprint")}>
            <span className="sr-only">Was </span>
            {formatINR(compareAt)}
          </s>
          <span className={cn("annot self-center rounded-full py-0.5 font-mono tracking-[0.12em]", s.save, light ? "bg-paper text-graphite" : "bg-graphite text-paper")}>
            Save {pct}%
          </span>
        </>
      )}
    </div>
  );
}
