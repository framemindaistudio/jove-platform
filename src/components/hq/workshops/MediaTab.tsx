"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, Loader2, Sparkles } from "lucide-react";
import { can, OPS_MEDIA } from "@/lib/hq/roles";
import { getCollection } from "@/lib/hq/collections";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { useCollection, useHq } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { mediaPack } from "@/lib/content/business";
import { addDays, dayMonth, isIso, MEDIA_PACK_ITEMS, str, type Rec } from "./logic";
import { Notice, ProgressBar } from "./bits";

const STATUSES = getCollection("mediaJobs")?.fields.find((f) => f.key === "status")?.options ?? [];
const DONE = ["delivered", "posted"];

export function MediaTab({ w, schoolName, today }: { w: Rec; schoolName: string; today: string }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS_MEDIA) && store.writable;
  const { records, loading, save, saveMany } = useCollection("mediaJobs");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const jobs = useMemo(() => records.filter((j) => j.workshopId === w.id).sort((a, b) => str(a.dueDate).localeCompare(str(b.dueDate)) || str(a.title).localeCompare(str(b.title))), [records, w.id]);
  const label = schoolName || str(w.title);
  const noDrone = str(w.droneAllowed) === "Not allowed";

  const toCreate = useMemo(() => {
    const have = new Set(jobs.map((j) => str(j.title).trim().toLowerCase()));
    return MEDIA_PACK_ITEMS.filter((i) => !(i.needsDrone && noDrone)).filter((i) => !have.has(i.title.toLowerCase()) && !have.has(`${i.title} — ${label}`.toLowerCase()));
  }, [jobs, label, noDrone]);

  const delivered = jobs.filter((j) => DONE.includes(str(j.status))).length;
  const overdue = jobs.filter((j) => isIso(j.dueDate) && str(j.dueDate) < today && !DONE.includes(str(j.status)));

  async function generate() {
    if (!isIso(w.date)) return;
    setBusy(true);
    setError("");
    setDone("");
    try {
      await saveMany(
        toCreate.map((i) => ({
          workshopId: w.id,
          deliverable: i.deliverable,
          title: `${i.title} — ${label}`,
          status: "planned",
          dueDate: addDays(str(w.date), i.days),
          assignee: "FrameMind AI Studio",
          notes: i.notes,
        })),
      );
      setDone(`${toCreate.length} deliverable${toCreate.length === 1 ? "" : "s"} created.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create deliverables");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(job: Rec, status: string) {
    setError("");
    try {
      await save({ ...job, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title={mediaPack.name}
        subtitle="Included free with every JOVE Day · produced by FrameMind AI Studio"
        action={
          <Link href="/hq/media" className="inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline">
            Media board <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        }
      >
        {!w.mediaPack && <Notice tone="warn" className="mb-4">The Media Pack is switched off for this workshop (Overview → Media & permissions). You can still create deliverables if the school is getting some of it.</Notice>}
        {noDrone && <Notice className="mb-4">Drone permission is “Not allowed” — the drone deliverable is skipped.</Notice>}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-48 flex-1">
            <p className="annot text-[10px] text-blueprint">Delivery progress</p>
            <p className="tabular mt-1 font-mono text-sm font-semibold">
              {delivered} of {jobs.length} delivered
              {!!overdue.length && <span className="ml-2 text-bad">· {overdue.length} overdue</span>}
            </p>
            <ProgressBar value={jobs.length ? delivered / jobs.length : 0} className="mt-2" label="Media deliverables delivered" />
          </div>
          {canWrite && (
            <div className="flex flex-col items-start gap-1">
              <Button size="sm" onClick={generate} disabled={busy || !toCreate.length || !isIso(w.date)}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} Generate Media Pack deliverables
              </Button>
              <p className="text-[11px] text-blueprint">{toCreate.length ? `Creates ${toCreate.length} missing item${toCreate.length === 1 ? "" : "s"}: reels due +5 days, photos & posting kit +5, film, drone & testimonial +10.` : jobs.length ? "All Media Pack deliverables already exist." : "Set the workshop date first."}</p>
            </div>
          )}
        </div>
        {done && (
          <Notice tone="ok" className="mt-4">
            {done}
          </Notice>
        )}
        {error && (
          <Notice tone="bad" className="mt-4">
            {error}
          </Notice>
        )}
      </Panel>

      <Panel title="Deliverables" bodyClassName="p-0">
        {loading ? (
          <p className="px-5 py-8 text-sm text-blueprint">Loading…</p>
        ) : jobs.length ? (
          <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-graphite/10 text-left">
                  {["Deliverable", "Due", "Assignee", "Status"].map((h) => (
                    <th key={h} scope="col" className="annot px-5 py-2.5 text-[10px] text-blueprint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const late = isIso(j.dueDate) && str(j.dueDate) < today && !DONE.includes(str(j.status));
                  return (
                    <tr key={j.id} className="border-b border-dashed border-graphite/10 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{str(j.title)}</p>
                        <p className="text-xs text-blueprint">{str(j.deliverable)}</p>
                      </td>
                      <td className={`tabular whitespace-nowrap px-5 py-3 font-mono text-xs ${late ? "font-semibold text-bad" : ""}`}>{isIso(j.dueDate) ? dayMonth(str(j.dueDate)) : "—"}</td>
                      <td className="px-5 py-3 text-charcoal">{str(j.assignee) || "—"}</td>
                      <td className="px-5 py-3">
                        {canWrite ? (
                          <Select aria-label={`Status of ${str(j.title)}`} className="h-9 w-36" value={str(j.status) || "planned"} onChange={(e) => setStatus(j, e.target.value)}>
                            {STATUSES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Badge tone={statusTone(j.status)} dot>
                            {str(j.status)}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <Clapperboard className="size-6 text-blueprint" aria-hidden />
            <p className="text-sm font-medium">No deliverables yet</p>
            <p className="max-w-sm text-xs text-blueprint">Generate the Media Pack deliverables to give FrameMind AI Studio a due-dated list for this school.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
