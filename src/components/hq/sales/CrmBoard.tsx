"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, Loader2, Plus, Search, Table2, Users } from "lucide-react";
import { getCollection, SCHOOL_STAGES, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { targets } from "@/lib/content/business";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { Input, Label } from "@/components/ui/form";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { Kanban } from "@/components/hq/Kanban";
import { EmptyState, Loading, PageHeader, StatCard } from "@/components/hq/ui";
import { cn, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { followUpState, OPEN_STAGES, schoolStudents, schoolValue, stageLabel, stageProbability, str, TRACK_STAGES } from "./crm";
import { FollowUpChip, Notice, Segmented } from "./bits";
import { newSchoolDraft, SchoolFormDrawer } from "./SchoolFormDrawer";
import { useToday } from "./useToday";

const schoolsDef = getCollection("schools")!;

export type CrmView = "pipeline" | "table";

const withStage = (r: BaseRecord) => (r.stage ? r : { ...r, stage: "lead" });

export function CrmBoard({ initialView }: { initialView: CrmView }) {
  const router = useRouter();
  const today = useToday();
  const { user, store } = useHq();
  const { records, loading, error, save } = useCollection("schools");
  const canWrite = can(user, schoolsDef.write) && store.writable;

  const [view, setView] = useState<CrmView>(initialView);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [pendingMove, setPendingMove] = useState<{ school: BaseRecord; stage: string } | null>(null);
  const [reason, setReason] = useState("");
  const [moving, setMoving] = useState<string | null>(null);
  const [moveError, setMoveError] = useState("");

  const schools = useMemo(() => records.map(withStage), [records]);

  /* ── header stats ── */
  const stats = useMemo(() => {
    const perStage = SCHOOL_STAGES.map((s) => {
      const list = schools.filter((r) => r.stage === s.value);
      const amount = list.reduce((acc, r) => acc + schoolValue(r).value, 0);
      return { ...s, count: list.length, amount, weighted: amount * stageProbability(s.value) };
    });
    const get = (v: string) => perStage.find((s) => s.value === v)!;
    const open = perStage.filter((s) => (OPEN_STAGES as string[]).includes(s.value));
    const openCount = open.reduce((a, s) => a + s.count, 0);
    const openValue = open.reduce((a, s) => a + s.amount, 0);
    const won = get("won");
    const lost = get("lost");
    const decided = won.count + lost.count;
    const forecast = perStage.reduce((a, s) => a + s.weighted, 0);
    const active = schools.filter((r) => r.stage !== "lost");
    const overdue = active.filter((r) => followUpState(r.nextFollowUp, today) === "overdue").length;
    const dueToday = active.filter((r) => followUpState(r.nextFollowUp, today) === "today").length;
    return { perStage, openCount, openValue, won, lost, conversion: decided ? won.count / decided : 0, decided, forecast, overdue, dueToday };
  }, [schools, today]);

  /* ── pipeline search ── */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return schools;
    return schools.filter((r) => [r.name, r.city, r.area, r.contactName, r.owner, r.board, ...(Array.isArray(r.tags) ? r.tags : [])].some((v) => str(v).toLowerCase().includes(s)));
  }, [schools, q]);

  function changeView(v: CrmView) {
    setView(v);
    router.replace(v === "table" ? "/hq/crm?view=table" : "/hq/crm", { scroll: false });
  }

  async function move(school: BaseRecord, stage: string, lostReason?: string) {
    setMoving(school.id);
    setMoveError("");
    try {
      await save({ ...school, stage, ...(lostReason !== undefined ? { lostReason } : {}) });
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "Could not move the school");
    } finally {
      setMoving(null);
    }
  }

  function onMove(school: BaseRecord, stage: string) {
    if (stage === "lost" || stage === "nurture") {
      setReason(str(school.lostReason));
      setPendingMove({ school, stage });
      return;
    }
    void move(school, stage);
  }

  const tableColumns: ExtraColumn<BaseRecord>[] = useMemo(
    () => [
      {
        key: "students",
        label: "Students",
        className: "text-right",
        sortValue: (r) => schoolStudents(r),
        render: (r) => <span className="tabular block text-right">{schoolStudents(r) ? formatNumber(schoolStudents(r)) : "—"}</span>,
      },
      {
        key: "dealValue",
        label: "Deal value",
        className: "text-right",
        sortValue: (r) => schoolValue(r).value,
        render: (r) => {
          const v = schoolValue(r);
          return (
            <span className="tabular block whitespace-nowrap text-right" title={v.estimated ? "Estimated from student numbers" : undefined}>
              {v.value ? `${v.estimated ? "≈ " : ""}${formatINR(v.value)}` : "—"}
            </span>
          );
        },
      },
      {
        key: "nextFollowUp",
        label: "Next follow-up",
        sortValue: (r) => str(r.nextFollowUp) || "9999",
        render: (r) => <FollowUpChip date={r.nextFollowUp} today={today} />,
      },
    ],
    [today],
  );

  const monthlyTarget = targets.monthlyRevenue;

  return (
    <div>
      <PageHeader
        eyebrow="Sales · 02"
        title="Schools CRM"
        icon="School"
        description="Every school from first lead to long-term partner. Drag cards between stages; open a school for its full timeline."
        actions={
          <>
            <Segmented
              label="View"
              value={view}
              onChange={changeView}
              options={[
                { value: "pipeline", label: (<><Columns3 className="size-3.5" aria-hidden /> Pipeline</>) },
                { value: "table", label: (<><Table2 className="size-3.5" aria-hidden /> Table</>) },
              ]}
            />
            {canWrite && (
              <Button size="sm" className="h-9" onClick={() => setDraft(newSchoolDraft({ owner: user.name }))}>
                <Plus className="size-4" aria-hidden /> New school
              </Button>
            )}
          </>
        }
      />

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open pipeline" value={formatINRCompact(stats.openValue)} sub={`${formatNumber(stats.openCount)} school${stats.openCount === 1 ? "" : "s"} being worked`} />
        <StatCard
          tone="dark"
          label="Weighted forecast"
          value={formatINRCompact(stats.forecast)}
          sub={`≈ ${(stats.forecast / monthlyTarget).toFixed(1)} months of the ${formatINRCompact(monthlyTarget)} monthly target`}
        />
        <StatCard
          label="Conversion rate"
          value={stats.decided ? `${Math.round(stats.conversion * 100)}%` : "—"}
          sub={stats.decided ? `${stats.won.count} won · ${stats.lost.count} lost` : "Shown once deals are won or lost"}
          progress={stats.decided ? stats.conversion : undefined}
        />
        <StatCard
          label="Follow-ups due"
          value={formatNumber(stats.overdue + stats.dueToday)}
          sub={stats.overdue ? <span className="font-semibold text-bad">{stats.overdue} overdue</span> : stats.dueToday ? `${stats.dueToday} today` : "Nothing overdue"}
        />
      </div>

      {/* stage strip */}
      <section aria-label="Pipeline by stage" className="relative mb-6 overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
        <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <ol className="relative -mb-px -mr-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {TRACK_STAGES.map((id, i) => {
            const s = stats.perStage.find((x) => x.value === id)!;
            const share = stats.forecast ? s.weighted / stats.forecast : 0;
            return (
              <li key={id} className="relative border-b border-r border-graphite/10 px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="annot text-[10px] text-blueprint">
                    <span className="font-mono">{String(i + 1).padStart(2, "0")}</span> {s.label}
                  </span>
                  <span className="font-mono text-[10px] text-blueprint">{Math.round(stageProbability(id) * 100)}%</span>
                </div>
                <p className="tabular mt-1.5 text-lg font-bold leading-none text-graphite">{formatINRCompact(s.amount)}</p>
                <p className="mt-1 text-xs text-charcoal">
                  {s.count} school{s.count === 1 ? "" : "s"}
                </p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-graphite/10" aria-hidden>
                  <div className="h-full rounded-full bg-graphite transition-[width] duration-700" style={{ width: `${Math.round(share * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-graphite/10 px-4 py-2 text-xs text-blueprint">
          <span>Bars show each stage&apos;s share of the weighted forecast.</span>
          <span className="ml-auto">
            Lost <strong className="tabular text-charcoal">{stats.perStage.find((s) => s.value === "lost")?.count ?? 0}</strong> · Nurture{" "}
            <strong className="tabular text-charcoal">{stats.perStage.find((s) => s.value === "nurture")?.count ?? 0}</strong>
          </span>
        </div>
      </section>

      {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
      {moveError && <Notice tone="bad" className="mb-4">{moveError}</Notice>}

      {view === "pipeline" ? (
        loading ? (
          <Loading />
        ) : !schools.length ? (
          <EmptyState
            icon="School"
            title="No schools in the pipeline yet"
            description="Add schools you are approaching, or convert website enquiries from the Leads inbox."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {canWrite && (
                  <Button size="sm" onClick={() => setDraft(newSchoolDraft({ owner: user.name }))}>
                    <Plus className="size-4" aria-hidden /> Add a school
                  </Button>
                )}
                <Button variant="secondary" size="sm" href="/hq/leads">
                  Open leads inbox
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter cards…" aria-label="Filter pipeline cards" className="pl-9" />
              </div>
              <p className="text-xs text-blueprint">{canWrite ? "Drag a card to change its stage · click to open" : "Click a card to open the school"}</p>
              {moving && (
                <span className="inline-flex items-center gap-1.5 text-xs text-charcoal">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving…
                </span>
              )}
            </div>
            <Kanban
              records={filtered}
              field="stage"
              columns={SCHOOL_STAGES}
              disabled={!canWrite}
              onMove={onMove}
              onOpen={(r) => router.push(`/hq/crm/${r.id}`)}
              columnFooter={(stage, items) => {
                const value = items.reduce((a, r) => a + schoolValue(r).value, 0);
                return (
                  <span className="flex items-center justify-between gap-2">
                    <span className="tabular font-semibold text-charcoal">{formatINRCompact(value)}</span>
                    <span className="tabular">weighted {formatINRCompact(value * stageProbability(stage))}</span>
                  </span>
                );
              }}
              renderCard={(r) => <SchoolCard school={r} today={today} busy={moving === r.id} />}
            />
          </>
        )
      ) : (
        <CollectionManager
          name="schools"
          columns={["name", "stage", "city", "contactName", "phone"]}
          extraColumns={tableColumns}
          hideNew
          onOpen={(r) => router.push(`/hq/crm/${r.id}`)}
          emptyText="Add schools you are approaching, or convert website enquiries from the Leads inbox."
        />
      )}

      <SchoolFormDrawer value={draft} onChange={setDraft} onClose={() => setDraft(null)} onSaved={(rec, isNew) => isNew && router.push(`/hq/crm/${rec.id}`)} />

      <Modal
        open={!!pendingMove}
        onClose={() => setPendingMove(null)}
        title={pendingMove ? `Move to ${stageLabel(pendingMove.stage)}` : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPendingMove(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!pendingMove) return;
                void move(pendingMove.school, pendingMove.stage, reason.trim());
                setPendingMove(null);
              }}
            >
              Move school
            </Button>
          </>
        }
      >
        {pendingMove && (
          <div>
            <p className="text-sm text-charcoal">
              <strong className="text-graphite">{str(pendingMove.school.name)}</strong> will move to <Badge tone={statusTone(pendingMove.stage)}>{stageLabel(pendingMove.stage)}</Badge>. What happened? The reason helps the next conversation.
            </p>
            <div className="mt-4">
              <Label htmlFor="move-reason">Reason (optional)</Label>
              <Input id="move-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={pendingMove.stage === "lost" ? "e.g. Budget frozen this year, chose another vendor" : "e.g. Revisit after exams in March"} autoFocus />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SchoolCard({ school, today, busy }: { school: BaseRecord; today: string; busy: boolean }) {
  const students = schoolStudents(school);
  const v = schoolValue(school);
  const meta = [school.city, school.board].filter(Boolean).map(String).join(" · ");
  return (
    <div className={cn("relative", busy && "opacity-60")}>
      <Link
        href={`/hq/crm/${school.id}`}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        className="line-clamp-2 font-semibold leading-snug text-graphite hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
      >
        {str(school.name) || "Untitled school"}
      </Link>
      {meta && <p className="mt-0.5 truncate text-xs text-blueprint">{meta}</p>}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-graphite/12 pt-2.5 text-xs">
        <span className="tabular inline-flex items-center gap-1 text-charcoal" title="Students">
          <Users className="size-3.5" aria-hidden />
          {students ? formatNumber(students) : "—"}
          <span className="sr-only"> students</span>
        </span>
        <span className="tabular font-semibold text-graphite" title={v.estimated ? "Estimated from student numbers" : "Expected deal value"}>
          {v.value ? `${v.estimated ? "≈ " : ""}${formatINRCompact(v.value)}` : "—"}
        </span>
      </div>
      <div className="mt-2">
        <FollowUpChip date={school.nextFollowUp} today={today} empty={<span className="text-[11px]">No follow-up set</span>} />
      </div>
    </div>
  );
}
