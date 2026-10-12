"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; title: string };

/**
 * Table of contents for legal pages.
 * - lg+: sticky list that highlights the section currently in view.
 * - below lg: a collapsible "On this page" panel.
 */
export function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = items.find((i) => visible.has(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const list = (
    <ol className="space-y-0.5">
      {items.map((item, i) => {
        const on = item.id === active;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={on ? "location" : undefined}
              className={cn(
                "group flex items-baseline gap-3 rounded-[var(--radius-sm)] border-l-2 py-1.5 pl-3 pr-2 text-[13px] leading-snug transition-colors",
                on ? "border-graphite bg-graphite/[0.05] font-semibold text-graphite" : "border-transparent text-charcoal hover:border-graphite/40 hover:text-graphite",
              )}
            >
              <span className="font-mono text-[11px] tracking-widest text-blueprint">{String(i + 1).padStart(2, "0")}</span>
              <span>{item.title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <details className="group rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 lg:hidden print:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-graphite [&::-webkit-details-marker]:hidden">
          <span className="annot text-charcoal">On this page</span>
          <ChevronDown className="size-4 text-blueprint transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <nav aria-label="Table of contents" className="border-t border-graphite/10 px-2 py-3">
          {list}
        </nav>
      </details>
      <nav aria-label="Table of contents" className="hidden lg:block print:hidden">
        <p className="annot mb-3 text-blueprint">On this page</p>
        {list}
      </nav>
    </>
  );
}
