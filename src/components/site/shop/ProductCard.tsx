"use client";

import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { buttonClass } from "@/components/ui/Button";
import { labs } from "@/lib/content/labs";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";
import { splitGrades, type ShopProduct } from "./catalog";

/** Catalog card: image, grades, name, short, price (+ compare-at), add to cart & details. */
export function ProductCard({ product, index, compact }: { product: ShopProduct; index?: number; compact?: boolean }) {
  const href = `/shop/${product.slug}`;
  const [gradeLine, ageLine] = splitGrades(product.grades);
  const pairedLabs = product.labSlugs.map((s) => labs.find((l) => l.slug === s)).filter((l): l is NonNullable<typeof l> => !!l);
  const lowStock = product.available && product.stock !== undefined && product.stock > 0 && product.stock <= 10;
  const titleId = `product-${product.slug}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="group relative flex h-full flex-col rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-within:shadow-[var(--shadow-lift)]"
    >
      <CornerMarks className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" inset={-5} />

      {/* Image — clickable through the title's stretched link */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-md)] bg-paper">
        <ProductImage
          src={product.image}
          alt=""
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className={cn("transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.045]", !product.available && "grayscale")}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite/10 via-transparent to-transparent" />
        {index !== undefined && (
          <span className="annot absolute left-3 top-3 rounded-[var(--radius-xs)] bg-paper/90 px-2 py-1 font-mono tracking-[0.14em] text-charcoal shadow-[var(--shadow-paper)] backdrop-blur-sm">
            No. {String(index + 1).padStart(2, "0")}
          </span>
        )}
        {gradeLine && (
          <span className="annot absolute right-3 top-3 rounded-full bg-graphite px-2.5 py-1 tracking-[0.14em] text-paper shadow-[var(--shadow-paper)]">{gradeLine.replace(/^Grades\s*/i, "Gr ")}</span>
        )}
        {!product.available && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="hatch absolute inset-0 bg-paper/40" />
            <span className="annot relative rounded-[var(--radius-sm)] border border-graphite/40 bg-paper px-3 py-1.5 text-graphite shadow-[var(--shadow-paper)]">Out of stock</span>
          </div>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "p-4" : "p-5")}>
        <p className="annot text-blueprint">
          {gradeLine || product.category}
          {ageLine && <span className="text-blueprint/70"> · {ageLine}</span>}
        </p>
        <h3 id={titleId} className={cn("mt-2 font-bold leading-tight tracking-[-0.02em] text-graphite", compact ? "text-lg" : "text-xl")}>
          <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-[var(--radius-md)] focus-visible:underline focus-visible:decoration-graphite/40 focus-visible:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        {product.short && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-charcoal">{product.short}</p>}

        {!compact && pairedLabs.length > 0 && (
          <p className="mt-3 flex items-start gap-2 text-xs leading-snug text-charcoal">
            <FlaskConical className="mt-px size-3.5 shrink-0 text-blueprint" aria-hidden />
            <span>
              <span className="font-semibold">Free {pairedLabs.length > 1 ? "labs" : "lab"}:</span> {pairedLabs.map((l) => l.title).join(" · ")}
            </span>
          </p>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3 border-t border-dashed border-graphite/20 pt-4">
            <Price price={product.price} compareAt={product.compareAt} size={compact ? "sm" : "md"} />
            <span className="annot shrink-0 pb-1 text-blueprint">Incl. GST</span>
          </div>
          {lowStock && <p className="annot mt-2 text-warn">Only {product.stock} left</p>}
          {/* Buttons sit above the stretched title link */}
          <div className="relative z-10 mt-4 flex gap-2">
            {product.available ? (
              <AddToCartButton product={product} size={compact ? "sm" : "md"} className={cn("flex-1", compact && "h-10")} />
            ) : (
              <button type="button" disabled className={buttonClass("secondary", compact ? "sm" : "md", cn("flex-1", compact && "h-10"))}>
                Out of stock
              </button>
            )}
            <Link href={href} className={buttonClass("secondary", compact ? "sm" : "md", cn("px-3.5", compact && "h-10"))} aria-label={`Details: ${product.name}`}>
              <span className={compact ? "sr-only" : "hidden sm:inline"}>Details</span>
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
