"use client";

import { useMemo, useState } from "react";
import { Award, CheckCircle2, FileText, Loader2, Printer, Save, Star } from "lucide-react";
import { can, OPS } from "@/lib/hq/roles";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/form";
import { formatINR, formatNumber } from "@/lib/utils";
import { useCollection, useHq } from "@/components/hq/data";
import { KV, Panel } from "@/components/hq/ui";
import { workshopEconomics } from "@/lib/content/business";
import { CHECKLIST, checklistOf, longDate, money, num, optionLabel, phaseProgress, str, studentsOf, bookedBands, tripCost, WORKSHOP_STATUS, type Rec } from "./logic";
import { Notice, ProgressBar } from "./bits";
import type { PatchFn } from "./useWorkshopDoc";

function reportTemplate(w: Rec) {
  const bands = bookedBands(w)
    .map((b) => b.grades)
    .join(", ");
  return `Post-workshop report — ${str(w.title)} (${longDate(str(w.date))})

Attendance: ${studentsOf(w)} students${bands ? ` across ${bands}` : ""}
Team on site:

What went well:
-

What to improve next time:
-

Incidents, damages or kit losses:
-

Kits returned & condition:
-

Media captured (reels, film, drone, interview):
-

School feedback in one line:

Next step with the school (JOVE Quarter / Year / Club):
`;
}

