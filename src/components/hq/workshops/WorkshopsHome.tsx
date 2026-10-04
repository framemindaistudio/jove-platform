"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { can, OPS, OPS_MEDIA, OPS_TRAINER } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { Loading, PageHeader, StatCard } from "@/components/hq/ui";
import { addDays, fillFromSchool, isCancelled, money, str, studentsOf, workshopDefaults, type Rec, readiness } from "./logic";
import { useToday } from "./time";
import { ProgressBar } from "./bits";
import { WorkshopCalendar } from "./WorkshopCalendar";
import { UpcomingList } from "./UpcomingList";
import { WorkshopFormDrawer } from "./WorkshopFormDrawer";

type View = "calendar" | "upcoming" | "all";

const EXTRA_COLUMNS: ExtraColumn<Rec>[] = [
  {
    key: "students",
    label: "Students",
    sortValue: (r) => studentsOf(r),
    render: (r) => <span className="tabular font-mono text-xs">{formatNumber(studentsOf(r))}</span>,
  },
  {
    key: "value",
    label: "Value",
    sortValue: (r) => money(r).basis,
    render: (r) => {
      const m = money(r);
      return (
        <span className="tabular font-mono text-xs" title={m.estimated ? "Computed from student counts — no agreed amount yet" : "Agreed amount"}>
          {formatINR(m.basis)}
          {m.estimated && m.basis > 0 && <span className="ml-1 text-blueprint">est.</span>}
        </span>
      );
    },
  },
  {
    key: "ready",
    label: "Ready",
    sortValue: (r) => readiness(r).pct,
    render: (r) => {
      const p = readiness(r);
      return (
        <span className="flex w-24 items-center gap-2">
          <ProgressBar value={p.pct} className="flex-1" label="Pre-event readiness" />
          <span className="tabular font-mono text-[11px] text-charcoal">{Math.round(p.pct * 100)}%</span>
        </span>
      );
    },
  },
];

export function WorkshopsHome({ initialNew, initialSchool }: { initialNew?: boolean; initialSchool?: string }) {
  const router = useRouter();
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const today = useToday();

  const { records: workshops, loading, error } = useCollection("workshops");
  const { records: trips } = useCollection(can(user, OPS_TRAINER) ? "trips" : "__none");
  const { records: media } = useCollection("mediaJobs");
  const schoolsQ = useCollection(can(user, OPS_MEDIA) ? "schools" : "__none");

  const schools = useMemo(() => new Map(schoolsQ.records.map((r) => [r.id, r])), [schoolsQ.records]);
  const schoolLabel = useCallback((w: Rec) => str(schools.get(str(w.schoolId))?.name), [schools]);

  const [view, setView] = useState<View>("calendar");
  const [draft, setDraft] = useState<Rec | null>(null);
  const [autoDone, setAutoDone] = useState(false);

  // ?new=1&school=<id> — open a prefilled drawer once the data is in (state adjusted during render, not in an effect)
  if (initialNew && !autoDone && canWrite && !loading && !schoolsQ.loading) {
    setAutoDone(true);
    setDraft(fillFromSchool({ ...workshopDefaults() }, initialSchool ? schools.get(initialSchool) : undefined) as Rec);
  }

  const stats = useMemo(() => {
    if (!today) return null;
    const live = workshops.filter((w) => !isCancelled(w));
    const month = live.filter((w) => str(w.date).startsWith(today.slice(0, 7)));
    const until = addDays(today, 60);
    const ahead = live.filter((w) => str(w.date) >= today && str(w.date) <= until && str(w.status) !== "completed");
    return {
      monthCount: month.length,
      monthStudents: month.reduce((s, w) => s + studentsOf(w), 0),
      aheadCount: ahead.length,
      aheadStudents: ahead.reduce((s, w) => s + studentsOf(w), 0),
      aheadValue: ahead.reduce((s, w) => s + money(w).basis, 0),
      nextReady: ahead.filter((w) => str(w.date) <= addDays(today, 14)),
    };
  }, [workshops, today]);

  const openNew = (date?: string) => setDraft({ ...workshopDefaults(), ...(date ? { date } : {}) } as Rec);

  const nextReadyAvg = stats && stats.nextReady.length ? stats.nextReady.reduce((s, w) => s + readiness(w).pct, 0) / stats.nextReady.length : null;

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Workshops"
        icon="CalendarRange"
        description="Every JOVE Day on one calendar — with run sheets, readiness checklists, kits, travel and media for each school."
        actions={
          canWrite ? (
            <Button size="sm" className="h-10" onClick={() => openNew()}>
              <Plus className="size-4" aria-hidden /> New workshop
            </Button>
          ) : undefined
        }
      />

      {error && (
        <p role="alert" className="mb-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}

      {!today || loading ? (
        <Loading label="Loading workshops…" />
      ) : (
        <>
          {stats && (
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="This month" value={stats.monthCount} sub={`${formatNumber(stats.monthStudents)} students`} />
              <StatCard label="Next 60 days" value={stats.aheadCount} sub={`${formatNumber(stats.aheadStudents)} students booked`} />
              <StatCard label="Value ahead" value={formatINRCompact(stats.aheadValue)} sub="Agreed or computed, ex-GST" tone="dark" />
              <StatCard
                label="Readiness · next 14 days"
                value={nextReadyAvg === null ? "—" : `${Math.round(nextReadyAvg * 100)}%`}
                sub={stats.nextReady.length ? `${stats.nextReady.length} workshop${stats.nextReady.length > 1 ? "s" : ""} inside two weeks` : "Nothing inside two weeks"}
                progress={nextReadyAvg ?? 0}
              />
            </div>
          )}

          <Tabs
            className="mb-6"
            value={view}
            onChange={setView}
            tabs={[
              { value: "calendar", label: "Calendar" },
              { value: "upcoming", label: "Upcoming" },
              { value: "all", label: "All workshops", count: workshops.length },
            ]}
          />

          <div role="tabpanel">
            {view === "calendar" && <WorkshopCalendar workshops={workshops} trips={trips} media={media} today={today} canWrite={canWrite} onNew={openNew} schoolLabel={schoolLabel} />}
            {view === "upcoming" && <UpcomingList workshops={workshops} today={today} canWrite={canWrite} onNew={() => openNew()} schoolLabel={schoolLabel} />}
            {view === "all" && (
              <CollectionManager<Rec>
                name="workshops"
                columns={["title", "schoolId", "date", "status"]}
                extraColumns={EXTRA_COLUMNS}
                hideNew
                onOpen={(r) => router.push(`/hq/workshops/${r.id}`)}
                emptyText="Add a workshop to start planning — pick the school and the counts and amount fill in for you."
              />
            )}
          </div>
        </>
      )}

      <WorkshopFormDrawer
        value={draft}
        onChange={(next) => setDraft(next as Rec)}
        onClose={() => setDraft(null)}
        onSaved={(saved, isNew) => {
          setDraft(null);
          if (isNew) router.push(`/hq/workshops/${saved.id}`);
        }}
      />
    </div>
  );
}
