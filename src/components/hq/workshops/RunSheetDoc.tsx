"use client";

import { useMemo } from "react";
import { can, OPS_MEDIA, OPS_TRAINER } from "@/lib/hq/roles";
import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import { useCollection, useHq, useSettings } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import { formatNumber } from "@/lib/utils";
import { kitPlan, list, longDate, num, optionLabel, PACKAGE_OPTIONS, packingList, scheduleOf, sortSchedule, str, WORKSHOP_STATUS, workshopValue, type Rec, type ScheduleRow } from "./logic";

const th = "border border-graphite/60 bg-graphite/10 px-1.5 py-1 text-left text-[9px] font-bold uppercase tracking-wider";
const td = "border border-graphite/40 px-1.5 py-1 align-top";
const tdn = `${td} tabular text-right font-mono`;

const laneOf = (hall: string) => (hall === "Hall A" ? "A" : hall === "Hall B" ? "B" : "ALL");

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
        <span className="h-px w-5 bg-graphite" aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-dotted border-graphite/40 py-[3px]">
      <dt className="w-[26mm] shrink-0 text-[9px] font-semibold uppercase tracking-wider text-blueprint">{label}</dt>
      <dd className="min-w-0 flex-1 text-[10.5px] font-medium">{children || <span className="text-blueprint/60">&nbsp;</span>}</dd>
    </div>
  );
}

