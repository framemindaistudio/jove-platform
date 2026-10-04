"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCollection } from "@/components/hq/data";
import type { Rec } from "./logic";

export type PatchFn = (patch: Record<string, unknown>, opts?: { immediate?: boolean }) => Promise<void>;
export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * One workshop record with optimistic, serialised partial saves.
 *
 * Checklist ticks and quick toggles call `patch()`; edits show instantly (overrides),
 * are merged, debounced and written one after another so two quick ticks can never
 * overwrite each other with a stale copy of the record.
 */
export function useWorkshopDoc(id: string) {
  const { records, loading, error, save } = useCollection("workshops");
  const record = useMemo(() => records.find((r) => r.id === id), [records, id]);

  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  const baseRef = useRef<Rec | undefined>(undefined);
  const pending = useRef<Record<string, unknown>>({});
  const chain = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    baseRef.current = record;
  }, [record]);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    chain.current = chain.current.then(async () => {
      const patch = pending.current;
      if (!Object.keys(patch).length || !baseRef.current) return;
      pending.current = {};
      setState("saving");
      try {
        const saved = await save({ ...baseRef.current, ...patch });
        baseRef.current = saved;
        setState("saved");
        setMessage("");
        if (!Object.keys(pending.current).length) setOverrides({});
      } catch (e) {
        pending.current = {};
        setOverrides({});
        setState("error");
        setMessage(e instanceof Error ? e.message : "Could not save");
      }
    });
    return chain.current;
  }, [save]);

  const patch = useCallback<PatchFn>(
    (p, opts) => {
      pending.current = { ...pending.current, ...p };
      setOverrides((o) => ({ ...o, ...p }));
      setState("saving");
      window.clearTimeout(timer.current);
      if (opts?.immediate) return flush();
      timer.current = window.setTimeout(flush, 450);
      return Promise.resolve();
    },
    [flush],
  );

  // write anything still queued when the page is left
  useEffect(
    () => () => {
      flush();
    },
    [flush],
  );

  const view = useMemo(() => (record ? ({ ...record, ...overrides } as Rec) : undefined), [record, overrides]);

  return { record: view, loading, error, patch, state, message };
}
