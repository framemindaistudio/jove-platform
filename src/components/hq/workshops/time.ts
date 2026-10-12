"use client";

import { useSyncExternalStore } from "react";
import { isoDate } from "@/lib/utils";

/**
 * Hydration-safe "today" (YYYY-MM-DD in the viewer's local time).
 * The server snapshot is null, so anything depending on the viewer's clock
 * renders only after hydration. Re-checks every minute and when the tab
 * becomes visible again (crossing midnight updates countdowns).
 */
function subscribe(cb: () => void) {
  const id = window.setInterval(cb, 60_000);
  const onVisible = () => {
    if (document.visibilityState === "visible") cb();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

const snapshot = () => isoDate();
const serverSnapshot = () => null;

export function useToday(): string | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
