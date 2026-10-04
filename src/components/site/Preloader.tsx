"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";

/**
 * Cinematic first-visit preloader: a pencil line-drawing of the JOVE arm rising out of the "O",
 * a 000→100 counter and cycling status lines, then the paper lifts away in staggered strips.
 *
 * - Runs on every full page load, so a reload never exposes a half-built page: the full version on the
 *   first visit of a browser session, a quick version afterwards (sessionStorage "jove-preloaded").
 * - Skipped entirely for reduced motion (an inline script hides it during HTML parse — no flash).
 * - Waits (bounded) for anything that sets <html data-jove-hold>, e.g. the home hero's 3D scene,
 *   so the page is revealed finished instead of swapping content in view.
 * - Never delays the page mounting underneath; click / Esc skips; CSS failsafe if JS never loads.
 */

const KEY = "jove-preloaded";
const STATUS = ["CALIBRATING SERVOS", "LOADING KINEMATICS", "TRAINING NEURAL NET", "SHARPENING PENCILS", "ROLLING CAMERA"];
const STRIPS = 4;
const EASE_IN_OUT: [number, number, number, number] = [0.76, 0, 0.24, 1];

/** Counter length before the exit starts (ms since the overlay was parsed): first visit of the session vs. later reloads. */
const RUN_MS = 1750;
const QUICK_MS = 900;
/** The cap the counter holds until React is live, and while something is holding the reveal. */
const PRE_CAP = 0.92;
const HOLD_CAP = 0.97;
/** Longest the reveal waits for a holder (e.g. the hero's 3D scene) after the counter has run. */
const MAX_HOLD_MS = 2400;

/**
 * Runs during HTML parse: (1) hides the overlay for returning / reduced-motion visitors before first paint,
 * (2) drives the counter, status line and progress bar until React hydrates and takes over (data-live),
 * so the 000→100 count is smooth from the very first frame instead of jumping at hydration.
 */
const INLINE_SCRIPT = `(function(){var d=document.documentElement,q=false;try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('jove-preloaded');return}q=!!sessionStorage.getItem('${KEY}')}catch(e){}d.classList.add('jove-preloading');if(q)d.classList.add('jove-pre-quick');var R=q?${QUICK_MS}:${RUN_MS},S=${JSON.stringify(STATUS)},T=performance.now();window.__jpT0=T;window.__jpRun=R;function f(){var n=performance.now()-T,r=document.querySelector('.jove-preloader');if(r&&r.hasAttribute('data-live'))return;if(r){var p=Math.min(${PRE_CAP},n/R),e=1-Math.pow(1-p,2.2),c=r.querySelector('[data-jp-count]'),s=r.querySelector('[data-jp-status]'),b=r.querySelector('[data-jp-bar]');if(c)c.textContent=('00'+Math.min(99,Math.round(e*100))).slice(-3);if(s)s.textContent=S[Math.min(S.length-1,Math.floor(p*S.length))];if(b)b.style.transform='scaleX('+e+')'}if(n<6000)requestAnimationFrame(f)}requestAnimationFrame(f)})();`;

const CSS = `
html.jove-preloaded .jove-preloader{display:none}
@media (prefers-reduced-motion: reduce){.jove-preloader{display:none}}
.jove-preloader{animation:jove-pre-failsafe .5s ease 4.4s forwards}
.jove-preloader[data-live]{animation:none}
@keyframes jove-pre-failsafe{to{opacity:0;visibility:hidden}}
.jove-preloader .jp-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:jp-draw var(--d,.9s) cubic-bezier(.65,0,.35,1) var(--delay,0s) forwards}
.jove-preloader .jp-fade{opacity:0;animation:jp-fade .5s ease var(--delay,0s) forwards}
.jove-preloader .jp-cursor{animation:jp-blink 1s steps(2,start) infinite}
html.jove-pre-quick .jove-preloader .jp-draw{animation-duration:calc(var(--d,.9s)*.45);animation-delay:calc(var(--delay,0s)*.4)}
html.jove-pre-quick .jove-preloader .jp-fade{animation-duration:.3s;animation-delay:calc(var(--delay,0s)*.4)}
@keyframes jp-draw{to{stroke-dashoffset:0}}
@keyframes jp-fade{to{opacity:1}}
@keyframes jp-blink{to{visibility:hidden}}
`;

