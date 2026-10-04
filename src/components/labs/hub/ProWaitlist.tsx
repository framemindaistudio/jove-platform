"use client";

import { useId, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { proLabs } from "@/lib/content/labs";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const ROLES = ["Student", "Parent", "Teacher", "School leader", "Other"];

/** Small waitlist form for the Pro journeys → lands in HQ leads (kind "contact"). */
export function ProWaitlist() {
  const uid = useId();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [picked, setPicked] = useState<string[]>([]);
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const toggle = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = contact.trim();
    const isEmail = value.includes("@");
    if (!name.trim()) return setError("Please tell us your name.");
    if (!value) return setError("Please share an email or phone number so we can tell you when Pro labs launch.");
    setState("sending");
    try {
      const res = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "contact",
          name: name.trim(),
          email: isEmail ? value : "",
          phone: isEmail ? "" : value,
          role,
          message: `Pro labs waitlist: ${picked.length ? picked.join(", ") : "All Pro journeys"}`,
          page: "/labs",
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <div role="status" className="rounded-[var(--radius-lg)] border border-paper/20 bg-paper/[0.06] p-6 text-paper">
        <span className="grid size-11 place-items-center rounded-full bg-paper text-graphite">
          <Check className="size-5" aria-hidden />
        </span>
        <p className="mt-4 text-xl font-bold">You&apos;re on the list.</p>
        <p className="mt-2 text-sm leading-relaxed text-paper/70">We&apos;ll write to you when the first Pro journeys open. Meanwhile, all six free labs are ready to play right now.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative rounded-[var(--radius-lg)] border border-paper/15 bg-paper p-5 text-graphite shadow-[var(--shadow-lift)] sm:p-6">
      <p className="annot text-blueprint">Join the Pro waitlist</p>
      <p className="mt-2 text-lg font-bold leading-snug">Be first to know when Pro journeys open.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor={`${uid}-name`} required>
          <Input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} required />
        </Field>
        <Field label="I am a" htmlFor={`${uid}-role`}>
          <Select id={`${uid}-role`} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Email or phone" htmlFor={`${uid}-contact`} required className="sm:col-span-2">
          <Input id={`${uid}-contact`} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" inputMode="email" maxLength={160} placeholder="you@example.com or +91 …" required />
        </Field>
      </div>
      <fieldset className="mt-4">
        <legend className="annot mb-2 text-charcoal">Interested in (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {proLabs.map((p) => {
            const on = picked.includes(p.title);
            return (
              <button key={p.title} type="button" aria-pressed={on} onClick={() => toggle(p.title)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", on ? "border-graphite bg-graphite text-paper" : "border-graphite/20 hover:border-graphite")}>
                {p.title}
              </button>
            );
          })}
        </div>
      </fieldset>
      {/* honeypot — hidden from people */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-[var(--radius-sm)] border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {state === "sending" ? "Joining…" : "Join the waitlist"}
        </Button>
        <p className="text-[11px] text-blueprint">No spam — one message when Pro launches.</p>
      </div>
    </form>
  );
}
