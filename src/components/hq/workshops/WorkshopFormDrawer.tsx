"use client";

import { useMemo, useState } from "react";
import { Calculator, Loader2, School, Trash2 } from "lucide-react";
import { getCollection } from "@/lib/hq/collections";
import { can, OPS, OPS_MEDIA } from "@/lib/hq/roles";
import { joveDayRules } from "@/lib/content/business";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { formatDateTime, formatINR, formatNumber } from "@/lib/utils";
import { useCollection, useHq, useLookup } from "@/components/hq/data";
import { RecordForm } from "@/components/hq/fields";
import { fillFromSchool, num, optionLabel, PACKAGE_OPTIONS, str, workshopValue, type Rec } from "./logic";
import { Notice } from "./bits";

const def = getCollection("workshops")!;

/**
 * Create / edit a workshop. Controlled: `value` is the draft (null = closed).
 * New drafts auto-fill from the chosen school (students, contacts, distance, amount).
 */
export function WorkshopFormDrawer({
  value,
  onChange,
  onClose,
  onSaved,
  onDeleted,
}: {
  value: Record<string, unknown> | null;
  onChange: (next: Record<string, unknown>) => void;
  onClose: () => void;
  onSaved?: (saved: Rec, isNew: boolean) => void;
  onDeleted?: () => void;
}) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const canSchools = can(user, OPS_MEDIA);
  const { save, remove } = useCollection("workshops");
  const schools = useLookup(canSchools ? "schools" : "__none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isNew = !value?.id;
  const school = value?.schoolId ? schools.get(str(value.schoolId)) : undefined;
  const calc = useMemo(() => (value ? workshopValue(value) : null), [value]);

  function change(next: Record<string, unknown>) {
    if (value && isNew && next.schoolId !== value.schoolId && next.schoolId) {
      const prev = value.schoolId ? schools.get(str(value.schoolId)) : undefined;
      onChange(fillFromSchool(next, schools.get(str(next.schoolId)), prev));
      return;
    }
    onChange(next);
  }

  async function submit() {
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const saved = await save(value);
      onSaved?.(saved, isNew);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!value?.id) return;
    if (!window.confirm("Delete this workshop? Linked trips and media deliverables stay. The change is recorded in the history.")) return;
    setBusy(true);
    try {
      await remove(String(value.id));
      onDeleted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setError("");
    onClose();
  }

  return (
    <Drawer
      open={!!value}
      onClose={close}
      title={isNew ? "New workshop" : `Edit: ${str(value?.title)}`}
      subtitle={!isNew && value?.updatedAt ? `Last updated ${formatDateTime(String(value.updatedAt))} by ${str(value.updatedBy) || "—"}` : "Pick the school first — counts, contacts and the amount fill in automatically."}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && !isNew && (
            <button type="button" onClick={del} disabled={busy} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10">
              <Trash2 className="size-3.5" aria-hidden /> Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              {canWrite ? "Cancel" : "Close"}
            </Button>
            {canWrite && (
              <Button size="sm" onClick={submit} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} {isNew ? "Create workshop" : "Save"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {value && (
        <>
          {!canWrite && <Notice className="mb-4">{store.writable ? "You have view-only access to workshops." : "HQ is in read-only mode."}</Notice>}

          {school && isNew && (
            <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50 px-4 py-3">
              <School className="mt-0.5 size-4 shrink-0 text-blueprint" aria-hidden />
              <div className="min-w-0 text-xs text-charcoal">
                <p className="font-semibold text-graphite">{str(school.name)}</p>
                <p>
                  {[str(school.city), str(school.board), school.distanceKm ? `${formatNumber(num(school.distanceKm))} km from base` : ""].filter(Boolean).join(" · ") || "No city / board recorded"}
                </p>
              </div>
              <button
                type="button"
                className="ml-auto shrink-0 rounded px-2 py-1 text-[11px] font-semibold text-graphite underline-offset-2 hover:underline"
                onClick={() =>
                  onChange(
                    fillFromSchool(
                      { ...value, title: "", schoolContact: "", schoolContactPhone: "", studentsG12: "", studentsG35: "", studentsG68: "", studentsG910: "", distanceKm: "", agreedAmount: "" },
                      school,
                    ),
                  )
                }
              >
                Refill from school
              </button>
            </div>
          )}

          <RecordForm def={def} value={value} onChange={change} disabled={!canWrite} exclude={["report", "feedbackScore"]} />

          {calc && (
            <section className="relative mt-6 overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50" aria-labelledby="pricing-helper">
              <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden />
              <div className="relative p-4">
                <div className="flex items-center gap-2">
                  <Calculator className="size-4 text-blueprint" aria-hidden />
                  <h3 id="pricing-helper" className="text-sm font-semibold">
                    Pricing helper · {optionLabel(PACKAGE_OPTIONS, calc.pkg)}
                  </h3>
                </div>
                {calc.lines.length ? (
                  <table className="mt-3 w-full text-xs">
                    <tbody>
                      {calc.lines.map((l) => (
                        <tr key={l.band.id} className="border-b border-dashed border-graphite/10">
                          <td className="py-1.5 text-charcoal">
                            {l.band.name} <span className="text-blueprint">({l.band.grades})</span>
                          </td>
                          <td className="tabular py-1.5 text-right font-mono text-charcoal">
                            {formatNumber(l.students)} × {formatINR(l.rate)}
                          </td>
                          <td className="tabular w-28 py-1.5 text-right font-mono font-semibold">{formatINR(l.amount)}</td>
                        </tr>
                      ))}
                      {calc.minimumApplies && (
                        <tr>
                          <td colSpan={2} className="py-1.5 text-warn">
                            Minimum billing applies (below {joveDayRules.minimumStudents} students / {formatINR(joveDayRules.minimumBilling)})
                          </td>
                          <td className="tabular py-1.5 text-right font-mono font-semibold">{formatINR(joveDayRules.minimumBilling)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-2 text-xs text-blueprint">Add student counts per grade band to compute the value.</p>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-charcoal">
                    Computed value <span className="text-blueprint">(ex-GST)</span>{" "}
                    <span className="tabular ml-1 font-mono text-base font-bold text-graphite">{formatINR(calc.value)}</span>
                  </p>
                  {canWrite && calc.value > 0 && num(value.agreedAmount) !== calc.value && (
                    <Button size="sm" variant="secondary" onClick={() => onChange({ ...value, agreedAmount: calc.value })}>
                      Use as agreed amount
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}

          {error && (
            <Notice tone="bad" className="mt-4">
              {error}
            </Notice>
          )}
        </>
      )}
    </Drawer>
  );
}
