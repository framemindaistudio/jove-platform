import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { PriceBook } from "@/lib/pricebook/types";
import { defaultScenario, reviveScenario, type Scenario } from "./model";

/**
 * Scenario store: one object, persisted in localStorage (this browser only), read through
 * useSyncExternalStore so the server render and first client render both show the defaults
 * and the saved scenario appears right after hydration with no mismatch.
 *
 * The defaults are the price book's numbers (HQ → Money → Prices & Costs). The book reaches the page from the
 * server, so everything here is worked out again whenever a newer book arrives.
 */
const KEY = "jove.planner.scenario.v1";

/** the scenario in use, and the price book it was worked out with */
let current: { book: PriceBook; scenario: Scenario } | null = null;
/** true when what is stored was saved before the planner remembered which numbers came from the price book */
let legacy = false;
const defaults = new WeakMap<PriceBook, Scenario>();
const listeners = new Set<() => void>();

function defaultsFor(book: PriceBook): Scenario {
  let d = defaults.get(book);
  if (!d) {
    d = defaultScenario(book);
    defaults.set(book, d);
  }
  return d;
}

function read(book: PriceBook): Scenario {
  if (current && current.book === book) return current.scenario;
  let raw: unknown = null;
  try {
    const text = window.localStorage.getItem(KEY);
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null;
  }
  legacy = !!raw && typeof raw === "object" && !("base" in raw);
  current = { book, scenario: reviveScenario(raw, book) };
  return current.scenario;
}

function store(scenario: Scenario) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(scenario));
    legacy = false;
  } catch {
    /* private mode or quota: the scenario still works for this session */
  }
}

function write(book: PriceBook, next: Scenario) {
  // measured against the book in use now: a part left at the book's number keeps following the book
  next.base = defaultsFor(book).base;
  current = { book, scenario: next };
  store(next);
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

export function usePlanner(book: PriceBook) {
  const scenario = useSyncExternalStore(
    subscribe,
    () => read(book),
    () => defaultsFor(book),
  );
  // A scenario saved by an older version: note once which of its numbers are the price book's, so that from now on
  // those follow the book and only the ones the founders changed stay as typed.
  useEffect(() => {
    const s = read(book);
    if (legacy) store(s);
  }, [book]);
  const update = useCallback((fn: (draft: Scenario) => Scenario) => write(book, fn(structuredClone(read(book)))), [book]);
  const reset = useCallback(() => write(book, defaultScenario(book)), [book]);
  return { scenario, update, reset };
}
