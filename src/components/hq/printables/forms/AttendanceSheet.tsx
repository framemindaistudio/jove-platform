"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { Annot, Sheet, SheetFooter, WriteLine, Wordmark } from "../PrintBits";
import { chunk, clampInt, longDate, parseNameLines, type Q } from "../util";

function Page({ q, rows, startAt, total, page, pages }: { q: Q; rows: { name: string; grade: string }[]; startAt: number; total: number; page: number; pages: number }) {
  return (
    <Sheet className="flex flex-col px-[14mm] pb-[8mm] pt-[12mm]">
      <header className="flex items-start justify-between gap-6 border-b-2 border-graphite pb-[3mm]">
        <Wordmark mm={34} />
        <div className="text-right">
          <h1 className="text-[16pt] font-bold leading-tight tracking-[-0.02em]">Attendance sheet</h1>
          <Annot>{q.title || "JOVE workshop"}{pages > 1 ? ` · page ${page} of ${pages}` : ""}</Annot>
        </div>
      </header>

      <div className="mt-[4mm] grid grid-cols-4 gap-x-[5mm] gap-y-[2.6mm]">
        <WriteLine label="School" value={q.school} className="col-span-2" />
        <WriteLine label="Date" value={longDate(q.date)} className="col-span-2" />
        <WriteLine label="Class / section" value={q.grade} />
        <WriteLine label="Session time" />
        <WriteLine label="Trainer" value={q.trainer} />
        <WriteLine label="School teacher present" />
      </div>

      <table className="mt-[4mm] w-full flex-1 border-collapse text-[8.5pt]" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "9mm" }} />
          <col />
          <col style={{ width: "26mm" }} />
          <col style={{ width: "17mm" }} />
          <col style={{ width: "17mm" }} />
          <col style={{ width: "30mm" }} />
        </colgroup>
        <thead>
          <tr className="border-y border-graphite bg-graphite/[0.05] text-left text-[6pt] font-semibold uppercase tracking-[0.14em] text-charcoal">
            <th className="px-[1.5mm] py-[1.6mm]">No.</th>
            <th className="px-[1.5mm]">Student name</th>
            <th className="px-[1.5mm]">Class / sec</th>
            <th className="px-[1.5mm]">Roll</th>
            <th className="px-[1.5mm]">Station</th>
            <th className="px-[1.5mm]">Signature / ✓</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-graphite/25">
              <td className="px-[1.5mm] font-mono text-[7pt] text-blueprint">{startAt + i + 1}</td>
              <td className="truncate border-l border-graphite/15 px-[1.5mm] font-semibold">{r.name}</td>
              <td className="truncate border-l border-graphite/15 px-[1.5mm]">{r.grade}</td>
              <td className="border-l border-graphite/15" />
              <td className="border-l border-graphite/15" />
              <td className="border-l border-graphite/15" />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-[3mm] flex items-end justify-between gap-6 text-[7pt] text-charcoal">
        <p>
          Present: ________ &nbsp; Absent: ________ &nbsp; Total on roll: {total || "________"}
        </p>
        <div className="w-[60mm]">
          <WriteLine label="Trainer signature" valueClassName="min-h-[6mm]" />
        </div>
      </div>
      <SheetFooter className="mt-[3mm]" />
    </Sheet>
  );
}

export function AttendanceSheet({ q }: { q: Q }) {
  const perPage = clampInt(q.rows, 10, 40, 30);
  const names = parseNameLines(q.names, q.grade ?? "");
  const pageCount = names.length ? Math.ceil(names.length / perPage) : clampInt(q.pages, 1, 40, 1);
  const filled = Array.from({ length: pageCount * perPage }, (_, i) => names[i] ?? { name: "", grade: "" });
  const sheets = chunk(filled, perPage);

  return (
    <PrintShell title="Attendance sheet" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{sheets.length} page{sheets.length === 1 ? "" : "s"} · {perPage} rows</span>}>
      {sheets.map((rows, i) => (
        <Page key={i} q={q} rows={rows} startAt={i * perPage} total={names.length} page={i + 1} pages={sheets.length} />
      ))}
    </PrintShell>
  );
}
