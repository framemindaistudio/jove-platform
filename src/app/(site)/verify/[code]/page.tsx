import type { Metadata } from "next";
import { Crosshair, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { CertificateCard, CertificateNotFound } from "@/components/site/contact/CertificateCard";
import { CertificateLookup } from "@/components/site/contact/CertificateLookup";
import { findCertificate } from "@/lib/public-data";

// Always read the live registry: a revoked certificate must never be served from a cached page.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

function cleanCode(raw: string) {
  let v = raw;
  try {
    v = decodeURIComponent(raw);
  } catch {
    /* keep the raw segment */
  }
  return v.trim().toUpperCase().slice(0, 40);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params;
  return {
    title: "Certificate Verification",
    description: "Result of a JOVE certificate verification.",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function VerifyResultPage({ params }: Props) {
  const code = cleanCode((await params).code);
  const malformed = !/^[A-Z0-9-]{6,32}$/.test(code);
  const cert = malformed ? null : await findCertificate(code);

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-32 sm:pb-16 sm:pt-40">
        <GridBackdrop />
        <Crosshair className="absolute left-[6%] top-28 hidden md:block" />
        <div className="container-bp relative">
          <SectionLabel index="VERIFY">Certificate check</SectionLabel>
          <h1 className="mt-6 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">
            {cert ? (cert.status === "valid" ? "This certificate is genuine." : "This certificate is not valid.") : "No match found."}
          </h1>
          <p className="mt-4 font-mono text-sm tracking-[0.14em] text-blueprint">
            <span className="annot mr-2">ID</span>
            <span className="break-all text-graphite">{code}</span>
          </p>
        </div>
      </section>

      <section className="relative pb-24 sm:pb-32">
        <div className="container-bp grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">{cert ? <CertificateCard cert={cert} /> : <CertificateNotFound code={code} malformed={malformed} />}</div>
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="annot text-blueprint">Check another certificate</p>
              <CertificateLookup stacked className="mt-3" />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
