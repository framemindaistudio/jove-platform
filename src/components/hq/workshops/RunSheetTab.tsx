"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Pencil, Plus, Printer, RotateCcw, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/form";
import { cn, uid } from "@/lib/utils";
import { Panel } from "@/components/hq/ui";
import { Notice } from "./bits";
import { defaultSchedule, HALLS, minutesOf, scheduleOf, sortSchedule, str, type Rec, type ScheduleRow } from "./logic";
import type { PatchFn } from "./useWorkshopDoc";

const LANES = ["Hall A", "Hall B", "Whole school"] as const;
const laneOf = (hall: string): (typeof LANES)[number] => (hall === "Hall A" ? "Hall A" : hall === "Hall B" ? "Hall B" : "Whole school");
const LANE_STYLE: Record<(typeof LANES)[number], string> = {
  "Hall A": "bg-graphite text-paper border-graphite",
  "Hall B": "bg-graphite/15 text-graphite border-graphite/40",
  "Whole school": "hatch-light bg-paper text-graphite border-graphite/50",
};

export function RunSheetTab({ w, patch, canWrite }: { w: Rec; patch: PatchFn; canWrite: boolean }) {
  const saved = useMemo(() => scheduleOf(w), [w]);
  const [draft, setDraft] = useState<ScheduleRow[] | null>(null);
  const rows = draft ?? saved.rows;
  const editing = draft !== null;
  const sorted = useMemo(() => sortSchedule(rows), [rows]);

  function update(id: string, p: Partial<ScheduleRow>) {
    setDraft((cur) => (cur ?? saved.rows).map((r) => (r.id === id ? { ...r, ...p } : r)));
  }

  async function save() {
    if (!draft) return;
    const clean = sortSchedule(draft.filter((r) => r.title.trim() && r.time));
    await patch({ schedule: clean }, { immediate: true });
    setDraft(null);
  }

  async function resetDefault() {
    if (!window.confirm("Replace the saved run sheet with the default JOVE Day schedule for the booked grade bands?")) return;
    await patch({ schedule: [] }, { immediate: true });
    setDraft(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={saved.custom ? "dark" : "outline"}>{saved.custom ? "Customised for this school" : "Default JOVE Day schedule"}</Badge>
        <p className="text-xs text-blueprint">{saved.custom ? "Saved on the workshop record." : "Trimmed to the grade bands booked. Customise any time — changes save on the workshop."}</p>
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={`/hq/print/runsheet/${w.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-graphite px-3 text-xs font-semibold hover:bg-graphite hover:text-paper">
            <Printer className="size-4" aria-hidden /> Print run sheet
          </a>
          {canWrite && !editing && (
            <Button size="sm" variant="secondary" onClick={() => setDraft(saved.rows.map((r) => ({ ...r })))}>
              <Pencil className="size-4" aria-hidden /> Customise
            </Button>
          )}
          {canWrite && editing && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                <X className="size-4" aria-hidden /> Cancel
              </Button>
              <Button size="sm" onClick={save}>
                <Save className="size-4" aria-hidden /> Save run sheet
              </Button>
            </>
          )}
        </div>
      </div>

      <Timeline rows={sorted} />

      {!editing ? (
        <Panel title="Schedule" bodyClassName="p-0">
          <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-graphite/10 text-left">
                  {["Time", "Hall", "Session", "Who", "What happens"].map((h) => (
                    <th key={h} scope="col" className="annot px-5 py-2.5 text-[10px] text-blueprint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b border-dashed border-graphite/10 align-top last:border-0">
                    <td className="tabular whitespace-nowrap px-5 py-3 font-mono text-xs">
                      {r.time}
                      {r.end && <span className="text-blueprint"> – {r.end}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="outline">{r.hall}</Badge>
                    </td>
                    <td className="px-5 py-3 font-semibold">{r.title}</td>
                    <td className="px-5 py-3 text-charcoal">{r.who}</td>
                    <td className="px-5 py-3 text-xs leading-relaxed text-charcoal">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Panel
          title="Edit schedule"
          subtitle="Times are 24-hour. Rows are sorted by time when you save."
          action={
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setDraft((cur) => sortSchedule(cur ?? saved.rows))}>
                <ArrowDownUp className="size-4" aria-hidden /> Sort
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft(defaultSchedule(w))}>
                <RotateCcw className="size-4" aria-hidden /> Load default
              </Button>
            </div>
          }
        >
          <ol className="space-y-3">
            {rows.map((r, i) => (
              <li key={r.id} className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-3">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-12">
                  <Input type="time" aria-label={`Start time, row ${i + 1}`} className="md:col-span-2" value={r.time} onChange={(e) => update(r.id, { time: e.target.value })} />
                  <Input type="time" aria-label={`End time, row ${i + 1}`} className="md:col-span-2" value={r.end} onChange={(e) => update(r.id, { end: e.target.value })} />
                  <div className="md:col-span-2">
                    <Select aria-label={`Hall, row ${i + 1}`} value={r.hall} onChange={(e) => update(r.id, { hall: e.target.value })}>
                      {HALLS.map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </Select>
                  </div>
                  <Input aria-label={`Who, row ${i + 1}`} placeholder="Who (e.g. Grades 6–8)" className="col-span-2 md:col-span-3" value={r.who} onChange={(e) => update(r.id, { who: e.target.value })} />
                  <div className="col-span-2 flex justify-end md:col-span-3">
                    <button type="button" onClick={() => setDraft((cur) => (cur ?? saved.rows).filter((x) => x.id !== r.id))} className="inline-flex h-10 items-center gap-1.5 rounded px-2.5 text-xs font-semibold text-bad hover:bg-bad/10" aria-label={`Remove row ${i + 1}`}>
                      <Trash2 className="size-4" aria-hidden /> Remove
                    </button>
                  </div>
                  <Input aria-label={`Session title, row ${i + 1}`} placeholder="Session title" className="col-span-2 md:col-span-4" value={r.title} onChange={(e) => update(r.id, { title: e.target.value })} />
                  <Input aria-label={`Details, row ${i + 1}`} placeholder="What happens" className="col-span-2 md:col-span-8" value={r.detail} onChange={(e) => update(r.id, { detail: e.target.value })} />
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDraft((cur) => [...(cur ?? saved.rows), { id: uid("row_"), time: "", end: "", hall: "Both", title: "", detail: "", who: "" }])}>
              <Plus className="size-4" aria-hidden /> Add row
            </Button>
            {saved.custom && (
              <Button size="sm" variant="ghost" onClick={resetDefault}>
                <RotateCcw className="size-4" aria-hidden /> Reset saved schedule to default
              </Button>
            )}
          </div>
        </Panel>
      )}

      {!sorted.length && <Notice>No sessions yet — load the default schedule or add rows.</Notice>}
      {str(w.venue) && (
        <Panel title="Venue notes" subtitle="Printed on the run sheet">
          <p className="whitespace-pre-wrap text-sm text-charcoal">{str(w.venue)}</p>
        </Panel>
      )}
    </div>
  );
}

/** Swim-lane view of the day: Hall A, Hall B and whole-school moments. */
function Timeline({ rows }: { rows: ScheduleRow[] }) {
  const valid = rows.filter((r) => r.time && r.end && minutesOf(r.end) > minutesOf(r.time));
  if (!valid.length) return null;
  const start = Math.floor(Math.min(...valid.map((r) => minutesOf(r.time))) / 60) * 60;
  const end = Math.ceil(Math.max(...valid.map((r) => minutesOf(r.end))) / 60) * 60;
  const span = Math.max(60, end - start);
  const hours = Array.from({ length: Math.round(span / 60) + 1 }, (_, i) => start + i * 60);
  const pct = (min: number) => `${((min - start) / span) * 100}%`;

  return (
    <section aria-label="Day timeline" className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="hq-scroll relative overflow-x-auto p-4" data-lenis-prevent>
        <div className="min-w-[680px]">
          <div className="relative ml-[5.5rem] h-5">
            {hours.map((h) => (
              <span key={h} className="tabular absolute -translate-x-1/2 font-mono text-[10px] text-blueprint" style={{ left: pct(h) }}>
                {String(Math.floor(h / 60)).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {LANES.map((lane) => (
            <div key={lane} className="flex items-stretch border-t border-dashed border-graphite/15">
              <p className="annot flex w-[5.5rem] shrink-0 items-center text-[10px] text-charcoal">{lane}</p>
              <div className="relative h-14 flex-1">
                {hours.map((h) => (
                  <span key={h} className="absolute inset-y-0 w-px bg-graphite/10" style={{ left: pct(h) }} aria-hidden />
                ))}
                {valid
                  .filter((r) => laneOf(r.hall) === lane)
                  .map((r) => (
                    <div
                      key={r.id}
                      className={cn("absolute inset-y-1.5 overflow-hidden rounded-[3px] border px-1.5 py-1 text-[10px] font-semibold leading-tight", LANE_STYLE[lane])}
                      style={{ left: pct(minutesOf(r.time)), width: `calc(${((minutesOf(r.end) - minutesOf(r.time)) / span) * 100}% - 2px)` }}
                      title={`${r.time}–${r.end} · ${r.title}`}
                    >
                      <span className="line-clamp-2">{r.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
