"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Clapperboard, Film, Loader2, Plus, Sparkles } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can, OPS_MEDIA } from "@/lib/hq/roles";
import { mediaPack } from "@/lib/content/business";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Kanban } from "@/components/hq/Kanban";
import { useCollection, useHq, useLookup } from "@/components/hq/data";
import { EmptyState, Loading, StatCard } from "@/components/hq/ui";
import { addDays, addWorkingDays, isIso, shortDate } from "@/components/hq/printables/util";
import { useToday } from "@/components/hq/printables/hooks";
import { RecordDrawer, blankRecord } from "./RecordDrawer";

export interface Job extends BaseRecord {
  title?: string;
  deliverable?: string;
  status?: string;
  dueDate?: string;
  workshopId?: string;
  assignee?: string;
}

const DONE = ["delivered", "posted"];
const STATUS_LABEL: Record<string, string> = { planned: "Planned", shot: "Shot", editing: "Editing", review: "In review", delivered: "Delivered", posted: "Posted" };
/** mediaPack.items order → deliverable type */
const KINDS = ["Reel", "Full-day film", "Drone shots", "Photos", "Testimonial clip", "Posting kit"];

export const isOverdue = (j: Job, today: string) => !!today && isIso(j.dueDate) && j.dueDate.slice(0, 10) < today && !DONE.includes(String(j.status));

/** Days between two ISO dates (b - a), whole days. */
export function daysBetween(a: string, b: string) {
  const d = (s: string) => {
    const [y, m, dd] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, dd);
  };
  return Math.round((d(b) - d(a)) / 86_400_000);
}

