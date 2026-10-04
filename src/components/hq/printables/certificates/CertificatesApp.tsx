"use client";

import { useMemo, useState } from "react";
import { Award, Ban, Download, ExternalLink, Eye, Loader2, Printer, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ConfirmButton } from "@/components/ui/Overlay";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager, downloadText } from "@/components/hq/CollectionManager";
import { certificateCodes, useCollection, useHq, useLookup } from "@/components/hq/data";
import { EmptyState, PageHeader, Panel } from "@/components/hq/ui";
import { can, OPS_TRAINER } from "@/lib/hq/roles";
import { gradeBands, packages } from "@/lib/content/business";
import { labs } from "@/lib/content/labs";
import { uid } from "@/lib/utils";
import { isIso, parseNameLines, qs, shortDate } from "../util";
import { useToday } from "../hooks";
import { CERT_TYPES, DEFAULT_PROGRAM, certMeta, type CertRecord } from "./types";

type Tab = "issue" | "registry";
const MAX_BATCH = 400;

interface Wk {
  id: string;
  title?: string;
  date?: string;
  schoolId?: string;
  package?: string;
  [k: string]: unknown;
}

function suggestProgram(type: string, workshop: Wk | undefined, bandId: string, labSlug: string) {
  if (type === "Lab completion") return labs.find((l) => l.slug === labSlug)?.title ?? "JOVE Virtual Lab";
  if (type === "Teacher training") return "JOVE Teacher Training: Robotics & AI in the Classroom";
  if (type === "Trainer") return "JOVE Day workshops (Robotics, AI & ML)";
  const pkg = packages.find((p) => p.id === workshop?.package)?.name ?? "JOVE Day";
  const band = gradeBands.find((b) => b.id === bandId);
  return band ? `${pkg}: ${band.name} (${band.grades})` : pkg === "JOVE Day" ? DEFAULT_PROGRAM : `${pkg}: Robotics, AI & ML Workshop`;
}

/* ───────────────────────────── Issue flow ───────────────────────────── */

