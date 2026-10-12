"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { gradeBands, type GradeBandId } from "@/lib/content/business";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import type { ShopProduct } from "./catalog";

type Sort = "recommended" | "price-asc" | "price-desc";

/** Grade filter + sort + animated product grid. */
export function ShopCatalog({ products }: { products: ShopProduct[] }) {
  const [band, setBand] = useState<GradeBandId | "all">("all");
  const [sort, setSort] = useState<Sort>("recommended");
  const reduce = useReducedMotion();
  const sortId = useId();

  const counts = useMemo(() => {
    const c = new Map<GradeBandId, number>();
    for (const p of products) for (const b of p.bands) c.set(b, (c.get(b) ?? 0) + 1);
    return c;
  }, [products]);

  const visible = useMemo(() => {
    const list = band === "all" ? products : products.filter((p) => p.bands.includes(band));
    if (sort === "recommended") return list;
    return [...list].sort((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price));
  }, [products, band, sort]);

  const active = gradeBands.find((b) => b.id === band);
  const indexOf = (slug: string) => products.findIndex((p) => p.slug === slug);

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-graphite/15 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter kits by grade" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <FilterChip pressed={band === "all"} onClick={() => setBand("all")} label="All grades" count={products.length} />
          {gradeBands.map((b) => (
            <FilterChip key={b.id} pressed={band === b.id} onClick={() => setBand(b.id)} label={b.grades} sub={b.name} count={counts.get(b.id) ?? 0} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor={sortId} className="annot shrink-0 text-blueprint">
            Sort
          </label>
          <Select id={sortId} value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 min-w-48 bg-paper-50">
            <option value="recommended">Recommended (by grade)</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </Select>
        </div>
      </div>

      <p className="annot mt-5 text-blueprint" aria-live="polite">
        <span className="font-mono">{String(visible.length).padStart(2, "0")}</span> {visible.length === 1 ? "kit" : "kits"}
        {active ? ` · ${active.grades} · ${active.name}` : " · Grades 1–10"}
      </p>

      {visible.length === 0 ? (
        <div className="relative mt-6 grid place-items-center rounded-[var(--radius-md)] border border-dashed border-graphite/25 px-6 py-16 text-center">
          <div className="hatch-light absolute inset-0 opacity-50" aria-hidden />
          <p className="relative text-lg font-semibold text-graphite">No kit for {active?.grades ?? "this grade"} just yet.</p>
          <p className="relative mt-2 max-w-md text-sm text-charcoal">
            Our design team is working on it. Meanwhile, every grade can explore our{" "}
            <Link href="/labs" className="font-semibold underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
              free Virtual Labs
            </Link>
            .
          </p>
          <button type="button" onClick={() => setBand("all")} className="annot relative mt-6 rounded-full border border-graphite/30 px-4 py-2 text-graphite transition-colors hover:bg-graphite hover:text-paper">
            Show all kits
          </button>
        </div>
      ) : (
        <motion.ul layout={!reduce} className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p) => (
              <motion.li
                key={p.slug}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <ProductCard product={p} index={indexOf(p.slug)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

function FilterChip({ pressed, onClick, label, sub, count }: { pressed: boolean; onClick: () => void; label: string; sub?: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "group/chip relative flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2 text-left transition-all duration-300 ease-[var(--ease-out-expo)]",
        pressed ? "border-graphite bg-graphite text-paper shadow-[var(--shadow-paper)]" : "border-graphite/20 bg-paper-50 text-graphite hover:border-graphite/50",
      )}
    >
      <span className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold">{label}</span>
        {sub && <span className={cn("annot text-[9px] tracking-[0.16em]", pressed ? "text-paper/60" : "text-blueprint")}>{sub}</span>}
      </span>
      <span className={cn("tabular grid size-6 place-items-center rounded-full font-mono text-[10px]", pressed ? "bg-paper/15 text-paper" : "bg-graphite/[0.07] text-charcoal")}>{count}</span>
    </button>
  );
}
