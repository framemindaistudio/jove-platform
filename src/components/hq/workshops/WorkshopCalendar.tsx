"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clapperboard, Plus, Truck } from "lucide-react";
import { statusTone, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatINRCompact, formatNumber } from "@/lib/utils";
import { addDays, isCancelled, longDate, money, num, parseIso, str, studentsOf, WORKSHOP_STATUS, type Rec } from "./logic";
import { useShowMoney } from "@/components/hq/data";
import { StatusBadge } from "./bits";

const CHIP: Record<Tone, string> = {
  ok: "border-l-ok bg-ok/10",
  warn: "border-l-warn bg-warn/10",
  bad: "border-l-bad bg-bad/10 line-through decoration-bad/50",
  info: "border-l-info bg-info/10",
  neutral: "border-l-graphite bg-graphite/[0.06]",
  dark: "border-l-graphite bg-graphite/[0.06]",
  outline: "border-l-graphite bg-graphite/[0.06]",
};
const DOT: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  info: "bg-info",
  neutral: "bg-graphite",
  dark: "bg-graphite",
  outline: "bg-graphite",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DONE_MEDIA = ["delivered", "posted"];

function shiftMonth(month: string, delta: number) {
  const d = parseIso(`${month}-01`);
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface DayItems {
  workshops: Rec[];
  trips: Rec[];
  media: Rec[];
}

export function WorkshopCalendar({
  workshops,
  trips,
  media,
  today,
  canWrite,
  onNew,
  schoolLabel,
}: {
  workshops: Rec[];
  trips: Rec[];
  media: Rec[];
  today: string;
  canWrite: boolean;
  onNew: (date: string) => void;
  schoolLabel: (w: Rec) => string;
}) {
  const showMoney = useShowMoney();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);

  const byDate = useMemo(() => {
    const m = new Map<string, DayItems>();
    const get = (d: string) => {
      let e = m.get(d);
      if (!e) m.set(d, (e = { workshops: [], trips: [], media: [] }));
      return e;
    };
    for (const w of workshops) if (str(w.date)) get(str(w.date).slice(0, 10)).workshops.push(w);
    for (const t of trips) if (str(t.date) && str(t.status) !== "cancelled") get(str(t.date).slice(0, 10)).trips.push(t);
    for (const j of media) if (str(j.dueDate) && !DONE_MEDIA.includes(str(j.status))) get(str(j.dueDate).slice(0, 10)).media.push(j);
    for (const e of m.values()) e.workshops.sort((a, b) => str(a.startTime).localeCompare(str(b.startTime)));
    return m;
  }, [workshops, trips, media]);

  const days = useMemo(() => {
    const first = parseIso(`${month}-01`);
    const offset = (first.getDay() + 6) % 7; // Monday-first grid
    const start = addDays(`${month}-01`, -offset);
    const all = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    // drop a trailing week that is entirely next month
    return all.slice(35).every((d) => !d.startsWith(month)) ? all.slice(0, 35) : all;
  }, [month]);

  const monthStats = useMemo(() => {
    const list = workshops.filter((w) => str(w.date).startsWith(month) && !isCancelled(w));
    return {
      count: list.length,
      students: list.reduce((s, w) => s + studentsOf(w), 0),
      value: list.reduce((s, w) => s + money(w).basis, 0),
    };
  }, [workshops, month]);

  const monthLabel = parseIso(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const sel = byDate.get(selected) ?? { workshops: [], trips: [], media: [] };

  function go(delta: number) {
    const next = shiftMonth(month, delta);
    setMonth(next);
    setSelected(next === today.slice(0, 7) ? today : `${next}-01`);
  }

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 hover:border-graphite/40" aria-label="Previous month">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => go(1)} className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 hover:border-graphite/40" aria-label="Next month">
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <Button
            variant="secondary"
            size="sm"
            className="h-9"
            onClick={() => {
              setMonth(today.slice(0, 7));
              setSelected(today);
            }}
          >
            Today
          </Button>
          <h2 className="ml-2 text-lg font-bold tracking-tight" aria-live="polite">
            {monthLabel}
          </h2>
        </div>
        <p className="annot text-[10px] text-blueprint">
          <span className="tabular font-mono text-graphite">{monthStats.count}</span> workshops · <span className="tabular font-mono text-graphite">{formatNumber(monthStats.students)}</span> students ·{" "}
          {showMoney && (
            <>
              <span className="tabular font-mono text-graphite">{formatINRCompact(monthStats.value)}</span> value
            </>
          )}
        </p>
      </div>

      {/* grid */}
      <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
        <div className="grid grid-cols-7 border-b border-graphite/15 bg-graphite text-paper">
          {WEEKDAYS.map((d) => (
            <div key={d} className="annot py-2 text-center text-[10px] text-paper/70">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const items = byDate.get(d);
            const inMonth = d.startsWith(month);
            const isToday = d === today;
            const isSel = d === selected;
            const date = parseIso(d);
            const w = items?.workshops ?? [];
            const label = `${longDate(d)}${w.length ? `, ${w.length} workshop${w.length > 1 ? "s" : ""}` : ""}${items?.trips.length ? `, ${items.trips.length} trip${items.trips.length > 1 ? "s" : ""}` : ""}${items?.media.length ? `, ${items.media.length} media due` : ""}`;
            return (
              <div
                key={d}
                className={cn(
                  "group relative min-h-16 border-graphite/10 p-1 sm:p-1.5 md:min-h-[7.5rem]",
                  i % 7 !== 6 && "border-r",
                  i < days.length - 7 && "border-b",
                  !inMonth && "bg-paper-200/40",
                  date.getDay() === 0 && inMonth && "hatch-light",
                  isSel && "ring-2 ring-inset ring-graphite",
                )}
              >
                <button type="button" onClick={() => setSelected(d)} className="absolute inset-0 z-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-graphite" aria-label={label} aria-pressed={isSel} />
                <div className="pointer-events-none relative z-10 flex items-start justify-between gap-1">
                  <span
                    className={cn(
                      "tabular grid size-6 place-items-center rounded-full font-mono text-[11px]",
                      isToday ? "bg-graphite font-bold text-paper" : inMonth ? "text-graphite" : "text-blueprint/60",
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <span className="hidden items-center gap-1 text-blueprint md:flex">
                    {!!items?.trips.length && (
                      <span className="inline-flex items-center gap-0.5 text-[10px]" title={`${items.trips.length} trip(s)`}>
                        <Truck className="size-3" aria-hidden />
                        {items.trips.length > 1 && items.trips.length}
                      </span>
                    )}
                    {!!items?.media.length && (
                      <span className="inline-flex items-center gap-0.5 text-[10px]" title={`${items.media.length} media deliverable(s) due`}>
                        <Clapperboard className="size-3" aria-hidden />
                        {items.media.length > 1 && items.media.length}
                      </span>
                    )}
                  </span>
                </div>

                {/* mobile: dots */}
                {(w.length > 0 || !!items?.trips.length || !!items?.media.length) && (
                  <div className="pointer-events-none relative z-10 mt-1 flex flex-wrap items-center gap-1 md:hidden" aria-hidden>
                    {w.slice(0, 3).map((x) => (
                      <span key={x.id} className={cn("size-1.5 rounded-full", DOT[statusTone(x.status)])} />
                    ))}
                    {!!items?.trips.length && <Truck className="size-2.5 text-blueprint" />}
                    {!!items?.media.length && <Clapperboard className="size-2.5 text-blueprint" />}
                  </div>
                )}

                {/* desktop: chips */}
                <ul className="pointer-events-none relative z-10 mt-1 hidden space-y-1 md:block">
                  {w.slice(0, 3).map((x) => (
                    <li key={x.id}>
                      <Link
                        href={`/hq/workshops/${x.id}`}
                        className={cn(
                          "pointer-events-auto block truncate rounded-[3px] border-l-2 px-1.5 py-1 text-[11px] font-medium leading-tight text-graphite transition-shadow hover:shadow-[var(--shadow-paper)] focus-visible:outline-2 focus-visible:outline-graphite",
                          CHIP[statusTone(x.status)],
                        )}
                        title={`${str(x.title)} · ${WORKSHOP_STATUS.find((o) => o.value === x.status)?.label ?? ""}`}
                      >
                        {schoolLabel(x) || str(x.title)}
                        <span className="tabular block font-mono text-[9px] font-normal text-blueprint">{formatNumber(studentsOf(x))} students</span>
                      </Link>
                    </li>
                  ))}
                  {w.length > 3 && <li className="px-1 text-[10px] text-blueprint">+{w.length - 3} more</li>}
                </ul>

                {canWrite && inMonth && (
                  <button
                    type="button"
                    onClick={() => onNew(d)}
                    className="absolute bottom-1 right-1 z-20 hidden size-6 place-items-center rounded-full border border-graphite/20 bg-paper text-graphite opacity-0 transition-opacity hover:bg-graphite hover:text-paper focus-visible:opacity-100 group-hover:opacity-100 md:grid"
                    aria-label={`New workshop on ${longDate(d)}`}
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-charcoal">
        {WORKSHOP_STATUS.map((o) => (
          <span key={o.value} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", DOT[statusTone(o.value)])} aria-hidden />
            {o.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <Truck className="size-3 text-blueprint" aria-hidden /> Trip
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clapperboard className="size-3 text-blueprint" aria-hidden /> Media due
        </span>
      </div>

      {/* selected day */}
      <section className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50" aria-labelledby="cal-day">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite/10 px-5 py-3.5">
          <h3 id="cal-day" className="text-sm font-semibold">
            {longDate(selected)}
            {selected === today && <span className="annot ml-2 text-[9px] text-blueprint">Today</span>}
          </h3>
          {canWrite && (
            <Button size="sm" variant="secondary" onClick={() => onNew(selected)}>
              <Plus className="size-4" aria-hidden /> Workshop on this day
            </Button>
          )}
        </div>
        <div className="p-5">
          {!sel.workshops.length && !sel.trips.length && !sel.media.length ? (
            <p className="text-sm text-blueprint">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {sel.workshops.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/hq/workshops/${x.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper px-3 py-2.5 transition-colors hover:border-graphite/30"
                  >
                    <span className="tabular font-mono text-xs text-blueprint">{str(x.startTime) || "—"}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{str(x.title)}</span>
                    <span className="tabular font-mono text-xs text-charcoal">{formatNumber(studentsOf(x))} students</span>
                    <StatusBadge status={x.status} />
                  </Link>
                </li>
              ))}
              {sel.trips.map((t) => (
                <li key={t.id}>
                  <Link href="/hq/travel" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-graphite/15 px-3 py-2 text-sm hover:border-graphite/40">
                    <Truck className="size-4 text-blueprint" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      Trip to {str(t.to) || "—"}
                      {num(t.distanceKm) > 0 && <span className="text-blueprint"> · {formatNumber(num(t.distanceKm))} km</span>}
                    </span>
                    <span className="annot text-[9px] text-blueprint">{str(t.status)}</span>
                  </Link>
                </li>
              ))}
              {sel.media.map((j) => (
                <li key={j.id}>
                  <Link href="/hq/media" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-graphite/15 px-3 py-2 text-sm hover:border-graphite/40">
                    <Clapperboard className="size-4 text-blueprint" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">Due: {str(j.title)}</span>
                    <span className="annot text-[9px] text-blueprint">{str(j.status)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
