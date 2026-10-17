"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/hq/ui";
import { shortDate } from "@/components/hq/printables/util";
import { requiredForSchool } from "@/lib/sign/catalog";
import { partyFromSchool, type SignDoc } from "@/lib/sign/context";
import { ChipLegend } from "./bits";
import { proposalFor, str, type Desk, type Rec } from "./desk";
import type { Preset } from "./NewDoc";
import { PaperSet } from "./PaperSet";

/** A school is "in play" once a proposal has gone out, a workshop is planned, or a paper has been made for it. */
const IN_PLAY = ["proposal", "negotiation", "won"];
const LIVE_WORKSHOP = ["tentative", "confirmed", "completed", "postponed"];

/** Documents to Sign → Schools: each school with a proposal or a workshop, and the papers every workshop needs. */
export function SchoolsTab({ desk, tab, onOpen, onNew }: { desk: Desk; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const rows = useMemo(() => {
    const withDocs = new Set(desk.docs.filter((d) => d.partyKind === "school" && d.partyId).map((d) => d.partyId));
    return desk.schools
      .map((school) => ({ school, workshops: desk.workshops.filter((w) => w.schoolId === school.id && LIVE_WORKSHOP.includes(str(w.status) || "tentative")).sort((a, b) => str(a.date).localeCompare(str(b.date))) }))
      .filter((r) => IN_PLAY.includes(str(r.school.stage)) || r.workshops.length > 0 || withDocs.has(r.school.id))
      .sort((a, b) => str(a.workshops[0]?.date || "9999").localeCompare(str(b.workshops[0]?.date || "9999")) || str(a.school.name).localeCompare(str(b.school.name)));
  }, [desk.schools, desk.workshops, desk.docs]);

  if (!rows.length)
    return (
      <EmptyState
        icon="School"
        title="No school has a proposal or a workshop yet"
        description="A school appears here once its stage is Proposal sent, Negotiation or Won, or a workshop is planned for it. Its papers are then filled in from the school's record, the proposal and the workshop."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/hq/crm" className={buttonClass("secondary", "sm")}>
              Open Schools CRM
            </Link>
            {desk.canEdit && (
              <Button size="sm" variant="ghost" onClick={() => onNew({ kind: "school" })}>
                Make a paper for any school
              </Button>
            )}
          </div>
        }
      />
    );

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-charcoal">
        Every booked workshop needs the same few papers from its school. They are filled in from the school&rsquo;s record, the proposal and the workshop, with the principal&rsquo;s name and yours on the signature lines.
      </p>
      <ul className="space-y-4">
        {rows.map(({ school, workshops }) => (
          <li key={school.id}>
            <SchoolCard desk={desk} school={school} workshops={workshops} tab={tab} onOpen={onOpen} onNew={onNew} />
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <ChipLegend />
        {desk.canEdit && (
          <Button size="sm" variant="ghost" onClick={() => onNew({ kind: "school" })}>
            A paper for another school…
          </Button>
        )}
      </div>
    </div>
  );
}

function SchoolCard({ desk, school, workshops, tab, onOpen, onNew }: { desk: Desk; school: Rec; workshops: Rec[]; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const required = useMemo(() => requiredForSchool(), []);
  const docs = useMemo(() => desk.docs.filter((d) => d.partyKind === "school" && d.partyId === school.id), [desk.docs, school.id]);
  const proposal = proposalFor(desk.proposals, school.id);
  const party = partyFromSchool(school);
  const stage = str(school.stage) || "lead";
  // one set of papers for each workshop; papers made without a workshop sit with the first one
  const sets = workshops.length ? workshops.map((w, i) => ({ workshop: w as Rec | undefined, docs: docs.filter((d) => d.workshopId === w.id || (i === 0 && !d.workshopId)) })) : [{ workshop: undefined, docs }];

  return (
    <article className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 shadow-[var(--shadow-paper)]" data-school={school.id}>
      <div className="mb-1 flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold leading-tight">{str(school.name)}</h3>
          <p className="truncate text-sm text-charcoal">{[str(school.city), party.person && `${party.person}${party.role ? `, ${party.role}` : ""}`].filter(Boolean).join(" · ") || "No contact on record"}</p>
        </div>
        <Badge tone={statusTone(stage)} dot>
          {stage}
        </Badge>
      </div>
      {!party.person && <p className="mb-2 text-xs text-warn">No principal or contact is on record for this school, so the signature line will be left to fill by hand. Add the name in Schools CRM, or type it on the paper.</p>}
      <div className="divide-y divide-graphite/10">
        {sets.map(({ workshop, docs: mine }) => (
          <div key={workshop?.id ?? "none"} className="py-4 last:pb-0">
            <p className="annot mb-2.5 text-charcoal">{workshop ? `${str(workshop.title) || "Workshop"} · ${shortDate(workshop.date) || "no date yet"} · ${str(workshop.status) || "tentative"}` : "No workshop planned yet"}</p>
            <PaperSet
              desk={desk}
              required={required}
              docs={mine}
              tab={tab}
              makeLabel="Make this workshop's papers"
              onMake={(templates) => desk.make(templates.map((template) => ({ template, party, sources: { school, workshop, proposal }, workshopId: workshop?.id, proposalId: proposal?.id })))}
              onOpen={onOpen}
              onOther={() => onNew({ kind: "school", id: school.id, workshopId: workshop?.id })}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
