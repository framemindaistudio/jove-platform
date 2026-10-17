"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { APPLY_ROLES, AVAILABILITY, HEARD, LANGUAGES, linksRequired, SKILLS, TRAVEL, appliedFor, type RoleId } from "@/lib/content/careers";

/** The careers page's "Apply" buttons send this event to choose the role in the form. */
export const APPLY_EVENT = "jove:apply-role";

const PROMPTS: Record<RoleId, { links: string; linksHint: string; message: string; messageHint: string }> = {
  trainer: { links: "Links (optional)", linksHint: "A project, a GitHub, a video of a class you taught", message: "What have you built or taught?", messageHint: "A robot, a circuit, a class or a club. Tell us what you did yourself." },
  "lead-trainer": { links: "Links (optional)", linksHint: "Projects, competitions, a class you led", message: "Tell us about the classes you have led", messageHint: "How many students, which grades, what you taught, and how you managed the room." },
  media: { links: "Showreel or portfolio link", linksHint: "Google Drive, YouTube, Instagram or Behance; student work counts", message: "What do you edit, and with what?", messageHint: "The kind of videos you make, your fastest turnaround, any camera work." },
  partnerships: { links: "LinkedIn or anything you'd like us to see (optional)", linksHint: "", message: "Why schools, and why you?", messageHint: "Any sales, outreach or school experience, and the languages you speak with confidence." },
  other: { links: "Links (optional)", linksHint: "", message: "What would you do at JOVE?", messageHint: "The role you have in mind and what you would bring to it." },
};