function ScheduleMatrix({ rows }: { rows: ScheduleRow[] }) {
  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr>
          <th className={`${th} w-[24mm]`}>Time</th>
          <th className={th}>Hall A</th>
          <th className={th}>Hall B</th>
          <th className={`${th} w-[10mm] text-center`}>Done</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const lane = laneOf(r.hall);
          const cell = (
            <>
              <p className="font-bold leading-tight">
                {r.title}
                {r.who && <span className="ml-1.5 font-normal text-charcoal">· {r.who}</span>}
              </p>
              {r.detail && <p className="mt-0.5 text-[9px] leading-snug text-charcoal">{r.detail}</p>}
            </>
          );
          return (
            <tr key={r.id} className="break-inside-avoid">
              <td className={`${td} tabular font-mono`}>
                {r.time}
                {r.end && `–${r.end}`}
              </td>
              {lane === "ALL" ? (
                <td colSpan={2} className={`${td} bg-graphite/[0.05]`}>
                  <p className="mb-0.5 text-[8px] font-bold uppercase tracking-widest text-blueprint">{r.hall === "Both" ? "Both halls" : r.hall}</p>
                  {cell}
                </td>
              ) : lane === "A" ? (
                <>
                  <td className={td}>{cell}</td>
                  <td className={`${td} bg-graphite/[0.04]`} />
                </>
              ) : (
                <>
                  <td className={`${td} bg-graphite/[0.04]`} />
                  <td className={td}>{cell}</td>
                </>
              )}
              <td className={td}>
                <span className="mx-auto block size-3.5 border border-graphite" aria-hidden />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function RunSheetDoc({ id }: { id: string }) {
  const { user } = useHq();
  const { settings } = useSettings();
  const wq = useCollection("workshops");
  const sq = useCollection(can(user, OPS_MEDIA) ? "schools" : "__none");
  const tq = useCollection(can(user, OPS_TRAINER) ? "trips" : "__none");

  const w: Rec | undefined = wq.records.find((r) => r.id === id);
  const school = w?.schoolId ? sq.records.find((s) => s.id === w.schoolId) : undefined;
  const trip = useMemo(() => tq.records.filter((t) => t.workshopId === id && str(t.status) !== "cancelled").sort((a, b) => str(a.date).localeCompare(str(b.date)))[0], [tq.records, id]);

  if (wq.loading) return <Loading label="Preparing run sheet…" className="min-h-dvh" />;
  if (!w) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <EmptyState icon="CalendarRange" title="Workshop not found" description="It may have been deleted, or the link is wrong." />
      </div>
    );
  }

  const rows = sortSchedule(scheduleOf(w).rows);
  const plan = kitPlan(w);
  const t = plan.totals;
  const packing = packingList(w);
  const value = workshopValue(w);
  const team = list(w.team);
  const address = [str(school?.address), [str(school?.area), str(school?.city)].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  const jovePhone = settings.phone;

  return (
    <PrintShell title={`Run sheet — ${str(w.title)}`} back={`/hq/workshops/${w.id}?tab=runsheet`}>
      {/* ───────── page 1 — the day ───────── */}
      <A4Page>
        <Letterhead
          settings={settings}
          docTitle="JOVE Day Run Sheet"
          docMeta={
            <>
              <p className="font-semibold text-graphite">{longDate(str(w.date))}</p>
              <p>{optionLabel(WORKSHOP_STATUS, w.status)} · {optionLabel(PACKAGE_OPTIONS, w.package || "jove-day")}</p>
            </>
          }
        />

        <h2 className="-mt-3 text-lg font-bold leading-tight tracking-tight">{str(w.title)}</h2>
        <p className="mb-4 mt-1 text-[10.5px] text-charcoal">
          <span className="font-bold text-graphite">{formatNumber(value.students)} students</span>
          {value.lines.map((l) => ` · ${l.band.grades.replace("Grades ", "Gr ")}: ${l.students}`).join("")}
          {value.lines.length ? "" : " · counts not entered yet"}
        </p>

        <div className="grid grid-cols-2 gap-x-8">
          <Section title="School">
            <dl>
              <Field label="School">{str(school?.name) || str(w.title)}</Field>
              <Field label="Address">{address}</Field>
              <Field label="On-day contact">{str(w.schoolContact)}</Field>
              <Field label="Contact phone">{str(w.schoolContactPhone)}</Field>
              <Field label="Principal">{str(school?.principalName)}</Field>
              <Field label="Venue">{str(w.venue)}</Field>
            </dl>
          </Section>
          <Section title="Day & team">
            <dl>
              <Field label="Report at">{str(w.startTime)}</Field>
              <Field label="Depart base">{[str(w.departTime), str(trip?.from) || ""].filter(Boolean).join(" · ")}</Field>
              <Field label="Transport">{[str(trip?.vehicle) || str(w.vehicle), num(w.distanceKm) ? `${formatNumber(num(w.distanceKm))} km one way` : ""].filter(Boolean).join(" · ")}</Field>
              <Field label="Driver">{str(trip?.driver)}</Field>
              <Field label="Lead">{str(w.leadTrainer)}</Field>
              <Field label="Team">{team.join(", ")}</Field>
              <Field label="JOVE office">{jovePhone}</Field>
            </dl>
          </Section>
        </div>

        <Section title="Schedule by hall" className="mt-4">
          <ScheduleMatrix rows={rows} />
        </Section>

        <PrintFooter note={`Run sheet · ${str(w.title)}`} />
      </A4Page>

      {/* ───────── page 2 — kits, packing, emergency ───────── */}
      <A4Page>
        <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-graphite pb-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blueprint">JOVE Day Run Sheet · page 2</p>
            <h1 className="text-lg font-bold tracking-tight">{str(w.title)}</h1>
          </div>
          <p className="tabular font-mono text-xs">{str(w.date)}</p>
        </div>

        <Section title="Kits & materials">
          {plan.rows.length ? (
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className={th}>Band · kit</th>
                  {["Students", "Sessions", "Stations", "Spares", "To pack", "Battery sets", "AA cells", "Worksheets", "Certificates"].map((h) => (
                    <th key={h} className={`${th} text-right`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((p) => (
                  <tr key={p.band.id}>
                    <td className={td}>
                      <span className="font-semibold">{p.band.name}</span> · {p.kit?.name}
                    </td>
                    <td className={tdn}>{p.students}</td>
                    <td className={tdn}>{p.sessions}</td>
                    <td className={tdn}>{p.stations}</td>
                    <td className={tdn}>{p.spares}</td>
                    <td className={`${tdn} font-bold`}>{p.kitsToPack}</td>
                    <td className={tdn}>{p.batterySets}</td>
                    <td className={tdn}>{p.cellsPerStation === null ? "USB" : p.aaCells}</td>
                    <td className={tdn}>{p.worksheets}</td>
                    <td className={tdn}>{p.certificates}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className={td}>Total</td>
                  <td className={tdn}>{t.students}</td>
                  <td className={tdn}>{t.sessions}</td>
                  <td className={tdn}>{t.stations}</td>
                  <td className={tdn}>{t.spares}</td>
                  <td className={tdn}>{t.kitsToPack}</td>
                  <td className={tdn}>{t.batterySets}</td>
                  <td className={tdn}>{t.aaCells}</td>
                  <td className={tdn}>{t.worksheets}</td>
                  <td className={tdn}>{t.certificates}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-[10px] text-blueprint">Add student counts to size the kits.</p>
          )}
        </Section>

        <Section title="Packing checklist — tick as loaded" className="mt-5">
          <div className="columns-2 gap-6">
            {packing.map((g) => (
              <div key={g.group} className="mb-3 break-inside-avoid">
                <h3 className="mb-1 border-b border-graphite/50 text-[9px] font-bold uppercase tracking-wider text-blueprint">{g.group}</h3>
                <ul className="space-y-[3px]">
                  {g.items.map((i) => (
                    <li key={i.label} className="flex items-start gap-2 text-[10px] leading-snug">
                      <span className="mt-px size-3 shrink-0 border border-graphite" aria-hidden />
                      <span className="min-w-0 flex-1">{i.label}</span>
                      {i.qty && <span className="tabular shrink-0 font-mono text-[9px]">{i.qty}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Emergency & key contacts — fill in before leaving base" className="mt-4">
          <dl className="grid grid-cols-2 gap-x-8">
            <Field label="National emergency">112</Field>
            <Field label="School coordinator">{[str(w.schoolContact), str(w.schoolContactPhone)].filter(Boolean).join(" · ")}</Field>
            <Field label="Nearest hospital" />
            <Field label="Hospital phone" />
            <Field label="School first-aid / nurse" />
            <Field label="Driver phone">{str(trip?.driver)}</Field>
            <Field label="JOVE office">{jovePhone}</Field>
            <Field label="Parent / guardian issue" />
          </dl>
          <p className="mt-2 text-[9px] leading-snug text-charcoal">
            Any student injury or faulty-kit incident: stop the activity, inform the school coordinator, note it on the back of this sheet, and report to the Founder &amp; CEO the same day. Drones fly only with written school permission and a clear Digital Sky airspace check.
          </p>
        </Section>

        <PrintFooter note={`Run sheet · ${str(w.title)}`} />
      </A4Page>
    </PrintShell>
  );
}
