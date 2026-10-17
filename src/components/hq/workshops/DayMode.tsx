"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, ClipboardList, CloudOff, FileText, Loader2, MessageCircle, Minus, Phone, Plus, ShieldAlert, Siren, Trash2 } from "lucide-react";
import { can, OPS, OPS_MEDIA } from "@/lib/hq/roles";
import { getCollection } from "@/lib/hq/collections";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/form";
import { useCollection, useHq } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import { telHref, whatsappHref } from "@/components/hq/sales/contact";
import { cn, formatNumber } from "@/lib/utils";
import { bandStudents, checklistOf, longDate, str, type Rec } from "./logic";
import { useToday } from "./time";
import { useWorkshopDoc, type PatchFn, type SaveState } from "./useWorkshopDoc";
import { attendedOf, clock, DAY_PHASE, dayLogOf, kitCountOf, LOG_KINDS, nowAndNext, reportFromDay, SAFEGUARDING_TEXT, type KitCount, type LogEntry, type LogKind } from "./day";

/** Minutes since midnight on this device, updated every 20 seconds. */
function useMinutes() {
  const [m, setM] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setM(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);
  return m;
}

const SECTIONS = [
  { id: "now", label: "Now" },
  { id: "tick", label: "Tick" },
  { id: "count", label: "Count" },
  { id: "kits", label: "Kits" },
  { id: "log", label: "Log" },
  { id: "call", label: "Call" },
] as const;

const big = "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite disabled:opacity-40";

/**
 * Workshop-day mode: one screen for the JOVE Day itself, made for a phone in one hand at the school and laid out
 * in columns on a laptop. What is on now, the day's checklist, head counts, the kit count, a quick log, the people
 * to call, and the report at the end. Works without network: changes wait on the device until it is back.
 */
