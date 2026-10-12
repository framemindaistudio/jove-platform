"use client";

import { ArrowDown } from "lucide-react";
import type { PackageId } from "@/lib/content/business";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ESTIMATE_EVENT, ESTIMATOR_ID } from "./data";
import { scrollToElement } from "./scroll";

/**
 * "Estimate this package" — pre-selects the package in the quote estimator and glides down to it.
 * A plain #estimate link without JavaScript.
 */
export function EstimateButton({ pkg, children, variant = "primary", className }: { pkg: PackageId; children: React.ReactNode; variant?: "primary" | "light" | "secondary"; className?: string }) {
  return (
    <a
      href={`#${ESTIMATOR_ID}`}
      className={buttonClass(variant, "md", cn("w-full", className))}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const target = document.getElementById(ESTIMATOR_ID);
        if (!target) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(ESTIMATE_EVENT, { detail: { pkg } }));
        scrollToElement(target);
        history.replaceState(null, "", `#${ESTIMATOR_ID}`);
        // keyboard users land on the package they picked
        requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`input[name="estimate-package"][value="${pkg}"]`)?.focus({ preventScroll: true }));
      }}
    >
      {children}
      <ArrowDown className="size-4 transition-transform duration-300 group-hover/btn:translate-y-0.5" aria-hidden />
    </a>
  );
}