function IssueFlow({ initialWorkshop }: { initialWorkshop?: string }) {
  const { records: workshopRecords } = useCollection<Wk>("workshops");
  const schools = useLookup("schools");
  const { saveMany } = useCollection<CertRecord & Record<string, unknown>>("certificates");

  const [workshopId, setWorkshopId] = useState(initialWorkshop ?? "");
  const [type, setType] = useState("Participation");
  const [bandInput, setBandInput] = useState<string | null>(null);
  const [labSlug, setLabSlug] = useState(labs[0]?.slug ?? "");
  const [programInput, setProgramInput] = useState<string | null>(null);
  const today = useToday();
  const [dateInput, setDateInput] = useState<string | null>(null);
  const [schoolInput, setSchoolInput] = useState<string | null>(null);
  const [defaultGrade, setDefaultGrade] = useState("");
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ batch: string; count: number; rows: { code: string; name: string; grade: string }[] } | null>(null);

  const workshops = useMemo(() => [...workshopRecords].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))), [workshopRecords]);
  const meta = certMeta(type);

  // Everything the chosen workshop can pre-fill is derived, so it works whichever collection finishes loading first,
  // and a value the person typed always wins over the pre-fill.
  const workshop = workshops.find((w) => w.id === workshopId);
  const activeBands = workshop
    ? ([["g1-2", workshop.studentsG12], ["g3-5", workshop.studentsG35], ["g6-8", workshop.studentsG68], ["g9-10", workshop.studentsG910]] as const).filter(([, n]) => Number(n) > 0)
    : [];
  const bandId = bandInput ?? (activeBands.length === 1 ? activeBands[0][0] : "");
  const program = programInput ?? suggestProgram(type, workshop, bandId, labSlug);
  const programTouched = programInput !== null;
  const school = schoolInput ?? String(schools.get(String(workshop?.schoolId ?? ""))?.name ?? "");
  const issueDate = dateInput ?? (workshop && isIso(workshop.date) ? workshop.date.slice(0, 10) : today);

  function pickWorkshop(id: string) {
    setWorkshopId(id);
    setSchoolInput(null);
    setDateInput(null);
    setBandInput(null);
  }

  const rows = useMemo(() => parseNameLines(names, defaultGrade.trim()), [names, defaultGrade]);
  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    let d = 0;
    for (const r of rows) {
      const k = `${r.name.toLowerCase()}|${r.grade.toLowerCase()}`;
      if (seen.has(k)) d += 1;
      seen.add(k);
    }
    return d;
  }, [rows]);

  const problems = [
    !rows.length && "Paste at least one name.",
    rows.length > MAX_BATCH && `Issue at most ${MAX_BATCH} certificates at a time (you have ${rows.length}).`,
    !program.trim() && "Add the programme text.",
    !issueDate && "Pick an issue date.",
  ].filter(Boolean) as string[];

  const previewHref = `/hq/print/certificates${qs({ sample: 1, type, program: program.trim(), date: issueDate })}`;

  async function generate() {
    if (problems.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const codes = await certificateCodes(rows.length);
      const batch = uid("batch");
      await saveMany(
        rows.map((r, i) => ({
          code: codes[i],
          studentName: r.name,
          grade: r.grade,
          schoolName: school.trim(),
          workshopId: workshopId || undefined,
          program: program.trim(),
          type,
          issueDate,
          status: "valid",
          batch,
        })),
      );
      setIssued({ batch, count: rows.length, rows: rows.map((r, i) => ({ code: codes[i], name: r.name, grade: r.grade })) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the certificates. Nothing was printed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setIssued(null);
    setNames("");
    setError("");
  }

  if (issued) {
    return (
      <Panel title="Certificates issued" subtitle={`${issued.count} saved to the registry. Each one is verifiable from its QR code.`}>
        <div className="flex flex-col items-start gap-5">
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
            <ShieldCheck className="size-5 shrink-0" aria-hidden />
            <span>
              <strong>{issued.count}</strong> certificate{issued.count === 1 ? "" : "s"} for <strong>{school || "your students"}</strong> are live in the registry.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href={`/hq/print/certificates${qs({ batch: issued.batch })}`} external>
              <Printer className="size-4" /> Print {issued.count} certificate{issued.count === 1 ? "" : "s"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadText(`jove-certificates-${issueDate}.csv`, ["Certificate ID,Student,Grade", ...issued.rows.map((r) => [r.code, r.name, r.grade].map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n"))}
            >
              <Download className="size-4" /> Download ID list (CSV)
            </Button>
            <Button variant="ghost" onClick={reset}>
              Issue another batch
            </Button>
          </div>
          <p className="max-w-xl text-xs text-blueprint">Printing opens in a new tab: A4 landscape, one certificate per page. Use your browser&apos;s “Save as PDF” to send a digital copy to the school.</p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <Panel title="1. Certificate details" subtitle="Everything here is printed on the certificate, so check spelling.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Workshop (optional)" htmlFor="c-workshop" help="Pre-fills school, date and programme." className="sm:col-span-2">
            <Select id="c-workshop" value={workshopId} onChange={(e) => pickWorkshop(e.target.value)}>
              <option value="">No workshop: enter details manually</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title || "Untitled workshop"}
                  {isIso(w.date) ? ` · ${shortDate(w.date)}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Certificate type" htmlFor="c-type">
            <Select id="c-type" value={type} onChange={(e) => setType(e.target.value)}>
              {CERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.value}
                </option>
              ))}
            </Select>
          </Field>

          {type === "Lab completion" ? (
            <Field label="Virtual Lab" htmlFor="c-lab">
              <Select id="c-lab" value={labSlug} onChange={(e) => setLabSlug(e.target.value)}>
                {labs.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.title}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Grade band" htmlFor="c-band" help="Used to word the programme.">
              <Select id="c-band" value={bandId} onChange={(e) => setBandInput(e.target.value)} disabled={type === "Trainer" || type === "Teacher training"}>
                <option value="">All grade bands</option>
                {gradeBands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.grades}: {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Programme text" htmlFor="c-program" className="sm:col-span-2" help={programTouched ? undefined : "Suggested from your choices. Edit freely."}>
            <Input
              id="c-program"
              value={program}
              maxLength={120}
              onChange={(e) => {
                setProgramInput(e.target.value);
              }}
            />
            {programTouched && (
              <button type="button" onClick={() => setProgramInput(null)} className="mt-1 text-xs font-medium text-charcoal underline underline-offset-2 hover:text-graphite">
                Use the suggested wording again
              </button>
            )}
          </Field>

          <Field label={meta.school ? "School" : "School / organisation (optional)"} htmlFor="c-school">
            <Input id="c-school" value={school} onChange={(e) => setSchoolInput(e.target.value)} placeholder="Printed under the student name" />
          </Field>
          <Field label="Issue date" htmlFor="c-date" required>
            <Input id="c-date" type="date" value={issueDate} onChange={(e) => setDateInput(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="2. Who gets one?" subtitle="One person per line. Optionally add the grade after a comma: “Aarav Sharma, Grade 7B”.">
        <div className="grid gap-4">
          <Field label="Names" htmlFor="c-names" help="Paste straight from a sheet: a tab also separates name and grade. Use “First Last”, since the comma splits off the grade.">
            <Textarea
              id="c-names"
              rows={9}
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder={"Aarav Sharma, Grade 7B\nDiya Menon, Grade 7A\nIshaan Rao"}
              className="font-mono text-[13px]"
              spellCheck={false}
            />
          </Field>
          <Field label="Grade for lines without one (optional)" htmlFor="c-grade">
            <Input id="c-grade" value={defaultGrade} onChange={(e) => setDefaultGrade(e.target.value)} placeholder="e.g. Grade 6" />
          </Field>

          <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 p-4" aria-live="polite">
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-mono text-2xl font-bold tabular">{rows.length}</span>
              <span className="text-charcoal">certificate{rows.length === 1 ? "" : "s"} will be created</span>
              {duplicates > 0 && <Badge tone="warn">{duplicates} possible duplicate{duplicates === 1 ? "" : "s"}</Badge>}
            </p>
            {rows.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-charcoal">
                {rows.slice(0, 5).map((r, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-dashed border-graphite/15 pb-1">
                    <span className="truncate font-medium text-graphite">{r.name}</span>
                    <span className="shrink-0 text-blueprint">{r.grade || "no grade"}</span>
                  </li>
                ))}
                {rows.length > 5 && <li className="text-blueprint">+ {rows.length - 5} more</li>}
              </ul>
            )}
          </div>

          {problems.length > 0 && rows.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-bad">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {error && (
            <p role="alert" className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={generate} disabled={busy || problems.length > 0}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Award className="size-4" aria-hidden />}
              {busy ? "Saving…" : `Generate & save${rows.length ? ` ${rows.length}` : ""}`}
            </Button>
            <Button href={previewHref} external variant="secondary">
              <Eye className="size-4" /> Preview design
            </Button>
          </div>
          <p className="text-xs text-blueprint">Saving gives every student a unique ID and QR code and records them in the registry. You can print right after.</p>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────────── Registry ───────────────────────────── */

function RowActions({ r, canWrite }: { r: CertRecord & Record<string, unknown>; canWrite: boolean }) {
  const { save } = useCollection("certificates");
  const [busy, setBusy] = useState(false);
  const revoked = r.status === "revoked";
  async function setStatus(status: string) {
    setBusy(true);
    try {
      await save({ ...r, status });
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex items-center justify-end gap-1">
      {!revoked && (
        <Button href={`/hq/print/certificates${qs({ ids: r.id })}`} external variant="ghost" size="sm" aria-label={`Print certificate for ${r.studentName}`}>
          <Printer className="size-3.5" /> Print
        </Button>
      )}
      <Button href={`/verify/${encodeURIComponent(r.code)}`} external variant="ghost" size="sm" aria-label={`Open public verification page for ${r.code}`}>
        <ExternalLink className="size-3.5" /> Verify
      </Button>
      {canWrite &&
        (revoked ? (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setStatus("valid")}>
            <RotateCcw className="size-3.5" /> Restore
          </Button>
        ) : (
          <ConfirmButton onConfirm={() => setStatus("revoked")} message="Revoke? The public page will show it as not valid.">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad">
              <Ban className="size-3.5" /> Revoke
            </span>
          </ConfirmButton>
        ))}
    </span>
  );
}

function Registry() {
  const { user } = useHq();
  const canWrite = can(user, OPS_TRAINER);
  const { records } = useCollection<CertRecord & Record<string, unknown>>("certificates");
  const lookup = useLookup("workshops");

  const reprint = useMemo(() => {
    const out: { key: string; label: string; href: string }[] = [];
    const batches = new Map<string, CertRecord[]>();
    const loose = new Map<string, CertRecord[]>();
    for (const r of records) {
      if (r.status === "revoked") continue;
      if (r.batch) batches.set(r.batch, [...(batches.get(r.batch) ?? []), r]);
      else if (r.workshopId) loose.set(r.workshopId, [...(loose.get(r.workshopId) ?? []), r]);
    }
    for (const [batch, list] of batches) {
      const f = list[0];
      out.push({ key: `b-${batch}`, label: `${f.schoolName || "Custom batch"} · ${f.type ?? "Participation"} · ${shortDate(f.issueDate) || "undated"} (${list.length})`, href: `/hq/print/certificates${qs({ batch })}` });
    }
    for (const [workshop, list] of loose) out.push({ key: `w-${workshop}`, label: `${String(lookup.get(workshop)?.title ?? "Workshop")} (${list.length})`, href: `/hq/print/certificates${qs({ workshop })}` });
    return out.reverse();
  }, [records, lookup]);

  return (
    <CollectionManager<CertRecord & Record<string, unknown>>
      name="certificates"
      columns={["code", "studentName", "grade", "schoolName", "type", "issueDate", "status"]}
      hideNew
      emptyText="No certificates yet. Issue the first batch from the “Issue certificates” tab."
      rowActions={(r) => <RowActions r={r} canWrite={canWrite} />}
      toolbar={
        reprint.length > 0 ? (
          <div className="w-full sm:w-72">
            <Select
              aria-label="Reprint a batch"
              value=""
              className="h-10"
              onChange={(e) => {
                const hit = reprint.find((x) => x.key === e.target.value);
                if (hit) window.open(hit.href, "_blank", "noopener,noreferrer");
              }}
            >
              <option value="">Reprint a batch…</option>
              {reprint.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </Select>
          </div>
        ) : undefined
      }
    />
  );
}

/* ───────────────────────────── Shell ───────────────────────────── */

export function CertificatesApp({ initialTab, initialWorkshop }: { initialTab?: string; initialWorkshop?: string }) {
  const [tab, setTab] = useState<Tab>(initialTab === "registry" ? "registry" : "issue");
  const { records } = useCollection("certificates");
  const [showTip, setShowTip] = useState(true);

  return (
    <div>
      <PageHeader
        icon="Award"
        eyebrow="Recognition"
        title="Certificates"
        description="Issue certificates in bulk, print them one per A4 landscape page, and let anyone verify them from the QR code."
        actions={
          <Button href="/verify" external variant="secondary" size="sm">
            <ShieldCheck className="size-4" /> Public verify page
          </Button>
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "issue", label: "Issue certificates" },
          { value: "registry", label: "Registry", count: records.length },
        ]}
      />

      {tab === "issue" ? (
        <>
          {showTip && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 px-4 py-3 text-sm text-charcoal">
              <p>
                Tip: for school workshops, open a workshop in HQ → Workshops and choose <strong>Issue certificates</strong>, or pick the workshop below. QR codes point to <span className="font-mono text-xs">/verify/&lt;ID&gt;</span> on the live site, so set the
                site URL before printing the real batch.
              </p>
              <button type="button" onClick={() => setShowTip(false)} className="shrink-0 text-xs font-semibold text-charcoal underline underline-offset-2 hover:text-graphite">
                Dismiss
              </button>
            </div>
          )}
          <IssueFlow initialWorkshop={initialWorkshop} />
        </>
      ) : records.length === 0 ? (
        <EmptyState icon="Award" title="No certificates issued yet" description="Issue your first batch and it will appear here, searchable by ID or name." action={<Button size="sm" onClick={() => setTab("issue")}>Issue certificates</Button>} />
      ) : (
        <Registry />
      )}
    </div>
  );
}
