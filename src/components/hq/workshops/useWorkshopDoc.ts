"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCollection } from "@/components/hq/data";
import type { Rec } from "./logic";

export type PatchFn = (patch: Record<string, unknown>, opts?: { immediate?: boolean }) => Promise<void>;
export type SaveState = "idle" | "saving" | "saved" | "error" | "offline";

/** A failed fetch (no network), as opposed to the server refusing the change. */
function isNetworkError(e: unknown) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return e instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(e instanceof Error ? e.message : String(e));
}

const keyOf = (id: string) => `jove-ws-unsent-${id}`;
function readUnsent(id: string): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(keyOf(id));
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
function writeUnsent(id: string, v: Record<string, unknown>) {
  try {
    if (Object.keys(v).length) window.localStorage.setItem(keyOf(id), JSON.stringify(v));
    else window.localStorage.removeItem(keyOf(id));
  } catch {
    // private window or storage full: the change still waits in memory
  }
}

/**
 * One workshop record with optimistic, serialised partial saves.
 *
 * Checklist ticks and quick toggles call `patch()`; edits show instantly (overrides),
 * are merged, debounced and written one after another so two quick ticks can never
 * overwrite each other with a stale copy of the record.
 *
 * With no network (a school hall often has none), changes are kept on the device, also across a reload, and
 * sent when the connection returns. A change the server refuses is dropped and the record reloaded, as before.
 */
export function useWorkshopDoc(id: string) {
  const { records, loading, error, save } = useCollection("workshops");
  const record = useMemo(() => records.find((r) => r.id === id), [records, id]);

  // changes left on this device by an earlier visit without network show at once, and are sent below
  const [overrides, setOverrides] = useState<Record<string, unknown>>(() => (typeof window === "undefined" ? {} : readUnsent(id)));
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  const baseRef = useRef<Rec | undefined>(undefined);
  const pending = useRef<Record<string, unknown>>({});
  const chain = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<number | undefined>(undefined);
  const retry = useRef<number | undefined>(undefined);
  const again = useRef<() => void>(() => {});

  useEffect(() => {
    baseRef.current = record;
  }, [record]);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    window.clearTimeout(retry.current);
    chain.current = chain.current.then(async () => {
      const patch = pending.current;
      if (!Object.keys(patch).length || !baseRef.current) return;
      pending.current = {};
      setState("saving");
      try {
        const saved = await save({ ...baseRef.current, ...patch });
        baseRef.current = saved;
        writeUnsent(id, pending.current);
        setState(Object.keys(pending.current).length ? "saving" : "saved");
        setMessage("");
        if (!Object.keys(pending.current).length) setOverrides({});
      } catch (e) {
        if (isNetworkError(e)) {
          // keep it, on this device too, and try again shortly
          pending.current = { ...patch, ...pending.current };
          writeUnsent(id, pending.current);
          setState("offline");
          setMessage("");
          retry.current = window.setTimeout(() => again.current(), 15_000);
          return;
        }
        pending.current = {};
        writeUnsent(id, {});
        setOverrides({});
        setState("error");
        setMessage(e instanceof Error ? e.message : "Could not save");
      }
    });
    return chain.current;
  }, [save, id]);

  useEffect(() => {
    again.current = () => void flush();
  }, [flush]);

  const patch = useCallback<PatchFn>(
    (p, opts) => {
      pending.current = { ...pending.current, ...p };
      writeUnsent(id, pending.current);
      setOverrides((o) => ({ ...o, ...p }));
      setState((s) => (s === "offline" ? "offline" : "saving"));
      window.clearTimeout(timer.current);
      if (opts?.immediate) return flush();
      timer.current = window.setTimeout(flush, 450);
      return Promise.resolve();
    },
    [flush, id],
  );

  // ...and go out once the record is here
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !record) return;
    restored.current = true;
    const unsent = readUnsent(id);
    if (!Object.keys(unsent).length) return;
    pending.current = { ...unsent, ...pending.current };
    void flush();
  }, [record, id, flush]);

  // send as soon as the connection is back
  useEffect(() => {
    const online = () => {
      if (Object.keys(pending.current).length) void flush();
    };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [flush]);

  // write anything still queued when the page is left
  useEffect(
    () => () => {
      window.clearTimeout(retry.current);
      flush();
    },
    [flush],
  );

  const view = useMemo(() => (record ? ({ ...record, ...overrides } as Rec) : undefined), [record, overrides]);

  return { record: view, loading, error, patch, state, message };
}
