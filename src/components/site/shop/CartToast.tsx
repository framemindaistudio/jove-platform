"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { useCart } from "@/components/site/CartProvider";
import { FREE_SHIPPING_ABOVE } from "@/lib/shop";
import { buttonClass } from "@/components/ui/Button";
import { cn, formatINR } from "@/lib/utils";
import { CART_ADDED_EVENT, type CartAddedDetail } from "./cart-events";
import { ProductImage } from "./ProductImage";

const VISIBLE_MS = 4800;

/** Bottom-corner confirmation shown whenever something is added to the cart on this page. */
export function CartToast() {
  const { count, subtotal, ready } = useCart();
  const reduce = useReducedMotion();
  const [item, setItem] = useState<(CartAddedDetail & { key: number }) | null>(null);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setItem(null);
  }, []);

  useEffect(() => {
    const onAdded = (e: Event) => {
      const detail = (e as CustomEvent<CartAddedDetail>).detail;
      if (!detail) return;
      setItem({ ...detail, key: Date.now() });
    };
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdded);
  }, []);

  useEffect(() => {
    if (!item || paused) return;
    timer.current = setTimeout(() => setItem(null), VISIBLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [item, paused]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, dismiss]);

  const remaining = Math.max(0, FREE_SHIPPING_ABOVE - subtotal);
  const announcement = item ? `Added ${item.qty > 1 ? `${item.qty} × ` : ""}${item.name} to your cart.${ready ? ` Cart now has ${count} ${count === 1 ? "item" : "items"}.` : ""}` : "";

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <AnimatePresence>
        {item && (
          <motion.div
            key={item.key}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: reduce ? 0.01 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
          >
            <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-paper/10 bg-graphite text-paper shadow-[var(--shadow-lift)]">
              <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
              <div className="relative flex gap-3.5 p-3.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-paper">
                  <ProductImage src={item.image} alt="" sizes="64px" quality={60} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="annot flex items-center gap-1.5 text-paper/60">
                    <Check className="size-3.5" aria-hidden /> Added to cart
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {item.qty > 1 && <span className="font-mono">{item.qty} × </span>}
                    {item.name}
                  </p>
                  {ready && (
                    <p className="mt-0.5 text-xs text-paper/60">
                      {count} {count === 1 ? "item" : "items"} · {formatINR(subtotal)}
                      {" · "}
                      {remaining > 0 ? `${formatINR(remaining)} to free shipping` : "Free shipping unlocked"}
                    </p>
                  )}
                </div>
                <button type="button" onClick={dismiss} className="-mr-1 -mt-1 self-start rounded-full p-1.5 text-paper/60 transition-colors hover:bg-paper/10 hover:text-paper" aria-label="Dismiss">
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="relative grid grid-cols-2 gap-2 border-t border-paper/10 p-3">
                <button type="button" onClick={dismiss} className={buttonClass("outline-light", "sm", "h-9 border-paper/30")}>
                  Keep browsing
                </button>
                <Link href="/cart" onClick={dismiss} className={buttonClass("light", "sm", "h-9")}>
                  View cart &amp; checkout
                </Link>
              </div>
              {!paused && !reduce && (
                <motion.span
                  aria-hidden
                  key={`bar-${item.key}`}
                  className={cn("absolute bottom-0 left-0 h-0.5 w-full origin-left bg-paper/50")}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: VISIBLE_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
