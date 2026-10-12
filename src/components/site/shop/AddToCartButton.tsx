"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { useCart } from "@/components/site/CartProvider";
import { cn } from "@/lib/utils";
import { announceCartAdd } from "./cart-events";

export interface CartableProduct {
  slug: string;
  name: string;
  price: number;
  image?: string;
}

/** Adds a product to the cart, flips to a short "Added" state and triggers the shared toast. */
export function AddToCartButton({
  product,
  qty = 1,
  disabled,
  variant = "primary",
  size = "md",
  className,
  label = "Add to cart",
  onAdded,
}: {
  product: CartableProduct;
  qty?: number;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  onAdded?: () => void;
}) {
  const { add, ready } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onClick = () => {
    if (!ready) return; // cart is still loading from storage
    add({ slug: product.slug, name: product.name, price: product.price, image: product.image }, qty);
    announceCartAdd({ slug: product.slug, name: product.name, image: product.image, qty });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
    onAdded?.();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={!ready || undefined}
      aria-label={`${label}: ${product.name}${qty > 1 ? ` × ${qty}` : ""}`}
      className={buttonClass(variant, size, cn("overflow-hidden", className))}
    >
      <span className="relative inline-flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-2 transition-all duration-300 ease-[var(--ease-out-expo)]", added ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100")}>
          <ShoppingBag className="size-4" aria-hidden />
          {label}
        </span>
        <span aria-hidden className={cn("absolute inset-0 inline-flex items-center justify-center gap-2 transition-all duration-300 ease-[var(--ease-out-expo)]", added ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}>
          <Check className="size-4" />
          Added
        </span>
      </span>
    </button>
  );
}
