"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClipName = "hero-arm" | "drone" | "kids-build" | "crew" | "trainer";

const RM_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeRM(cb: () => void) {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** prefers-reduced-motion, hydration-safe (server snapshot = false). */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeRM, () => window.matchMedia(RM_QUERY).matches, () => false);
}

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

function pickSrc(name: ClipName, small?: boolean) {
  const conn = (navigator as NavigatorWithConnection).connection;
  const useSmall = small || window.matchMedia("(max-width: 767px)").matches || !!conn?.saveData;
  return `/videos/${name}${useSmall ? "-sm" : ""}.mp4`;
}

/**
 * Lazy, silent, looping background clip.
 * - No video bytes are requested until the clip is near the viewport (poster shows until then).
 * - Plays only while in view; pauses when scrolled away.
 * - Honours prefers-reduced-motion (stays on the poster unless the viewer presses play).
 * - `playing` makes it controlled (pair with <VideoToggle/>); otherwise it follows reduced-motion.
 */
export function LazyVideo({
  name,
  label,
  className,
  videoClassName,
  small,
  objectPosition = "50% 50%",
  playing,
  children,
}: {
  name: ClipName;
  /** Accessible description of what the clip shows. */
  label: string;
  className?: string;
  videoClassName?: string;
  /** Always use the 960w encode (phone frames, small tiles). */
  small?: boolean;
  objectPosition?: string;
  /** Controlled play state. Undefined = autoplay unless reduced motion. */
  playing?: boolean;
  /** Overlay layers rendered above the video. */
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [src, setSrc] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const wantPlay = playing ?? !reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setSrc((cur) => cur ?? pickSrc(name, small));
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [name, small]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    el.muted = true;
    if (inView && wantPlay) {
      const p = el.play();
      if (p) p.catch(() => {});
    } else {
      el.pause();
    }
  }, [inView, wantPlay, src]);

  return (
    <div className={cn("overflow-hidden", className)}>
      <video
        ref={ref}
        src={src ?? undefined}
        poster={`/videos/${name}-poster.webp`}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className={cn("absolute inset-0 size-full object-cover", videoClassName)}
        style={{ objectPosition }}
      />
      {children}
    </div>
  );
}

/** Small round pause/play control for autoplaying clips (WCAG 2.2.2). */
export function VideoToggle({ playing, onToggle, label, className, tone = "light" }: { playing: boolean; onToggle: () => void; label: string; className?: string; tone?: "light" | "dark" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? `Pause ${label}` : `Play ${label}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-sm transition-colors",
        tone === "light" ? "border-paper/30 bg-ink/40 text-paper hover:bg-paper hover:text-graphite" : "border-graphite/25 bg-paper/70 text-graphite hover:bg-graphite hover:text-paper",
        className,
      )}
    >
      {playing ? <Pause className="size-3" aria-hidden /> : <Play className="size-3" aria-hidden />}
      <span>{playing ? "Pause" : "Play"}</span>
    </button>
  );
}

/** Play state for a group of clips: autoplay unless reduced motion, until the viewer toggles. */
export function useClipPlayback() {
  const reduced = usePrefersReducedMotion();
  const [manual, setManual] = useState<boolean | null>(null);
  const playing = manual ?? !reduced;
  return { playing, toggle: () => setManual(!playing) };
}
