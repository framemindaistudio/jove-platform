"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can, OPS_MEDIA } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { useCollection, useHq } from "@/components/hq/data";
import { Loading } from "@/components/hq/ui";
import { isIso, parseIso, toIso } from "@/components/hq/printables/util";
import { useThisMonth, useToday } from "@/components/hq/printables/hooks";
import { cn } from "@/lib/utils";
import { RecordDrawer, blankRecord } from "./RecordDrawer";

interface Post extends BaseRecord {
  date?: string;
  platform?: string;
  format?: string;
  title?: string;
  status?: string;
  owner?: string;
}

const PLATFORMS: Record<string, { code: string; box: string }> = {
  Instagram: { code: "IG", box: "bg-graphite text-paper" },
  YouTube: { code: "YT", box: "bg-charcoal text-paper" },
  LinkedIn: { code: "IN", box: "bg-blueprint text-paper" },
  Facebook: { code: "FB", box: "border border-graphite text-graphite" },
  WhatsApp: { code: "WA", box: "border border-graphite text-graphite" },
  X: { code: "X", box: "border border-graphite text-graphite" },
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LIVE = ["published"];

const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const shiftMonth = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  return monthKeyOf(new Date(y, m - 1 + n, 1));
};

function Chip({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const p = PLATFORMS[String(post.platform)] ?? { code: "··", box: "border border-graphite/40 text-charcoal" };
  const status = String(post.status ?? "idea");
  const published = LIVE.includes(status);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Edit post: ${post.title ?? "Untitled"} (${post.platform ?? "platform not set"} ${post.format ?? ""}, ${status})`}
      title={`${post.title ?? ""}${post.format ? ` · ${post.format}` : ""} · ${status}`}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-[3px] border bg-paper px-1 py-[3px] text-left text-[11px] leading-tight transition-colors hover:border-graphite hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-1",
        status === "idea" ? "border-dashed border-graphite/35" : "border-graphite/25",
        published && "bg-graphite/[0.06]",
      )}
    >
      <span className={cn("grid h-4 min-w-5 shrink-0 place-items-center rounded-[2px] px-0.5 font-mono text-[9px] font-bold", p.box)}>{p.code}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{post.title || "Untitled"}</span>
      {published && <Check className="size-3 shrink-0" aria-hidden />}
    </button>
  );
}

export function ContentCalendar() {
  const { records, loading, error } = useCollection<Post>("contentCalendar");
  const { user } = useHq();
  const canWrite = can(user, OPS_MEDIA);
  const nowMonth = useThisMonth();
  const today = useToday();
  const [picked, setMonth] = useState<string | null>(null);
  const month = picked ?? (nowMonth || null);
  const [platform, setPlatform] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const platformOptions = useMemo(() => getCollection("contentCalendar")?.fields.find((f) => f.key === "platform")?.options ?? [], []);
  const visible = useMemo(() => records.filter((r) => isIso(r.date) && (!platform || r.platform === platform)), [records, platform]);
  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const r of visible) {
      const k = String(r.date).slice(0, 10);
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return map;
  }, [visible]);
  const undated = records.filter((r) => !isIso(r.date)).length;

  const cells = useMemo(() => {
    if (!month) return [];
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(y, m, 0).getDate();
    const total = Math.ceil((offset + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(y, m - 1, 1 - offset + i);
      return { iso: toIso(d), day: d.getDate(), inMonth: d.getMonth() === m - 1, weekend: d.getDay() === 0 || d.getDay() === 6 };
    });
  }, [month]);

  const monthPosts = month ? visible.filter((r) => String(r.date).startsWith(month)) : [];
  const counts = monthPosts.reduce<Record<string, number>>((acc, r) => ({ ...acc, [String(r.status ?? "idea")]: (acc[String(r.status ?? "idea")] ?? 0) + 1 }), {});
  const label = month ? parseIso(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "";

  if (loading) return <Loading />;

  const newPost = (date?: string) => setEditing(blankRecord("contentCalendar", { date: date || today || undefined, owner: "Chinmay R M" }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => month && setMonth(shiftMonth(month, -1))} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-40 text-center text-lg font-bold tracking-[-0.02em]" aria-live="polite">
            {label || "…"}
          </h2>
          <Button variant="secondary" size="sm" onClick={() => month && setMonth(shiftMonth(month, 1))} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMonth(monthKeyOf(new Date()))}>
          Today
        </Button>
        <div className="w-40">
          <Select aria-label="Filter by platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-8 text-xs">
            <option value="">All platforms</option>
            {platformOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        {canWrite && (
          <Button size="sm" className="ml-auto" onClick={() => newPost()}>
            <Plus className="size-4" /> New post
          </Button>
        )}
      </div>

      <p className="mb-3 text-xs text-charcoal" aria-live="polite">
        {monthPosts.length ? (
          <>
            <strong>{monthPosts.length}</strong> post{monthPosts.length === 1 ? "" : "s"} this month
            {Object.entries(counts).map(([s, n]) => ` · ${n} ${s}`)}
          </>
        ) : (
          "Nothing planned this month."
        )}
        {undated > 0 && ` · ${undated} post${undated === 1 ? "" : "s"} without a date (see the Posts tab)`}
      </p>

      {error && <p className="mb-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

      <div className="hq-scroll overflow-x-auto rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50" data-lenis-prevent>
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-graphite/15 bg-graphite/[0.04]" aria-hidden>
            {WEEKDAYS.map((d) => (
              <div key={d} className="annot px-2 py-2 text-[10px] text-blueprint">
                {d}
              </div>
            ))}
          </div>
          {month ? (
            <ol className="grid grid-cols-7">
              {cells.map((c) => {
                const posts = byDay.get(c.iso) ?? [];
                const open = expanded === c.iso;
                const shown = open ? posts : posts.slice(0, 3);
                const isToday = c.iso === today;
                return (
                  <li
                    key={c.iso}
                    aria-label={`${parseIso(c.iso).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}: ${posts.length} post${posts.length === 1 ? "" : "s"}`}
                    className={cn("group relative min-h-[112px] border-b border-r border-graphite/10 p-1.5 [&:nth-child(7n)]:border-r-0", !c.inMonth && "bg-graphite/[0.035]", c.inMonth && c.weekend && "bg-paper-200/30")}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={cn("grid size-5 place-items-center rounded-full font-mono text-[10px] font-semibold tabular", isToday ? "bg-graphite text-paper" : c.inMonth ? "text-charcoal" : "text-blueprint/60")}>{c.day}</span>
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => newPost(c.iso)}
                          aria-label={`Add a post on ${parseIso(c.iso).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`}
                          className="grid size-5 place-items-center rounded text-blueprint opacity-0 transition-opacity hover:bg-graphite/10 hover:text-graphite focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {shown.map((p) => (
                        <Chip key={p.id} post={p} onOpen={() => setEditing({ ...p })} />
                      ))}
                      {posts.length > 3 && (
                        <button type="button" onClick={() => setExpanded(open ? null : c.iso)} className="w-full rounded px-1 text-left text-[10px] font-semibold text-blueprint hover:text-graphite">
                          {open ? "Show fewer" : `+${posts.length - 3} more`}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="h-96" />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-charcoal">
        {Object.entries(PLATFORMS).map(([name, p]) => (
          <span key={name} className="inline-flex items-center gap-1.5">
            <span className={cn("grid h-4 min-w-5 place-items-center rounded-[2px] px-0.5 font-mono text-[9px] font-bold", p.box)}>{p.code}</span>
            {name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-6 rounded-[3px] border border-dashed border-graphite/40" aria-hidden /> Idea
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-6 rounded-[3px] border border-graphite/30" aria-hidden /> In progress / scheduled
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3.5" aria-hidden /> Published
        </span>
      </div>

      <RecordDrawer name="contentCalendar" initial={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