export function WrapUpTab({ w, patch, canWrite }: { w: Rec; patch: PatchFn; canWrite: boolean }) {
  const { user } = useHq();
  const canMoney = can(user, OPS);
  const feedbackQ = useCollection("feedback");
  const expensesQ = useCollection(canMoney ? "expenses" : "__none");
  const tripsQ = useCollection(canMoney ? "trips" : "__none");
  const [text, setText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const responses = useMemo(() => feedbackQ.records.filter((f) => f.workshopId === w.id), [feedbackQ.records, w.id]);
  const rated = responses.filter((f) => num(f.rating) > 0);
  const avg = rated.length ? rated.reduce((s, f) => s + num(f.rating), 0) / rated.length : null;
  const rebook = responses.filter((f) => f.wouldRebook).length;
  const byRespondent = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of responses) m.set(str(f.respondent) || "Other", (m.get(str(f.respondent) || "Other") ?? 0) + 1);
    return [...m.entries()];
  }, [responses]);

  const spent = useMemo(() => expensesQ.records.filter((e) => e.workshopId === w.id).reduce((s, e) => s + num(e.amount), 0), [expensesQ.records, w.id]);
  const tripSpend = useMemo(() => tripsQ.records.filter((t) => t.workshopId === w.id && str(t.status) !== "cancelled").reduce((s, t) => s + tripCost(t).total, 0), [tripsQ.records, w.id]);

  const m = money(w);
  const students = studentsOf(w);
  const econ = students ? workshopEconomics(students, m.basis / students) : null;
  const post = phaseProgress(checklistOf(w), CHECKLIST[CHECKLIST.length - 1]);
  const report = text ?? str(w.report);
  const dirty = text !== null && text !== str(w.report);
  const completed = str(w.status) === "completed";

  async function saveReport() {
    if (text === null) return;
    setSaving(true);
    await patch({ report: text }, { immediate: true });
    setText(null);
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Close-out actions" subtitle={`Post-workshop checklist ${post.done}/${post.total}`} className="lg:col-span-1">
          <ProgressBar value={post.pct} className="mb-4" label="Post-workshop checklist" />
          <div className="flex flex-col gap-2.5">
            <Button href={`/hq/finance?tab=invoices&new=1&workshop=${w.id}`} variant="secondary" size="md" className="justify-start">
              <FileText className="size-4" aria-hidden /> Create invoice
            </Button>
            <Button href={`/hq/certificates?workshop=${w.id}`} variant="secondary" size="md" className="justify-start">
              <Award className="size-4" aria-hidden /> Issue certificates
            </Button>
            <a href={`/hq/print/attendance/${w.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-graphite px-5 text-sm font-semibold hover:bg-graphite hover:text-paper">
              <Printer className="size-4" aria-hidden /> Attendance sheets
            </a>
            {canWrite && !completed && (
              <Button size="md" className="justify-start" onClick={() => patch({ status: "completed" }, { immediate: true })}>
                <CheckCircle2 className="size-4" aria-hidden /> Mark workshop completed
              </Button>
            )}
            {completed && (
              <p className="flex items-center gap-2 text-sm text-ok">
                <CheckCircle2 className="size-4" aria-hidden /> Completed · {optionLabel(WORKSHOP_STATUS, w.status)}
              </p>
            )}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-blueprint">Invoice amounts follow the agreed value and the advance recorded on Overview. Certificates need the student name list from the school.</p>
        </Panel>

        <Panel title="Feedback" subtitle="From the feedback log for this workshop" className="lg:col-span-1">
          {feedbackQ.loading ? (
            <p className="text-sm text-blueprint">Loading…</p>
          ) : responses.length ? (
            <>
              <div className="flex items-end gap-3">
                <p className="tabular font-mono text-4xl font-bold leading-none">{avg === null ? "—" : avg.toFixed(1)}</p>
                <div className="pb-0.5">
                  <p className="flex gap-0.5" aria-label={avg === null ? "No ratings yet" : `Average rating ${avg.toFixed(1)} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`size-4 ${avg !== null && avg >= n - 0.25 ? "fill-graphite text-graphite" : "text-graphite/25"}`} aria-hidden />
                    ))}
                  </p>
                  <p className="mt-1 text-xs text-blueprint">
                    {rated.length} rating{rated.length === 1 ? "" : "s"} · {responses.length} response{responses.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <KV k="Would book again / recommend" v={`${rebook} of ${responses.length}`} />
                {byRespondent.map(([k, n]) => (
                  <KV key={k} k={k} v={n} />
                ))}
              </div>
              {canWrite && avg !== null && num(w.feedbackScore) !== Math.round(avg * 10) / 10 && (
                <button type="button" className="mt-3 text-xs font-semibold underline-offset-2 hover:underline" onClick={() => patch({ feedbackScore: Math.round(avg * 10) / 10 }, { immediate: true })}>
                  Save {avg.toFixed(1)} as this workshop’s average
                </button>
              )}
              {num(w.feedbackScore) > 0 && <p className="mt-2 text-xs text-blueprint">Saved on workshop: {num(w.feedbackScore)} / 5</p>}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-blueprint">No feedback logged yet. Collect the student, teacher and principal forms on the day, then enter them in Reputation → Feedback and pick this workshop.</p>
          )}
        </Panel>

        <Panel title="Economics" subtitle="Plan from the JOVE Day cost model vs expenses logged" className="lg:col-span-1">
          {econ ? (
            <>
              <KV k="Revenue (ex-GST)" v={<span className="tabular font-mono">{formatINR(m.basis)}</span>} />
              <KV k="Planned costs" v={<span className="tabular font-mono">{formatINR(Math.round(econ.variable))}</span>} />
              <KV k="Planned contribution" v={<span className="tabular font-mono font-bold">{formatINR(Math.round(econ.contribution))}</span>} />
              {canMoney && (
                <>
                  <KV k="Expenses logged" v={<span className="tabular font-mono">{formatINR(spent)}</span>} />
                  <KV k="Trip costs recorded" v={<span className="tabular font-mono">{formatINR(tripSpend)}</span>} />
                </>
              )}
              <p className="mt-3 text-xs leading-relaxed text-blueprint">Planned margin {econ.marginPct}% at {formatNumber(students)} students. Actuals depend on every expense being logged against this workshop.</p>
            </>
          ) : (
            <p className="text-sm text-blueprint">Add student counts to see the plan.</p>
          )}
        </Panel>
      </div>

      <Panel
        title="Post-workshop report"
        subtitle={w.date ? `${longDate(str(w.date))} · sent to management within a day of the workshop` : undefined}
        action={
          canWrite && (
            <div className="flex gap-1.5">
              {!report.trim() && (
                <Button size="sm" variant="ghost" onClick={() => setText(reportTemplate(w))}>
                  Insert template
                </Button>
              )}
              <Button size="sm" onClick={saveReport} disabled={!dirty || saving}>
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save report
              </Button>
            </div>
          )
        }
      >
        <label htmlFor="wrapup-report" className="sr-only">
          Post-workshop report
        </label>
        <Textarea id="wrapup-report" rows={14} value={report} readOnly={!canWrite} onChange={(e) => setText(e.target.value)} placeholder="What went well, what to improve, incidents, kit condition, media captured, the school's reaction, next step…" className="font-mono text-[13px]" />
        {dirty && <p className="mt-2 text-xs text-warn">Unsaved changes.</p>}
        {!dirty && str(w.report) && <p className="mt-2 flex items-center gap-1.5 text-xs text-blueprint"><Badge tone="ok">Saved</Badge> on this workshop</p>}
      </Panel>
      {!canWrite && <Notice>You have view-only access to workshops.</Notice>}
    </div>
  );
}
