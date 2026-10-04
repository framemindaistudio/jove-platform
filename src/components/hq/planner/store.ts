import { useCallback, useSyncExternalStore } from "react";
import { defaultScenario, reviveScenario, type Scenario } from "./model";

/**
 * Scenario store: one object, persisted in localStorage (this browser only), read through
 * useSyncExternalStore so the server render and first client render both show the defaults
 * and the saved scenario appears right after hydration with no mismatch.
 */
const KEY = "jove.planner.scenario.v1";
const SERVER_SNAPSHOT: Scenario = defaultScenario();

let current: Scenario | null = null;
const listeners = new Set<() => void>();

function read(): Scenario {
  if (current) return current;
  let raw: unknown = null;
  try {
    const text = window.localStorage.getItem(KEY);
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null;
  }
  current = reviveScenario(raw);
  return current;
}

function write(next: Scenario) {
  current = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode or quota: the scenario still works for this session */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = null; // another tab changed it
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePlanner() {
  const scenario = useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);
  const update = useCallback((fn: (draft: Scenario) => Scenario) => write(fn(structuredClone(read()))), []);
  const reset = useCallback(() => write(defaultScenario()), []);
  return { scenario, update, reset };
}
