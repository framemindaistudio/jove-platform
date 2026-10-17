"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState, Panel } from "@/components/hq/ui";
import type { SignDoc } from "@/lib/sign/context";
import { ChipLegend } from "./bits";
import { str, type Desk } from "./desk";
import type { Preset } from "./NewDoc";
import { PaperSet } from "./PaperSet";

/** Documents to Sign → Others: vendors, colleges, sponsors, parents at public events. Anyone who is not team or a school. */
export function OthersTab({ desk, tab, onOpen, onNew }: { desk: Desk; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const groups = useMemo(() => {
    const by = new Map<string, { name: string; kind: string; id: string; docs: SignDoc[] }>();
    for (const d of desk.docs) {
      if (d.partyKind !== "vendor" && d.partyKind !== "other") continue;
      const key = `${d.partyKind}:${d.partyId || str(d.partyName).toLowerCase()}`;
      if (!by.has(key)) by.set(key, { name: str(d.partyName) || "No name yet", kind: d.partyKind, id: str(d.partyId), docs: [] });
      by.get(key)!.docs.push(d);
    }
    return [...by.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [desk.docs]);

  const start: Preset = { kinds: ["vendor", "other"] };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-charcoal">Papers with anyone who is not on the team and not a school: a supplier who sees the kit designs, a college sending interns, a sponsor, or parents at a public event.</p>
        {desk.canEdit && (
          <Button size="sm" onClick={() => onNew(start)}>
            <FilePlus2 className="size-3.5" aria-hidden /> New document
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="Signature" title="Nothing here yet" description="A mutual NDA before a supplier sees your designs, an MoU with a college, a waiver for a public event: make one with New document." />
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li key={`${g.kind}:${g.id || g.name}`}>
              <article className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 shadow-[var(--shadow-paper)]">
                <h3 className="text-base font-bold leading-tight">{g.name}</h3>
                <p className="mb-3 text-sm text-charcoal">{g.kind === "vendor" ? "Vendor" : "Not on record in HQ"}</p>
                <PaperSet desk={desk} required={[]} docs={g.docs} tab={tab} makeLabel="" onMake={async () => []} onOpen={onOpen} onOther={g.kind === "vendor" && g.id ? () => onNew({ kind: "vendor", id: g.id }) : undefined} />
              </article>
            </li>
          ))}
        </ul>
      )}
      {groups.length > 0 && <ChipLegend />}

      <Panel title="Parents' consent for photos, video and drone" subtitle="Signed by a parent for each student, before every workshop">
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-56 flex-1 text-sm text-charcoal">These are small slips, two to a page, printed with the school&rsquo;s name and the date, and with each student&rsquo;s name if you paste the class list. They are made in Printables. The school then signs the &ldquo;Consent confirmation&rdquo; in the Schools tab.</p>
          <Link href="/hq/printables" className={buttonClass("secondary", "sm")}>
            Open Printables
          </Link>
        </div>
      </Panel>
    </div>
  );
}
