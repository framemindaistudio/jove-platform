"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, BellRing, Zap } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { useCart } from "@/components/site/CartProvider";
import { FREE_SHIPPING_ABOVE, dispatchWindow, isMadeToOrder } from "@/lib/shop";
import { cn, formatINR } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import { QtyStepper } from "./QtyStepper";
import type { ShopProduct } from "./catalog";

const MAX_QTY = 20;

/** Quantity, Add to cart and Buy now for a product page — plus a sticky mobile buy bar once the panel scrolls away. */
export function PurchasePanel({ product }: { product: ShopProduct }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { add, ready, lines, subtotal } = useCart();
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const maxQty = product.stock !== undefined && product.stock > 0 ? Math.min(MAX_QTY, product.stock) : MAX_QTY;
  const inCart = ready ? (lines.find((l) => l.slug === product.slug)?.qty ?? 0) : 0;
  const lineTotal = product.price * qty;
  const afterAdd = (ready ? subtotal : 0) + lineTotal;
  const toFree = Math.max(0, FREE_SHIPPING_ABOVE - afterAdd);
  const lowStock = product.available && product.stock !== undefined && product.stock > 0 && product.stock <= 10;

  useEffect(() => {
    const el = panelRef.current;
    if (!el || !product.available || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [product.available]);

  const buyNow = () => {
    if (!ready || buying) return;
    setBuying(true);
    add({ slug: product.slug, name: product.name, price: product.price, image: product.image }, qty);
    router.push("/cart");
  };

  if (!product.available) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-graphite/30 bg-paper-50 p-5">
        <p className="flex items-center gap-2 font-semibold text-graphite">
          <span className="size-2 rounded-full bg-graphite/40" aria-hidden /> Out of stock right now
        </p>
        <p className="mt-2 text-sm leading-relaxed text-charcoal">
          A fresh batch is being assembled. Tell us you&rsquo;re interested and we&rsquo;ll let you know the moment it&rsquo;s back — meanwhile, the paired Virtual Lab is free to try.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button href="/contact" variant="secondary">
            <BellRing className="size-4" aria-hidden /> Ask about restock
          </Button>
          <Button href="/shop" variant="ghost">
            See other kits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={panelRef} className="rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-4 shadow-[var(--shadow-paper)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-graphite">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok/50 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-ok" />
            </span>
            {lowStock ? `Only ${product.stock} left` : isMadeToOrder(product.stock) ? "Made to order" : "In stock"}
            <span className="font-normal text-charcoal">· dispatch in {dispatchWindow(product.stock)}</span>
          </p>
          {inCart > 0 && <p className="annot text-blueprint">{inCart} already in your cart</p>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <QtyStepper value={qty} onChange={setQty} max={maxQty} label="Quantity" />
          <p className="tabular text-sm text-charcoal">
            <span className="font-mono">{qty}</span> × {formatINR(product.price)} = <strong className="font-semibold text-graphite">{formatINR(lineTotal)}</strong>
          </p>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <AddToCartButton product={product} qty={qty} size="lg" variant="secondary" className="w-full" />
          <button type="button" onClick={buyNow} disabled={!ready || buying} className={buttonClass("primary", "lg", "w-full")}>
            <Zap className="size-4" aria-hidden />
            {buying ? "Opening cart…" : "Buy now"}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden />
          </button>
        </div>

        <p className="mt-3 min-h-5 text-xs text-charcoal" aria-live="polite">
          {ready && (toFree > 0 ? <>Add {formatINR(toFree)} more to your cart for free shipping.</> : <>This order ships free — you&rsquo;re above {formatINR(FREE_SHIPPING_ABOVE)}.</>)}
        </p>
      </div>

      {/* Sticky buy bar (mobile & tablet) */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: reduce ? 0.01 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-[var(--consent-offset,0px)] z-40 border-t border-graphite/15 bg-paper/95 shadow-[0_-8px_30px_rgb(22_22_22/0.08)] backdrop-blur-md lg:hidden"
          >
            <div className="container-bp flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-graphite">{product.name}</p>
                <p className="tabular font-mono text-xs text-charcoal">
                  {formatINR(product.price)} <span className="annot text-blueprint">incl. GST</span>
                </p>
              </div>
              <AddToCartButton product={product} qty={qty} size="md" label="Add" className={cn("shrink-0")} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
