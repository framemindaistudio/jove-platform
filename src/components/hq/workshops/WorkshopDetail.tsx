"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, ClipboardList, Pencil, Printer, Users } from "lucide-react";
import { can, OPS, OPS_MEDIA } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { formatNumber } from "@/lib/utils";
import { useCollection, useHq } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import { bookedBands, longDate, readiness, str, studentsOf, WORKSHOP_STATUS, type Rec } from "./logic";
import { useToday } from "./time";
import { Countdown, DateBlock, Notice, ReadinessRing } from "./bits";
import { useWorkshopDoc } from "./useWorkshopDoc";
import { WorkshopFormDrawer } from "./WorkshopFormDrawer";
import { OverviewTab } from "./OverviewTab";
import { RunSheetTab } from "./RunSheetTab";
import { ChecklistTab } from "./ChecklistTab";
import { KitsTab } from "./KitsTab";
import { TravelTab } from "./TravelTab";
import { MediaTab } from "./MediaTab";
import { WrapUpTab } from "./WrapUpTab";

const TAB_IDS = ["overview", "runsheet", "checklist", "kits", "travel", "media", "wrapup"] as const;
type TabId = (typeof TAB_IDS)[number];
const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  runsheet: "Run sheet",
  checklist: "Checklist",
  kits: "Kits & materials",
  travel: "Travel",
  media: "Media",
  wrapup: "Wrap-up",
};

export function WorkshopDetail({ id, initialTab }: { id: string; initialTab?: string }) {
  const router = useRouter();
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const canSchools = can(user, OPS_MEDIA);
  const today = useToday();
  const { record: w, loading, error, patch, state, message } = useWorkshopDoc(id);
  const schoolsQ = useCollection(canSchools ? "schools" : "__none");
  const school = w?.schoolId ? schoolsQ.records.find((s) => s.id === w.schoolId) : undefined;

  const [tab, setTab] = useState<TabId>((TAB_IDS as readonly string[]).includes(initialTab ?? "") ? (initialTab as TabId) : "overview");
  const [draft, setDraft] = useState<Rec | null>(null);

  function changeTab(next: TabId) {
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? window.location.pathname : `?tab=${next}`);
  }

  if (loading || !today) return <Loading label="Loading workshop…" />;
  if (!w) {
    return (
      <div className="py-6">
        <EmptyState
          icon="CalendarRange"
          title="Workshop not found"
          description={error || "It may have been deleted, or the link is wrong."}
          action={
            <Button href="/hq/workshops" size="sm" variant="secondary">
              <ArrowLeft className="size-4" aria-hidden /> All workshops
            </Button>
          }
        />
      </div>
    );
  }

  const ready = readiness(w);
  const schoolName = str(school?.name);
  const bands = bookedBands(w);

  return (
    <div>
      <Link href="/hq/workshops" className="no-print mb-4 inline-flex items-center gap-1.5 rounded px-1 py-1 text-sm font-medium text-charcoal hover:text-graphite">
        <ArrowLeft className="size-4" aria-hidden /> Workshops
      </Link>

      <header className="relative mb-6 overflow-hidden rounded-[var(--radius-lg)] border border-graphite bg-graphite p-5 text-paper sm:p-7">
        <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <DateBlock iso={str(w.date)} dark />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Countdown date={w.date} today={today} className="bg-paper/15! text-paper!" />
              <span className="annot text-paper/55">{longDate(str(w.date))}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-3xl">{str(w.title) || "Untitled workshop"}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-paper/70">
              {schoolName &&
                (canSchools ? (
                  <Link href={`/hq/crm/${school?.id}`} className="underline underline-offset-2 hover:text-paper">
                    {schoolName}
                  </Link>
                ) : (
                  <span>{schoolName}</span>
                ))}
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden /> <span className="tabular font-mono">{formatNumber(studentsOf(w))}</span> students
                {bands.length > 0 && <span className="text-paper/50">· {bands.map((b) => b.grades.replace("Grades ", "Gr ")).join(", ")}</span>}
              </span>
              {str(w.startTime) && <span className="tabular font-mono">Report {str(w.startTime)}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:justify-end">
            <ReadinessRing value={ready.pct} size={76} label="Ready" dark />
            <div className="flex flex-col gap-2">
              <div>
                <label htmlFor="ws-status" className="annot mb-1 block text-[9px] text-paper/55">
                  Status
                </label>
                {canWrite ? (
                  <Select id="ws-status" className="h-9 w-40 border-paper/30 bg-paper/10 text-paper focus:border-paper focus:bg-ink focus:ring-paper/20" value={str(w.status) || "tentative"} onChange={(e) => patch({ status: e.target.value }, { immediate: true })}>
                    {WORKSHOP_STATUS.map((o) => (
                      <option key={o.value} value={o.value} className="text-graphite">
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="text-sm font-semibold">{WORKSHOP_STATUS.find((o) => o.value === w.status)?.label ?? str(w.status)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center gap-2 border-t border-paper/15 pt-4">
          {canWrite && (
            <Button size="sm" variant="light" onClick={() => setDraft({ ...w })}>
              <Pencil className="size-4" aria-hidden /> Edit
            </Button>
          )}
          <Button size="sm" variant="outline-light" href={`/hq/print/runsheet/${w.id}`} external>
            <Printer className="size-4" aria-hidden /> Run sheet
          </Button>
          <Button size="sm" variant="outline-light" href={`/hq/print/attendance/${w.id}`} external>
            <ClipboardList className="size-4" aria-hidden /> Attendance sheets
          </Button>
          <Button size="sm" variant="outline-light" onClick={() => changeTab("checklist")}>
            <ClipboardCheck className="size-4" aria-hidden /> Checklist
          </Button>
          <p className="ml-auto text-xs text-paper/60" role="status" aria-live="polite">
            {state === "saving" && "Saving…"}
            {state === "saved" && "All changes saved"}
          </p>
        </div>
      </header>

      {state === "error" && (
        <Notice tone="bad" className="mb-4">
          {message || "Could not save the last change."} The record was reloaded from the server.
        </Notice>
      )}
      {!canWrite && (
        <Notice className="mb-4">{store.writable || store.viewOnly ? "You have view-only access to workshops." : "HQ is in read-only mode — changes cannot be saved."}</Notice>
      )}

      <Tabs className="mb-6" value={tab} onChange={changeTab} tabs={TAB_IDS.map((t) => ({ value: t, label: TAB_LABELS[t] }))} />

      <div role="tabpanel" aria-label={TAB_LABELS[tab]}>
        {tab === "overview" && <OverviewTab w={w} patch={patch} canWrite={canWrite} school={school} canSchools={canSchools} showMoney={can(user, OPS)} />}
        {tab === "runsheet" && <RunSheetTab w={w} patch={patch} canWrite={canWrite} />}
        {tab === "checklist" && <ChecklistTab w={w} patch={patch} canWrite={canWrite} today={today} />}
        {tab === "kits" && <KitsTab w={w} showMoney={can(user, OPS)} />}
        {tab === "travel" && <TravelTab w={w} schoolName={schoolName} />}
        {tab === "media" && <MediaTab w={w} schoolName={schoolName} today={today} />}
        {tab === "wrapup" && <WrapUpTab w={w} patch={patch} canWrite={canWrite} />}
      </div>

      <WorkshopFormDrawer
        value={draft}
        onChange={(next) => setDraft(next as Rec)}
        onClose={() => setDraft(null)}
        onSaved={() => setDraft(null)}
        onDeleted={() => router.push("/hq/workshops")}
      />
    </div>
  );
}