type LenisLike = { stop: () => void; start: () => void; isStopped?: boolean };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;
const noopSubscribe = () => () => {};

function d(delay: number, dur = 0.9): React.CSSProperties {
  return { ["--delay" as string]: `${delay}s`, ["--d" as string]: `${dur}s` };
}

function Drawing() {
  return (
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full text-graphite" aria-hidden>
      {/* construction geometry */}
      <g strokeWidth="0.6" className="text-graphite/40" stroke="currentColor">
        <circle className="jp-draw" pathLength={1} style={d(0, 1.2)} cx="200" cy="230" r="150" strokeDasharray="1" />
        <circle className="jp-draw" pathLength={1} style={d(0.15, 1.1)} cx="200" cy="230" r="112" />
        <path className="jp-draw" pathLength={1} style={d(0.05, 0.9)} d="M20 250 H380" />
        <path className="jp-draw" pathLength={1} style={d(0.1, 0.9)} d="M200 40 V390" />
        <path className="jp-draw" pathLength={1} style={d(0.3, 0.8)} d="M95 355 L330 90" />
      </g>
      {/* the "O" ring */}
      <g strokeWidth="2.2">
        <circle className="jp-draw" pathLength={1} style={d(0.2, 1)} cx="200" cy="250" r="70" />
        <circle className="jp-draw" pathLength={1} style={d(0.32, 0.95)} cx="200" cy="250" r="55" strokeWidth="1.2" />
      </g>
      {/* arm rising from the ring */}
      <g strokeWidth="1.8">
        <path className="jp-draw" pathLength={1} style={d(0.55, 0.6)} d="M190.7 246.3 L230.7 146.3" />
        <path className="jp-draw" pathLength={1} style={d(0.6, 0.6)} d="M209.3 253.7 L249.3 153.7" />
        <circle className="jp-draw" pathLength={1} style={d(0.5, 0.6)} cx="200" cy="250" r="18" />
        <circle className="jp-draw" pathLength={1} style={d(0.85, 0.5)} cx="240" cy="150" r="15" />
        <circle className="jp-draw" pathLength={1} style={d(0.95, 0.4)} cx="240" cy="150" r="5" strokeWidth="1.2" />
        <path className="jp-draw" pathLength={1} style={d(0.95, 0.5)} d="M243.3 143.8 L171.3 105.8" />
        <path className="jp-draw" pathLength={1} style={d(1.0, 0.5)} d="M236.7 156.2 L164.7 118.2" />
        <circle className="jp-draw" pathLength={1} style={d(1.15, 0.4)} cx="166" cy="112" r="10" />
        <path className="jp-draw" pathLength={1} style={d(1.25, 0.4)} d="M158 119 L146 131 L149 143" />
        <path className="jp-draw" pathLength={1} style={d(1.3, 0.4)} d="M170 122 L166 138 L174 147" />
      </g>
      {/* crosshairs */}
      <g strokeWidth="0.8" className="text-graphite/60" stroke="currentColor">
        <g className="jp-fade" style={d(0.7)}>
          <circle cx="330" cy="90" r="7" />
          <path d="M316 90 H344 M330 76 V104" />
        </g>
        <g className="jp-fade" style={d(0.9)}>
          <circle cx="70" cy="130" r="5" />
          <path d="M60 130 H80 M70 120 V140" />
        </g>
      </g>
      {/* dimension lines */}
      <g strokeWidth="0.8" className="text-graphite/70" stroke="currentColor">
        <path className="jp-draw" pathLength={1} style={d(1.05, 0.5)} d="M130 345 H270" />
        <path className="jp-fade" style={d(1.05)} d="M130 339 V351 M270 339 V351 M130 345 l7 -3 M130 345 l7 3 M270 345 l-7 -3 M270 345 l-7 3" />
        <path className="jp-draw" pathLength={1} style={d(1.15, 0.5)} d="M300 250 V105" />
        <path className="jp-fade" style={d(1.15)} d="M294 250 H306 M294 105 H306" />
        <path className="jp-draw" pathLength={1} style={d(1.2, 0.5)} d="M262 162 A26 26 0 0 0 252 128" />
      </g>
      {/* annotations */}
      <g fill="currentColor" stroke="none" className="font-mono text-graphite/70" fontSize="9" letterSpacing="1.5">
        <text className="jp-fade" style={d(1.2)} x="186" y="362">Ø 140</text>
        <text className="jp-fade" style={d(1.3)} x="308" y="182">H 145</text>
        <text className="jp-fade" style={d(1.3)} x="266" y="138">θ 42°</text>
        <text className="jp-fade" style={d(0.8)} x="214" y="262">J1</text>
        <text className="jp-fade" style={d(1.0)} x="258" y="160">J3</text>
        <text className="jp-fade" style={d(1.3)} x="128" y="104">GRIPPER</text>
        <text className="jp-fade" style={d(0.6)} x="24" y="242">FIG. 01 — JOVE ARM</text>
      </g>
    </svg>
  );
}

