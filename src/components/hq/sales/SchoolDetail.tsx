"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarPlus, CheckCircle2, FileSignature, Loader2, MapPin, MessageCircle, Mail, MonitorPlay, Pencil, Phone, Plus, StickyNote, Trash2, Users, type LucideIcon } from "lucide-react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { getCollection, invoiceTotals, SCHOOL_STAGES, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmButton } from "@/components/ui/Overlay";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { useCollection, useHq } from "@/components/hq/data";
import { EmptyState, KV, Loading, Panel } from "@/components/hq/ui";
import { cn, formatDate, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { BackLink, ContactButtons, FollowUpChip, Monogram, Notice } from "./bits";
import { introMessage, introSubject } from "./contact";
import { addDays, bandCounts, byDateDesc, initials, schoolStudents, schoolValue, stageIndex, stageLabel, str, todayIso, TRACK_STAGES } from "./crm";
import { packageName } from "./pricing";
import { SchoolFormDrawer } from "./SchoolFormDrawer";
import { useToday } from "./useToday";

const schoolsDef = getCollection("schools")!;
const activitiesDef = getCollection("activities")!;
const TYPE_OPTIONS = activitiesDef.fields.find((f) => f.key === "type")?.options ?? [];
const OUTCOME_OPTIONS = activitiesDef.fields.find((f) => f.key === "outcome")?.options ?? [];

const TYPE_ICON: Record<string, LucideIcon> = {
  Call: Phone,
  Visit: MapPin,
  Meeting: Users,
  Demo: MonitorPlay,
  Email: Mail,
  WhatsApp: MessageCircle,
  Proposal: FileSignature,
  Note: StickyNote,
};

const outcomeTone = (o: unknown) => (o === "Positive" ? "ok" : o === "Negative" ? "bad" : o === "No response" ? "warn" : "neutral");

export function SchoolDetail({ id }: { id: string }) {
  const { user, store } = useHq();
  const today = useToday();
  const schools = useCollection("schools");
  const activities = useCollection("activities");
  const proposals = useCollection("proposals");
  const workshops = useCollection("workshops");
  const invoices = useCollection("invoices");
  const canWrite = can(user, schoolsDef.write) && store.writable;

  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const school = schools.records.find((r) => r.id === id);
  const stage = str(school?.stage) || "lead";

  const timeline = useMemo(() => activities.records.filter((a) => a.schoolId === id).sort(byDateDesc("date")), [activities.records, id]);
  const related = useMemo(
    () => ({
      workshops: workshops.records.filter((w) => w.schoolId === id).sort((a, b) => str(a.date).localeCompare(str(b.date))),
      proposals: proposals.records.filter((p) => p.schoolId === id).sort(byDateDesc("date")),
      invoices: invoices.records.filter((i) => i.schoolId === id).sort(byDateDesc("date")),
    }),
    [workshops.records, proposals.records, invoices.records, id],
  );

  if (schools.loading) return <Loading label="Loading school…" />;
  if (!school) {
    return (
      <div>
        <BackLink href="/hq/crm">Schools CRM</BackLink>
        <EmptyState
          icon="School"
          title="School not found"
          description="It may have been deleted, or the link is out of date."
          action={
            <Button size="sm" href="/hq/crm">
              Back to the pipeline
            </Button>
          }
        />
      </div>
    );
  }

  const students = schoolStudents(school);
  const value = schoolValue(school);
  const bands = bandCounts(school);
  const sender = user.name;

  async function patchSchool(patch: Record<string, unknown>) {
    if (!school) return;
    setSaving(true);
    setError("");
    try {
      await schools.save({ ...school, ...patch });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the school");
    } finally {
      setSaving(false);
    }
  }

  function changeStage(next: string) {
    if (next === stage) return;
    if (next === "lost" || next === "nurture") {
      setReason(str(school?.lostReason));
      setPendingStage(next);
      return;
    }
    void patchSchool({ stage: next });
  }

  const outstanding = related.invoices
    .filter((i) => ["sent", "partially-paid", "overdue"].includes(str(i.status)))
    .reduce((s, i) => s + invoiceTotals(i).balance, 0);

  const meta = [school.city, school.area, school.board, school.schoolType].filter(Boolean).map(String);

  return (
    <div>
      <BackLink href="/hq/crm">Schools CRM</BackLink>

      {/* ── profile header ── */}
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)]">
        <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <CornerMarks />
        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Monogram text={initials(str(school.name))} className="size-14 text-base" />
              <div className="min-w-0">
                <p className="annot text-blueprint">School profile</p>
                <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-graphite sm:text-3xl">{str(school.name) || "Untitled school"}</h1>
                {meta.length > 0 && <p className="mt-1 text-sm text-charcoal">{meta.join(" · ")}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(stage)} dot>
                    {stageLabel(stage)}
                  </Badge>
                  {Array.isArray(school.interestedIn) && (school.interestedIn as string[]).map((p) => (
                    <Badge key={p} tone="outline">
                      {packageName(p)}
                    </Badge>
                  ))}
                  {Array.isArray(school.tags) && (school.tags as string[]).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-60">
              <div>
                <Label htmlFor="school-stage">Stage</Label>
                <Select id="school-stage" value={stage} onChange={(e) => changeStage(e.target.value)} disabled={!canWrite || saving}>
                  {SCHOOL_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
              {canWrite && (
                <Button variant="secondary" size="sm" className="h-10" onClick={() => setDraft({ ...school })}>
                  <Pencil className="size-4" aria-hidden /> Edit details
                </Button>
              )}
            </div>
          </div>

          <StageTrack stage={stage} />

          {(stage === "lost" || stage === "nurture") && (
            <Notice tone="warn" className="mt-5">
              <strong>{stageLabel(stage)}</strong>
              {school.lostReason ? ` — ${str(school.lostReason)}` : " — no reason recorded. Edit the school to add one."}
            </Notice>
          )}

          <div className="mt-6 flex flex-col gap-4 border-t border-dashed border-graphite/15 pt-5 md:flex-row md:items-center md:justify-between">
            <ContactButtons
              phone={school.phone}
              email={school.email}
              whatsappText={introMessage({ kind: "school", name: school.contactName, organisation: school.name, sender })}
              emailSubject={introSubject("school", school.name)}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="h-10" href={`/hq/proposals/new?school=${school.id}`}>
                <FileSignature className="size-4" aria-hidden /> Create proposal
              </Button>
              <Button variant="secondary" size="sm" className="h-10" href={`/hq/workshops?new=1&school=${school.id}`}>
                <CalendarPlus className="size-4" aria-hidden /> Schedule workshop
              </Button>
            </div>
          </div>
        </div>
      </section>

      {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
      {!canWrite && <Notice className="mt-4">{store.writable ? "You have view-only access to the CRM." : "HQ is in read-only mode — changes cannot be saved."}</Notice>}

      {/* ── KPI row ── */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite p-5 text-paper">
          <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="relative">
            <p className="annot text-paper/55">Deal value</p>
            <p className="tabular mt-3 text-[26px] font-bold leading-none tracking-tight">{value.value ? `${value.estimated ? "≈ " : ""}${formatINRCompact(value.value)}` : "—"}</p>
            <p className="mt-2 text-xs text-paper/60">{value.estimated ? "Estimated from student numbers" : value.value ? "Expected, ex-GST" : "Set on the school or via a proposal"}</p>
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5">
          <p className="annot text-blueprint">Students</p>
          <p className="tabular mt-3 text-[26px] font-bold leading-none tracking-tight">{students ? formatNumber(students) : "—"}</p>
          <p className="mt-2 text-xs text-charcoal">Grades 1–10 in scope</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5">
          <p className="annot text-blueprint">Last contact</p>
          <p className="mt-3 text-[22px] font-bold leading-none tracking-tight">{school.lastContact ? formatDate(str(school.lastContact), { year: undefined }) : "—"}</p>
          <p className="mt-2 text-xs text-charcoal">{timeline.length} logged activit{timeline.length === 1 ? "y" : "ies"}</p>
        </div>
        <FollowUpCard school={school} today={today} canWrite={canWrite} onSet={(d) => patchSchool({ nextFollowUp: d })} busy={saving} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── activity ── */}
        <div className="space-y-6">
          {canWrite && <ActivityLogger school={school} today={today} />}
          <Panel title="Activity timeline" subtitle={`${timeline.length} entr${timeline.length === 1 ? "y" : "ies"} · newest first`}>
            {timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-charcoal">Nothing logged yet. Record every call, visit and demo so the next conversation starts with context.</p>
            ) : (
              <ol className="relative space-y-0">
                {timeline.map((a, i) => (
                  <TimelineItem key={a.id} activity={a} last={i === timeline.length - 1} canWrite={canWrite} onDelete={() => activities.remove(a.id)} today={today} />
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* ── side column ── */}
        <aside className="space-y-6">
          <Panel title="Contact & profile">
            <div>
              <KV k="Key contact" v={[school.contactName, school.contactRole].filter(Boolean).map(String).join(" · ") || "—"} />
              <KV k="Principal" v={str(school.principalName) || "—"} />
              <KV k="Phone" v={school.phone ? <span className="tabular">{str(school.phone)}</span> : "—"} />
              <KV k="Email" v={school.email ? <span className="break-all">{str(school.email)}</span> : "—"} />
              <KV
                k="Website"
                v={
                  school.website ? (
                    <a href={/^https?:/i.test(str(school.website)) ? str(school.website) : `https://${str(school.website)}`} target="_blank" rel="noopener noreferrer" className="break-all underline-offset-4 hover:underline">
                      {str(school.website)}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <KV k="Address" v={<span className="whitespace-pre-line">{str(school.address) || "—"}</span>} />
              <KV k="Distance from base" v={Number(school.distanceKm) > 0 ? `${formatNumber(Number(school.distanceKm))} km` : "—"} />
              <KV k="Fee band" v={str(school.feeBand) || "—"} />
              <KV k="Source" v={str(school.source) || "—"} />
              <KV k="Owner" v={str(school.owner) || "—"} />
            </div>
            {school.notes ? (
              <div className="mt-4 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper px-3.5 py-3">
                <p className="annot mb-1 text-blueprint">Notes</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-graphite">{str(school.notes)}</p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Students by grade group" subtitle={students ? `${formatNumber(students)} students` : "No student numbers yet"}>
            <BandChart bands={bands} total={students} />
          </Panel>

          <Panel
            title="Proposals"
            action={
              <Link href={`/hq/proposals/new?school=${school.id}`} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold hover:bg-graphite/5 focus-visible:outline-2 focus-visible:outline-graphite">
                <Plus className="size-3.5" aria-hidden /> New
              </Link>
            }
          >
            {related.proposals.length === 0 ? (
              <p className="text-sm text-charcoal">No proposals yet.</p>
            ) : (
              <ul className="divide-y divide-graphite/10">
                {related.proposals.map((p) => (
                  <li key={p.id}>
                    <Link href={`/hq/proposals/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-graphite focus-visible:outline-2 focus-visible:outline-graphite">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{str(p.number) || "Draft proposal"}</span>
                        <span className="block truncate text-xs text-blueprint">
                          {packageName(p.packageId)} · {formatDate(str(p.date))}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tabular text-sm font-semibold">{Number(p.total) ? formatINR(Number(p.total)) : "—"}</span>
                        <Badge tone={statusTone(p.status || "draft")}>{str(p.status) || "draft"}</Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Workshops" action={<Link href={`/hq/workshops?new=1&school=${school.id}`} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold hover:bg-graphite/5 focus-visible:outline-2 focus-visible:outline-graphite"><Plus className="size-3.5" aria-hidden /> Schedule</Link>}>
            {related.workshops.length === 0 ? (
              <p className="text-sm text-charcoal">No workshops scheduled for this school.</p>
            ) : (
              <ul className="divide-y divide-graphite/10">
                {related.workshops.map((w) => (
                  <li key={w.id}>
                    <Link href="/hq/workshops" className="flex items-center justify-between gap-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-graphite">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{str(w.title) || "Workshop"}</span>
                        <span className="block text-xs text-blueprint">{formatDate(str(w.date))}</span>
                      </span>
                      <Badge tone={statusTone(w.status)}>{str(w.status) || "tentative"}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {can(user, getCollection("invoices")!.read) && (
            <Panel title="Invoices" subtitle={outstanding > 0 ? `${formatINR(outstanding)} outstanding` : related.invoices.length ? "Nothing outstanding" : undefined}>
              {related.invoices.length === 0 ? (
                <p className="text-sm text-charcoal">No invoices raised yet.</p>
              ) : (
                <ul className="divide-y divide-graphite/10">
                  {related.invoices.map((inv) => {
                    const t = invoiceTotals(inv);
                    return (
                      <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{str(inv.number) || "Invoice"}</span>
                          <span className="block text-xs text-blueprint">{formatDate(str(inv.date))}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="tabular font-semibold">{formatINR(t.total)}</span>
                          <span className="tabular text-xs text-charcoal">{t.balance > 0 ? `Balance ${formatINR(t.balance)}` : "Settled"}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          )}
        </aside>
      </div>

      <SchoolFormDrawer value={draft} onChange={setDraft} onClose={() => setDraft(null)} />

      <Modal
        open={!!pendingStage}
        onClose={() => setPendingStage(null)}
        title={pendingStage ? `Move to ${stageLabel(pendingStage)}` : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPendingStage(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!pendingStage) return;
                void patchSchool({ stage: pendingStage, lostReason: reason.trim() });
                setPendingStage(null);
              }}
            >
              Move school
            </Button>
          </>
        }
      >
        <p className="text-sm text-charcoal">What happened? The reason helps the next conversation.</p>
        <div className="mt-4">
          <Label htmlFor="stage-reason">Reason (optional)</Label>
          <Input id="stage-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={pendingStage === "lost" ? "e.g. Budget frozen this year" : "e.g. Revisit after exams in March"} autoFocus />
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── stage track ─────────────────────────── */

function StageTrack({ stage }: { stage: string }) {
  const idx = stageIndex(stage);
  const off = idx < 0;
  return (
    <ol className="mt-6 grid grid-cols-3 gap-y-3 sm:grid-cols-6" aria-label="Sales stage progress">
      {TRACK_STAGES.map((s, i) => {
        const done = !off && i < idx;
        const current = !off && i === idx;
        return (
          <li key={s} aria-current={current ? "step" : undefined} className="relative flex flex-col items-start gap-2 pr-2">
            <span className="flex w-full items-center gap-2">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[10px] font-semibold",
                  current ? "border-graphite bg-graphite text-paper" : done ? "border-graphite bg-graphite/10 text-graphite" : "border-graphite/25 bg-paper text-blueprint",
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" aria-hidden /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className={cn("hidden h-px flex-1 sm:block", done ? "bg-graphite" : "bg-graphite/20")} aria-hidden />
            </span>
            <span className={cn("text-xs", current ? "font-bold text-graphite" : done ? "font-medium text-charcoal" : "text-blueprint")}>{stageLabel(s)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────────── follow-up card ─────────────────────────── */

function FollowUpCard({ school, today, canWrite, onSet, busy }: { school: BaseRecord; today: string; canWrite: boolean; onSet: (date: string) => void; busy: boolean }) {
  const base = today || todayIso();
  const presets: [string, number][] = [
    ["Tomorrow", 1],
    ["+3 days", 3],
    ["+1 week", 7],
  ];
  return (
    <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5">
      <p className="annot text-blueprint">Next follow-up</p>
      <div className="mt-3 min-h-[26px]">
        <FollowUpChip date={school.nextFollowUp} today={today} empty={<span className="text-[22px] font-bold leading-none text-graphite">—</span>} className="text-sm" />
      </div>
      {canWrite ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {presets.map(([label, n]) => (
            <button
              key={label}
              type="button"
              disabled={busy}
              onClick={() => onSet(addDays(base, n))}
              className="rounded-full border border-graphite/20 px-2.5 py-1 text-[11px] font-semibold text-charcoal transition-colors hover:border-graphite hover:bg-graphite hover:text-paper focus-visible:outline-2 focus-visible:outline-graphite disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-charcoal">{school.nextFollowUp ? "Scheduled" : "None scheduled"}</p>
      )}
    </div>
  );
}

/* ─────────────────────────── students-by-band mini chart ─────────────────────────── */

function BandChart({ bands, total }: { bands: ReturnType<typeof bandCounts>; total: number }) {
  const max = Math.max(1, ...bands.map((b) => b.students));
  const split = bands.reduce((s, b) => s + b.students, 0);
  if (!total) return <p className="text-sm text-charcoal">Add student counts per grade group (Edit details) to see the split and a price estimate.</p>;
  return (
    <div>
      <ul className="space-y-3">
        {bands.map(({ band, students }) => (
          <li key={band.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-graphite">
                {band.name} <span className="text-blueprint">· {band.grades}</span>
              </span>
              <span className="tabular font-semibold">{students ? formatNumber(students) : "—"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-graphite/10" role="img" aria-label={`${band.grades}: ${students} students`}>
              <div className="hatch-dense h-full rounded-full bg-graphite" style={{ width: `${(students / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {split === 0 && <p className="mt-3 text-xs text-blueprint">Only a total is recorded ({formatNumber(total)}). Add the grade split for an exact quote.</p>}
    </div>
  );
}

/* ─────────────────────────── timeline ─────────────────────────── */

function TimelineItem({ activity: a, last, canWrite, onDelete, today }: { activity: BaseRecord; last: boolean; canWrite: boolean; onDelete: () => Promise<unknown>; today: string }) {
  const Icon = TYPE_ICON[str(a.type)] ?? StickyNote;
  const [busy, setBusy] = useState(false);
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-graphite/15" aria-hidden />}
      <span className="relative grid size-8 shrink-0 place-items-center rounded-full border border-graphite/25 bg-paper text-graphite">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-semibold text-graphite">{str(a.type) || "Note"}</span>
          <span className="tabular text-xs text-blueprint">{formatDate(str(a.date))}</span>
          {a.outcome ? <Badge tone={outcomeTone(a.outcome)}>{str(a.outcome)}</Badge> : null}
          {a.by ? <span className="text-xs text-blueprint">· {str(a.by)}</span> : null}
          {canWrite && (
            <ConfirmButton
              onConfirm={() => {
                setBusy(true);
                onDelete().catch(() => setBusy(false));
              }}
              message="Delete this activity? It stays in the change history."
              className="ml-auto rounded p-1 text-blueprint transition-colors hover:bg-bad/10 hover:text-bad focus-visible:outline-2 focus-visible:outline-bad"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />}
              <span className="sr-only">Delete activity</span>
            </ConfirmButton>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-graphite">{str(a.summary)}</p>
        {a.details ? <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-charcoal">{str(a.details)}</p> : null}
        {!!(a.nextStep || a.nextDate) && (
          <p className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] bg-graphite/[0.05] px-2.5 py-1.5 text-xs text-charcoal">
            <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            <span>
              Next: <strong className="font-semibold text-graphite">{str(a.nextStep) || "Follow up"}</strong>
            </span>
            {a.nextDate ? <FollowUpChip date={a.nextDate} today={today} /> : null}
          </p>
        )}
      </div>
    </li>
  );
}

/* ─────────────────────────── quick log form ─────────────────────────── */

function ActivityLogger({ school, today }: { school: BaseRecord; today: string }) {
  const { user } = useHq();
  const activities = useCollection("activities");
  const schools = useCollection("schools");
  const [type, setType] = useState("Call");
  const [date, setDate] = useState("");
  const [outcome, setOutcome] = useState("Positive");
  const [summary, setSummary] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const effectiveDate = date || today;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Add a one-line summary of what happened.");
      return;
    }
    setBusy(true);
    setError("");
    setDone("");
    try {
      const d = effectiveDate || todayIso();
      await activities.save({
        schoolId: school.id,
        type,
        date: d,
        summary: summary.trim(),
        outcome,
        nextStep: nextStep.trim(),
        nextDate,
        by: user.name,
      });
      const lastContact = !school.lastContact || d >= str(school.lastContact) ? d : school.lastContact;
      const movedToContacted = str(school.stage || "lead") === "lead" && type !== "Note";
      await schools.save({
        ...school,
        lastContact,
        ...(nextDate ? { nextFollowUp: nextDate } : {}),
        ...(movedToContacted ? { stage: "contacted" } : {}),
      });
      setSummary("");
      setNextStep("");
      setNextDate("");
      setDate("");
      setDone(movedToContacted ? "Logged — the school moved to Contacted." : "Logged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log the activity");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Log an activity" subtitle="Calls, visits, demos — keep the thread alive">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Label htmlFor="act-type">Type</Label>
          <Select id="act-type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="act-date">Date</Label>
          <Input id="act-date" type="date" value={effectiveDate} onChange={(e) => setDate(e.target.value)} className="tabular" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="act-outcome">Outcome</Label>
          <Select id="act-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-6">
          <Label htmlFor="act-summary">What happened?</Label>
          <Textarea id="act-summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Spoke to the principal — keen on a JOVE Day in November for Grades 3–8" />
        </div>
        <div className="sm:col-span-4">
          <Label htmlFor="act-next">Next step</Label>
          <Input id="act-next" value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="e.g. Send proposal, book a demo visit" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="act-next-date">Next step date</Label>
          <Input id="act-next-date" type="date" value={nextDate} min={effectiveDate || undefined} onChange={(e) => setNextDate(e.target.value)} className="tabular" />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
          <Button type="submit" size="sm" className="h-10" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />} Log activity
          </Button>
          <p className="text-xs text-blueprint">Sets “Last contact”, and moves “Next follow-up” when you add a next step date.</p>
        </div>
        {error && <Notice tone="bad" className="sm:col-span-6">{error}</Notice>}
        {done && <Notice tone="ok" className="sm:col-span-6">{done}</Notice>}
      </form>
    </Panel>
  );
}

