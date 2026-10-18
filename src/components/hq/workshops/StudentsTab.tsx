"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, CalendarClock, ClipboardCheck, FileDown, Printer, RotateCcw, School, Trash2, UserPlus, Users } from "lucide-react";
import { api, certificateCodes, useCollection } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { bandOf, byClass, classLabel, parseRoster, presentByBand, programFor, studentOrder, type Student } from "@/lib/hq/roster";
import { gradeBands } from "@/lib/content/business";
import { cn, formatNumber, uid } from "@/lib/utils";
import { attendedOf } from "./day";
import { bandStudents, bookedBands, str, type Rec } from "./logic";

type PatchFn = (p: Record<string, unknown>) => void;
interface Cert {
  id: string;
  code: string;
  status?: string;
}

const printLink = (ids: string[]) => `/hq/print/certificates?ids=${ids.map(encodeURIComponent).join(",")}`;

/**
 * Workshop → Students. The school's class list, pasted once, then:
 *   the day before   attendance sheets with the names on them, and every participation certificate printed in
 *                    class order, to hand out at the closing Show
 *   on the day       names ticked on paper; walk-ins written in
 *   after the day    absentees marked here (everyone else counts as present), their certificates cancelled, the
 *                    Day mode head counts filled in, walk-ins' certificates issued, one PDF per class for the school
 * Founders and admins change it; operations can look. Interns, trainers and media never see it (children's names).
 */
