"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** false on the server and during hydration, true afterwards — for client-only decisions without mismatches. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Live media-query match (server value during SSR/hydration). */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

let webgl: boolean | null = null;
function detectWebGL() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webgl = false;
  }
  return webgl;
}

export function useWebGL() {
  return useSyncExternalStore(noopSubscribe, detectWebGL, () => false);
}

let forced = false;
function subscribePreloader(cb: () => void) {
  window.addEventListener("jove:preloaded", cb);
  const t = window.setTimeout(() => {
    forced = true;
    cb();
  }, 5200); // longest preloader: 1750 ms run + 2400 ms hold + exit
  return () => {
    window.removeEventListener("jove:preloaded", cb);
    window.clearTimeout(t);
  };
}

/** true once the preloader has lifted (or immediately when it isn't shown, e.g. reduced motion). */
export function usePreloaderDone() {
  return useSyncExternalStore(
    subscribePreloader,
    () => forced || !document.documentElement.classList.contains("jove-preloading"),
    () => false,
  );
}

/** Tracks whether an element is within (or near) the viewport. */
export function useInView<T extends Element>(rootMargin = "0px", initial = false) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}
