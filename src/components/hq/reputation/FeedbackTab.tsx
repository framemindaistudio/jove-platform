"use client";

import { MessageSquareHeart, Printer, Repeat, Star } from "lucide-react";
import type { BaseRecord } from "@/lib/hq/collections";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useLookup } from "@/components/hq/data";
import { EmptyState, Panel, StatCard } from "@/components/hq/ui";
import { isIso, shortDate } from "@/components/hq/printables/util";

interface Fb extends BaseRecord {
  respondent?: string;
  rating?: number | string;
  liked?: string;
  improve?: string;
  wouldRebook?: boolean;
  date?: string;
  workshopId?: string;
  name?: string;
}

const RESPONDENTS = ["Student", "Teacher", "Principal", "Parent", "Management"];
const rating = (r: Fb) => {
  const n = Number(r.rating);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmt = (n: number | null) => (n === null ? "–" : n.toFixed(1));

function Bar({ value, max = 5, label }: { value: number | null; max?: number; label: string }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-graphite/10" role="img" aria-label={label}>
      <div className="h-full rounded-full bg-graphite transition-[width] duration-700" style={{ width: `${value === null ? 0 : (value / max) * 100}%` }} />
    </div>
  );
}

function Analytics({ records }: { records: Fb[] }) {
  const workshops = useLookup("workshops");
  const rated = records.filter((r) => rating(r) !== null);
  const overall = avg(rated.map((r) => rating(r)!));
  const answered = records.filter((r) => typeof r.wouldRebook === "boolean");
  const rebook = answered.length ? Math.round((answered.filter((r) => r.wouldRebook).length / answered.length) * 100) : null;
  const staff = answered.filter((r) => ["Teacher", "Principal", "Management"].includes(String(r.respondent)));
  const staffRebook = staff.length ? Math.round((staff.filter((r) => r.wouldRebook).length / staff.length) * 100) : null;

  const byType = RESPONDENTS.map((t) => {
    const xs = rated.filter((r) => r.respondent === t).map((r) => rating(r)!);
    return { type: t, n: xs.length, avg: avg(xs) };
  });
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: rated.filter((r) => rating(r) === s).length }));
  const maxDist = Math.max(1, ...dist.map((d) => d.n));
  const recent = [...records]
    .filter((r) => String(r.liked ?? "").trim() || String(r.improve ?? "").trim())
    .sort((a, b) => String(b.date ?? b.createdAt ?? "").localeCompare(String(a.date ?? a.createdAt ?? "")))
    .slice(0, 6);

  return (
    <div className="mb-8 space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Average rating" value={overall === null ? "–" : `${fmt(overall)} / 5`} sub={`${rated.length} rated response${rated.length === 1 ? "" : "s"}`} icon={<Star className="size-4" />} progress={overall === null ? undefined : overall / 5} />
        <StatCard label="Would book again" value={rebook === null ? "–" : `${rebook}%`} sub={answered.length ? `${answered.length} answered` : "No answers yet"} icon={<Repeat className="size-4" />} progress={rebook === null ? undefined : rebook / 100} />
        <StatCard label="School staff would rebook" value={staffRebook === null ? "–" : `${staffRebook}%`} sub={staff.length ? `Teachers, principals, management (${staff.length})` : "Teachers & principals"} icon={<Repeat className="size-4" />} />
        <StatCard label="Responses" value={records.length} sub="All respondent types" icon={<MessageSquareHeart className="size-4" />} />
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon="MessageSquareHeart"
          title="No feedback recorded yet"
          description="After each JOVE Day, print the feedback forms, collect them, and enter the responses below. Results appear here automatically."
          action={<Button size="sm" href="/hq/printables" variant="secondary"><Printer className="size-4" /> Print feedback forms</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Rating by respondent" subtitle="Average out of 5">
            <ul className="space-y-3">
              {byType.map((t) => (
                <li key={t.type} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-charcoal">{t.type}</span>
                  <Bar value={t.avg} label={`${t.type}: ${fmt(t.avg)} out of 5`} />
                  <span className="w-16 shrink-0 text-right font-mono text-xs tabular">
                    {fmt(t.avg)} <span className="text-blueprint">({t.n})</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Rating spread" subtitle="How many gave each score">
            <ul className="space-y-3">
              {dist.map((d) => (
                <li key={d.s} className="flex items-center gap-3 text-sm">
                  <span className="flex w-10 shrink-0 items-center gap-1 font-mono text-xs">
                    {d.s} <Star className="size-3" aria-hidden />
                  </span>
                  <Bar value={d.n} max={maxDist} label={`${d.n} response${d.n === 1 ? "" : "s"} gave ${d.s} stars`} />
                  <span className="w-8 shrink-0 text-right font-mono text-xs tabular">{d.n}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent comments" subtitle="Latest words from the room">
            {recent.length ? (
              <ul className="space-y-3">
                {recent.map((r) => (
                  <li key={r.id} className="border-b border-dashed border-graphite/15 pb-3 text-sm last:border-0 last:pb-0">
                    <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-blueprint">
                      <Badge tone="outline">{r.respondent || "Respondent"}</Badge>
                      {rating(r) !== null && <span className="font-mono">{rating(r)}/5</span>}
                      {isIso(r.date) && <span>{shortDate(r.date)}</span>}
                      {r.workshopId && workshops.get(r.workshopId) && <span className="truncate">{String(workshops.get(r.workshopId)?.title ?? "")}</span>}
                    </p>
                    {String(r.liked ?? "").trim() && (
                      <p className="text-charcoal">
                        <span className="font-semibold text-graphite">Liked: </span>
                        {r.liked}
                      </p>
                    )}
                    {String(r.improve ?? "").trim() && (
                      <p className="mt-0.5 text-charcoal">
                        <span className="font-semibold text-graphite">To improve: </span>
                        {r.improve}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-blueprint">No written comments yet.</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

export function FeedbackTab() {
  const { records } = useCollection<Fb>("feedback");
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 px-4 py-3">
        <p className="text-sm text-charcoal">Collect feedback on paper in the hall, then key it in below. Print the forms for your next JOVE Day:</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" href="/hq/print/forms/student-feedback?version=smiley&pages=5" external>
            <Printer className="size-3.5" /> Student (Gr 1–5)
          </Button>
          <Button size="sm" variant="secondary" href="/hq/print/forms/student-feedback?version=short&pages=10" external>
            <Printer className="size-3.5" /> Student (Gr 6–10)
          </Button>
          <Button size="sm" variant="secondary" href="/hq/print/forms/teacher-feedback?pages=2" external>
            <Printer className="size-3.5" /> Teacher / principal
          </Button>
          <Button size="sm" variant="ghost" href="/hq/printables">
            All printables
          </Button>
        </div>
      </div>

      <Analytics records={records} />

      <CollectionManager<Fb> name="feedback" newLabel="Add response" emptyText="No responses yet. Add one here after collecting the forms." />
    </div>
  );
}
