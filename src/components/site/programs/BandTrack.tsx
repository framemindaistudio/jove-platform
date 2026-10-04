"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, MotionConfig, useScroll, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

export interface TrackItem {
  id: string;
  index: string;
  grades: string;
  range: string;
  name: string;
}

type LenisLike = { scrollTo: (target: HTMLElement | number, opts?: { offset?: number; duration?: number }) => void };

/**
 * Wraps the four grade-band sections with a sticky switcher.
 * - Scroll-spy highlights the band in view.
 * - Clicking scrolls (via Lenis when active) and updates the URL hash, so /programs#g6-8 links work both ways.
 * - A thin progress rule shows how far through the four bands the reader is.
 */
export function BandTrack({ items, children }: { items: TrackItem[]; children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [top, setTop] = useState(64);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start 160px", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  // Track the fixed site header's real height so the switcher sits flush under it.
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("header.site-header");
    if (!header) return;
    const measure = () => setTop(Math.round(header.getBoundingClientRect().height));
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    const raf = requestAnimationFrame(measure);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll-spy: the band crossing the upper-middle of the viewport is active.
  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  const go = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const offset = -(top + (bar.current?.offsetHeight ?? 56) + 8);
      const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
      if (lenis) lenis.scrollTo(el, { offset });
      else {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? "auto" : "smooth" });
      }
      history.replaceState(null, "", `#${id}`);
      setActive(id);
      // Move focus to the section heading for keyboard & screen-reader users.
      const heading = el.querySelector<HTMLElement>("h2");
      heading?.focus({ preventScroll: true });
    },
    [top],
  );

  return (
    <MotionConfig reducedMotion="user">
      <div ref={wrap} className="relative">
        <div ref={bar} className="sticky z-40 border-y border-graphite/10 bg-paper/90 backdrop-blur-md" style={{ top }}>
          <nav aria-label="Grade groups" className="container-bp">
            <ul className="grid grid-cols-4">
              {items.map((item, i) => {
                const on = item.id === active;
                return (
                  <li key={item.id} className="relative">
                    <a
                      href={`#${item.id}`}
                      aria-current={on ? "true" : undefined}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        go(item.id);
                      }}
                      className={cn(
                        "group relative flex h-[4.5rem] flex-col justify-center px-1.5 text-left transition-colors sm:h-16 sm:px-4",
                        on ? "text-graphite" : "text-blueprint hover:text-graphite",
                      )}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="hidden font-mono text-[10px] tracking-[0.12em] sm:inline">{item.index}</span>
                        <span className="annot whitespace-nowrap text-[10px] sm:text-[11px]">
                          <span className="sm:hidden">Gr </span>
                          <span className="hidden sm:inline">Grades </span>
                          {item.range}
                        </span>
                      </span>
                      <span className={cn("mt-0.5 text-[12px] font-semibold leading-[1.15] tracking-tight sm:truncate sm:text-sm sm:leading-normal", on ? "text-graphite" : "text-charcoal/80")}>{item.name}</span>
                      {on && <motion.span layoutId="band-track-active" className="absolute inset-x-1.5 bottom-0 h-[2px] bg-graphite sm:inset-x-4" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                    </a>
                    {i < items.length - 1 && <span aria-hidden className="absolute right-0 top-1/2 h-6 w-px -translate-y-1/2 bg-graphite/10" />}
                  </li>
                );
              })}
            </ul>
          </nav>
          <motion.div aria-hidden className="absolute inset-x-0 -bottom-px h-px origin-left bg-graphite/60" style={{ scaleX: progress }} />
        </div>
        {children}
      </div>
    </MotionConfig>
  );
}
