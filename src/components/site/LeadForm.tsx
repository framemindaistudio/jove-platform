"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type Kind = "workshop" | "trainer" | "contact" | "kits" | "studio" | "partner";

const BANDS = [
  { id: "g1-2", label: "Grades 1–2" },
  { id: "g3-5", label: "Grades 3–5" },
  { id: "g6-8", label: "Grades 6–8" },
  { id: "g9-10", label: "Grades 9–10" },
];

/**
 * Public enquiry form → POST /api/public/submit → lands in HQ → Website Leads.
 * kind="workshop" shows school fields; "trainer" shows applicant fields; others are a simple contact form.
 */
export function LeadForm({ kind = "workshop", className, submitLabel, dark }: { kind?: Kind; className?: string; submitLabel?: string; dark?: boolean }) {
  const page = usePathname();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [bands, setBands] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
    payload.kind = kind;
    payload.gradeBands = bands;
    payload.page = page;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/public/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not send. Please try again.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
      setState("error");
    }
  }

  const labelTone = dark ? "[&_label]:text-paper/60" : "";

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {state === "done" ? (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-4 py-10">
            <CheckCircle2 className={cn("size-12", dark ? "text-paper" : "text-graphite")} strokeWidth={1.25} />
            <h3 className="text-2xl font-bold">Received — thank you!</h3>
            <p className={cn("max-w-md text-sm leading-relaxed", dark ? "text-paper/70" : "text-charcoal")}>
              {kind === "trainer"
                ? "We review every application personally. If your profile fits, we'll call you within a week for a short demo session."
                : "A JOVE founder will call you within one working day to understand your school and lock a date."}
            </p>
            <Button variant={dark ? "outline-light" : "secondary"} size="sm" onClick={() => setState("idle")}>
              Send another
            </Button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} className={cn("grid gap-5 sm:grid-cols-2", labelTone)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* honeypot */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

            <Field label="Your name" htmlFor="lf-name" required>
              <Input id="lf-name" name="name" required autoComplete="name" placeholder="Full name" />
            </Field>
            {kind === "workshop" || kind === "partner" || kind === "kits" || kind === "studio" ? (
              <Field label="Your role" htmlFor="lf-role">
                <Input id="lf-role" name="role" placeholder="Principal, Correspondent, Teacher…" />
              </Field>
            ) : kind === "trainer" ? (
              <Field label="Current role / college" htmlFor="lf-role">
                <Input id="lf-role" name="role" placeholder="e.g. B.E. ECE final year, Robotics trainer" />
              </Field>
            ) : (
              <Field label="Organisation" htmlFor="lf-org">
                <Input id="lf-org" name="organisation" placeholder="Optional" />
              </Field>
            )}

            {(kind === "workshop" || kind === "kits" || kind === "studio" || kind === "partner") && (
              <Field label={kind === "partner" ? "Organisation" : "School name"} htmlFor="lf-org" required className="sm:col-span-2">
                <Input id="lf-org" name="organisation" required placeholder={kind === "partner" ? "Company / organisation" : "School name"} />
              </Field>
            )}

            <Field label="Phone / WhatsApp" htmlFor="lf-phone" required>
              <Input id="lf-phone" name="phone" type="tel" required autoComplete="tel" placeholder="+91" />
            </Field>
            <Field label="Email" htmlFor="lf-email">
              <Input id="lf-email" name="email" type="email" autoComplete="email" placeholder="you@school.edu.in" />
            </Field>
            <Field label="City" htmlFor="lf-city">
              <Input id="lf-city" name="city" autoComplete="address-level2" placeholder="City" />
            </Field>

            {kind === "workshop" && (
              <>
                <Field label="Approx. students" htmlFor="lf-students">
                  <Input id="lf-students" name="students" type="number" min={1} placeholder="e.g. 300" />
                </Field>
                <div className="sm:col-span-2">
                  <p className={cn("annot mb-2", dark ? "text-paper/60" : "text-charcoal")}>Grade groups</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {BANDS.map((b) => (
                      <Checkbox
                        key={b.id}
                        label={<span className={dark ? "text-paper" : undefined}>{b.label}</span>}
                        checked={bands.includes(b.id)}
                        onChange={(e) => setBands((prev) => (e.target.checked ? [...prev, b.id] : prev.filter((x) => x !== b.id)))}
                      />
                    ))}
                  </div>
                </div>
                <Field label="Interested in" htmlFor="lf-package">
                  <Select id="lf-package" name="package" defaultValue="jove-day">
                    <option value="jove-day">JOVE Day (one full day)</option>
                    <option value="jove-quarter">JOVE Quarter (3 months)</option>
                    <option value="jove-year">JOVE Year (academic year)</option>
                    <option value="jove-club">JOVE Club (after school)</option>
                    <option value="custom">Not sure yet</option>
                  </Select>
                </Field>
                <Field label="Preferred date" htmlFor="lf-date">
                  <Input id="lf-date" name="preferredDate" type="date" />
                </Field>
              </>
            )}
            {kind === "trainer" && (
              <Field label="Experience (years)" htmlFor="lf-exp">
                <Input id="lf-exp" name="students" type="number" min={0} placeholder="0" />
              </Field>
            )}

            <Field label={kind === "trainer" ? "Tell us about your robotics / AI / teaching experience" : "Anything we should know?"} htmlFor="lf-msg" className="sm:col-span-2">
              <Textarea id="lf-msg" name="message" rows={4} placeholder={kind === "trainer" ? "Projects, workshops taken, tools you know, portfolio links…" : "Dates, number of sections, special requests…"} />
            </Field>

            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className={cn("text-xs", dark ? "text-paper/50" : "text-blueprint")}>We reply within one working day. No spam, ever.</p>
              <Button type="submit" variant={dark ? "light" : "primary"} size="lg" disabled={state === "sending"}>
                {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {submitLabel || (kind === "trainer" ? "Apply as trainer" : kind === "workshop" ? "Request a JOVE Day" : "Send message")}
              </Button>
            </div>
            {state === "error" && <p className="text-sm text-bad sm:col-span-2">{error}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
