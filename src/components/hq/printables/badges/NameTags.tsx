"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { Sheet, Tile, Wordmark } from "../PrintBits";
import { chunk, clampInt, parseNameLines, type Q } from "../util";

function Tag({ name, grade, school }: { name: string; grade: string; school: string }) {
  const size = name.length > 24 ? "12.5pt" : name.length > 17 ? "15pt" : "18pt";
  return (
    <Tile w={95} h={54} className="flex flex-col bg-white">
      <div className="flex items-center justify-between bg-graphite px-[4mm] py-[2.2mm] text-paper">
        <Wordmark white mm={19} />
        <span className="text-[6pt] font-semibold uppercase tracking-[0.24em]">Hello, I am</span>
      </div>
      <div className="bp-grid-fine pointer-events-none absolute inset-x-0 bottom-0 top-[9.5mm] opacity-30" aria-hidden />
      <div className="relative flex flex-1 flex-col justify-center px-[5mm]">
        {name ? (
          <p className="truncate font-bold leading-[1.05] tracking-[-0.02em]" style={{ fontSize: size }}>
            {name}
          </p>
        ) : (
          <div className="h-[9mm] border-b border-dotted border-graphite/60" />
        )}
        <p className="mt-[1.4mm] min-h-[4mm] text-[8.5pt] font-semibold text-charcoal">{grade || (name ? "" : "Grade / class: ________")}</p>
      </div>
      <div className="relative flex items-center justify-between border-t border-graphite/25 px-[4mm] py-[1.7mm] text-[5.8pt] font-semibold uppercase tracking-[0.16em] text-blueprint">
        <span className="max-w-[58mm] truncate">{school || "Robotics & AI workshop"}</span>
        <span>Team ______</span>
      </div>
    </Tile>
  );
}

export function NameTags({ q }: { q: Q }) {
  const rows = parseNameLines(q.names);
  const tags = rows.length ? rows : Array.from({ length: clampInt(q.pages, 1, 60, 1) * 10 }, () => ({ name: "", grade: "" }));
  const sheets = chunk(tags, 10);

  return (
    <PrintShell title="Student name tags" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{tags.length} tags · {sheets.length} sheet{sheets.length === 1 ? "" : "s"} · 10 per A4</span>}>
      {sheets.map((group, i) => (
        <Sheet key={i} className="flex items-center justify-center">
          <div className="grid grid-cols-2" style={{ width: "190mm" }}>
            {group.map((t, j) => (
              <Tag key={j} name={t.name} grade={t.grade} school={q.school ?? ""} />
            ))}
          </div>
        </Sheet>
      ))}
    </PrintShell>
  );
}
