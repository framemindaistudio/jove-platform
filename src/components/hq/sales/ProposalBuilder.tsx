"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy, ExternalLink, Loader2, Printer, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { addOns, gradeBands, joveDayRules, mediaPack } from "@/lib/content/business";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/Overlay";
import { Checkbox, Input, Label, Select, Textarea } from "@/components/ui/form";
import { nextNumber, useCollection, useHq } from "@/components/hq/data";
import { LineItemsEditor } from "@/components/hq/fields";
import { EmptyState, Loading, PageHeader, Panel } from "@/components/hq/ui";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import { BackLink, Notice } from "./bits";
import { addDays, BAND_FIELDS, schoolStudents, str, todayIso } from "./crm";
import {
  addOnListRate,
  bandRate,
  CLUB_MIN_STUDENTS,
  CLUB_PRICE_PER_STUDENT_MONTH,
  defaultAddOnQty,
  PACKAGE_CHOICES,
  priceProposal,
  TAKE_HOME_KITS_MIN,
  unitLabel,
  YEAR_SMM_DISCOUNT_PERCENT,
  type ProposalPackageId,
  type ProposalPricing,
} from "./pricing";

const proposalsDef = getCollection("proposals")!;
const STATUS_OPTIONS = proposalsDef.fields.find((f) => f.key === "status")?.options ?? [];
const BAND_KEYS = Object.values(BAND_FIELDS);

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const mapOf = (v: unknown): Record<string, number> =>
  v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, num(x)])) : {};
const listOf = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/** Spread a bare total across the four grade groups in proportion to the grades each covers (2/3/3/2 of 10). */
function spreadTotal(total: number): Record<string, number> {
  const weights = [2, 3, 3, 2];
  const parts = weights.map((w) => Math.round((total * w) / 10));
  const diff = total - parts.reduce((a, b) => a + b, 0);
  parts[parts.indexOf(Math.max(...parts))] += diff;
  return Object.fromEntries(BAND_KEYS.map((k, i) => [k, Math.max(0, parts[i])]));
}

function blankProposal(school?: BaseRecord): Record<string, unknown> {
  const today = todayIso();
  const counts = school ? Object.fromEntries(BAND_KEYS.map((k) => [k, num(school[k])])) : Object.fromEntries(BAND_KEYS.map((k) => [k, 0]));
  const hasSplit = BAND_KEYS.some((k) => num(counts[k]) > 0);
  const total = school ? num(school.studentsTotal) : 0;
  return {
    status: "draft",
    date: today,
    validUntil: addDays(today, 30),
    schoolId: school?.id ?? "",
    packageId: "jove-day",
    ...(hasSplit || !total ? counts : spreadTotal(total)),
    discountPercent: 0,
    months: 1,
    addOns: [],
    addOnQty: {},
    addOnRate: {},
    extraItems: [],
    notes: "",
  };
}

/* ─────────────────────────── loader / not-found ─────────────────────────── */

export function ProposalBuilder({ id, schoolId, created }: { id?: string; schoolId?: string; created?: boolean }) {
  const proposals = useCollection("proposals");
  const schools = useCollection("schools");

  if (proposals.loading || schools.loading) return <Loading label="Loading proposal…" />;
  const existing = id ? proposals.records.find((r) => r.id === id) : undefined;
  if (id && !existing) {
    return (
      <div>
        <BackLink href="/hq/proposals">Proposals</BackLink>
        <EmptyState
          icon="FileSignature"
          title="Proposal not found"
          description="It may have been deleted, or the link is out of date."
          action={
            <Button size="sm" href="/hq/proposals">
              All proposals
            </Button>
          }
        />
      </div>
    );
  }
  return <BuilderForm key={existing?.id ?? "new"} initial={existing ?? null} presetSchool={schoolId ? schools.records.find((s) => s.id === schoolId) : undefined} created={created} />;
}

/* ─────────────────────────── the builder ─────────────────────────── */

