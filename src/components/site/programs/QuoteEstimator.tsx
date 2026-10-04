"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Check, CheckCircle2, Copy, Info, Minus, Plus, RotateCcw, Send } from "lucide-react";
import { addOns, gradeBands, joveDayRules, packages, type GradeBandId, type PackageId } from "@/lib/content/business";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { CornerMarks } from "@/components/brand/Blueprint";
import { cn, formatINR, formatNumber, pad2 } from "@/lib/utils";
import { BAND_IDS, CLUB_MIN_STUDENTS, ESTIMATE_EVENT, SESSIONS, YEAR_SMM_DISCOUNT, bandPrice, priceLabel, unitLabel } from "./data";
import { FILM_IDS, KITS_MIN, MAX_MONTHS, MAX_STUDENTS_PER_BAND, SMM_IDS, TEACHER_MIN, computeQuote, defaultInput, quoteMessage, type FilmId, type QuoteInput, type SmmId } from "./quote";
import { scrollToElement } from "./scroll";

/* ── helpers ──────────────────────────────────────────────────────────── */

const DEFAULT = defaultInput();
const toStrings = (r: Record<GradeBandId, number>) => Object.fromEntries(BAND_IDS.map((id) => [id, String(r[id] ?? 0)])) as Record<GradeBandId, string>;
const EMPTY = Object.fromEntries(BAND_IDS.map((id) => [id, ""])) as Record<GradeBandId, string>;
const num = (s: string) => {
  const n = Math.round(Number(s));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const addOn = (id: string) => addOns.find((a) => a.id === id);
const MIX_TONE: Record<GradeBandId, string> = { "g1-2": "bg-graphite/25", "g3-5": "bg-graphite/45", "g6-8": "bg-graphite/70", "g9-10": "bg-graphite" };
const PHONE_RE = /^[+\d][\d\s-]{7,15}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** Number that eases to its new value (instant for reduced-motion users). SSR renders the exact value. */
function Num({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 160, damping: 28, mass: 0.5 });
  const text = useTransform(spring, (v) => format(Math.round(v)));
  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);
  return <motion.span>{text}</motion.span>;
}

function Stepper({ id, value, onChange, label, step = 10, min = 0, max }: { id: string; value: string; onChange: (v: string) => void; label: string; step?: number; min?: number; max: number }) {
  const n = num(value);
  const set = (v: number) => onChange(String(Math.max(min, Math.min(max, v))));
  return (
    <div className="flex h-11 w-fit items-stretch overflow-hidden rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 transition-colors focus-within:border-graphite focus-within:ring-2 focus-within:ring-graphite/10">
      <button type="button" onClick={() => set(n - step)} disabled={n <= min} aria-label={`Decrease ${label} by ${step}`} className="grid w-10 place-items-center text-charcoal transition-colors hover:bg-graphite/5 focus-visible:bg-graphite/10 focus-visible:outline-none disabled:opacity-30">
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, String(max).length))}
        onBlur={() => set(n)}
        className="w-[4.5rem] border-x border-graphite/15 bg-transparent text-center font-mono text-base text-graphite tabular outline-none [appearance:textfield] placeholder:text-blueprint/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" onClick={() => set(n + step)} disabled={n >= max} aria-label={`Increase ${label} by ${step}`} className="grid w-10 place-items-center text-charcoal transition-colors hover:bg-graphite/5 focus-visible:bg-graphite/10 focus-visible:outline-none disabled:opacity-30">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function ToggleCard({ checked, onChange, title, price, detail, children }: { checked: boolean; onChange: (v: boolean) => void; title: string; price: string; detail: string; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border p-4 transition-all duration-300", checked ? "border-graphite bg-paper-50 shadow-[var(--shadow-paper)]" : "border-graphite/15 bg-paper-50/60 hover:border-graphite/35")}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span
          aria-hidden
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[4px] border border-graphite/35 bg-paper text-paper transition-colors peer-checked:border-graphite peer-checked:bg-graphite peer-focus-visible:ring-2 peer-focus-visible:ring-graphite/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper"
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="text-sm font-semibold text-graphite">{title}</span>
            <span className="font-mono text-xs text-charcoal tabular">{price}</span>
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-charcoal">{detail}</span>
        </span>
      </label>
      {checked && children && <div className="mt-3 border-t border-dashed border-graphite/15 pt-3 sm:pl-8">{children}</div>}
    </div>
  );
}

