import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: React.ReactNode;
}

/**
 * Accordion built on native <details> — keyboard operable and readable without JavaScript.
 * `group` makes it exclusive (one answer open at a time) in browsers that support details[name].
 */
export function FaqList({ items, group, dark, className }: { items: FaqItem[]; group: string; dark?: boolean; className?: string }) {
  return (
    <div className={cn("border-b", dark ? "border-paper/15" : "border-graphite/15", className)}>
      {items.map((item, i) => (
        <details key={item.q} name={group} open={i === 0} className={cn("group border-t", dark ? "border-paper/15" : "border-graphite/15")}>
          <summary
            className={cn(
              "flex cursor-pointer list-none items-start gap-4 py-5 transition-colors sm:gap-6 sm:py-6 [&::-webkit-details-marker]:hidden",
              dark ? "hover:text-paper" : "hover:text-ink",
            )}
          >
            <span className={cn("pt-1 font-mono text-xs tracking-widest", dark ? "text-paper/45" : "text-blueprint")}>{String(i + 1).padStart(2, "0")}</span>
            <span className={cn("flex-1 text-[17px] font-semibold leading-snug tracking-[-0.01em] sm:text-lg", dark ? "text-paper" : "text-graphite")}>{item.q}</span>
            <span
              aria-hidden
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-[var(--ease-out-expo)] group-open:rotate-45",
                dark ? "border-paper/30 group-open:bg-paper group-open:text-graphite" : "border-graphite/30 group-open:bg-graphite group-open:text-paper",
              )}
            >
              <Plus className="size-4" strokeWidth={1.5} />
            </span>
          </summary>
          <div className={cn("pb-6 pl-[2.6rem] pr-12 text-[15px] leading-relaxed sm:pl-[3.1rem]", dark ? "text-paper/70" : "text-charcoal")}>{item.a}</div>
        </details>
      ))}
    </div>
  );
}