type Errors = Partial<Record<"role" | "roleOther" | "name" | "phone" | "email" | "links", string>>;

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="annot mb-2.5 text-charcoal">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite",
                on ? "border-graphite bg-graphite text-paper" : "border-graphite/25 text-graphite hover:border-graphite",
              )}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ApplyForm() {
  const uid = useId();
  const page = usePathname();
  const top = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<RoleId | "">("");
  const [roleOther, setRoleOther] = useState("");
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "", current: "", experience: "", links: "", message: "", startFrom: "", heardFrom: "", travel: "", website: "" });
  const [student, setStudent] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [serverError, setServerError] = useState("");

  // a role chosen on the page (an "Apply" button) or in the link (/careers?role=media)
  useEffect(() => {
    const choose = (id: unknown) => {
      if (APPLY_ROLES.some((r) => r.id === id)) {
        setRole(id as RoleId);
        setSkills([]);
        setErrors((e) => ({ ...e, role: undefined }));
      }
    };
    choose(new URLSearchParams(window.location.search).get("role"));
    const on = (e: Event) => choose((e as CustomEvent<string>).detail);
    window.addEventListener(APPLY_EVENT, on);
    return () => window.removeEventListener(APPLY_EVENT, on);
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const id = (k: string) => `${uid}-${k}`;
  const prompts = role ? PROMPTS[role] : PROMPTS.other;

  function validate(): Errors {
    const e: Errors = {};
    if (!role) e.role = "Choose the role you are applying for.";
    if (role === "other" && !roleOther.trim()) e.roleOther = "Tell us the role you have in mind.";
    if (!f.name.trim()) e.name = "Please tell us your name.";
    if (!f.phone.trim()) e.phone = "We call every applicant, so a phone number is needed.";
    else if (!/^[+\d][\d\s-]{7,15}$/.test(f.phone.trim())) e.phone = "Please enter a valid phone number.";
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Please enter a valid email.";
    if (role && linksRequired(role) && !f.links.trim()) e.links = "Add a link to your showreel or portfolio.";
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = (["role", "roleOther", "name", "phone", "email", "links"] as const).find((k) => e[k]);
      if (first === "role") top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (first) document.getElementById(id(first))?.focus();
      return;
    }
    setState("sending");
    setServerError("");
    try {
      const res = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "trainer",
          name: f.name.trim(),
          phone: f.phone.trim(),
          email: f.email.trim(),
          city: f.city.trim(),
          role: f.current.trim(),
          message: f.message.trim(),
          page,
          website: f.website,
          application: { role, roleOther, current: f.current, student, experience: f.experience, skills, languages, availability, travel: f.travel, links: f.links, startFrom: f.startFrom, heardFrom: f.heardFrom },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not send. Please try again.");
      track("generate_lead", { lead_type: "trainer", form: "careers", role });
      setState("done");
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not send.");
      setState("error");
    }
  }

  const skillList = role ? SKILLS[role] : [];

  return (
    <div ref={top} className="scroll-mt-28">
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" && role ? (
          <motion.div key="done" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-4 py-8">
            <CheckCircle2 className="size-12 text-graphite" strokeWidth={1.25} aria-hidden />
            <h3 className="text-2xl font-bold tracking-tight text-graphite">Thank you, {f.name.trim().split(" ")[0]}. Your application is in.</h3>
            <p className="max-w-md text-sm leading-relaxed text-charcoal">
              You applied for <strong className="text-graphite">{appliedFor({ role, roleOther })}</strong>. A founder reads every application personally. If your profile fits, we
              call you within a week to set up the next step.
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label="Job application">
            {/* honeypot */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={id("website")}>Website</label>
              <input id={id("website")} tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
            </div>

            {/* 1 · role */}
            <fieldset>
              <legend className="annot mb-3 text-charcoal">
                1 · The role you are applying for<span className="ml-0.5 text-bad">*</span>
              </legend>
              <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-invalid={!!errors.role}>
                {APPLY_ROLES.map((r) => {
                  const on = role === r.id;
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        "relative flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-graphite",
                        on ? "border-graphite bg-graphite text-paper" : "border-graphite/20 bg-paper-50 hover:border-graphite/60",
                        r.id === "other" && "sm:col-span-2",
                      )}
                    >
                      <input
                        type="radio"
                        name={id("role")}
                        value={r.id}
                        checked={on}
                        onChange={() => {
                          setRole(r.id);
                          setSkills([]);
                          setErrors((e) => ({ ...e, role: undefined }));
                        }}
                        className="sr-only"
                      />
                      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", on ? "border-paper bg-paper" : "border-graphite/40")} aria-hidden>
                        {on && <span className="size-2.5 rounded-full bg-graphite" />}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block font-mono text-[11px] tracking-widest", on ? "text-paper/60" : "text-blueprint")}>{r.code === "R-00" ? "OPEN" : r.code}</span>
                        <span className="mt-0.5 block text-[15px] font-bold leading-snug tracking-[-0.01em]">{r.title}</span>
                        <span className={cn("mt-0.5 block text-[13px] leading-snug", on ? "text-paper/75" : "text-charcoal")}>{r.short}</span>
                        <span className={cn("mt-1.5 block text-[11px] font-semibold uppercase tracking-wider", on ? "text-paper/60" : "text-blueprint")}>{r.type}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.role && (
                <p role="alert" className="mt-2 text-sm text-bad">
                  {errors.role}
                </p>
              )}
              {role === "other" && (
                <Field label="Which role?" htmlFor={id("roleOther")} required error={errors.roleOther} className="mt-4">
                  <Input id={id("roleOther")} value={roleOther} onChange={(e) => setRoleOther(e.target.value)} maxLength={80} placeholder="e.g. Operations intern, 3D designer" />
                </Field>
              )}
            </fieldset>

            {/* 2 · you */}
            <fieldset className="mt-9 grid gap-5 sm:grid-cols-2">
              <legend className="annot mb-1 text-charcoal sm:col-span-2">2 · About you</legend>
              <Field label="Your name" htmlFor={id("name")} required error={errors.name}>
                <Input id={id("name")} value={f.name} onChange={set("name")} autoComplete="name" maxLength={120} placeholder="Full name" />
              </Field>
              <Field label="Phone / WhatsApp" htmlFor={id("phone")} required error={errors.phone}>
                <Input id={id("phone")} value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="+91" />
              </Field>
              <Field label="Email" htmlFor={id("email")} error={errors.email}>
                <Input id={id("email")} value={f.email} onChange={set("email")} type="email" autoComplete="email" maxLength={160} placeholder="you@example.com" />
              </Field>
              <Field label="City" htmlFor={id("city")}>
                <Input id={id("city")} value={f.city} onChange={set("city")} autoComplete="address-level2" maxLength={80} placeholder="e.g. Bagalkot" />
              </Field>
              <div className="sm:col-span-2">
                <Checkbox label="I am a student" checked={student} onChange={(e) => setStudent(e.target.checked)} />
              </div>
              <Field label={student ? "College, course and year" : "What you do now"} htmlFor={id("current")}>
                <Input id={id("current")} value={f.current} onChange={set("current")} maxLength={120} placeholder={student ? "e.g. B.E. ECE, 3rd year, BEC Bagalkot" : "e.g. Robotics trainer, video editor"} />
              </Field>
              <Field label="Experience in this kind of work (years)" htmlFor={id("experience")} help={student ? "Projects and clubs count. 0 is fine." : undefined}>
                <Input id={id("experience")} value={f.experience} onChange={set("experience")} type="number" inputMode="decimal" min={0} max={40} step={0.5} placeholder="0" />
              </Field>
            </fieldset>

            {/* 3 · skills and availability */}
            <fieldset className="mt-9 grid gap-6 sm:grid-cols-2">
              <legend className="annot mb-1 text-charcoal sm:col-span-2">3 · Skills and availability</legend>
              {skillList.length > 0 && <Chips label={role === "media" ? "Tools and skills you use" : "What you can do (tick all that fit)"} options={skillList} value={skills} onChange={setSkills} />}
              <Chips label="Languages you can teach or talk in" options={LANGUAGES} value={languages} onChange={setLanguages} />
              <Chips label="When you are free" options={AVAILABILITY} value={availability} onChange={setAvailability} />
              <Field label="Can you travel to schools for a full day?" htmlFor={id("travel")}>
                <Select id={id("travel")} value={f.travel} onChange={set("travel")}>
                  <option value="">Choose</option>
                  {TRAVEL.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="You could start from (optional)" htmlFor={id("startFrom")}>
                <Input id={id("startFrom")} value={f.startFrom} onChange={set("startFrom")} type="date" />
              </Field>
            </fieldset>

            {/* 4 · work */}
            <fieldset className="mt-9 grid gap-5">
              <legend className="annot mb-1 text-charcoal">4 · Your work</legend>
              <Field label={prompts.links} htmlFor={id("links")} required={!!role && linksRequired(role)} error={errors.links} help={prompts.linksHint || undefined}>
                <Input id={id("links")} value={f.links} onChange={set("links")} maxLength={600} placeholder="https://" />
              </Field>
              <Field label={prompts.message} htmlFor={id("message")} help={prompts.messageHint}>
                <Textarea id={id("message")} value={f.message} onChange={set("message")} rows={5} maxLength={3000} />
              </Field>
              <Field label="Where did you hear about JOVE? (optional)" htmlFor={id("heardFrom")} className="sm:max-w-sm">
                <Select id={id("heardFrom")} value={f.heardFrom} onChange={set("heardFrom")}>
                  <option value="">Choose</option>
                  {HEARD.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </Select>
              </Field>
            </fieldset>

            <div className="mt-8 flex flex-col gap-4 border-t border-dashed border-graphite/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs leading-relaxed text-blueprint">We use these details only to consider your application, and a founder reads every one.</p>
              <Button type="submit" size="lg" disabled={state === "sending"}>
                {state === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                {state === "sending" ? "Sending…" : "Send application"}
              </Button>
            </div>
            {state === "error" && serverError && (
              <p role="alert" className="mt-3 text-sm text-bad">
                {serverError}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "Apply for this role": chooses the role in the form and takes the visitor to it. */
export function ApplyForRole({ role, title }: { role: RoleId; title: string }) {
  return (
    <a
      href={`?role=${role}#apply`}
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(APPLY_EVENT, { detail: role }));
        history.replaceState(null, "", `?role=${role}#apply`);
        document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-graphite px-5 text-sm font-semibold text-paper transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
    >
      Apply for this role<span className="sr-only">: {title}</span>
      <ArrowRight className="size-4" aria-hidden />
    </a>
  );
}