function Step({ n, title, hint, children, action }: { n: number; title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <fieldset className="relative min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-graphite/15 pb-3">
        <legend className="float-left flex items-baseline gap-3">
          <span className="font-mono text-[11px] tracking-[0.12em] text-blueprint">{pad2(n)}</span>
          <span className="text-lg font-bold tracking-tight text-graphite sm:text-xl">{title}</span>
        </legend>
        {action}
      </div>
      {hint && <p className="clear-both pt-3 text-sm text-charcoal">{hint}</p>}
      <div className="clear-both pt-4">{children}</div>
    </fieldset>
  );
}

function Row({ label, detail, amount, strong, rule }: { label: string; detail?: string; amount: number; strong?: boolean; rule?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5", rule && "mt-1.5 border-t border-dashed border-graphite/20 pt-3")}>
      <dt className="min-w-0">
        <span className={cn("block text-[13px] leading-snug", strong ? "font-semibold text-graphite" : "text-charcoal")}>{label}</span>
        {detail && <span className="block font-mono text-[11px] text-blueprint tabular">{detail}</span>}
      </dt>
      <dd className={cn("shrink-0 font-mono text-[13px] text-graphite tabular", strong && "font-semibold")}>{amount < 0 ? `− ${formatINR(-amount)}` : formatINR(amount)}</dd>
    </div>
  );
}

function Meter({ label, value, target, format }: { label: string; value: number; target: number; format: (n: number) => string }) {
  const met = value >= target;
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[11px]">
        <span className="annot text-blueprint">{label}</span>
        <span className="flex items-center gap-1 whitespace-nowrap font-mono text-charcoal tabular">
          {format(value)} / {format(target)}
          {met && <Check className="size-3.5 text-graphite" strokeWidth={2.5} aria-label="met" />}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-graphite/[0.08]" aria-hidden>
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]", met ? "bg-graphite" : "hatch-dense bg-graphite/40")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── estimator ────────────────────────────────────────────────────────── */

type FormKey = "name" | "school" | "phone" | "email";

/**
 * The /packages quote estimator. Prices come only from business.ts (via ./quote);
 * the server recomputes nothing here — the breakdown is sent as text with the lead for the founders to confirm.
 */
