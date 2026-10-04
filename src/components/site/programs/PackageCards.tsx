import { Check, Clapperboard } from "lucide-react";
import { packages } from "@/lib/content/business";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { cn, formatINR, pad2 } from "@/lib/utils";
import { mediaIncluded, packageNote, priceLabel } from "./data";
import { EstimateButton } from "./EstimateButton";

/** The four packages from business.ts as spec cards. The highlighted one is labelled "Recommended". */
export function PackageCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
      {packages.map((p, i) => {
        const hi = !!p.highlight;
        const { price, unit } = priceLabel(p.id);
        const media = mediaIncluded(p.id);
        return (
          <Reveal key={p.id} delay={i * 0.08} className="h-full">
            <article
              aria-labelledby={`pkg-${p.id}`}
              className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] p-6 transition-shadow duration-500 sm:p-7",
                hi ? "bg-graphite text-paper shadow-[var(--shadow-lift)]" : "border border-graphite/15 bg-paper-50 text-graphite shadow-[var(--shadow-paper)] hover:shadow-[var(--shadow-lift)]",
              )}
            >
              <div aria-hidden className={cn("absolute inset-0", hi ? "bp-grid-dark opacity-70" : "bp-grid-fine opacity-50")} />
              <CornerMarks className={cn("m-3", hi ? "text-paper/40" : "text-graphite/35")} />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("font-mono text-[11px] tracking-[0.12em]", hi ? "text-paper/55" : "text-blueprint")}>
                    {pad2(i + 1)} / {pad2(packages.length)}
                  </span>
                  {hi && <span className="annot rounded-full bg-paper px-2.5 py-1 text-[10px] text-graphite">Recommended</span>}
                </div>
                <h3 id={`pkg-${p.id}`} className="mt-5 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
                  {p.name}
                </h3>
                <p className={cn("annot mt-1", hi ? "text-paper/55" : "text-blueprint")}>{p.cadence}</p>
                <p className={cn("mt-4 text-sm leading-relaxed", hi ? "text-paper/75" : "text-charcoal")}>{p.headline}</p>

                <div className={cn("mt-6 border-y py-5", hi ? "border-paper/15" : "border-graphite/12")}>
                  <p className="font-mono text-[1.55rem] font-medium leading-tight tracking-tight tabular">{price}</p>
                  <p className={cn("mt-1 text-xs", hi ? "text-paper/60" : "text-blueprint")}>{unit} · ex-GST</p>
                  <p className={cn("mt-3 text-xs font-semibold", hi ? "text-paper/85" : "text-charcoal")}>{packageNote(p.id)}</p>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {p.includes.map((item) => (
                    <li key={item} className={cn("flex gap-2.5 text-sm leading-snug", hi ? "text-paper/85" : "text-charcoal")}>
                      <Check className={cn("mt-0.5 size-4 shrink-0", hi ? "text-paper" : "text-graphite")} strokeWidth={2.2} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className={cn("mt-6 flex gap-2.5 rounded-[var(--radius-sm)] border border-dashed p-3 text-xs leading-relaxed", hi ? "border-paper/25 text-paper/75" : "border-graphite/20 text-charcoal")}>
                  <Clapperboard className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} aria-hidden />
                  <span>
                    <span className="font-semibold">{media.label}</span>
                    {media.value ? ` — ≈ ${formatINR(media.value)} market value` : ""} by FrameMind AI Studio
                  </span>
                </div>

                <p className={cn("mt-4 text-xs leading-relaxed", hi ? "text-paper/60" : "text-blueprint")}>
                  <span className="annot mr-1.5">Ideal for</span>
                  {p.idealFor}
                </p>

                <div className="mt-auto pt-7">
                  <EstimateButton pkg={p.id} variant={hi ? "light" : "primary"}>
                    Estimate {p.name}
                  </EstimateButton>
                </div>
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