function BuilderForm({ initial, presetSchool, created }: { initial: BaseRecord | null; presetSchool?: BaseRecord; created?: boolean }) {
  const router = useRouter();
  const { user, store } = useHq();
  const proposals = useCollection("proposals");
  const schoolsCol = useCollection("schools");
  const activities = useCollection("activities");
  const canWrite = can(user, proposalsDef.write) && store.writable;

  const [form, setForm] = useState<Record<string, unknown>>(() => (initial ? { ...initial } : blankProposal(presetSchool)));
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(initial ?? null));
  const [persistedStatus, setPersistedStatus] = useState<string>(() => str(initial?.status));
  const [saving, setSaving] = useState<"save" | "pdf" | "send" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(created ? "Proposal created." : "");

  const set = (patch: Record<string, unknown>) => {
    setForm((f) => ({ ...f, ...patch }));
    setNotice("");
  };

  const schools = useMemo(() => [...schoolsCol.records].sort((a, b) => str(a.name).localeCompare(str(b.name))), [schoolsCol.records]);
  const school = schools.find((s) => s.id === form.schoolId);
  const pricing = useMemo(() => priceProposal(form), [form]);
  const packageId = pricing.packageId;

  const isNew = !form.id;
  const dirty = isNew || JSON.stringify(form) !== snapshot;

  useEffect(() => {
    if (!dirty || isNew) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, isNew]);

  /* ── school ── */
  function chooseSchool(schoolId: string) {
    const next = schools.find((s) => s.id === schoolId);
    setForm((f) => {
      const prev = schools.find((s) => s.id === f.schoolId);
      const empty = BAND_KEYS.every((k) => num(f[k]) === 0);
      const sameAsPrev = !!prev && BAND_KEYS.every((k) => num(f[k]) === num(prev[k]));
      const patch: Record<string, unknown> = { schoolId };
      if (next && (empty || sameAsPrev)) {
        const split = BAND_KEYS.some((k) => num(next[k]) > 0);
        Object.assign(patch, split ? Object.fromEntries(BAND_KEYS.map((k) => [k, num(next[k])])) : num(next.studentsTotal) > 0 ? spreadTotal(num(next.studentsTotal)) : {});
      }
      return { ...f, ...patch };
    });
    setNotice("");
  }

  function applySchoolNumbers() {
    if (!school) return;
    const split = BAND_KEYS.some((k) => num(school[k]) > 0);
    const total = num(school.studentsTotal);
    set(split ? Object.fromEntries(BAND_KEYS.map((k) => [k, num(school[k])])) : total > 0 ? spreadTotal(total) : {});
  }

  /* ── add-ons ── */
  function toggleAddOn(id: string, on: boolean) {
    const a = addOns.find((x) => x.id === id);
    setForm((f) => {
      const cur = new Set(listOf(f.addOns));
      if (on) cur.add(id);
      else cur.delete(id);
      const qty = mapOf(f.addOnQty);
      if (on && a && !(id in qty)) qty[id] = defaultAddOnQty(a);
      return { ...f, addOns: addOns.map((x) => x.id).filter((x) => cur.has(x)), addOnQty: qty };
    });
    setNotice("");
  }
  function setAddOnQty(id: string, q: number) {
    set({ addOnQty: { ...mapOf(form.addOnQty), [id]: q } });
  }
  function setAddOnRate(id: string, rate: number, listRate: number) {
    const cur = { ...mapOf(form.addOnRate) };
    if (!rate || rate === listRate) delete cur[id];
    else cur[id] = rate;
    set({ addOnRate: cur });
  }

  /* ── persistence ── */
  async function persist(overrides: Record<string, unknown> = {}, mode: "save" | "pdf" | "send" = "save"): Promise<BaseRecord | null> {
    if (!form.schoolId) {
      setError("Choose the school this proposal is for.");
      return null;
    }
    setSaving(mode);
    setError("");
    setNotice("");
    try {
      const merged = { ...form, ...overrides };
      const p = priceProposal(merged);
      const number = str(merged.number) || (await nextNumber("proposal"));
      const record = {
        ...merged,
        number,
        packageId: p.packageId,
        months: p.months,
        discountPercent: p.discountPercent,
        total: p.subtotal,
        grandTotal: p.grandTotal,
        status: str(merged.status) || "draft",
      };
      const saved = await proposals.save(record);
      setForm(saved);
      setSnapshot(JSON.stringify(saved));
      const prev = persistedStatus;
      setPersistedStatus(str(saved.status));
      let crmNote = "";
      try {
        crmNote = await syncCrm(saved, p, prev);
      } catch {
        crmNote = " The CRM could not be updated automatically.";
      }
      setNotice(`Saved as ${number}.${crmNote}`);
      if (isNew) router.replace(`/hq/proposals/${saved.id}?created=1`);
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the proposal");
      return null;
    } finally {
      setSaving(null);
    }
  }

  /** Keep the school's stage, deal value and follow-ups in step with the proposal's status. */
  async function syncCrm(saved: BaseRecord, p: ProposalPricing, prevStatus: string) {
    const target = schoolsCol.records.find((s) => s.id === saved.schoolId);
    if (!target) return "";
    const status = str(saved.status);
    if (status === prevStatus || (status !== "sent" && status !== "accepted")) return "";
    const today = todayIso();
    const stage = str(target.stage) || "lead";
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];
    if (status === "sent") {
      if (["lead", "contacted", "meeting"].includes(stage)) {
        patch.stage = "proposal";
        notes.push("School moved to Proposal sent");
      }
      if (!num(target.dealValue)) patch.dealValue = p.subtotal;
      if (!target.nextFollowUp || str(target.nextFollowUp) <= today) {
        patch.nextFollowUp = addDays(today, 3);
        notes.push("follow-up set for 3 days from now");
      }
      patch.lastContact = today;
    } else {
      if (stage !== "won") {
        patch.stage = "won";
        notes.push("School marked Won");
      }
      patch.dealValue = p.subtotal;
    }
    await schoolsCol.save({ ...target, ...patch });
    await activities.save({
      schoolId: target.id,
      type: "Proposal",
      date: today,
      summary:
        status === "sent"
          ? `Proposal ${str(saved.number)} sent — ${p.pkg.name}, ${formatNumber(p.students)} students, ${formatINR(p.subtotal)} + GST`
          : `Proposal ${str(saved.number)} accepted — ${p.pkg.name}, ${formatINR(p.subtotal)} + GST`,
      outcome: status === "accepted" ? "Positive" : "Neutral",
      nextStep: status === "sent" ? "Follow up on the proposal" : "Confirm the date and collect the advance",
      nextDate: addDays(today, status === "sent" ? 3 : 2),
      by: user.name,
    });
    return notes.length ? ` ${notes.join("; ")}.` : "";
  }

  async function saveAndOpenPdf() {
    const saved = dirty ? await persist({}, "pdf") : form;
    const id = str(saved?.id);
    if (id) router.push(`/hq/print/proposal/${id}`);
  }

  async function duplicate() {
    if (!form.id) return;
    setSaving("save");
    setError("");
    try {
      const copy = { ...form, number: "", status: "draft", date: todayIso(), validUntil: addDays(todayIso(), 30) } as Record<string, unknown>;
      delete copy.id;
      delete copy.createdAt;
      delete copy.updatedAt;
      delete copy.createdBy;
      delete copy.updatedBy;
      const saved = await proposals.save({ ...copy, number: await nextNumber("proposal") });
      router.push(`/hq/proposals/${saved.id}?created=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not duplicate");
      setSaving(null);
    }
  }

  async function remove() {
    try {
      await proposals.remove(str(form.id));
      router.push("/hq/proposals");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  const status = str(form.status) || "draft";
  const splitCount = BAND_KEYS.reduce((s, k) => s + num(form[k]), 0);
  const schoolTotalOnly = !!school && !BAND_KEYS.some((k) => num(school[k]) > 0) && num(school.studentsTotal) > 0;
  const busy = saving !== null;

  return (
    <div>
      <BackLink href="/hq/proposals">Proposals</BackLink>
      <PageHeader
        eyebrow="Sales · 03"
        title={isNew ? "New proposal" : `Proposal ${str(form.number) || "(draft)"}`}
        icon="FileSignature"
        description={school ? `For ${str(school.name)}${school.city ? `, ${str(school.city)}` : ""} — pricing updates live from the JOVE price book.` : "Choose a school, a package and the student numbers — pricing updates live from the JOVE price book."}
        actions={
          <>
            <Badge tone={statusTone(status)} dot>
              {status}
            </Badge>
            {!isNew && !dirty && (
              <Button variant="secondary" size="sm" className="h-10" href={`/hq/print/proposal/${str(form.id)}`}>
                <Printer className="size-4" aria-hidden /> Print / PDF
              </Button>
            )}
          </>
        }
      />

      {!canWrite && <Notice className="mb-4">{store.writable || store.viewOnly ? "You have view-only access to proposals." : "HQ is in read-only mode — changes cannot be saved."}</Notice>}
      {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
      {notice && <Notice tone="ok" className="mb-4">{notice}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <fieldset disabled={!canWrite} className="m-0 min-w-0 space-y-6 border-0 p-0">
          <legend className="sr-only">Proposal details</legend>

          {/* 01 school */}
          <Panel title={<StepTitle n="01">School</StepTitle>}>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <Label htmlFor="pr-school">School</Label>
                <Select id="pr-school" value={str(form.schoolId)} onChange={(e) => chooseSchool(e.target.value)} required>
                  <option value="">Choose a school…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {str(s.name)}
                      {s.city ? ` — ${str(s.city)}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="pr-date">Proposal date</Label>
                <Input id="pr-date" type="date" value={str(form.date)} onChange={(e) => set({ date: e.target.value })} className="tabular" />
              </div>
              {school ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper px-3.5 py-2.5 text-xs text-charcoal sm:col-span-6">
                  <span className="font-semibold text-graphite">{str(school.name)}</span>
                  <span>{[school.contactName, school.phone].filter(Boolean).map(String).join(" · ") || "No contact on file"}</span>
                  {schoolStudents(school) > 0 && <span>{formatNumber(schoolStudents(school))} students on file</span>}
                  <Link href={`/hq/crm/${school.id}`} className="ml-auto inline-flex items-center gap-1 font-semibold text-graphite underline-offset-4 hover:underline">
                    Open school <ExternalLink className="size-3" aria-hidden />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-blueprint sm:col-span-6">
                  Not in the CRM yet? <Link href="/hq/crm" className="font-semibold text-graphite underline-offset-4 hover:underline">Add the school first</Link> — the proposal pre-fills its student numbers.
                </p>
              )}
            </div>
          </Panel>

          {/* 02 package */}
          <Panel title={<StepTitle n="02">Package</StepTitle>}>
            <div role="radiogroup" aria-label="Package" className="grid gap-3 sm:grid-cols-2">
              {PACKAGE_CHOICES.map((c) => (
                <label
                  key={c.id}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1 rounded-[var(--radius-md)] border p-4 transition-colors",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-graphite",
                    packageId === c.id ? "border-graphite bg-graphite text-paper shadow-[var(--shadow-paper)]" : "border-graphite/20 bg-paper-50 hover:border-graphite/50",
                    !canWrite && "cursor-default",
                  )}
                >
                  <input type="radio" name="package" value={c.id} checked={packageId === c.id} onChange={() => set({ packageId: c.id as ProposalPackageId })} className="sr-only" />
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{c.name}</span>
                    <span className={cn("annot text-[10px]", packageId === c.id ? "text-paper/60" : "text-blueprint")}>{c.cadence}</span>
                  </span>
                  <span className={cn("text-xs leading-relaxed", packageId === c.id ? "text-paper/75" : "text-charcoal")}>{c.priceNote}</span>
                </label>
              ))}
            </div>
            {packageId === "jove-club" && (
              <div className="mt-4 max-w-xs">
                <Label htmlFor="pr-months">Months</Label>
                <Input id="pr-months" type="number" min={1} max={12} inputMode="numeric" value={num(form.months) || ""} placeholder="1" onChange={(e) => set({ months: Math.max(1, Math.round(num(e.target.value))) })} className="tabular" />
                <p className="mt-1 text-xs text-blueprint">{formatINR(CLUB_PRICE_PER_STUDENT_MONTH)} per student per month · minimum {CLUB_MIN_STUDENTS} students.</p>
              </div>
            )}
          </Panel>

          {/* 03 students */}
          {packageId !== "custom" && (
            <Panel
              title={<StepTitle n="03">Students by grade group</StepTitle>}
              subtitle={`${formatNumber(splitCount)} students in total`}
              action={
                school && (schoolTotalOnly || splitCount === 0) ? (
                  <button type="button" onClick={applySchoolNumbers} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-graphite hover:bg-graphite/5 focus-visible:outline-2 focus-visible:outline-graphite">
                    <Sparkles className="size-3.5" aria-hidden /> Use school&apos;s numbers
                  </button>
                ) : undefined
              }
            >
              <div className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/15">
                <table className="w-full text-sm">
                  <thead className="bg-graphite/[0.04] text-left">
                    <tr className="annot text-[10px] text-blueprint">
                      <th scope="col" className="px-3 py-2 font-medium">Grade group</th>
                      <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">{PACKAGE_CHOICES.find((c) => c.id === packageId)?.unit || "per student"}</th>
                      <th scope="col" className="w-28 px-3 py-2 font-medium">Students</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeBands.map((b) => {
                      const key = BAND_FIELDS[b.id];
                      const n = num(form[key]);
                      const rate = bandRate(b, packageId);
                      return (
                        <tr key={b.id} className="border-t border-graphite/10">
                          <th scope="row" className="px-3 py-2.5 text-left font-medium">
                            <span className="block">{b.name}</span>
                            <span className="block text-xs font-normal text-blueprint">{b.grades}</span>
                          </th>
                          <td className="tabular hidden px-3 py-2.5 text-right text-charcoal sm:table-cell">{formatINR(rate)}</td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              aria-label={`Students in ${b.grades}`}
                              value={n || ""}
                              placeholder="0"
                              onChange={(e) => set({ [key]: Math.max(0, Math.round(num(e.target.value))) })}
                              className="tabular h-9"
                            />
                          </td>
                          <td className="tabular px-3 py-2.5 text-right font-semibold">{n ? formatINR(n * rate * (packageId === "jove-club" ? pricing.months : 1)) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {packageId === "jove-day" && (
                <p className="mt-3 text-xs text-blueprint">
                  A JOVE Day is billed at a minimum of {formatINR(joveDayRules.minimumBilling)} (≈ {joveDayRules.minimumStudents} students) and hosts up to {joveDayRules.maxStudentsPerDay} students.
                </p>
              )}
            </Panel>
          )}

          {/* 04 add-ons */}
          <Panel title={<StepTitle n={packageId === "custom" ? "03" : "04"}>Add-ons</StepTitle>} subtitle="Optional extras from JOVE and FrameMind AI Studio">
            <ul className="space-y-2.5">
              {addOns.map((a) => {
                const on = listOf(form.addOns).includes(a.id);
                const qty = mapOf(form.addOnQty)[a.id] || defaultAddOnQty(a);
                const listRate = addOnListRate(a, packageId);
                const rate = mapOf(form.addOnRate)[a.id] || listRate;
                const kit = a.id === "take-home-kits";
                const yearDeal = packageId === "jove-year" && a.id.startsWith("smm-") && YEAR_SMM_DISCOUNT_PERCENT > 0;
                return (
                  <li key={a.id} className={cn("rounded-[var(--radius-md)] border p-3.5 transition-colors", on ? "border-graphite bg-paper" : "border-graphite/15 bg-paper-50")}>
                    <div className="flex items-start justify-between gap-3">
                      <Checkbox
                        checked={on}
                        onChange={(e) => toggleAddOn(a.id, e.target.checked)}
                        label={
                          <span>
                            <span className="block font-semibold">{a.name}</span>
                            <span className="block text-xs font-normal leading-relaxed text-charcoal">{a.detail}</span>
                          </span>
                        }
                        className="items-start [&>input]:mt-1"
                      />
                      <span className="shrink-0 text-right">
                        <span className="tabular block text-sm font-semibold">{kit ? "Bulk price" : a.price}</span>
                        {yearDeal && <Badge tone="ok">{YEAR_SMM_DISCOUNT_PERCENT}% off · JOVE Year</Badge>}
                        {a.owner !== "JOVE" && <span className="annot mt-1 block text-[9px] text-blueprint">FrameMind</span>}
                      </span>
                    </div>
                    {on && !kit && (
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-dashed border-graphite/15 pt-3 sm:max-w-md">
                        <div>
                          <Label htmlFor={`qty-${a.id}`} className="capitalize">
                            {unitLabel(a.unit, 2)}
                          </Label>
                          <Input id={`qty-${a.id}`} type="number" min={1} inputMode="numeric" value={qty} onChange={(e) => setAddOnQty(a.id, Math.max(1, Math.round(num(e.target.value))))} className="tabular h-9" />
                        </div>
                        <div>
                          <Label htmlFor={`rate-${a.id}`}>Rate (₹ ex-GST)</Label>
                          <Input id={`rate-${a.id}`} type="number" min={0} inputMode="numeric" value={rate || ""} onChange={(e) => setAddOnRate(a.id, num(e.target.value), listRate)} className="tabular h-9" />
                        </div>
                      </div>
                    )}
                    {on && kit && (
                      <p className="mt-3 border-t border-dashed border-graphite/15 pt-3 text-xs text-charcoal">
                        One kit per student by grade group, at the bulk school price (minimum {TAKE_HOME_KITS_MIN} kits). The kit price includes GST, so the proposal shows it ex-GST.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* 05 extras & discount */}
          <Panel title={<StepTitle n={packageId === "custom" ? "04" : "05"}>Discount &amp; extra items</StepTitle>}>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="pr-discount">Discount %</Label>
                <Input id="pr-discount" type="number" min={0} max={100} step={0.5} inputMode="decimal" value={num(form.discountPercent) || ""} placeholder="0" onChange={(e) => set({ discountPercent: Math.min(100, Math.max(0, num(e.target.value))) })} className="tabular" />
                <p className="mt-1 text-xs text-blueprint">Applies to the programme fee only.</p>
              </div>
              <div className="sm:col-span-6">
                <Label>Extra line items (ex-GST)</Label>
                <LineItemsEditor value={form.extraItems} onChange={(items) => set({ extraItems: items })} disabled={!canWrite} />
              </div>
            </div>
          </Panel>

          {/* 06 terms */}
          <Panel title={<StepTitle n={packageId === "custom" ? "05" : "06"}>Validity, status &amp; notes</StepTitle>}>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="pr-valid">Valid until</Label>
                <Input id="pr-valid" type="date" value={str(form.validUntil)} onChange={(e) => set({ validUntil: e.target.value })} className="tabular" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="pr-status">Status</Label>
                <Select id="pr-status" value={status} onChange={(e) => set({ status: e.target.value })}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-6">
                <Label htmlFor="pr-notes">Notes / special terms</Label>
                <Textarea id="pr-notes" rows={4} value={str(form.notes)} onChange={(e) => set({ notes: e.target.value })} placeholder="Shown on the printed proposal — e.g. preferred dates, transport arrangements, separate payment schedule" />
                <p className="mt-1 text-xs text-blueprint">Printed under “Notes &amp; special terms”.</p>
              </div>
            </div>
          </Panel>
        </fieldset>

        {/* ── live summary ── */}
        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <PriceSummary pricing={pricing} />
          <div className="mt-4 flex flex-col gap-2.5">
            {canWrite && (
              <>
                <Button className="h-11 w-full" onClick={() => persist({}, "save")} disabled={busy || (!dirty && !isNew)}>
                  {saving === "save" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} {isNew ? "Create proposal" : dirty ? "Save changes" : "Saved"}
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="secondary" className="h-11" onClick={saveAndOpenPdf} disabled={busy}>
                    {saving === "pdf" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Printer className="size-4" aria-hidden />} {dirty ? "Save & PDF" : "Print / PDF"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-11"
                    onClick={() => persist({ status: "sent" }, "send")}
                    disabled={busy || status === "sent" || status === "accepted"}
                    title="Saves the proposal as sent, moves the school to Proposal sent and logs the activity"
                  >
                    {saving === "send" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Mark sent
                  </Button>
                </div>
                {status === "sent" && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => persist({ status: "accepted" }, "save")} disabled={busy}>
                    Mark accepted — school won
                  </Button>
                )}
                {!isNew && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button type="button" onClick={duplicate} disabled={busy} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-charcoal hover:bg-graphite/5 focus-visible:outline-2 focus-visible:outline-graphite disabled:opacity-50">
                      <Copy className="size-3.5" aria-hidden /> Duplicate
                    </button>
                    <ConfirmButton onConfirm={remove} message="Delete this proposal? It stays in the change history." className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10 focus-visible:outline-2 focus-visible:outline-bad">
                      <Trash2 className="size-3.5" aria-hidden /> Delete
                    </ConfirmButton>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="font-mono text-[11px] font-medium text-blueprint">{n}</span>
      {children}
    </span>
  );
}

/* ─────────────────────────── live price summary ─────────────────────────── */

function Row({ label, detail, amount, strong, negative }: { label: React.ReactNode; detail?: React.ReactNode; amount: React.ReactNode; strong?: boolean; negative?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 py-1.5 text-sm", strong && "font-semibold")}>
      <div className="min-w-0">
        <p className={cn("leading-snug", !strong && "text-graphite")}>{label}</p>
        {detail && <p className="mt-0.5 text-[11px] leading-snug text-blueprint">{detail}</p>}
      </div>
      <p className={cn("tabular shrink-0", negative && "text-bad")}>{amount}</p>
    </div>
  );
}

export function PriceSummary({ pricing: p }: { pricing: ProposalPricing }) {
  const lines = [...p.bandLines, ...(p.minimumLine ? [p.minimumLine] : [])];
  const none = !lines.length && !p.addOnLines.length && !p.extraLines.length;
  return (
    <section aria-label="Live pricing" className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
      <div className="bg-graphite px-5 py-4 text-paper">
        <p className="annot text-paper/55">Total incl. GST</p>
        <p className="tabular mt-1.5 text-3xl font-bold tracking-tight" aria-live="polite">
          {formatINR(p.grandTotal)}
        </p>
        <p className="mt-1.5 text-xs text-paper/65">
          {p.pkg.name}
          {p.students ? ` · ${formatNumber(p.students)} students` : ""}
          {p.perStudent ? ` · ${formatINR(p.perStudent)} ${p.packageId === "jove-club" ? "per student / month" : "per student"} avg.` : ""}
        </p>
      </div>

      <div className="px-5 py-4">
        {none ? (
          <p className="py-3 text-sm text-charcoal">Enter student numbers or add items to see the breakdown.</p>
        ) : (
          <div className="divide-y divide-dashed divide-graphite/15">
            {lines.length > 0 && (
              <div className="pb-2">
                <p className="annot mb-1 text-[10px] text-blueprint">Programme</p>
                {lines.map((l) => (
                  <Row key={l.key} label={l.label} detail={l.kind === "minimum" ? l.detail : `${formatNumber(l.qty)} ${l.unit} × ${formatINR(l.rate)}`} amount={formatINR(l.amount)} />
                ))}
                {p.discount > 0 && <Row label={`Discount (${p.discountPercent}%)`} amount={`− ${formatINR(p.discount)}`} negative />}
              </div>
            )}
            {p.addOnLines.length > 0 && (
              <div className="py-2">
                <p className="annot mb-1 text-[10px] text-blueprint">Add-ons</p>
                {p.addOnLines.map((l) => (
                  <Row key={l.key} label={l.label} detail={`${formatNumber(l.qty)} ${l.unit} × ${formatINR(l.rate)}`} amount={formatINR(l.amount)} />
                ))}
              </div>
            )}
            {p.extraLines.length > 0 && (
              <div className="py-2">
                <p className="annot mb-1 text-[10px] text-blueprint">Extra items</p>
                {p.extraLines.map((l) => (
                  <Row key={l.key} label={l.label} detail={`${formatNumber(l.qty)} × ${formatINR(l.rate)}`} amount={formatINR(l.amount)} />
                ))}
              </div>
            )}
            <div className="pt-2">
              <Row label="Subtotal (ex-GST)" amount={formatINR(p.subtotal)} strong />
              <Row label={`GST ${p.gstPercent}%`} amount={formatINR(p.gst)} />
              <Row label="Grand total" amount={formatINR(p.grandTotal)} strong />
            </div>
          </div>
        )}

        {p.grandTotal > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-[var(--radius-sm)] bg-graphite/[0.05] px-3 py-2">
              <dt className="text-blueprint">{joveDayRules.advancePercent}% advance</dt>
              <dd className="tabular mt-0.5 text-sm font-semibold text-graphite">{formatINR(p.advance)}</dd>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-graphite/[0.05] px-3 py-2">
              <dt className="text-blueprint">Balance · {joveDayRules.balanceDueDays} days after</dt>
              <dd className="tabular mt-0.5 text-sm font-semibold text-graphite">{formatINR(p.balance)}</dd>
            </div>
          </dl>
        )}

        {p.mediaPacks > 0 && (
          <p className="mt-3 rounded-[var(--radius-sm)] border border-dashed border-graphite/30 px-3 py-2.5 text-xs leading-relaxed text-charcoal">
            <strong className="text-graphite">{p.mediaPacks === 1 ? "1 × " : `${p.mediaPacks} × `}{mediaPack.name}</strong> included free — market value {formatINR(p.mediaValue)}.
          </p>
        )}

        {p.warnings.length > 0 && (
          <ul className="mt-3 space-y-1.5" aria-label="Pricing checks">
            {p.warnings.map((w) => (
              <li key={w} className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-warn/30 bg-warn/10 px-2.5 py-2 text-xs leading-snug text-warn">
                <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
