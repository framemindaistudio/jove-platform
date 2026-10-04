"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/form";
import { analyticsRunning } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** Same rule the server applies in findCertificate(). */
const CODE_RE = /^[A-Z0-9-]{6,32}$/;

function normalise(raw: string) {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s_‐-―−]+/g, "-");
}

/** Certificate ID form: validates the shape, then navigates to /verify/<code>. */
export function CertificateLookup({ initial = "", className, dark, stacked }: { initial?: string; className?: string; dark?: boolean; stacked?: boolean }) {
  const router = useRouter();
  const uid = useId();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [transitioning, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const pending = transitioning || loading;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = normalise(value);
    if (!code) return setError("Enter the certificate ID printed on the certificate.");
    if (!CODE_RE.test(code)) return setError("That does not look like a certificate ID. IDs use letters, numbers and hyphens, for example JOVE-26-7KQ2M.");
    setError("");
    setValue(code);
    const target = `/verify/${encodeURIComponent(code)}`;
    // with analytics running, a certificate page has to open as a fresh document (see components/site/Analytics)
    if (analyticsRunning()) {
      setLoading(true);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full page load is the point
      window.location.assign(target);
    } else startTransition(() => router.push(target));
  }

  const inputId = `${uid}-code`;
  const errId = `${uid}-err`;

  return (
    <form onSubmit={onSubmit} noValidate className={cn("w-full", className)}>
      <Label htmlFor={inputId} className={dark ? "text-paper/70" : undefined}>
        Certificate ID
      </Label>
      <div className={cn("flex flex-col gap-3", !stacked && "sm:flex-row")}>
        <Input
          id={inputId}
          name="code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          placeholder="JOVE-26-7KQ2M"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          className="h-14 flex-1 font-mono text-base uppercase tracking-[0.12em] placeholder:normal-case placeholder:tracking-[0.08em]"
        />
        <Button type="submit" size="lg" disabled={pending} className={stacked ? undefined : "sm:min-w-44"}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
          {pending ? "Checking" : "Verify"}
        </Button>
      </div>
      <p id={errId} role="alert" className="mt-2 min-h-5 text-xs text-bad">
        {error}
      </p>
    </form>
  );
}
