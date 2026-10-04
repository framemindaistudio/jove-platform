import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, configuredUsers } from "@/lib/hq/auth";
import { Logo } from "@/components/brand/Logo";
import { AnnotationStack, CornerMarks, Crosshair, DimensionLine } from "@/components/brand/Blueprint";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/hq") ? next : "/hq";
  if (await getSession()) redirect(safeNext);
  const usersConfigured = configuredUsers().length > 0;

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.15fr_1fr]">
      {/* left: blueprint panel */}
      <div className="relative hidden overflow-hidden bg-paper lg:block">
        <div className="bp-grid absolute inset-0" />
        <Image src="/images/misc/hq-command.webp" alt="" fill priority sizes="60vw" className="object-cover object-center opacity-90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/10 to-paper/40" />
        <Crosshair className="absolute left-10 top-10" />
        <div className="absolute inset-x-12 bottom-12">
          <p className="annot text-blueprint">JOVE HQ · Command Center</p>
          <h1 className="mt-3 max-w-lg text-5xl font-bold leading-[1.02] tracking-tight text-graphite">
            One portal.
            <br />
            The whole company.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal">
            Schools, workshops, kits, money, curriculum, printables and media — versioned in your private GitHub, available anywhere.
          </p>
          <DimensionLine label="Precision · Learning · Innovation · Automation" className="mt-10" />
        </div>
      </div>

      {/* right: form */}
      <div className="relative flex items-center justify-center bg-graphite px-6 py-16 text-paper">
        <div className="bp-grid-dark absolute inset-0 opacity-70" />
        <div className="relative w-full max-w-sm">
          <div className="mx-auto mb-10 w-40">
            <Logo variant="wordmark" tone="white" priority />
          </div>
          <div className="relative rounded-[var(--radius-lg)] border border-paper/15 bg-ink/40 p-7 backdrop-blur">
            <CornerMarks className="text-paper/50" />
            <h2 className="text-xl font-bold">Team sign in</h2>
            <p className="mt-1 text-sm text-paper/55">Founders, trainers and media crew only.</p>
            {usersConfigured ? (
              <LoginForm next={safeNext} />
            ) : (
              <div className="mt-6 rounded border border-warn/40 bg-warn/15 p-4 text-sm text-paper/85">
                <p className="font-semibold">HQ users are not configured yet.</p>
                <p className="mt-1 text-paper/65">
                  Add <code className="font-mono text-xs">HQ_USERS</code> and <code className="font-mono text-xs">HQ_SESSION_SECRET</code> to the environment (Vercel → Settings → Environment Variables). See the README.
                </p>
              </div>
            )}
          </div>
          <div className="mt-10 flex items-end justify-between">
            <AnnotationStack items={["Robotics", "AI", "STEM Education", "Real World Skills"]} className="text-paper/40" />
            <Link href="/" className="annot text-paper/45 hover:text-paper">
              ← Public site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
