import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, CircleAlert, SearchX } from "lucide-react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { buttonClass } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";

export interface VerifiedCertificate {
  code: string;
  studentName: string;
  grade?: string;
  schoolName?: string;
  program?: string;
  type: string;
  issueDate?: string;
  status: string;
}

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid gap-1 border-t border-graphite/12 py-3.5 first:border-t-0 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="annot pt-0.5 text-blueprint">{label}</dt>
      <dd className={cn("text-[15px] font-semibold leading-snug text-graphite", mono && "font-mono tracking-[0.1em]")}>{children}</dd>
    </div>
  );
}

/** Result of a successful registry lookup: verified, revoked, or unclear status. */
export function CertificateCard({ cert }: { cert: VerifiedCertificate }) {
  const state = cert.status === "valid" ? "valid" : cert.status === "revoked" ? "revoked" : "other";
  const head = {
    valid: { icon: BadgeCheck, label: "Verified", note: "This certificate is genuine. It was issued by JOVE and is in our registry.", tone: "bg-graphite text-paper" },
    revoked: { icon: CircleAlert, label: "Revoked", note: "This certificate was issued by JOVE but has since been revoked and is no longer valid.", tone: "bg-bad text-white" },
    other: { icon: CircleAlert, label: "Needs review", note: "This certificate is in our registry, but its status could not be confirmed. Please contact us.", tone: "bg-warn text-white" },
  }[state];
  const Icon = head.icon;

  return (
    <article aria-labelledby="cert-result" className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite/25 bg-paper-50 shadow-[var(--shadow-lift)]">
      <CornerMarks size={14} />
      <div className={cn("flex items-start gap-4 px-6 py-5 sm:px-9", head.tone)} role="status">
        <Icon className="mt-0.5 size-8 shrink-0" strokeWidth={1.5} aria-hidden />
        <div>
          <p id="cert-result" className="text-2xl font-bold leading-none tracking-[-0.02em]">
            <span aria-hidden>{state === "valid" ? "✓ " : ""}</span>
            {head.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed opacity-85">{head.note}</p>
        </div>
      </div>

      <div className="relative px-6 py-7 sm:px-9 sm:py-9">
        <Image
          src="/brand/jove-mark.png"
          alt=""
          width={1024}
          height={1178}
          sizes="320px"
          className="pointer-events-none absolute -bottom-10 -right-8 hidden w-72 select-none opacity-[0.07] sm:block"
        />
        <p className="annot text-blueprint">Certificate of {cert.type.toLowerCase()}</p>
        <p className={cn("mt-2 text-[clamp(1.9rem,4.5vw,3rem)] font-bold leading-[1.05] tracking-[-0.03em] text-graphite", state === "revoked" && "line-through decoration-bad/60 decoration-2")}>
          {cert.studentName || "Student"}
        </p>
        <dl className="relative mt-7">
          {cert.program && <Row label="Programme">{cert.program}</Row>}
          <Row label="Type">{cert.type}</Row>
          {cert.schoolName && <Row label="School">{cert.schoolName}</Row>}
          {cert.grade && <Row label="Grade">{cert.grade}</Row>}
          {cert.issueDate && <Row label="Issued on">{formatDate(cert.issueDate, { day: "numeric", month: "long", year: "numeric" })}</Row>}
          <Row label="Certificate ID" mono>
            {cert.code}
          </Row>
        </dl>
      </div>
    </article>
  );
}

/** Shown when no certificate matches (or the ID is malformed). */
export function CertificateNotFound({ code, malformed }: { code: string; malformed: boolean }) {
  return (
    <article aria-labelledby="cert-result" className="relative rounded-[var(--radius-md)] border border-graphite/25 bg-paper-50 shadow-[var(--shadow-paper)]">
      <CornerMarks size={14} />
      <div className="px-6 py-8 sm:px-9 sm:py-10" role="status">
        <SearchX className="size-9 text-blueprint" strokeWidth={1.4} aria-hidden />
        <h2 id="cert-result" className="mt-4 text-[clamp(1.6rem,3.6vw,2.2rem)] font-bold leading-tight tracking-[-0.025em] text-graphite">
          We could not verify that certificate
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal">
          {malformed ? (
            <>
              <span className="break-all font-mono tracking-wider text-graphite">{code}</span> does not look like a JOVE certificate ID.
            </>
          ) : (
            <>
              There is no certificate with the ID <span className="break-all font-mono tracking-wider text-graphite">{code}</span> in our registry.
            </>
          )}{" "}
          That does not always mean a certificate is fake. Please check these first:
        </p>
        <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-charcoal">
          {[
            "Re-type the ID exactly as printed. The letter O and the number 0, and the letter I and the number 1, are easy to mix up.",
            "IDs look like JOVE-26-7KQ2M: the word JOVE, a two-digit year and a short code, joined by hyphens.",
            "Certificates are added to the registry after the workshop, so a very recent certificate may not be listed yet.",
            "Certificates you print yourself at the end of a free Virtual Lab are self-service and are not entered in the registry, so they cannot be verified here.",
          ].map((t) => (
            <li key={t} className="relative pl-5">
              <span aria-hidden className="absolute left-0 top-[0.62em] size-[5px] rotate-45 border border-graphite/70" />
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/verify" className={buttonClass("primary", "md")}>
            Try another ID
          </Link>
          <Link href="/contact?type=general" className={buttonClass("secondary", "md")}>
            Ask us to check
          </Link>
        </div>
      </div>
    </article>
  );
}