export function DayMode({ id }: { id: string }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const today = useToday();
  const minutes = useMinutes();
  const { record: w, loading, error, patch, state, message } = useWorkshopDoc(id);
  const schoolsQ = useCollection(can(user, OPS_MEDIA) ? "schools" : "__none");
  const teamDef = getCollection("team");
  const teamQ = useCollection(teamDef && can(user, teamDef.read) ? "team" : "__none_team");

  if (loading || !today || minutes === null) return <Loading label="Opening day mode…" />;
  if (!w) {
    return (
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
    );
  }

  const school = w.schoolId ? schoolsQ.records.find((s) => s.id === w.schoolId) : undefined;
  const isToday = str(w.date) === today;

  return (
    <div className="mx-auto max-w-[1400px] pb-28 lg:pb-8" data-daymode>
      <DayHeader w={w} schoolName={str(school?.name)} minutes={minutes} state={state} />
      {state === "error" && <p className="mb-4 rounded-[var(--radius-sm)] border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{message || "The last change was not saved."} The record was reloaded.</p>}
      {!isToday && (
        <p className="mb-4 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 py-2 text-sm text-charcoal">
          This workshop is on {longDate(str(w.date))}. Day mode is for the day itself; you can look around now.
        </p>
      )}
      {!canWrite && <p className="mb-4 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 py-2 text-sm text-charcoal">You can follow the day here. The founders tick, count and log.</p>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <NowPanel w={w} minutes={minutes} isToday={isToday} />
        </div>
        <div className="space-y-5">
          <TickPanel w={w} patch={patch} canWrite={canWrite} />
          <CountPanel w={w} patch={patch} canWrite={canWrite} />
          <KitsPanel w={w} patch={patch} canWrite={canWrite} />
        </div>
        <div className="space-y-5">
          <LogPanel w={w} patch={patch} canWrite={canWrite} by={user.name} />
          <CallPanel w={w} team={teamQ.records} />
          <FinishPanel w={w} patch={patch} canWrite={canWrite} />
        </div>
      </div>

      {/* phone: jump between the parts of the day */}
      <nav aria-label="Day mode sections" className="fixed inset-x-0 bottom-0 z-30 border-t border-graphite/15 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-6">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex min-h-14 flex-col items-center justify-center text-[12px] font-semibold text-graphite active:bg-graphite/10">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function SaveNote({ state }: { state: SaveState }) {
  if (state === "offline")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/20 px-2.5 py-1 text-xs font-semibold text-paper" role="status">
        <CloudOff className="size-3.5" aria-hidden /> No network: saved on this device, sends when back
      </span>
    );
  return (
    <span className="text-xs text-paper/70" role="status" aria-live="polite">
      {state === "saving" ? "Saving…" : state === "saved" ? "All changes saved" : ""}
    </span>
  );
}

function DayHeader({ w, schoolName, minutes, state }: { w: Rec; schoolName: string; minutes: number; state: SaveState }) {
  return (
    <header className="relative mb-5 overflow-hidden rounded-[var(--radius-lg)] bg-graphite p-4 text-paper sm:p-6">
      <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex flex-wrap items-start gap-x-6 gap-y-3">
        <Link href={`/hq/workshops/${w.id}`} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-paper/80 hover:text-paper">
          <ArrowLeft className="size-4" aria-hidden /> Workshop
        </Link>
        <div className="order-3 w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
          <p className="annot text-paper/55">Day mode</p>
          <h1 className="mt-1 text-xl font-bold leading-tight tracking-[-0.02em] sm:text-2xl">{str(w.title) || "Workshop"}</h1>
          <p className="mt-1 text-sm text-paper/70">{[schoolName, str(w.startTime) && `Team reports at ${str(w.startTime)}`].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-3xl font-medium tabular-nums tracking-tight sm:text-4xl" aria-label={`Time now ${clock(minutes)}`}>
            {clock(minutes)}
          </p>
          <SaveNote state={state} />
        </div>
      </div>
    </header>
  );
}

function Panel({ id, title, sub, children, className }: { id: string; title: string; sub?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn("scroll-mt-4 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 sm:p-5", className)}>
      <h2 id={`${id}-h`} className="text-base font-bold tracking-[-0.01em] text-graphite">
        {title}
      </h2>
      {sub && <p className="mt-0.5 text-xs text-blueprint">{sub}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* ── now and next ── */

function NowPanel({ w, minutes, isToday }: { w: Rec; minutes: number; isToday: boolean }) {
  const t = useMemo(() => nowAndNext(w, minutes), [w, minutes]);
  const live = isToday;
  return (
    <Panel id="now" title="Now" sub={live ? (t.over ? "The day's sessions are over" : t.started ? `${Math.round(t.progress * 100)}% of the day done` : "Before the first session") : "The run sheet for the day"}>
      {live && (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-graphite/10" aria-hidden>
            <div className="h-full rounded-full bg-graphite transition-all" style={{ width: `${Math.round(t.progress * 100)}%` }} />
          </div>
          <div className="mt-4 space-y-3">
            {t.now.length ? (
              t.now.map((r) => (
                <div key={r.id} className="rounded-[var(--radius-sm)] bg-graphite p-4 text-paper" data-now>
                  <p className="annot text-paper/60">
                    {r.hall} · until {r.end || "—"}
                  </p>
                  <p className="mt-1 text-xl font-bold leading-snug">{r.title}</p>
                  {r.detail && <p className="mt-1 text-sm text-paper/75">{r.detail}</p>}
                  {r.who && <p className="mt-1 font-mono text-xs text-paper/60">{r.who}</p>}
                </div>
              ))
            ) : (
              <p className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 p-4 text-sm text-charcoal">{t.over ? "All sessions are done. Pack up, count the kits back and finish the day below." : "Nothing is on at this minute."}</p>
            )}
            {t.next && (
              <div className="rounded-[var(--radius-sm)] border border-graphite/20 p-4" data-next>
                <p className="annot text-blueprint">
                  Next · {t.next.time} · {t.next.hall}
                  {minutes < Math.floor(Number(t.next.time.split(":")[0]) * 60 + Number(t.next.time.split(":")[1])) ? ` · in ${Math.max(0, Number(t.next.time.split(":")[0]) * 60 + Number(t.next.time.split(":")[1]) - minutes)} min` : ""}
                </p>
                <p className="mt-1 text-lg font-bold leading-snug text-graphite">{t.next.title}</p>
              </div>
            )}
          </div>
        </>
      )}
      <ol className={cn("divide-y divide-graphite/[0.08]", live && "mt-4 border-t border-graphite/10")}>
        {t.rows.map((r) => {
          const on = live && t.now.some((x) => x.id === r.id);
          const done = live && !on && !!r.end && minutes >= Number(r.end.split(":")[0]) * 60 + Number(r.end.split(":")[1]);
          return (
            <li key={r.id} className={cn("grid grid-cols-[3.5rem_1fr] gap-x-3 py-2.5 text-sm", on && "font-semibold text-ink", done && "text-blueprint")}>
              <span className="font-mono tabular-nums">{r.time}</span>
              <span>
                {r.title}
                <span className="block text-xs font-normal text-blueprint">
                  {r.hall}
                  {r.end ? ` · until ${r.end}` : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/* ── the day's checklist ── */

function TickPanel({ w, patch, canWrite }: { w: Rec; patch: PatchFn; canWrite: boolean }) {
  const checks = checklistOf(w);
  const done = DAY_PHASE.items.filter((i) => checks[i.id]).length;
  const drone = str(w.droneAllowed) || "Pending";
  return (
    <Panel id="tick" title="On the day" sub={`${done} of ${DAY_PHASE.items.length} done`}>
      <ul className="space-y-2">
        {DAY_PHASE.items.map((i) => {
          const on = !!checks[i.id];
          const skip = i.id === "d-preflight" && drone !== "Granted";
          return (
            <li key={i.id}>
              <button
                type="button"
                disabled={!canWrite}
                aria-pressed={on}
                onClick={() => patch({ checklist: { ...checklistOf(w), [i.id]: !on } })}
                className={cn("flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default", on ? "border-graphite bg-graphite text-paper" : "border-graphite/20 bg-paper hover:border-graphite/50")}
              >
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", on ? "border-paper bg-paper text-graphite" : "border-graphite/40")} aria-hidden>
                  {on && <Check className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{i.label}</span>
                  <span className={cn("block text-xs", on ? "text-paper/60" : "text-blueprint")}>
                    {i.owner}
                    {skip ? ` · drone permission: ${drone}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ── head counts ── */

function Stepper({ label, value, onChange, disabled, max }: { label: string; value: number; onChange: (n: number) => void; disabled: boolean; max?: number }) {
  const set = (n: number) => onChange(Math.max(0, Math.min(max ?? 99999, Math.round(n) || 0)));
  return (
    <div className="flex items-stretch overflow-hidden rounded-[var(--radius-sm)] border border-graphite/25 bg-paper">
      <button type="button" disabled={disabled || value <= 0} onClick={() => set(value - 1)} aria-label={`One less: ${label}`} className="grid w-12 place-items-center text-graphite active:bg-graphite/10 disabled:opacity-30">
        <Minus className="size-5" aria-hidden />
      </button>
      <Input aria-label={label} type="number" inputMode="numeric" min={0} value={value} disabled={disabled} onChange={(e) => set(Number(e.target.value))} className="h-12 w-20 rounded-none border-0 border-x border-graphite/15 text-center font-mono text-lg tabular-nums" />
      <button type="button" disabled={disabled} onClick={() => set(value + 1)} aria-label={`One more: ${label}`} className="grid w-12 place-items-center text-graphite active:bg-graphite/10 disabled:opacity-30">
        <Plus className="size-5" aria-hidden />
      </button>
    </div>
  );
}

function CountPanel({ w, patch, canWrite }: { w: Rec; patch: PatchFn; canWrite: boolean }) {
  const att = attendedOf(w);
  const bands = kitCountOf(w).map((k) => k.band);
  const present = bands.reduce((s, b) => s + (att[b.id] ?? 0), 0);
  const expected = bands.reduce((s, b) => s + bandStudents(w, b.id), 0);
  return (
    <Panel id="count" title="Students present" sub={expected ? `${formatNumber(present)} of ${formatNumber(expected)} counted` : "No student numbers on this workshop"}>
      <ul className="space-y-3">
        {bands.map((b) => {
          const exp = bandStudents(w, b.id);
          const v = att[b.id] ?? 0;
          return (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="block text-sm font-semibold text-graphite">{b.grades}</span>
                <span className="block text-xs text-blueprint">{exp} expected</span>
              </span>
              <span className="flex items-center gap-2">
                <Stepper label={`${b.grades} present`} value={v} disabled={!canWrite} onChange={(n) => patch({ attended: { ...attendedOf(w), [b.id]: n } })} />
                {canWrite && v !== exp && (
                  <button type="button" onClick={() => patch({ attended: { ...attendedOf(w), [b.id]: exp } })} className="min-h-12 rounded-[var(--radius-sm)] px-2 text-xs font-semibold text-graphite underline underline-offset-2">
                    All {exp}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ── kits ── */

function KitsPanel({ w, patch, canWrite }: { w: Rec; patch: PatchFn; canWrite: boolean }) {
  const rows = kitCountOf(w);
  const set = (bandId: string, c: KitCount) => {
    const now = Object.fromEntries(kitCountOf(w).map((r) => [r.band.id, r.count]));
    patch({ kitCount: { ...now, [bandId]: c } });
  };
  const missing = rows.reduce((s, r) => s + Math.max(0, r.count.out - r.count.back), 0);
  return (
    <Panel id="kits" title="Kits" sub={rows.length ? `${missing ? `${missing} not back yet` : "All counted back"} · count them out in the morning and back at pack-up` : "No kits planned"}>
      <ul className="space-y-4">
        {rows.map(({ band, count, planned }) => (
          <li key={band.id}>
            <p className="text-sm font-semibold text-graphite">
              {band.grades} <span className="font-normal text-blueprint">· {planned} packed</span>
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {(["out", "back", "damaged"] as const).map((k) => (
                <div key={k}>
                  <p className="annot mb-1 text-blueprint">{k === "out" ? "Taken" : k === "back" ? "Back" : "Damaged"}</p>
                  <Stepper label={`${band.grades} kits ${k}`} value={count[k]} disabled={!canWrite} onChange={(n) => set(band.id, { ...count, [k]: n })} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ── the log ── */

function LogPanel({ w, patch, canWrite, by }: { w: Rec; patch: PatchFn; canWrite: boolean; by: string }) {
  const log = dayLogOf(w);
  const [kind, setKind] = useState<LogKind>("note");
  const [text, setText] = useState("");
  const add = (t: string, k: LogKind) => {
    const entry: LogEntry = { id: `log_${Date.now().toString(36)}`, at: new Date().toISOString(), by, kind: k, text: t.trim() };
    return patch({ dayLog: [entry, ...dayLogOf(w)] }, { immediate: true });
  };
  const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const kindLabel = (k: LogKind) => LOG_KINDS.find((x) => x.id === k)?.label ?? "Note";

  return (
    <Panel id="log" title="Log" sub="Notes go into the report at the end of the day">
      {canWrite && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kind of note">
            {LOG_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={kind === k.id}
                onClick={() => setKind(k.id)}
                className={cn("min-h-10 rounded-full border px-3 text-[13px] font-semibold", kind === k.id ? "border-graphite bg-graphite text-paper" : "border-graphite/25 text-graphite", k.id === "safeguarding" && kind !== k.id && "border-bad/40 text-bad")}
              >
                {k.label}
              </button>
            ))}
          </div>
          {kind === "safeguarding" ? (
            <div className="rounded-[var(--radius-sm)] border border-bad/30 bg-bad/[0.06] p-4 text-sm text-graphite" data-safeguarding>
              <p className="flex items-center gap-2 font-bold text-bad">
                <ShieldAlert className="size-5" aria-hidden /> Do this now
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Make the child safe.</li>
                <li>Tell the Safeguarding Lead at once. If the Lead cannot be reached, tell the deputy.</li>
                <li>The Lead tells the school&apos;s principal or designated person the same day.</li>
                <li>Write what happened only on the safeguarding form for the Lead, never here: everyone with an HQ login can read this page.</li>
              </ol>
              <button type="button" onClick={() => add(SAFEGUARDING_TEXT, "safeguarding")} className={cn(big, "mt-3 w-full bg-bad px-4 text-paper hover:bg-bad/90")}>
                Log that a concern was reported
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                await add(text, kind);
                setText("");
              }}
              className="space-y-2"
            >
              <Textarea aria-label="Note" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={LOG_KINDS.find((k) => k.id === kind)?.hint} maxLength={600} />
              <button type="submit" disabled={!text.trim()} className={cn(big, "w-full bg-graphite px-4 text-paper hover:bg-ink")}>
                <Plus className="size-4" aria-hidden /> Add to the log
              </button>
            </form>
          )}
        </div>
      )}
      {log.length ? (
        <ul className={cn("divide-y divide-graphite/[0.08]", canWrite && "mt-4 border-t border-graphite/10")} data-log>
          {log.map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-2.5 text-sm">
              <span className="font-mono text-xs tabular-nums text-blueprint">{time(e.at)}</span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[11px] font-semibold uppercase tracking-wider", e.kind === "incident" || e.kind === "safeguarding" ? "text-bad" : "text-blueprint")}>{kindLabel(e.kind)}</span>
                <span className="block text-graphite">{e.text}</span>
                {e.by && <span className="block text-xs text-blueprint">{e.by}</span>}
              </span>
              {canWrite && (
                <button type="button" aria-label="Remove this note" onClick={() => patch({ dayLog: dayLogOf(w).filter((x) => x.id !== e.id) }, { immediate: true })} className="grid size-10 place-items-center rounded text-blueprint hover:bg-bad/10 hover:text-bad">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !canWrite && <p className="text-sm text-charcoal">Nothing logged yet.</p>
      )}
    </Panel>
  );
}

/* ── people to call ── */

function CallRow({ name, note, phone, text }: { name: string; note?: string; phone: string; text: string }) {
  const tel = telHref(phone);
  const wa = whatsappHref(phone, text);
  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-graphite">{name}</span>
        {note && <span className="block text-xs text-blueprint">{note}</span>}
      </span>
      {tel && (
        <a href={tel} className={cn(big, "border border-graphite/25 px-3 text-graphite hover:border-graphite")}>
          <Phone className="size-4" aria-hidden /> Call
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(big, "border border-graphite/25 px-3 text-graphite hover:border-graphite")}>
          <MessageCircle className="size-4" aria-hidden /> WhatsApp
        </a>
      )}
    </li>
  );
}

function CallPanel({ w, team }: { w: Rec; team: Rec[] }) {
  const onSite = Array.isArray(w.team) ? (w.team as unknown[]).map(String).filter(Boolean) : [];
  const people = onSite.map((n) => ({ name: n, rec: team.find((t) => str(t.name).toLowerCase() === n.toLowerCase() || str(t.name).split(" ")[0].toLowerCase() === n.split(" ")[0].toLowerCase()) }));
  const hello = `Hello, this is the JOVE team at the school for ${str(w.title)}.`;
  return (
    <Panel id="call" title="People to call">
      <ul className="divide-y divide-graphite/[0.08]">
        {str(w.schoolContact) && <CallRow name={str(w.schoolContact)} note="School contact for the day" phone={str(w.schoolContactPhone)} text={hello} />}
        {people.map((p) => (
          <CallRow key={p.name} name={p.name} note={str(p.rec?.role) || "Team on site"} phone={str(p.rec?.phone)} text="" />
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href="tel:112" className={cn(big, "bg-bad px-3 text-paper hover:bg-bad/90")}>
          <Siren className="size-4" aria-hidden /> Emergency 112
        </a>
        <a href="tel:108" className={cn(big, "border border-bad/40 px-3 text-bad hover:bg-bad/10")}>
          <Phone className="size-4" aria-hidden /> Ambulance 108
        </a>
      </div>
    </Panel>
  );
}

/* ── the end of the day ── */

function FinishPanel({ w, patch, canWrite }: { w: Rec; patch: PatchFn; canWrite: boolean }) {
  const [busy, setBusy] = useState<"" | "report" | "done">("");
  const [note, setNote] = useState("");
  const hasReport = !!str(w.report).trim();
  const completed = str(w.status) === "completed";
  if (!canWrite) return null;
  return (
    <Panel id="finish" title="Finish the day" sub="The report is written from today's counts and log; you can edit it in Wrap-up">
      <div className="grid gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={async () => {
            if (hasReport && !window.confirm("Replace the report that is already written with one from today's counts and log?")) return;
            setBusy("report");
            await patch({ report: reportFromDay(w) }, { immediate: true });
            setBusy("");
            setNote("Report written. Read it and add the rest in Wrap-up.");
          }}
          className={cn(big, "border border-graphite px-4 text-graphite hover:bg-graphite hover:text-paper")}
        >
          {busy === "report" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileText className="size-4" aria-hidden />} {hasReport ? "Rewrite the report from today" : "Write the report from today"}
        </button>
        <button
          type="button"
          disabled={!!busy || completed}
          onClick={async () => {
            setBusy("done");
            await patch({ status: "completed" }, { immediate: true });
            setBusy("");
          }}
          className={cn(big, "bg-graphite px-4 text-paper hover:bg-ink")}
        >
          {completed ? <CheckCircle2 className="size-4" aria-hidden /> : <ClipboardList className="size-4" aria-hidden />} {completed ? "Workshop marked completed" : "Mark the workshop completed"}
        </button>
        <Link href={`/hq/workshops/${w.id}?tab=wrapup`} className="text-center text-sm font-semibold text-graphite underline underline-offset-4">
          Open Wrap-up
        </Link>
      </div>
      {note && (
        <p role="status" className="mt-3 text-sm text-ok">
          {note}
        </p>
      )}
    </Panel>
  );
}
