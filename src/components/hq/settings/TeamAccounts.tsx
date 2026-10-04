"use client";

import { useMemo, useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { hqNav } from "@/lib/hq/nav";
import { ALL, LEADERSHIP, roleLabels, type Role } from "@/lib/hq/roles";
import { CodeBlock, SettingsSection, StatusPill, Subhead } from "./shared";
import type { SystemInfo } from "./useSystemInfo";

const HASH_RE = /^sha256:[0-9a-f]{64}$/i;

export function TeamAccounts({ sys }: { sys: SystemInfo }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("ops");
  const [hash, setHash] = useState("");

  const roleModules = useMemo(() => {
    const items = hqNav.flatMap((g) => g.items);
    return ALL.map((r) => ({ role: r, labels: items.filter((i) => i.roles.includes(r)).map((i) => i.label) }));
  }, []);

  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  const hashOk = HASH_RE.test(hash.trim());
  const entry = JSON.stringify({ username: cleanUser || "username", name: name.trim() || "Full Name", role, password: hashOk ? hash.trim() : "sha256:PASTE_HASH_FROM_THE_SCRIPT" });

  return (
    <SettingsSection id="team" index="07" title="Team accounts" description="Logins are defined by the HQ_USERS environment variable, so they live outside the data repository and can only be changed by someone with Vercel access.">
      {/* current logins */}
      <Subhead>Configured logins</Subhead>
      {sys.status === "loading" && <div className="h-24 animate-pulse rounded-[var(--radius-sm)] bg-graphite/[0.05]" aria-hidden />}
      {sys.status === "error" && (
        <p role="alert" className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {sys.message}
        </p>
      )}
      {sys.status === "ready" &&
        (sys.users.length === 0 ? (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 bg-paper px-4 py-5 text-sm text-charcoal">No logins are configured in this environment yet. Follow the steps below to add the first two founder accounts.</p>
        ) : (
          <div className="hq-scroll overflow-x-auto rounded-[var(--radius-sm)] border border-graphite/12" data-lenis-prevent>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
                  {["Name", "Username", "Role", "Password"].map((h) => (
                    <th key={h} className="annot px-4 py-2.5 text-[10px] font-semibold text-blueprint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sys.users.map((u) => (
                  <tr key={u.username} className="border-b border-graphite/[0.07] last:border-0">
                    <td className="px-4 py-3 font-medium text-graphite">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3">{roleLabels[u.role] ?? u.role}</td>
                    <td className="px-4 py-3">{u.passwordHashed ? <StatusPill tone="ok">Hashed</StatusPill> : <StatusPill tone="warn">Plain text, replace it</StatusPill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {sys.status === "ready" && sys.users.some((u) => !u.passwordHashed) && (
        <p className="mt-2 text-xs text-warn">At least one password is stored as plain text in HQ_USERS. Replace it with a sha256 hash (step 1 below) before going live.</p>
      )}

      {/* how to add */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <Subhead>Add or change a login</Subhead>
          <ol className="space-y-5 text-sm text-charcoal">
            <li>
              <p className="flex gap-2">
                <span className="font-mono text-xs text-blueprint">01</span>
                <span>
                  <strong className="text-graphite">Hash the password.</strong> Run this in the project folder; use 10 or more characters and share the password privately, never in a group chat.
                </span>
              </p>
              <CodeBlock className="mt-2" code={'node scripts/hash-password.mjs "a-strong-password"'} />
              <p className="mt-1.5 text-xs text-blueprint">It prints a value starting with sha256: that is safe to store.</p>
            </li>
            <li>
              <p className="flex gap-2">
                <span className="font-mono text-xs text-blueprint">02</span>
                <span>
                  <strong className="text-graphite">Add the account to HQ_USERS.</strong> It is a JSON array with one object per person. Build the object on the right and paste it into the array, separated by commas.
                </span>
              </p>
            </li>
            <li>
              <p className="flex gap-2">
                <span className="font-mono text-xs text-blueprint">03</span>
                <span>
                  <strong className="text-graphite">Save and redeploy.</strong> On Vercel: Project → Settings → Environment Variables → edit HQ_USERS → redeploy. Locally: edit <span className="font-mono text-xs">.env.local</span> and restart the dev server. To change a password, replace that person&apos;s hash the same way.
                </span>
              </p>
            </li>
          </ol>
        </div>

        <div>
          <Subhead>Account builder</Subhead>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" htmlFor="acct-user" help="Lowercase letters, numbers, dot, dash">
              <Input id="acct-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" spellCheck={false} placeholder="shiva" />
            </Field>
            <Field label="Full name" htmlFor="acct-name">
              <Input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="Shivaprasad Reddy S S" />
            </Field>
            <Field label="Role" htmlFor="acct-role" className="sm:col-span-2">
              <Select id="acct-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ALL.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Password hash" htmlFor="acct-hash" className="sm:col-span-2" error={hash.trim() && !hashOk ? "Paste the full value printed by the script (sha256: followed by 64 characters)" : undefined} help={!hash.trim() ? "Paste the output of step 1" : undefined}>
              <Input id="acct-hash" value={hash} onChange={(e) => setHash(e.target.value)} autoComplete="off" spellCheck={false} className="font-mono text-xs" placeholder="sha256:…" aria-invalid={hash.trim() && !hashOk ? true : undefined} />
            </Field>
          </div>
          <CodeBlock className="mt-4" label="Paste into the HQ_USERS array" code={entry} />
          <p className="mt-2 text-xs text-blueprint">Nothing typed here is sent anywhere. The object is built in your browser.</p>
        </div>
      </div>

      {/* roles */}
      <div className="mt-8 border-t border-dashed border-graphite/15 pt-6">
        <Subhead>What each role can open</Subhead>
        <dl className="grid gap-3 md:grid-cols-2">
          {roleModules.map(({ role: r, labels }) => (
            <div key={r} className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3">
              <dt className="text-sm font-semibold text-graphite">{roleLabels[r]}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-charcoal">{LEADERSHIP.includes(r) ? `Every module (${labels.length}), including Settings, Finance and Team.` : labels.join(", ")}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-blueprint">Access is also enforced on the server for each record type, so a hidden menu item is never the only protection.</p>
      </div>
    </SettingsSection>
  );
}