export function QuoteEstimator({ whatsappBase }: { whatsappBase: string | null }) {
  const uid = useId();
  const [pkg, setPkg] = useState<PackageId>(DEFAULT.pkg);
  const [students, setStudents] = useState<Record<GradeBandId, string>>(() => toStrings(DEFAULT.students));
  const [clubMonths, setClubMonths] = useState(String(DEFAULT.clubMonths));
  const [smm, setSmm] = useState<SmmId | "none">(DEFAULT.smm);
  const [smmMonths, setSmmMonths] = useState(String(DEFAULT.smmMonths));
  const [films, setFilms] = useState<FilmId[]>(DEFAULT.films);
  const [teacherTraining, setTeacherTraining] = useState(DEFAULT.teacherTraining);
  const [teachers, setTeachers] = useState(String(DEFAULT.teachers));
  const [takeHomeKits, setTakeHomeKits] = useState(DEFAULT.takeHomeKits);
  const [labSetup, setLabSetup] = useState(DEFAULT.labSetup);

  const input = useMemo<QuoteInput>(
    () => ({
      pkg,
      students: Object.fromEntries(BAND_IDS.map((id) => [id, num(students[id])])) as Record<GradeBandId, number>,
      clubMonths: num(clubMonths) || 1,
      smm,
      smmMonths: num(smmMonths) || 1,
      films,
      teacherTraining,
      teachers: num(teachers),
      takeHomeKits,
      labSetup,
    }),
    [pkg, students, clubMonths, smm, smmMonths, films, teacherTraining, teachers, takeHomeKits, labSetup],
  );
  const quote = useMemo(() => computeQuote(input), [input]);
  const isClub = pkg === "jove-club";

  /* package cards above fire an event to pre-select a package */
  useEffect(() => {
    const onPick = (e: Event) => {
      const next = (e as CustomEvent<{ pkg?: PackageId }>).detail?.pkg;
      if (next && packages.some((p) => p.id === next)) setPkg(next);
    };
    window.addEventListener(ESTIMATE_EVENT, onPick);
    return () => window.removeEventListener(ESTIMATE_EVENT, onPick);
  }, []);

  /* polite, debounced screen-reader summary (skips the first render) */
  const [announce, setAnnounce] = useState("");
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(
      () => setAnnounce(quote.totalStudents ? `${quote.packageName}: estimated total ${formatINR(quote.total)} for ${formatNumber(quote.totalStudents)} students.` : "Add students to see an estimate."),
      900,
    );
    return () => clearTimeout(t);
  }, [quote.total, quote.totalStudents, quote.packageName]);

  /* mobile: floating total while the inputs are on screen and the receipt is not */
  const rootRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [rootInView, setRootInView] = useState(false);
  const [receiptInView, setReceiptInView] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    const receipt = receiptRef.current;
    if (!root || !receipt) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === root) setRootInView(e.isIntersecting);
        else setReceiptInView(e.isIntersecting);
      }
    });
    io.observe(root);
    io.observe(receipt);
    return () => io.disconnect();
  }, []);

  /* copy breakdown */
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(quoteMessage(quote));
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 2500);
  }

  /* send-me-this-quote form */
  const [form, setForm] = useState<Record<FormKey | "website", string>>({ name: "", school: "", phone: "", email: "", website: "" });
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState<{ name: string; pkg: string; students: number; total: number } | null>(null);

  function validate() {
    const e: Partial<Record<FormKey, string>> = {};
    if (!form.name.trim()) e.name = "Please tell us your name.";
    if (!form.school.trim()) e.school = "Which school is this for?";
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!phone && !email) e.phone = "Share a phone number or an email.";
    if (phone && !PHONE_RE.test(phone)) e.phone = "Please enter a valid phone number.";
    if (email && !EMAIL_RE.test(email)) e.email = "Please enter a valid email.";
    return e;
  }

  async function send(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!quote.totalStudents) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = (["name", "school", "phone", "email"] as FormKey[]).find((k) => e[k]);
      if (first) document.getElementById(`${uid}-f-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    setServerError("");
    try {
      const res = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "workshop",
          name: form.name.trim(),
          organisation: form.school.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          students: quote.totalStudents,
          gradeBands: quote.bandLines.map((l) => l.band),
          package: quote.pkg,
          message: quoteMessage(quote),
          page: "/packages#estimate",
          website: form.website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setSent({ name: form.name.trim(), pkg: quote.packageName, students: quote.totalStudents, total: quote.total });
      setStatus("idle");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const field = (k: FormKey) => ({
    id: `${uid}-f-${k}`,
    value: form[k],
    "aria-invalid": errors[k] ? true : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [k]: v }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    },
  });

  const smmAddOn = smm !== "none" ? addOn(smm) : undefined;
  const teacherAddOn = addOn("teacher-training");
  const kitsAddOn = addOn("take-home-kits");
  const labAddOn = addOn("lab-setup");
  const sessionsLabel = pkg === "jove-day" ? "1 full day" : pkg === "jove-quarter" ? `${SESSIONS["jove-quarter"]} JOVE Days` : pkg === "jove-year" ? `${SESSIONS["jove-year"]} sessions` : `${quote.sessions} × 60 min`;
  const waHref = whatsappBase && quote.totalStudents ? `${whatsappBase}${encodeURIComponent(`Hello JOVE — I'd like a proposal for this estimate:\n\n${quoteMessage(quote)}`)}` : null;

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* ── inputs ── */}
        <div className="space-y-12 lg:col-span-7">
          <Step n={1} title="Choose a package">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Package">
              {packages.map((p) => {
                const on = p.id === pkg;
                const pl = priceLabel(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "relative flex cursor-pointer flex-col rounded-[var(--radius-md)] border p-4 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-graphite/40 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-paper",
                      on ? "border-graphite bg-graphite text-paper shadow-[var(--shadow-lift)]" : "border-graphite/15 bg-paper-50 text-graphite hover:border-graphite/40",
                    )}
                  >
                    <input type="radio" name="estimate-package" value={p.id} checked={on} onChange={() => setPkg(p.id)} className="sr-only" />
                    {p.highlight && (
                      <span className={cn("annot absolute -top-2.5 right-3 rounded-full border px-2 py-0.5 text-[9px]", on ? "border-paper/40 bg-graphite text-paper" : "border-graphite/25 bg-paper text-graphite")}>Recommended</span>
                    )}
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-base font-semibold">{p.name}</span>
                      <span aria-hidden className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-paper bg-paper" : "border-graphite/30")}>
                        {on && <span className="size-1.5 rounded-full bg-graphite" />}
                      </span>
                    </span>
                    <span className={cn("annot mt-1 text-[10px]", on ? "text-paper/60" : "text-blueprint")}>{p.cadence}</span>
                    <span className="mt-3 font-mono text-sm tabular">{pl.price}</span>
                    <span className={cn("text-[11px]", on ? "text-paper/60" : "text-blueprint")}>{pl.unit} · ex-GST</span>
                  </label>
                );
              })}
            </div>
            {isClub && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-dashed border-graphite/25 p-4">
                <div>
                  <label htmlFor={`${uid}-club-months`} className="text-sm font-semibold text-graphite">
                    How many months of club?
                  </label>
                  <p className="text-xs text-blueprint">
                    {formatINR(bandPrice(gradeBands[0], "jove-club"))} per student per month · min. {CLUB_MIN_STUDENTS} students
                  </p>
                </div>
                <Stepper id={`${uid}-club-months`} value={clubMonths} onChange={setClubMonths} label="club months" step={1} min={1} max={MAX_MONTHS} />
              </div>
            )}
          </Step>

          <Step
            n={2}
            title="Students by grade group"
            hint={isClub ? "Club members per grade group — the same monthly fee for every grade." : "How many students will take part from each grade group? Leave a group at 0 to skip it."}
            action={
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setStudents(toStrings(DEFAULT.students))} className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/20 px-2.5 text-xs font-semibold text-charcoal transition-colors hover:border-graphite hover:text-graphite">
                  <RotateCcw className="size-3.5" aria-hidden /> Example mix
                </button>
                <button type="button" onClick={() => setStudents(EMPTY)} className="inline-flex h-8 items-center rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-blueprint transition-colors hover:bg-graphite/5 hover:text-graphite">
                  Clear
                </button>
              </div>
            }
          >
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
              {gradeBands.map((b) => {
                const line = quote.bandLines.find((l) => l.band === b.id);
                const id = `${uid}-${b.id}`;
                return (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-graphite/10 px-4 py-4 first:border-t-0">
                    <div className="flex min-w-0 items-start gap-3">
                      <span aria-hidden className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", MIX_TONE[b.id])} />
                      <div className="min-w-0">
                        <label htmlFor={id} className="block text-[15px] font-semibold text-graphite">
                          {b.name} <span className="font-normal text-blueprint">· {b.grades}</span>
                        </label>
                        <p className="mt-0.5 font-mono text-xs text-charcoal tabular">
                          {formatINR(bandPrice(b, pkg))} {unitLabel(pkg)}
                          {line && <span className="text-blueprint"> · {formatINR(line.amount)}</span>}
                        </p>
                        {line && line.batches > 1 && !isClub && (
                          <p className="mt-0.5 text-[11px] text-blueprint">
                            Runs as {line.batches} batches of up to {b.maxPerSession}
                          </p>
                        )}
                      </div>
                    </div>
                    <Stepper id={id} value={students[b.id]} onChange={(v) => setStudents((s) => ({ ...s, [b.id]: v }))} label={`${b.name} students`} max={MAX_STUDENTS_PER_BAND} />
                  </div>
                );
              })}
              <div className="border-t border-graphite/15 bg-paper-100/70 px-4 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="annot text-charcoal">Total students</span>
                  <span className="font-mono text-lg font-medium text-graphite tabular">{formatNumber(quote.totalStudents)}</span>
                </div>
                <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-graphite/[0.07]" aria-hidden>
                  {quote.bandLines.map((l) => (
                    <span key={l.band} className={cn("h-full transition-[width] duration-500 ease-[var(--ease-out-expo)]", MIX_TONE[l.band])} style={{ width: `${(l.students / quote.totalStudents) * 100}%` }} />
                  ))}
                </div>
                {pkg === "jove-day" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Meter label="Day minimum · students" value={quote.totalStudents} target={joveDayRules.minimumStudents} format={formatNumber} />
                    <Meter label="Day minimum · billing" value={quote.programmeSubtotal} target={joveDayRules.minimumBilling} format={(v) => formatINR(v)} />
                  </div>
                )}
              </div>
            </div>
          </Step>

          <Step n={3} title="Optional add-ons" hint="Media from our in-house studio, teacher training and take-home kits. Prices ex-GST unless marked.">
            <div className="space-y-3">
              {/* social media */}
              <div className={cn("rounded-[var(--radius-md)] border p-4 transition-all duration-300", smm !== "none" ? "border-graphite bg-paper-50 shadow-[var(--shadow-paper)]" : "border-graphite/15 bg-paper-50/60")}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-graphite">Social Media Management</p>
                  <p className="annot text-[10px] text-blueprint">
                    By FrameMind AI Studio{pkg === "jove-year" && YEAR_SMM_DISCOUNT > 0 ? ` · ${YEAR_SMM_DISCOUNT}% off with JOVE Year` : ""}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <Field label="Monthly plan" htmlFor={`${uid}-smm`} className="min-w-[14rem] flex-1">
                    <Select id={`${uid}-smm`} value={smm} onChange={(e) => setSmm(e.target.value as SmmId | "none")}>
                      <option value="none">No social media plan</option>
                      {SMM_IDS.map((id) => {
                        const a = addOn(id);
                        return a ? (
                          <option key={id} value={id}>
                            {a.name.replace(/^Social Media Management — /, "")} — {a.price}
                          </option>
                        ) : null;
                      })}
                    </Select>
                  </Field>
                  {smm !== "none" && (
                    <Field label="Months" htmlFor={`${uid}-smm-months`}>
                      <Stepper id={`${uid}-smm-months`} value={smmMonths} onChange={setSmmMonths} label="social media months" step={1} min={1} max={MAX_MONTHS} />
                    </Field>
                  )}
                </div>
                {smmAddOn && <p className="mt-2.5 text-xs leading-relaxed text-charcoal">{smmAddOn.detail}</p>}
              </div>

              {FILM_IDS.map((id) => {
                const a = addOn(id);
                if (!a) return null;
                return (
                  <ToggleCard
                    key={id}
                    checked={films.includes(id)}
                    onChange={(v) => setFilms((f) => (v ? [...f, id] : f.filter((x) => x !== id)))}
                    title={a.name}
                    price={a.price}
                    detail={`${a.detail} By ${a.owner}.`}
                  />
                );
              })}

              {teacherAddOn && (
                <ToggleCard checked={teacherTraining} onChange={setTeacherTraining} title={teacherAddOn.name} price={teacherAddOn.price} detail={teacherAddOn.detail}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor={`${uid}-teachers`} className="text-xs font-semibold text-graphite">
                      Teachers to train <span className="font-normal text-blueprint">(min. {TEACHER_MIN})</span>
                    </label>
                    <Stepper id={`${uid}-teachers`} value={teachers} onChange={setTeachers} label="teachers" step={1} min={TEACHER_MIN} max={200} />
                  </div>
                </ToggleCard>
              )}

              {kitsAddOn && (
                <ToggleCard checked={takeHomeKits} onChange={setTakeHomeKits} title={kitsAddOn.name} price={kitsAddOn.price} detail={`${kitsAddOn.detail} Kit prices include GST.`}>
                  {quote.kitLines.length ? (
                    <ul className="space-y-1 text-xs text-charcoal">
                      {quote.kitLines.map((l) => (
                        <li key={l.id} className="flex justify-between gap-3">
                          <span>{l.label}</span>
                          <span className="font-mono tabular">{l.detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-blueprint">Add students above to price their kits.</p>
                  )}
                  {quote.totalStudents > 0 && quote.totalStudents < KITS_MIN && <p className="mt-2 text-xs text-blueprint">Bulk price starts at {KITS_MIN} kits — shown at MRP.</p>}
                </ToggleCard>
              )}

              {labAddOn && (
                <ToggleCard checked={labSetup} onChange={setLabSetup} title={labAddOn.name} price={labAddOn.price} detail={labAddOn.detail}>
                  <p className="text-xs text-blueprint">Quoted after a site visit, so it is noted on your quote but not added to the total.</p>
                </ToggleCard>
              )}
            </div>
          </Step>
        </div>

        {/* ── receipt ── */}
        <div className="lg:col-span-5">
          <div ref={receiptRef} id="quote-receipt" className="scroll-mt-28 lg:sticky lg:top-24">
            <div data-lenis-prevent className="hq-scroll relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-lift)] lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto">
              <div className="relative overflow-hidden rounded-t-[var(--radius-lg)] bg-graphite px-5 py-5 text-paper">
                <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-70" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="annot text-paper/55">Your estimate</p>
                    <p className="mt-1 text-xl font-bold tracking-tight">{quote.packageName}</p>
                    <p className="text-xs text-paper/60">
                      {quote.packageCadence}
                      {isClub ? ` · ${num(clubMonths) || 1} month${(num(clubMonths) || 1) > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="annot text-paper/55">Students</p>
                    <p className="mt-1 font-mono text-xl tabular">
                      <Num value={quote.totalStudents} format={formatNumber} />
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative px-5 pb-5 pt-4">
                <CornerMarks className="m-2 text-graphite/30" size={8} />
                {quote.totalStudents === 0 ? (
                  <p className="py-6 text-center text-sm text-blueprint">Add students in step 02 to see your estimate.</p>
                ) : (
                  <dl>
                    {quote.bandLines.map((l) => (
                      <Row key={l.id} label={l.label} detail={l.detail} amount={l.amount} />
                    ))}
                    <Row label="Programme subtotal" amount={quote.programmeSubtotal} strong rule />
                    {quote.adjustment && <Row label={quote.adjustment.label} detail={quote.adjustment.detail} amount={quote.adjustment.amount} />}
                    {quote.addOnLines.map((l, i) => (
                      <Row key={l.id} label={l.label} detail={l.detail} amount={l.amount} rule={i === 0} />
                    ))}
                    <Row label="Taxable value" amount={quote.taxable} strong rule />
                    <Row label={`GST @ ${quote.gstPercent}%`} amount={quote.gst} />
                    {quote.kitLines.map((l, i) => (
                      <Row key={l.id} label={`${l.label} · take-home`} detail={`${l.detail} · incl. GST${quote.kitsAtBulkPrice ? "" : " · MRP"}`} amount={l.amount} rule={i === 0} />
                    ))}
                  </dl>
                )}

                <div className="mt-4 flex items-end justify-between gap-3 rounded-[var(--radius-md)] bg-graphite px-4 py-4 text-paper">
                  <div>
                    <p className="annot text-paper/55">Estimated total</p>
                    <p className="text-[11px] text-paper/55">incl. {quote.gstPercent}% GST{quote.kitsTotal ? " & kits" : ""}</p>
                  </div>
                  <p className="font-mono text-[clamp(1.5rem,4vw,2rem)] font-medium leading-none tracking-tight tabular">
                    <Num value={quote.total} format={(v) => formatINR(v)} />
                  </p>
                </div>

                {quote.totalStudents > 0 && (
                  <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-graphite/10">
                    <div className="bg-paper-50 p-3">
                      <dt className="annot text-[10px] text-blueprint">Avg. per student</dt>
                      <dd className="mt-1 font-mono text-base text-graphite tabular">{formatINR(quote.avgPerStudent)}</dd>
                      <dd className="text-[11px] text-blueprint">{quote.sessions > 1 ? `≈ ${formatINR(quote.perStudentPerSession)} per session` : "ex-GST"}</dd>
                    </div>
                    <div className="bg-paper-50 p-3">
                      <dt className="annot text-[10px] text-blueprint">Sessions</dt>
                      <dd className="mt-1 font-mono text-base text-graphite tabular">{sessionsLabel}</dd>
                      <dd className="text-[11px] text-blueprint">{isClub ? `${num(clubMonths) || 1} mo of club` : pkg === "jove-day" ? "07:30 – 16:30 on campus" : "planned with you"}</dd>
                    </div>
                    <div className="bg-paper-50 p-3">
                      {quote.savings !== null ? (
                        <>
                          <dt className="annot text-[10px] text-blueprint">Saving vs separate days</dt>
                          <dd className="mt-1 font-mono text-base text-graphite tabular">{formatINR(quote.savings)}</dd>
                          <dd className="text-[11px] text-blueprint">
                            {Math.round(quote.savingsPct ?? 0)}% less than {SESSIONS[pkg as "jove-quarter" | "jove-year"]} JOVE Days
                          </dd>
                        </>
                      ) : quote.advance !== null ? (
                        <>
                          <dt className="annot text-[10px] text-blueprint">Advance to confirm</dt>
                          <dd className="mt-1 font-mono text-base text-graphite tabular">{formatINR(quote.advance)}</dd>
                          <dd className="text-[11px] text-blueprint">{joveDayRules.advancePercent}% of the workshop fee</dd>
                        </>
                      ) : (
                        <>
                          <dt className="annot text-[10px] text-blueprint">Per month</dt>
                          <dd className="mt-1 font-mono text-base text-graphite tabular">{formatINR(quote.programmeTotal / (num(clubMonths) || 1))}</dd>
                          <dd className="text-[11px] text-blueprint">club fees, ex-GST</dd>
                        </>
                      )}
                    </div>
                    <div className="bg-paper-50 p-3">
                      <dt className="annot text-[10px] text-blueprint">Media included</dt>
                      <dd className="mt-1 font-mono text-base text-graphite tabular">{quote.media.value ? `≈ ${formatINR(quote.media.value)}` : "Included"}</dd>
                      <dd className="text-[11px] leading-snug text-blueprint">{quote.media.label}</dd>
                    </div>
                  </dl>
                )}

                {(quote.notes.length > 0 || quote.labSetupNote) && (
                  <ul className="mt-4 space-y-2">
                    {quote.labSetupNote && (
                      <li className="flex gap-2 text-xs leading-relaxed text-charcoal">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-blueprint" aria-hidden />
                        {quote.labSetupNote}
                      </li>
                    )}
                    {quote.notes.map((n) => (
                      <li key={n} className="flex gap-2 text-xs leading-relaxed text-charcoal">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-blueprint" aria-hidden />
                        {n}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copy}
                    disabled={!quote.totalStudents}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/20 px-3 text-xs font-semibold text-graphite transition-colors hover:border-graphite disabled:opacity-40"
                  >
                    {copied === "ok" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    {copied === "ok" ? "Copied" : copied === "fail" ? "Copy not available" : "Copy breakdown"}
                  </button>
                  {waHref && (
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/20 px-3 text-xs font-semibold text-graphite transition-colors hover:border-graphite">
                      Share on WhatsApp
                    </a>
                  )}
                  <a href={`#${uid}-send`} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-graphite px-3 text-xs font-semibold text-paper transition-colors hover:bg-ink">
                    <Send className="size-3.5" aria-hidden /> Send me this quote
                  </a>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-blueprint">
                  An indicative estimate from our published prices. Workshop and media prices exclude GST; kit prices include it. Final figures are confirmed in your written proposal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── send ── */}
        <div id={`${uid}-send`} className="scroll-mt-28 lg:col-span-12">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-100 p-6 shadow-[var(--shadow-paper)] sm:p-8">
            <div aria-hidden className="bp-grid-fine absolute inset-0 opacity-60" />
            <CornerMarks className="m-3 text-graphite/40" />
            <div className="relative grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="annot text-blueprint">04 · Send me this quote</p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-graphite sm:text-3xl">Get it in writing.</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal">
                  We&apos;ll check dates, batches and travel, then send a formal proposal for{" "}
                  <span className="font-semibold text-graphite">
                    {quote.packageName}
                    {quote.totalStudents ? ` · ${formatNumber(quote.totalStudents)} students · ${formatINR(quote.total)}` : ""}
                  </span>
                  . No obligation.
                </p>
              </div>
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait" initial={false}>
                  {sent ? (
                    <motion.div key="sent" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex h-full flex-col justify-center rounded-[var(--radius-md)] bg-graphite p-6 text-paper">
                      <CheckCircle2 className="size-8" strokeWidth={1.5} aria-hidden />
                      <p className="mt-4 text-xl font-bold tracking-tight">Thank you, {sent.name.split(" ")[0]} — your quote is with the JOVE team.</p>
                      <p className="mt-2 text-sm leading-relaxed text-paper/70">
                        {sent.pkg} · {formatNumber(sent.students)} students · {formatINR(sent.total)} estimated. We aim to reply with a formal proposal within one working day.
                      </p>
                      <button type="button" onClick={() => setSent(null)} className="mt-5 w-fit text-sm font-semibold text-paper underline underline-offset-4 hover:text-paper/80">
                        Change the estimate and send again
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={send} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 sm:grid-cols-2" aria-label="Send me this quote">
                      <Field label="Your name" htmlFor={`${uid}-f-name`} required error={errors.name}>
                        <Input {...field("name")} autoComplete="name" maxLength={120} />
                      </Field>
                      <Field label="School" htmlFor={`${uid}-f-school`} required error={errors.school}>
                        <Input {...field("school")} autoComplete="organization" maxLength={160} />
                      </Field>
                      <Field label="Phone" htmlFor={`${uid}-f-phone`} error={errors.phone} help="Phone or email — at least one">
                        <Input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="+91" />
                      </Field>
                      <Field label="Email" htmlFor={`${uid}-f-email`} error={errors.email}>
                        <Input {...field("email")} type="email" autoComplete="email" maxLength={160} />
                      </Field>
                      {/* honeypot */}
                      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                        <label htmlFor={`${uid}-website`}>Website</label>
                        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                        <Button type="submit" size="lg" disabled={status === "sending" || !quote.totalStudents}>
                          {status === "sending" ? "Sending…" : "Send me this quote"}
                          <Send className="size-4" aria-hidden />
                        </Button>
                        <p className="text-xs text-blueprint">{quote.totalStudents ? "Your full breakdown is attached automatically." : "Add students to your estimate first."}</p>
                      </div>
                      {status === "error" && serverError && (
                        <p role="alert" className="text-sm text-bad sm:col-span-2">
                          {serverError}
                        </p>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* mobile floating total */}
      <AnimatePresence>
        {rootInView && !receiptInView && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-graphite px-4 py-3 text-paper shadow-[var(--shadow-lift)] lg:hidden"
          >
            <div className="min-w-0">
              <p className="annot truncate text-[10px] text-paper/55">
                {quote.packageName} · {formatNumber(quote.totalStudents)} students
              </p>
              <p className="font-mono text-lg font-medium tabular">
                <Num value={quote.total} format={(v) => formatINR(v)} />
              </p>
            </div>
            <button
              type="button"
              onClick={() => receiptRef.current && scrollToElement(receiptRef.current)}
              className="h-9 shrink-0 rounded-[var(--radius-sm)] bg-paper px-3 text-xs font-semibold text-graphite transition-colors hover:bg-white"
            >
              View breakdown
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