export function StudentsTab({ w, patch, canWrite, schoolName, today }: { w: Rec; patch: PatchFn; canWrite: boolean; schoolName: string; today: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [sha, setSha] = useState("");
  const [meta, setMeta] = useState({ updatedAt: "", updatedBy: "" });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [lastBatch, setLastBatch] = useState<string[]>([]);
  const certsQ = useCollection<Cert & Record<string, unknown>>("certificates");
  const certById = useMemo(() => new Map(certsQ.records.map((c) => [c.id, c])), [certsQ.records]);

  const load = useCallback(async () => {
    const j = await api<{ students: Student[]; sha: string; updatedAt: string; updatedBy: string }>(`/api/hq/workshops/${w.id}/students`);
    setStudents(j.students);
    setSha(j.sha);
    setMeta({ updatedAt: j.updatedAt, updatedBy: j.updatedBy });
    setStatus("ready");
  }, [w.id]);

  useEffect(() => {
    let alive = true;
    api<{ students: Student[]; sha: string; updatedAt: string; updatedBy: string }>(`/api/hq/workshops/${w.id}/students`)
      .then((j) => {
        if (!alive) return;
        setStudents(j.students);
        setSha(j.sha);
        setMeta({ updatedAt: j.updatedAt, updatedBy: j.updatedBy });
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [w.id]);

  /** Saves the whole list; on a clash with someone else's save, reloads and says so. */
  const store = useCallback(
    async (next: Student[], ok?: string) => {
      setMessage(null);
      try {
        const j = await api<{ sha: string; updatedAt: string; updatedBy: string }>(`/api/hq/workshops/${w.id}/students`, { method: "PUT", body: JSON.stringify({ students: next, sha }) });
        setStudents(next);
        setSha(j.sha);
        setMeta({ updatedAt: j.updatedAt, updatedBy: j.updatedBy });
        if (ok) setMessage({ tone: "ok", text: ok });
        return true;
      } catch (e) {
        const text = e instanceof Error ? e.message : "Could not save the list.";
        setMessage({ tone: "bad", text: /conflict|changed|409/i.test(text) ? "Someone else changed this list a moment ago. It has been reloaded: make your change again." : text });
        await load().catch(() => {});
        return false;
      }
    },
    [w.id, sha, load],
  );

  const bands = bookedBands(w);
  const sorted = useMemo(() => [...students].sort(studentOrder), [students]);
  const classes = useMemo(() => byClass(students), [students]);
  const absent = students.filter((s) => s.absent);
  const certOf = (s: Student) => (s.certId ? certById.get(s.certId) : undefined);
  const validCert = (s: Student) => {
    const c = certOf(s);
    return !!c && (c.status ?? "valid") !== "revoked";
  };
  const toIssue = students.filter((s) => !s.absent && !s.certId);
  const toCancel = absent.filter(validCert);
  const toRestore = students.filter((s) => !s.absent && s.certId && certOf(s) && !validCert(s));
  const handOut = sorted.filter((s) => !s.absent && validCert(s));
  const dayDone = !!str(w.date) && str(w.date) < today;
  const counts = presentByBand(students);
  const att = attendedOf(w);
  const countsDiffer = Object.entries(counts).some(([b, n]) => att[b as keyof typeof att] !== n);
  const outOfBand = students.filter((s) => {
    const b = bandOf(s.grade);
    return !b || !bands.some((x) => x.id === b);
  });

  async function issue() {
    if (!toIssue.length) return;
    setBusy("issue");
    setMessage(null);
    try {
      const codes = await certificateCodes(toIssue.length);
      const batch = uid("batch");
      const saved = (await certsQ.saveMany(
        toIssue.map((s, i) => ({
          code: codes[i],
          studentName: s.name,
          grade: classLabel(s),
          schoolName,
          workshopId: w.id,
          program: programFor(str(w.package) || undefined, s.grade),
          type: "Participation",
          issueDate: str(w.date) || today,
          status: "valid",
          batch,
        })),
      )) as Cert[];
      const byCode = new Map(saved.map((c) => [c.code, c]));
      const next = students.map((s) => {
        const i = toIssue.findIndex((t) => t.id === s.id);
        if (i < 0) return s;
        const c = byCode.get(codes[i]);
        return c ? { ...s, certId: c.id, certCode: c.code } : s;
      });
      const ids = [...next].sort(studentOrder).filter((s) => toIssue.some((t) => t.id === s.id) && s.certId).map((s) => s.certId!);
      setLastBatch(ids);
      await store(next, `${formatNumber(ids.length)} participation certificates issued. Print them below, in class order.`);
    } catch (e) {
      setMessage({ tone: "bad", text: e instanceof Error ? e.message : "Could not issue the certificates." });
    } finally {
      setBusy("");
    }
  }

  async function setCertStatus(list: Student[], to: "valid" | "revoked", done: string) {
    setBusy(to);
    setMessage(null);
    try {
      await certsQ.saveMany(list.map((s) => ({ ...certOf(s)!, status: to })));
      setMessage({ tone: "ok", text: done });
    } catch (e) {
      setMessage({ tone: "bad", text: e instanceof Error ? e.message : "Could not change the certificates." });
    } finally {
      setBusy("");
    }
  }

  function updateCounts() {
    patch({ attended: { ...att, ...counts } });
    setMessage({ tone: "ok", text: "Day mode head counts now match this list." });
  }

  if (status === "loading") return <div className="h-40 animate-pulse rounded-[var(--radius-md)] bg-graphite/[0.05]" aria-hidden />;
  if (status === "error") return <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">Could not load the student list. Refresh the page to try again.</p>;

  const booked = bands.reduce((n, b) => n + bandStudents(w, b.id), 0);

  return (
    <div className="space-y-6" data-students>
      <Steps hasList={students.length > 0} issued={students.some((s) => s.certId)} dayDone={dayDone} />

      {message && (
        <p role="status" className={cn("rounded-[var(--radius-sm)] border px-3 py-2 text-sm", message.tone === "ok" ? "border-ok/30 bg-ok/10 text-ok" : "border-bad/30 bg-bad/10 text-bad")}>
          {message.text}
        </p>
      )}

      {students.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="On the list" value={formatNumber(students.length)} sub={booked ? `${formatNumber(booked)} booked` : undefined} />
          <Stat label="Absent" value={formatNumber(absent.length)} sub={dayDone ? "Ticked after the day" : "Marked after the day"} />
          <Stat label="Certificates to hand out" value={formatNumber(handOut.length)} sub={toIssue.length ? `${formatNumber(toIssue.length)} not issued yet` : "All issued"} />
          <Stat label="Classes" value={formatNumber(classes.length)} sub={classes.slice(0, 3).map((c) => c.label).join(", ") + (classes.length > 3 ? "…" : "")} />
        </div>
      )}

      {students.length > 0 && bands.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-xs">
          {bands.map((b) => {
            const listed = students.filter((s) => bandOf(s.grade) === b.id).length;
            const exp = bandStudents(w, b.id);
            return (
              <li key={b.id} className={cn("rounded-full border px-3 py-1", listed === exp ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/40 bg-warn/10 text-graphite")}>
                {b.grades}: {formatNumber(listed)} on the list · {formatNumber(exp)} booked
              </li>
            );
          })}
          {outOfBand.length > 0 && <li className="rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-graphite">{formatNumber(outOfBand.length)} with a grade not booked for this day</li>}
        </ul>
      )}

      {students.length > 0 && (
        <Panel title="What to do now" subtitle="In order: the day before, then after the day.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="annot text-[10px] text-blueprint">The day before</p>
              <Action icon={<ClipboardCheck className="size-4" />} title="Print the attendance sheets" text="One sheet per class, with the names on it and blank rows for walk-ins.">
                <Button href={`/hq/print/attendance/${w.id}`} external size="sm" variant="secondary">
                  <Printer className="size-4" aria-hidden /> Attendance sheets
                </Button>
              </Action>
              <Action icon={<Award className="size-4" />} title="Issue the participation certificates" text={toIssue.length ? `For ${formatNumber(toIssue.length)} student${toIssue.length === 1 ? "" : "s"} on the list without one. Each gets an ID and a QR code.` : "Every student on the list has one."}>
                {canWrite && toIssue.length > 0 && (
                  <Button size="sm" onClick={() => void issue()} disabled={!!busy}>
                    {busy === "issue" ? "Issuing…" : `Issue ${formatNumber(toIssue.length)}`}
                  </Button>
                )}
              </Action>
              <Action icon={<Printer className="size-4" />} title="Print the certificates, class by class" text="In the order of the classes below, so each class's pile is ready for the closing Show.">
                {handOut.length > 0 && (
                  <Button href={printLink(handOut.map((s) => s.certId!))} external size="sm" variant="secondary">
                    <Printer className="size-4" aria-hidden /> All {formatNumber(handOut.length)}
                  </Button>
                )}
                {lastBatch.length > 0 && lastBatch.length !== handOut.length && (
                  <Button href={printLink(lastBatch)} external size="sm" variant="ghost">
                    Only the {formatNumber(lastBatch.length)} just issued
                  </Button>
                )}
              </Action>
            </div>
            <div className="space-y-2">
              <p className="annot text-[10px] text-blueprint">After the day</p>
              <Action icon={<Users className="size-4" />} title="Tick the absent students below" text="From the signed attendance sheets. Add walk-ins with the box at the bottom, ticked as walk-ins, and issue their certificates above.">
                {null}
              </Action>
              <Action icon={<RotateCcw className="size-4" />} title="Cancel the certificates of absent students" text={toCancel.length ? `${formatNumber(toCancel.length)} printed certificate${toCancel.length === 1 ? "" : "s"} for absent students: cancel them here, and tear up the paper copies.` : "None to cancel."}>
                {canWrite && toCancel.length > 0 && (
                  <Button size="sm" variant="danger" onClick={() => void setCertStatus(toCancel, "revoked", `${formatNumber(toCancel.length)} certificates cancelled. Their QR codes now say “not valid”.`)} disabled={!!busy}>
                    Cancel {formatNumber(toCancel.length)}
                  </Button>
                )}
                {canWrite && toRestore.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => void setCertStatus(toRestore, "valid", `${formatNumber(toRestore.length)} certificates restored.`)} disabled={!!busy}>
                    Restore {formatNumber(toRestore.length)} (no longer absent)
                  </Button>
                )}
              </Action>
              <Action icon={<CalendarClock className="size-4" />} title="Fill in the Day mode head counts" text={`From this list: ${bands.map((b) => `${b.grades} ${formatNumber(counts[b.id] ?? 0)}`).join(" · ") || "no grade groups booked"}.`}>
                {canWrite && countsDiffer && (
                  <Button size="sm" variant="secondary" onClick={updateCounts}>
                    Use these counts
                  </Button>
                )}
                {!countsDiffer && <span className="text-xs text-ok">Day mode already matches</span>}
              </Action>
              <Action icon={<FileDown className="size-4" />} title="Soft copy for the school" text="Open a class, then “Save as PDF” in the print window. Email the PDFs to the school the same day.">
                {null}
              </Action>
              <ul className="ml-9 flex flex-wrap gap-1.5">
                {classes.map((c) => {
                  const ids = c.students.filter((s) => !s.absent && validCert(s)).map((s) => s.certId!);
                  return ids.length ? (
                    <li key={c.label}>
                      <a href={printLink(ids)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-graphite/20 px-2.5 py-1 text-xs font-semibold text-graphite hover:border-graphite">
                        <FileDown className="size-3" aria-hidden /> {c.label} ({ids.length})
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          </div>
        </Panel>
      )}

      {students.length > 0 && (
        <Panel title={`The list · ${formatNumber(students.length)} students`} subtitle={meta.updatedAt ? `Last saved ${new Date(meta.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} by ${meta.updatedBy}` : undefined}>
          <div className="space-y-5">
            {classes.map((c) => (
              <section key={c.label} aria-label={c.label}>
                <h4 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-graphite">
                  <School className="size-4 text-blueprint" aria-hidden /> {c.label} <span className="font-normal text-blueprint">· {c.students.length}</span>
                </h4>
                <div className="hq-scroll overflow-x-auto rounded-[var(--radius-sm)] border border-graphite/12" data-lenis-prevent>
                  <table className="w-full min-w-[560px] text-sm">
                    <tbody>
                      {c.students.map((s, i) => {
                        const cert = certOf(s);
                        return (
                          <tr key={s.id} className={cn("border-b border-graphite/[0.07] last:border-0", s.absent && "bg-graphite/[0.03] text-blueprint")} data-student={s.name}>
                            <td className="w-10 px-3 py-2 font-mono text-xs text-blueprint">{i + 1}</td>
                            <td className={cn("px-3 py-2 font-medium", s.absent ? "line-through" : "text-graphite")}>
                              {s.name}
                              {s.walkIn && <span className="ml-2 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info">walk-in</span>}
                            </td>
                            <td className="w-44 px-3 py-2 font-mono text-[11px]">{cert ? <span className={(cert.status ?? "valid") === "revoked" ? "text-bad line-through" : "text-graphite"}>{cert.code}</span> : <span className="text-blueprint">no certificate yet</span>}</td>
                            <td className="w-28 px-3 py-2">
                              <label className={cn("flex items-center gap-2 text-xs", !canWrite && "opacity-60")}>
                                <input type="checkbox" checked={!!s.absent} disabled={!canWrite || !!busy} onChange={(e) => void store(students.map((x) => (x.id === s.id ? { ...x, absent: e.target.checked || undefined } : x)))} aria-label={`${s.name} absent`} />
                                Absent
                              </label>
                            </td>
                            <td className="w-10 px-2 py-2 text-right">
                              {canWrite && (
                                <button
                                  type="button"
                                  title={`Remove ${s.name} from the list`}
                                  aria-label={`Remove ${s.name}`}
                                  className="rounded p-1 text-blueprint hover:bg-bad/10 hover:text-bad"
                                  onClick={() => {
                                    if (s.certId && validCert(s) && !window.confirm(`${s.name} has a certificate (${s.certCode}). Removing them from the list does not cancel it: cancel it in Certificates if it should not exist. Remove from the list?`)) return;
                                    void store(students.filter((x) => x.id !== s.id), `${s.name} removed from the list.`);
                                  }}
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </Panel>
      )}

      {canWrite ? (
        <AddStudents
          first={students.length === 0}
          dayDone={dayDone}
          onAdd={async (rows, walkIn) => {
            const have = new Set(students.map((s) => `${s.name.toLowerCase()}|${classLabel(s)}`));
            const fresh = rows.filter((r) => !have.has(`${r.name.toLowerCase()}|${classLabel(r)}`));
            const dupes = rows.length - fresh.length;
            const next = [...students, ...fresh.map((r) => ({ id: uid("st"), name: r.name, grade: r.grade, ...(r.section ? { section: r.section } : {}), ...(walkIn ? { walkIn: true } : {}) }))];
            return store(next, `${formatNumber(fresh.length)} added${dupes ? `; ${dupes} already on the list were skipped` : ""}.`);
          }}
        />
      ) : (
        students.length === 0 && <p className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 bg-paper px-4 py-5 text-sm text-charcoal">No student list yet. A founder pastes the school&apos;s class lists here the day before the workshop.</p>
      )}

      <p className="text-xs text-blueprint">Only founders, admins and operations see this list. Keep just name, grade and section: never ask the school for phone numbers, addresses or dates of birth.</p>
    </div>
  );
}

function Steps({ hasList, issued, dayDone }: { hasList: boolean; issued: boolean; dayDone: boolean }) {
  const steps = [
    { when: "3 days before", what: "Ask the school for its class lists: name, grade, section only.", done: hasList },
    { when: "The day before", what: "Paste the lists here. Print the attendance sheets; issue and print the certificates.", done: issued },
    { when: "On the day", what: "Tick names on the sheets. Hand out the certificates at the closing Show.", done: dayDone },
    { when: "After the day", what: "Tick absentees here, cancel their certificates, fill the head counts, email the PDFs.", done: false },
  ];
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.when} className={cn("rounded-[var(--radius-sm)] border px-3 py-2.5", s.done ? "border-ok/30 bg-ok/[0.06]" : "border-graphite/12 bg-paper-50")}>
          <p className="annot text-[10px] text-blueprint">
            {String(i + 1).padStart(2, "0")} · {s.when} {s.done && <span className="text-ok">✓</span>}
          </p>
          <p className="mt-1 text-xs leading-snug text-charcoal">{s.what}</p>
        </li>
      ))}
    </ol>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50 px-4 py-3">
      <p className="annot text-[10px] text-blueprint">{label}</p>
      <p className="tabular mt-1 font-mono text-2xl font-semibold text-graphite">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-charcoal">{sub}</p>}
    </div>
  );
}

function Action({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper px-3 py-2.5">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-graphite/[0.07] text-graphite">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-graphite">{title}</p>
        <p className="text-xs text-charcoal">{text}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

function AddStudents({ first, dayDone, onAdd }: { first: boolean; dayDone: boolean; onAdd: (rows: { name: string; grade: string; section: string }[], walkIn: boolean) => Promise<boolean> }) {
  const [text, setText] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [walkIn, setWalkIn] = useState(dayDone);
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => parseRoster(text, { grade, section }), [text, grade, section]);
  const groups = useMemo(() => byClass(parsed.rows.map((r, i) => ({ id: String(i), ...r }))), [parsed.rows]);
  const noGrade = parsed.rows.filter((r) => !bandOf(r.grade)).length;

  return (
    <Panel title={first ? "Paste the school's class lists" : "Add students"} subtitle={first ? "One student per line: Name, Grade, Section. Or copy the columns straight from Excel or Google Sheets." : "Students the school sent later, or walk-ins on the day."}>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Field label="Names" htmlFor="st-paste">
          <Textarea id="st-paste" rows={first ? 10 : 5} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Aarav Sharma, 7, B\nDiya Menon, 7, B\nIshaan Rao, 8, A"} className="font-mono text-sm" />
        </Field>
        <div className="space-y-3">
          <Field label="Grade for lines without one" htmlFor="st-grade" help="When you paste one class at a time">
            <Input id="st-grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 7" />
          </Field>
          <Field label="Section for lines without one" htmlFor="st-sec">
            <Input id="st-sec" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. B" />
          </Field>
          {!first && (
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={walkIn} onChange={(e) => setWalkIn(e.target.checked)} /> These are walk-ins (came on the day)
            </label>
          )}
        </div>
      </div>
      {parsed.rows.length > 0 && (
        <p className="mt-3 text-sm text-charcoal">
          <strong className="text-graphite">{formatNumber(parsed.rows.length)} students</strong> in {groups.length} class{groups.length === 1 ? "" : "es"}: {groups.map((g) => `${g.label} (${g.students.length})`).join(", ")}
          {noGrade > 0 && <span className="text-warn"> · {noGrade} without a grade 1–10: check them</span>}
        </p>
      )}
      {parsed.problems.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-xs text-bad">
          {parsed.problems.slice(0, 5).map((p) => (
            <li key={p}>{p} (left out)</li>
          ))}
        </ul>
      )}
      <Button
        className="mt-4"
        disabled={busy || parsed.rows.length === 0}
        onClick={async () => {
          setBusy(true);
          const ok = await onAdd(parsed.rows, !first && walkIn);
          setBusy(false);
          if (ok) setText("");
        }}
      >
        <UserPlus className="size-4" aria-hidden /> {busy ? "Saving…" : first ? `Save the list (${formatNumber(parsed.rows.length)})` : `Add ${formatNumber(parsed.rows.length)}`}
      </Button>
      {first && <p className="mt-2 text-xs text-blueprint">Grades 1–2 → Little Inventors, 3–5 → Young Makers, 6–8 → Robo Engineers, 9–10 → AI Innovators: the grade decides the programme printed on each certificate ({gradeBands.map((b) => b.name).join(", ")}).</p>}
    </Panel>
  );
}