export function Preloader() {
  // true only while hydrating server HTML — the inline script must never be created client-side
  const hydrating = useSyncExternalStore(noopSubscribe, () => false, () => true);
  const [phase, setPhase] = useState<"play" | "exit" | "gone">("play");
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const exitRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;
    const markDone = () => {
      html.classList.remove("jove-preloading", "jove-pre-quick");
      html.classList.add("jove-preloaded");
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* storage blocked — preloader simply shows again next visit */
      }
      performance.mark?.("jove:preloaded");
      window.dispatchEvent(new Event("jove:preloaded"));
    };

    let skip = html.classList.contains("jove-preloaded") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // when the inline script parsed the overlay (≈ its first paint) and how long it runs; absent on client-side mounts
    const w = window as unknown as { __jpT0?: number; __jpRun?: number };
    const t0 = w.__jpT0 ?? 0;
    const runMs = w.__jpRun ?? RUN_MS;
    const mountedAt = performance.now();
    // hydrated very late (slow network) or mounted by a client-side navigation: never block the page
    if (mountedAt - t0 > 3600) skip = true;

    let raf = 0;
    const timers: number[] = [];
    if (skip) {
      root.style.display = "none";
      markDone();
      raf = requestAnimationFrame(() => setPhase("gone"));
      return () => cancelAnimationFrame(raf);
    }

    root.dataset.live = "";
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const unlock = () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      lenis()?.start();
    };

    // normal case: count straight through to RUN_MS; hydrated late: finish from where the inline script is holding
    const exitAt = Math.max(t0 + runMs, mountedAt + 450);
    const natural = exitAt === t0 + runMs;
    const p0 = Math.min(PRE_CAP, (mountedAt - t0) / runMs);
    let exiting = false;
    const exit = () => {
      if (exiting) return;
      exiting = true;
      cancelAnimationFrame(raf);
      if (counterRef.current) counterRef.current.textContent = "100";
      if (statusRef.current) statusRef.current.textContent = "READY";
      if (barRef.current) barRef.current.style.transform = "scaleX(1)";
      markDone();
      setPhase("exit");
      timers.push(
        window.setTimeout(() => {
          unlock();
          setPhase("gone");
        }, 920),
      );
    };
    exitRef.current = exit;

    const tick = () => {
      const now = performance.now();
      // something (the hero's 3D scene) asked us to keep the page covered until it is ready — bounded
      const held = !!html.dataset.joveHold && now < exitAt + MAX_HOLD_MS;
      const raw = natural ? (now - t0) / runMs : p0 + ((1 - p0) * (now - mountedAt)) / (exitAt - mountedAt);
      const p = Math.min(held ? HOLD_CAP : 1, raw);
      const eased = 1 - Math.pow(1 - p, 2.2);
      if (counterRef.current) counterRef.current.textContent = String(Math.min(99, Math.round(eased * 100))).padStart(3, "0");
      if (statusRef.current) statusRef.current.textContent = held && raw >= 1 ? "RENDERING ARM" : STATUS[Math.min(STATUS.length - 1, Math.floor(p * STATUS.length))];
      if (barRef.current) barRef.current.style.transform = `scaleX(${eased})`;
      const l = lenis();
      if (l && !l.isStopped) l.stop();
      if (now >= exitAt && !held) exit();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("keydown", onKey);
      unlock();
    };
  }, []);

  // Make sure scroll is never left locked if the component unmounts mid-exit.
  useEffect(() => {
    if (phase === "gone") lenis()?.start();
  }, [phase]);

  if (phase === "gone") return null;
  const exiting = phase === "exit";

  return (
    <>
      {hydrating && <script dangerouslySetInnerHTML={{ __html: INLINE_SCRIPT }} />}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div ref={rootRef} className="jove-preloader fixed inset-0 z-[200] cursor-pointer select-none" aria-hidden onClick={() => exitRef.current()}>
        {/* paper strips (each carries a slice of one continuous grid) */}
        {Array.from({ length: STRIPS }, (_, i) => (
          <div key={i} className="absolute inset-y-0" style={{ left: `${(i * 100) / STRIPS}%`, width: `${100 / STRIPS + 0.05}%` }}>
            <motion.div
              className="absolute inset-0 bg-graphite"
              initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
              animate={exiting ? { clipPath: "inset(0% 0% 100% 0%)" } : undefined}
              transition={{ duration: 0.62, delay: 0.16 + i * 0.06, ease: EASE_IN_OUT }}
            />
            <motion.div
              className="absolute inset-0 overflow-hidden bg-paper"
              initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
              animate={exiting ? { clipPath: "inset(0% 0% 100% 0%)" } : undefined}
              transition={{ duration: 0.6, delay: 0.06 + i * 0.06, ease: EASE_IN_OUT }}
            >
              <div className="absolute inset-y-0" style={{ left: `${-i * 100}%`, width: `${STRIPS * 100}%` }}>
                <div className="bp-grid absolute inset-0" />
                <div className="paper-grain absolute inset-0 opacity-70 mix-blend-multiply" />
              </div>
            </motion.div>
          </div>
        ))}

        {/* content */}
        <motion.div
          className="relative z-10 flex h-full flex-col justify-between p-5 text-graphite sm:p-8"
          animate={exiting ? { opacity: 0, y: -24 } : undefined}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="annot flex items-start justify-between gap-4 text-blueprint">
            <span>
              <span className="font-semibold text-graphite">JOVE</span>
              <span className="hidden sm:inline"> — Journey of Visionation &amp; Excellence</span>
            </span>
            <span className="font-mono tracking-[0.14em]">DRG. JV-000 · REV A</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative aspect-square w-[min(68vw,46vh,380px)]">
              <span aria-hidden className="absolute -inset-3 border border-graphite/10" />
              <span aria-hidden className="absolute -left-3 -top-3 h-3 w-3 border-l border-t border-graphite/50" />
              <span aria-hidden className="absolute -right-3 -top-3 h-3 w-3 border-r border-t border-graphite/50" />
              <span aria-hidden className="absolute -bottom-3 -left-3 h-3 w-3 border-b border-l border-graphite/50" />
              <span aria-hidden className="absolute -bottom-3 -right-3 h-3 w-3 border-b border-r border-graphite/50" />
              <Drawing />
            </div>
            <div className="mt-8 flex w-[min(68vw,380px)] items-end justify-between gap-4">
              <div className="font-mono text-[clamp(2.75rem,8vw,4.5rem)] font-medium leading-none tracking-[-0.04em] tabular-nums">
                <span ref={counterRef} data-jp-count suppressHydrationWarning>
                  000
                </span>
                <span className="ml-1 align-top text-base text-blueprint">%</span>
              </div>
              <div className="pb-1 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal">
                <span ref={statusRef} data-jp-status suppressHydrationWarning>
                  {STATUS[0]}
                </span>
                <span className="jp-cursor ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-graphite" />
              </div>
            </div>
            <span className="relative mt-3 block h-px w-[min(68vw,380px)] bg-graphite/15">
              <span ref={barRef} data-jp-bar suppressHydrationWarning className="absolute inset-0 origin-left bg-graphite" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>

          <div className="annot flex items-end justify-between gap-4 text-blueprint">
            <span>Click or Esc to skip</span>
            <span className="hidden font-mono tracking-[0.14em] sm:inline">PRECISION · LEARNING · INNOVATION · AUTOMATION</span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
