"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import { A4Page, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import { can, OPS_MEDIA } from "@/lib/hq/roles";
import { Select } from "@/components/ui/form";
import { useCollection, useHq } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import { kitPlan, longDate, str, type Rec } from "./logic";

const ROWS_PER_PAGE = 30;

interface Sheet {
  key: string;
  title: string;
  grades: string;
  session: number;
  sessions: number;
  rows: number;
}

function SheetPage({ w, school, sheet, page, pages, start, count }: { w: Rec; school: string; sheet: Sheet; page: number; pages: number; start: number; count: number }) {
  const last = page === pages;
  return (
    <A4Page>
      <header className="mb-3 border-b-2 border-graphite pb-3">
        <div className="flex items-start justify-between gap-6">
          <div className="w-28">
            <Image src="/brand/jove-wordmark.png" alt="JOVE" width={1400} height={669} className="h-auto w-full" priority />
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold leading-tight tracking-tight">Attendance sheet</h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-blueprint">
              {sheet.title}
              {sheet.sessions > 1 ? ` · session ${sheet.session} of ${sheet.sessions}` : ""}
              {pages > 1 ? ` · page ${page}/${pages}` : ""}
            </p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-4 gap-x-5 gap-y-2 text-[10px]">
          {[
            ["School", school],
            ["Date", longDate(str(w.date))],
            ["Grades", sheet.grades],
            ["Session time", ""],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 border-b border-dotted border-graphite/50 pb-0.5">
              <dt className="text-[8px] font-semibold uppercase tracking-wider text-blueprint">{k}</dt>
              <dd className="min-h-[4mm] truncate font-semibold">{v}</dd>
            </div>
          ))}
          <div className="col-span-2 min-w-0 border-b border-dotted border-graphite/50 pb-0.5">
            <dt className="text-[8px] font-semibold uppercase tracking-wider text-blueprint">Trainer</dt>
            <dd className="min-h-[4mm] font-semibold">{str(w.leadTrainer)}</dd>
          </div>
          <div className="col-span-2 min-w-0 border-b border-dotted border-graphite/50 pb-0.5">
            <dt className="text-[8px] font-semibold uppercase tracking-wider text-blueprint">School teacher present</dt>
            <dd className="min-h-[4mm]" />
          </div>
        </dl>
      </header>

      <table className="w-full table-fixed border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="w-[11mm] border border-graphite/70 bg-graphite/10 px-1.5 py-1 text-center text-[9px] font-bold uppercase tracking-wider">#</th>
            <th className="border border-graphite/70 bg-graphite/10 px-2 py-1 text-left text-[9px] font-bold uppercase tracking-wider">Student name</th>
            <th className="w-[30mm] border border-graphite/70 bg-graphite/10 px-2 py-1 text-left text-[9px] font-bold uppercase tracking-wider">Grade / section</th>
            <th className="w-[42mm] border border-graphite/70 bg-graphite/10 px-2 py-1 text-left text-[9px] font-bold uppercase tracking-wider">Signature / ✓</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }, (_, i) => (
            <tr key={i} className="h-[6.3mm]">
              <td className="tabular border border-graphite/50 text-center font-mono text-[9px] text-charcoal">{start + i + 1}</td>
              <td className="border border-graphite/50" />
              <td className="border border-graphite/50" />
              <td className="border border-graphite/50" />
            </tr>
          ))}
        </tbody>
      </table>

      {last && (
        <div className="mt-3 flex items-end justify-between gap-8 text-[10px]">
          <p className="flex-1 border-b border-dotted border-graphite/60 pb-0.5">
            <span className="text-[8px] font-semibold uppercase tracking-wider text-blueprint">Present / total: </span>
          </p>
          <p className="flex-1 border-b border-dotted border-graphite/60 pb-0.5">
            <span className="text-[8px] font-semibold uppercase tracking-wider text-blueprint">Trainer signature: </span>
          </p>
        </div>
      )}
      <PrintFooter note={`Attendance · ${sheet.title}`} />
    </A4Page>
  );
}

export function AttendanceDoc({ id }: { id: string }) {
  const { user } = useHq();
  const spareId = useId();
  const [spare, setSpare] = useState(0);
  const wq = useCollection("workshops");
  const sq = useCollection(can(user, OPS_MEDIA) ? "schools" : "__none");

  const w: Rec | undefined = wq.records.find((r) => r.id === id);
  const schoolName = str(w?.schoolId ? sq.records.find((s) => s.id === w.schoolId)?.name : "") || str(w?.title);

  const sheets = useMemo<Sheet[]>(() => {
    if (!w) return [];
    const plan = kitPlan(w);
    if (!plan.rows.length) return [{ key: "generic", title: "All grades", grades: "", session: 1, sessions: 1, rows: ROWS_PER_PAGE + spare }];
    return plan.rows.flatMap((p) =>
      Array.from({ length: p.sessions }, (_, i) => ({
        key: `${p.band.id}-${i}`,
        title: `${p.band.name} (${p.band.grades})`,
        grades: p.band.grades,
        session: i + 1,
        sessions: p.sessions,
        rows: p.perSession + spare,
      })),
    );
  }, [w, spare]);

  if (wq.loading) return <Loading label="Preparing attendance sheets…" className="min-h-dvh" />;
  if (!w) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <EmptyState icon="CalendarRange" title="Workshop not found" description="It may have been deleted, or the link is wrong." />
      </div>
    );
  }

  return (
    <PrintShell
      title={`Attendance — ${str(w.title)}`}
      back={`/hq/workshops/${w.id}`}
      toolbar={
        <div className="flex items-center gap-2">
          <label htmlFor={spareId} className="text-xs font-medium text-charcoal">
            Spare rows
          </label>
          <div className="w-24">
            <Select id={spareId} className="h-9" value={String(spare)} onChange={(e) => setSpare(Number(e.target.value))}>
              {[0, 5, 10, 15].map((n) => (
                <option key={n} value={n}>
                  +{n}
                </option>
              ))}
            </Select>
          </div>
        </div>
      }
    >
      {sheets.flatMap((sheet) => {
        const pages = Math.max(1, Math.ceil(sheet.rows / ROWS_PER_PAGE));
        return Array.from({ length: pages }, (_, p) => {
          const start = p * ROWS_PER_PAGE;
          return <SheetPage key={`${sheet.key}-${p}`} w={w} school={schoolName} sheet={sheet} page={p + 1} pages={pages} start={start} count={Math.min(ROWS_PER_PAGE, sheet.rows - start)} />;
        });
      })}
    </PrintShell>
  );
}
