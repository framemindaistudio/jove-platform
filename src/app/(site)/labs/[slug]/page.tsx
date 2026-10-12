import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, GraduationCap, Layers } from "lucide-react";
import { getLab, labs } from "@/lib/content/labs";
import { GridBackdrop, SectionLabel, CornerMarks } from "@/components/brand/Blueprint";
import { Badge } from "@/components/ui/Badge";
import { LabLoader } from "@/components/labs/registry";
import { CTASection } from "@/components/site/CTASection";

export function generateStaticParams() {
  return labs.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) return {};
  return { title: `${lab.title} — Free Virtual Lab`, description: lab.summary, openGraph: { images: [lab.image] } };
}

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-28 sm:pt-32">
        <GridBackdrop />
        <div className="container-bp relative">
          <Link href="/labs" className="annot inline-flex items-center gap-2 text-blueprint hover:text-graphite">
            <ArrowLeft className="size-3.5" /> All Virtual Labs
          </Link>
          <div className="mt-6 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SectionLabel>{`Virtual Lab · ${lab.topic}`}</SectionLabel>
              <h1 className="mt-5 text-[clamp(2.4rem,5.5vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.03em]">{lab.title}</h1>
              <p className="mt-3 text-lg font-medium text-charcoal">{lab.subtitle}</p>
              <p className="mt-5 max-w-xl leading-relaxed text-charcoal">{lab.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="dark"><GraduationCap className="size-3" /> {lab.grades}</Badge>
                <Badge tone="outline"><Clock className="size-3" /> ~{lab.minutes} min</Badge>
                <Badge tone="outline"><Layers className="size-3" /> {lab.level}</Badge>
                {lab.concepts.map((c) => (
                  <Badge key={c} tone="neutral">{c}</Badge>
                ))}
              </div>
            </div>
            <div className="relative lg:col-span-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper">
                <CornerMarks />
                <Image src={lab.image} alt={`${lab.title} blueprint illustration`} fill priority sizes="(max-width:1024px) 100vw, 40vw" className="object-cover mix-blend-multiply" />
              </div>
              <p className="annot mt-3 text-right text-blueprint">Offline version: {lab.offlineLink}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="container-bp relative pb-24">
        <LabLoader slug={lab.slug} />
      </section>
      <CTASection
        eyebrow="Loved this lab?"
        title={["Now build it", "for real."]}
        body="Every Virtual Lab mirrors a hands-on session in our full-day JOVE workshops — with real robots, real sensors and a film crew capturing it all."
        primary={{ label: "Bring JOVE to your school", href: "/contact" }}
        secondary={{ label: "More Virtual Labs", href: "/labs" }}
      />
    </>
  );
}
