"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { shortDate } from "@/components/hq/printables/util";
import { GROUPS, templateById, TEMPLATES } from "@/lib/sign/catalog";
import { emptyParty, partyFromMember, partyFromSchool, partyFromVendor, type SignDoc } from "@/lib/sign/context";
import type { PartyKind } from "@/lib/sign/types";
import { proposalFor, str, type Desk, type NewDoc as NewDocInput } from "./desk";

/** What "new document" starts with: a template, a kind of party, a record, or nothing. */
export interface Preset {
  templateId?: string;
  kind?: PartyKind;
  /** several kinds to choose between, when it is not one */
  kinds?: PartyKind[];
  id?: string;
  workshopId?: string;
}

const KIND_LABEL: Record<PartyKind, string> = { team: "Someone on the team", school: "A school", vendor: "A vendor", other: "Someone else (type the name)" };
const TYPED = "__typed";

/** Pick a paper and who it is for; HQ makes it with the names and details filled in. */
export function NewDoc({ desk, preset, onClose, onMade }: { desk: Desk; preset: Preset | null; onClose: () => void; onMade: (doc: SignDoc) => void }) {
  return (
    <Modal open={!!preset} onClose={onClose} title="New document" size="max-w-xl">
      {preset && <Form key={JSON.stringify(preset)} desk={desk} preset={preset} onClose={onClose} onMade={onMade} />}
    </Modal>
  );
}

function Form({ desk, preset, onClose, onMade }: { desk: Desk; preset: Preset; onClose: () => void; onMade: (doc: SignDoc) => void }) {
  const [templateId, setTemplateId] = useState(preset.templateId ?? "");
  const [kindPick, setKindPick] = useState<PartyKind | "">(preset.kind ?? "");
  const [recordId, setRecordId] = useState(preset.id ?? "");
  const [workshopId, setWorkshopId] = useState(preset.workshopId ?? "");
  const [name, setName] = useState("");
  const [person, setPerson] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const template = templateById(templateId);
  // a paper offered here must fit who it is for, when that was decided before the form opened
  const allowed = useMemo(() => (preset.kind ? [preset.kind] : (preset.kinds ?? null)), [preset.kind, preset.kinds]);
  const offered = useMemo(() => TEMPLATES.filter((t) => !allowed || t.parties.some((p) => allowed.includes(p))), [allowed]);
  const kinds = template ? template.parties.filter((k) => !allowed || allowed.includes(k)) : [];
  const kind: PartyKind | "" = kindPick && kinds.includes(kindPick) ? kindPick : (kinds[0] ?? "");
  const records = kind === "team" ? desk.team : kind === "school" ? desk.schools : kind === "vendor" ? desk.vendors : [];
  const record = records.find((r) => r.id === recordId);
  const typed = kind === "other" || recordId === TYPED;
  const workshops = kind === "school" && record ? desk.workshops.filter((w) => w.schoolId === record.id && str(w.status) !== "cancelled").sort((a, b) => str(a.date).localeCompare(str(b.date))) : [];
  const workshop = workshops.find((w) => w.id === workshopId) ?? (workshops.length === 1 ? workshops[0] : undefined);
  const ready = !!template && !!kind && (typed ? !!name.trim() : !!record);

  async function make() {
    if (!template || !kind) return;
    setBusy(true);
    setError("");
    try {
      let input: NewDocInput;
      if (typed) input = { template, party: { ...emptyParty(kind), name: name.trim(), person: person.trim() } };
      else if (kind === "team" && record) input = { template, party: partyFromMember(record), sources: { member: record } };
      else if (kind === "school" && record) {
        const proposal = proposalFor(desk.proposals, record.id);
        input = { template, party: partyFromSchool(record), sources: { school: record, workshop, proposal }, workshopId: workshop?.id, proposalId: proposal?.id };
      } else if (kind === "vendor" && record) input = { template, party: partyFromVendor(record), sources: { vendor: record } };
      else return;
      const [doc] = await desk.make([input]);
      if (doc) onMade(doc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The document could not be made. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Which paper?">
        <Select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setError(""); }} disabled={!!preset.templateId}>
          <option value="">Choose a document…</option>
          {GROUPS.map((g) => {
            const list = offered.filter((t) => t.group === g.id);
            return list.length ? (
              <optgroup key={g.id} label={g.title}>
                {list.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
        </Select>
      </Field>
      {template && <p className="-mt-2 text-xs leading-relaxed text-blueprint">{template.blurb} {template.when}.</p>}

      {template && kinds.length > 1 && !preset.kind && (
        <Field label="Who is it for?">
          <Select value={kind} onChange={(e) => { setKindPick(e.target.value as PartyKind); setRecordId(""); }}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {template && kind && kind !== "other" && (
        <Field label={kind === "team" ? "Team member" : kind === "school" ? "School" : "Vendor"} help={records.length ? undefined : `No ${kind === "team" ? "team members" : kind === "school" ? "schools" : "vendors"} on record yet: type the name instead.`}>
          <Select value={recordId} onChange={(e) => { setRecordId(e.target.value); setWorkshopId(""); }} disabled={!!preset.id}>
            <option value="">Choose…</option>
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                {str(r.name)}
                {kind === "team" && str(r.role) ? ` · ${str(r.role)}` : ""}
                {kind !== "team" && str(r.city) ? ` · ${str(r.city)}` : ""}
              </option>
            ))}
            {kind !== "team" && <option value={TYPED}>Not on record: type the name</option>}
          </Select>
        </Field>
      )}

      {template && kind === "school" && workshops.length > 1 && (
        <Field label="For which workshop?">
          <Select value={workshop?.id ?? ""} onChange={(e) => setWorkshopId(e.target.value)}>
            <option value="">No particular workshop</option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {str(w.title) || "Workshop"} · {shortDate(w.date) || "no date yet"}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {template && typed && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={kind === "school" ? "School's name" : "Name of the organisation or person"} className="sm:col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Who signs for it (optional)" className="sm:col-span-2" help="For an organisation: the principal, proprietor or manager. Leave empty for a person.">
            <Input value={person} onChange={(e) => setPerson(e.target.value)} />
          </Field>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-graphite/10 pt-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" disabled={!ready || busy} onClick={make}>
          {busy ? "Making…" : "Make it"}
        </Button>
      </div>
    </div>
  );
}