export function Pipeline({ workshopId }: { workshopId: string }) {
  const { records, loading, error, save, saveMany } = useCollection<Job>("mediaJobs");
  const workshops = useLookup("workshops");
  const { user } = useHq();
  const canWrite = can(user, OPS_MEDIA);
  const today = useToday();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const jobs = useMemo(() => records.filter((r) => !workshopId || r.workshopId === workshopId), [records, workshopId]);
  const columns = useMemo(() => (getCollection("mediaJobs")?.fields.find((f) => f.key === "status")?.options ?? []).map((o) => ({ value: o.value, label: STATUS_LABEL[o.value] ?? o.label })), []);

  const stats = useMemo(() => {
    const open = jobs.filter((j) => !DONE.includes(String(j.status)));
    return {
      planned: jobs.filter((j) => j.status === "planned").length,
      inProduction: jobs.filter((j) => ["shot", "editing", "review"].includes(String(j.status))).length,
      overdue: jobs.filter((j) => isOverdue(j, today)).length,
      dueSoon: today ? open.filter((j) => isIso(j.dueDate) && daysBetween(today, j.dueDate.slice(0, 10)) >= 0 && daysBetween(today, j.dueDate.slice(0, 10)) <= 7).length : 0,
      done: jobs.filter((j) => DONE.includes(String(j.status))).length,
    };
  }, [jobs, today]);

  const workshop = workshopId ? workshops.get(workshopId) : undefined;
  const hasPack = !!workshopId && records.some((r) => r.workshopId === workshopId && mediaPack.items.some((i) => String(r.title ?? "").startsWith(i.title)));

  async function addPack() {
    if (!workshop || !isIso(workshop.date)) return;
    setBusy(true);
    setNotice("");
    try {
      const wDate = String(workshop.date).slice(0, 10);
      await saveMany(
        mediaPack.items.map((item, i) => {
          const days = Number(/(\d+)\s*working days/i.exec(item.delivery)?.[1]);
          return {
            workshopId,
            deliverable: KINDS[i] ?? "Other",
            title: `${item.title}: ${String(workshop.title ?? "workshop")}`,
            status: "planned",
            dueDate: Number.isFinite(days) ? addWorkingDays(wDate, days) : addDays(wDate, 7),
            assignee: "Chinmay R M",
            notes: item.detail,
          };
        }),
      );
      setNotice(`Added ${mediaPack.items.length} Media Pack deliverables for this workshop.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not add the Media Pack");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Planned" value={stats.planned} sub="Not shot yet" icon={<Clapperboard className="size-4" />} />
        <StatCard label="In production" value={stats.inProduction} sub="Shot, editing or in review" icon={<Film className="size-4" />} />
        <StatCard label="Due in 7 days" value={stats.dueSoon} sub="Open deliverables" icon={<CalendarClock className="size-4" />} />
        <StatCard label="Overdue" value={stats.overdue} sub={stats.overdue ? "Needs attention today" : "Nothing late"} tone={stats.overdue ? "dark" : "light"} icon={<AlertTriangle className="size-4" />} />
      </div>

      {error && <p className="mb-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {notice && (
        <p role="status" className="mb-3 rounded border border-graphite/15 bg-paper-200/50 px-3 py-2 text-sm text-charcoal">
          {notice}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canWrite && (
          <Button size="sm" onClick={() => setEditing(blankRecord("mediaJobs", { workshopId: workshopId || undefined }))}>
            <Plus className="size-4" /> New deliverable
          </Button>
        )}
        {canWrite && workshop && isIso(workshop.date) && !hasPack && (
          <Button size="sm" variant="secondary" onClick={addPack} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} Add the standard Media Pack ({mediaPack.items.length})
          </Button>
        )}
        <p className="ml-auto hidden text-xs text-blueprint md:block">Drag cards between columns to update status. Click a card to edit.</p>
      </div>

      {!jobs.length ? (
        <EmptyState
          icon="Clapperboard"
          title={workshopId ? "No deliverables for this workshop yet" : "No deliverables yet"}
          description={workshopId ? "Add the standard Media Pack to plan the reels, film, drone shots, photos and testimonial in one click." : "Every JOVE Day promises a Media Pack. Pick a workshop above to add its deliverables, or create one manually."}
          action={canWrite ? <Button size="sm" onClick={() => setEditing(blankRecord("mediaJobs", { workshopId: workshopId || undefined }))}><Plus className="size-4" /> New deliverable</Button> : undefined}
        />
      ) : (
        <Kanban<Job>
          records={jobs}
          field="status"
          columns={columns}
          disabled={!canWrite}
          onOpen={(j) => setEditing({ ...j })}
          onMove={async (j, status) => {
            try {
              await save({ ...j, status });
            } catch (e) {
              setNotice(e instanceof Error ? e.message : "Could not move the card");
            }
          }}
          columnFooter={(value, items) => (value === "planned" ? `${items.length} to shoot` : value === "delivered" ? `${items.length} handed over` : undefined)}
          renderCard={(j) => {
            const late = isOverdue(j, today);
            const w = j.workshopId ? workshops.get(j.workshopId) : undefined;
            const left = today && isIso(j.dueDate) ? daysBetween(today, j.dueDate.slice(0, 10)) : null;
            return (
              <div className={late ? "-m-3 rounded-[var(--radius-sm)] border-l-[3px] border-bad p-3" : undefined}>
                <p className="text-[13px] font-semibold leading-snug">{j.title || "Untitled"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {j.deliverable && <Badge tone="outline">{j.deliverable}</Badge>}
                  {late && <Badge tone="bad" dot>Overdue {left !== null ? `${Math.abs(left)}d` : ""}</Badge>}
                </div>
                {w && !workshopId && <p className="mt-2 truncate text-xs text-blueprint">{String(w.title ?? "")}</p>}
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-charcoal">
                  <span className={late ? "font-semibold text-bad" : left !== null && left >= 0 && left <= 2 && !DONE.includes(String(j.status)) ? "font-semibold text-warn" : ""}>{isIso(j.dueDate) ? `Due ${shortDate(j.dueDate)}` : "No due date"}</span>
                  {j.assignee && <span className="max-w-[45%] truncate text-blueprint">{j.assignee}</span>}
                </div>
              </div>
            );
          }}
        />
      )}

      {!workshopId && stats.done > 0 && <p className="mt-3 text-xs text-blueprint">{stats.done} deliverable{stats.done === 1 ? "" : "s"} already delivered or posted.</p>}

      <RecordDrawer name="mediaJobs" initial={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
