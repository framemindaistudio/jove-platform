"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { cn } from "@/lib/utils";
import { ProductImage } from "./ProductImage";

export interface GalleryImage {
  src?: string;
  alt: string;
  caption: string;
  /** Sketches sit on paper (multiply blend); photos are shown as-is. */
  kind: "photo" | "sketch";
  fit?: "cover" | "contain";
}

/** Main image + thumbnails. Thumbnails and arrow keys switch images; reduced motion = instant swap. */
export function ProductGallery({ images, name, outOfStock, tag }: { images: GalleryImage[]; name: string; outOfStock?: boolean; tag?: string }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const count = images.length;
  const current = images[active] ?? images[0];
  if (!current) return null;

  const go = (i: number) => setActive(((i % count) + count) % count);

  return (
    <figure
      className="relative"
      aria-roledescription="image gallery"
      aria-label={`${name} — images`}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(active + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(active - 1);
        }
      }}
    >
      <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper shadow-[var(--shadow-lift)]">
        <CornerMarks inset={-7} size={14} />
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)]">
          <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductImage
                src={current.src}
                alt={current.alt}
                preload={active === 0}
                eager
                quality={90}
                fit={current.fit}
                sizes="(max-width: 1024px) 100vw, 56vw"
                className={cn(current.kind === "sketch" && "mix-blend-multiply", outOfStock && active === 0 && "grayscale")}
              />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] shadow-[inset_0_0_60px_rgb(245_241_232/0.45)]" aria-hidden />

          {tag && <span className="annot absolute left-4 top-4 rounded-full bg-graphite px-3 py-1.5 tracking-[0.14em] text-paper shadow-[var(--shadow-paper)]">{tag}</span>}
          {outOfStock && active === 0 && (
            <span className="annot absolute right-4 top-4 rounded-[var(--radius-sm)] border border-graphite/40 bg-paper px-3 py-1.5 text-graphite shadow-[var(--shadow-paper)]">Out of stock</span>
          )}

          {count > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-graphite/15 bg-paper/90 p-1 shadow-[var(--shadow-paper)] backdrop-blur-sm">
              <button type="button" onClick={() => go(active - 1)} className="grid size-8 place-items-center rounded-full text-graphite transition-colors hover:bg-graphite hover:text-paper" aria-label="Previous image">
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="tabular min-w-12 text-center font-mono text-[11px] text-charcoal" aria-live="polite">
                {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              <button type="button" onClick={() => go(active + 1)} className="grid size-8 place-items-center rounded-full text-graphite transition-colors hover:bg-graphite hover:text-paper" aria-label="Next image">
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>

      <figcaption className="annot mt-4 flex items-baseline gap-3 text-blueprint">
        <span className="font-mono">Fig. {String(active + 1).padStart(2, "0")}</span>
        <span className="h-px w-6 shrink-0 translate-y-[-3px] bg-graphite/30" aria-hidden />
        <span className="normal-case tracking-normal">{current.caption}</span>
      </figcaption>

      {count > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4" role="group" aria-label="Choose image">
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Show image ${i + 1}: ${img.caption}`}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border bg-paper transition-all duration-300 ease-[var(--ease-out-expo)]",
                i === active ? "border-graphite shadow-[var(--shadow-paper)] ring-2 ring-graphite/15" : "border-graphite/15 opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage
                src={img.src}
                alt=""
                eager
                quality={60}
                fit={img.fit}
                sizes="(max-width: 1024px) 30vw, 18vw"
                className={cn("transition-transform duration-700 group-hover:scale-105", img.kind === "sketch" && "mix-blend-multiply")}
              />
              <span className="annot absolute bottom-1.5 left-1.5 rounded-[var(--radius-xs)] bg-paper/90 px-1.5 py-0.5 font-mono text-[9px] text-charcoal">{String(i + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
