"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, BookOpen, Clock, Cpu, Download, FolderOpen, Printer, Users } from "lucide-react";
import { PageHeader, Loading, EmptyState, Panel } from "@/components/hq/ui";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { gradeBands, kits, type GradeBand, type GradeBandId } from "@/lib/content/business";
import { KindIcon } from "./DocTree";
import { useOpsTree } from "./hooks";
import { docHref, extOf, fileKind, filesBelow, formatBytes, friendlyName, nodeTitle, OPS_ROOT, printDocHref, printPackHref, type TreeNode } from "./lib";

const CURRICULUM = `${OPS_ROOT}/02_CURRICULUM`;
const STUDENT = `${OPS_ROOT}/05_STUDENT_MATERIAL`;
const TRAINER = `${OPS_ROOT}/04_TRAINER_MANUAL`;

/** Folder names used in OPERATIONS/ for each grade band. */
const BAND_FOLDER: Record<GradeBandId, string> = {
  "g1-2": "G01-02_Little_Inventors",
  "g3-5": "G03-05_Young_Makers",
  "g6-8": "G06-08_Robo_Engineers",
  "g9-10": "G09-10_AI_Innovators",
};

const PROGRAM_SECTIONS = [
  { folder: "00_Framework", title: "Curriculum framework", blurb: "How JOVE sessions are designed — outcomes, pedagogy and assessment." },
  { folder: "Club_Program", title: "Club Program", blurb: "Material for the recurring in-school JOVE Club." },
  { folder: "Teacher_Training", title: "Teacher training", blurb: "Resources for training school teachers to continue the learning." },
  { folder: "Virtual_Labs", title: "Virtual Labs", blurb: "Lesson design behind the free online Virtual Labs." },
];

function DocRows({ nodes, base }: { nodes: TreeNode[]; base: string }) {
  return (
    <ul className="divide-y divide-graphite/10">
      {nodes.map((n) => {
        const kind = fileKind(n.name);
        const sub = n.path.slice(base.length + 1).split("/").slice(0, -1).map((s) => friendlyName(s)).join(" / ");
        return (
          <li key={n.path} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
            <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper">
              <KindIcon kind={kind} className="size-4 text-charcoal" />
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-sm font-semibold leading-snug">{nodeTitle(n)}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-blueprint">
                {sub && <span>{sub}</span>}
                <span className="break-all font-mono">{n.name}</span>
                <span className="tabular font-mono uppercase">{extOf(n.name)}</span>
                <span className="tabular font-mono">{formatBytes(n.size)}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href={docHref(n.path)} className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite px-3 text-xs font-semibold transition-colors hover:bg-graphite hover:text-paper">
                <BookOpen className="size-3.5" aria-hidden /> Open
              </Link>
              {kind === "markdown" && (
                <a href={printDocHref(n.path)} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-xs font-semibold text-charcoal transition-colors hover:bg-graphite/[0.07]" aria-label={`Print ${nodeTitle(n)}`}>
                  <Printer className="size-3.5" aria-hidden /> Print
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DocPanel({ title, subtitle, folder, index, loading, back }: { title: string; subtitle?: string; folder: string; index: Map<string, TreeNode> | null; loading: boolean; back: string }) {
  const node = index?.get(folder);
  const files = filesBelow(node);
  const md = files.filter((f) => fileKind(f.name) === "markdown");
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex items-center gap-1">
          {md.length > 1 && (
            <a href={printPackHref([folder], `${title} — print pack`, back)} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-charcoal hover:bg-graphite/[0.07]">
              <Printer className="size-3.5" aria-hidden /> Print all
            </a>
          )}
          <Link href={docHref(folder)} className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-charcoal hover:bg-graphite/[0.07]" aria-label={`Open the ${title} folder in the library`}>
            Folder <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      }
    >
      {loading ? (
        <Loading label="Looking for documents…" className="py-6" />
      ) : files.length === 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 px-4 py-6 text-center">
          <p className="text-sm font-medium">No documents here yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-blueprint">Documents added to this folder in the Operations Library appear here automatically.</p>
          <Link href={docHref(folder)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4">
            Go to the folder <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </div>
      ) : (
        <DocRows nodes={files} base={folder} />
      )}
    </Panel>
  );
}

function BandCard({ band, selected, count, onSelect }: { band: GradeBand; selected: boolean; count: number | null; onSelect: () => void }) {
  const kit = kits.find((k) => k.id === band.kitId);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border bg-paper-50 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite",
        selected ? "border-graphite shadow-[var(--shadow-lift)]" : "border-graphite/15 hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-paper)]",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-graphite/10 bg-paper-100">
        <Image src={band.image} alt="" fill sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        <span className="absolute left-3 top-3 rounded-full bg-graphite px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-paper">{band.grades}</span>
        {selected && <CornerMarks size={8} inset={6} />}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-base font-bold tracking-tight">{band.name}</p>
        <p className="mt-0.5 text-xs text-charcoal">{band.theme}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-blueprint">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden />
            <dt className="sr-only">Session length</dt>
            <dd className="tabular font-mono">{band.durationMin} min</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="size-3.5" aria-hidden />
            <dt className="sr-only">Kit</dt>
            <dd className="truncate">{kit?.name.replace(/^JOVE /, "") ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-auto pt-3 text-[11px] font-semibold">
          <span className="tabular font-mono">{count === null ? "…" : count}</span> {count === 1 ? "lesson document" : "lesson documents"}
        </p>
      </div>
    </button>
  );
}

/** /hq/curriculum — trainer-friendly view over the curriculum folders in the Operations Library. */
export function CurriculumApp() {
  const params = useSearchParams();
  const { index, loading, error, reload } = useOpsTree();
  const band = gradeBands.find((b) => b.id === params.get("band")) ?? gradeBands[0];
  const kit = kits.find((k) => k.id === band.kitId);

  const curFolder = `${CURRICULUM}/${BAND_FOLDER[band.id]}`;
  const stuFolder = `${STUDENT}/${BAND_FOLDER[band.id]}`;
  const back = `/hq/curriculum?band=${band.id}`;
  const mdIn = (folder: string) => filesBelow(index?.get(folder)).filter((f) => fileKind(f.name) === "markdown").length;
  const curMd = index ? mdIn(curFolder) : 0;
  const packMd = index ? curMd + mdIn(stuFolder) + mdIn(TRAINER) : 0;

  const select = (id: GradeBandId) => {
    window.history.pushState(null, "", `/hq/curriculum?band=${id}`);
    requestAnimationFrame(() => document.getElementById("band-detail")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  };

  return (
    <div>
      <PageHeader
        title="Curriculum"
        eyebrow="Trainer toolkit"
        icon="GraduationCap"
        description="Lesson plans, student printables and the trainer manual for every grade band. Documents appear here automatically as they are added to the Operations Library."
        actions={
          <Button href="/hq/docs?path=OPERATIONS/02_CURRICULUM" variant="secondary" size="sm">
            <FolderOpen className="size-4" /> Open in library
          </Button>
        }
      />

      {error ? (
        <EmptyState icon="GraduationCap" title="Couldn’t load the curriculum" description={error} action={<Button size="sm" onClick={reload}>Try again</Button>} />
      ) : (
        <>
          <section aria-label="Grade bands" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {gradeBands.map((b) => (
              <BandCard key={b.id} band={b} selected={b.id === band.id} count={index ? filesBelow(index.get(`${CURRICULUM}/${BAND_FOLDER[b.id]}`)).length : null} onSelect={() => select(b.id)} />
            ))}
          </section>

          <section id="band-detail" aria-labelledby="band-title" className="mt-10 scroll-mt-24">
            <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite p-6 text-paper sm:p-8">
              <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr]">
                <div>
                  <p className="annot text-paper/60">
                    {band.grades} · {band.theme}
                  </p>
                  <h2 id="band-title" className="mt-2 text-3xl font-bold tracking-[-0.03em]">
                    {band.name}
                  </h2>
                  <p className="mt-1 text-paper/75">{band.tagline}</p>
                  <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-paper/60" aria-hidden />
                      <dt className="sr-only">Session length</dt>
                      <dd className="tabular font-mono">{band.durationMin} min session</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-paper/60" aria-hidden />
                      <dt className="sr-only">Group size</dt>
                      <dd className="tabular font-mono">{band.studentsPerStation} per station</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="size-4 text-paper/60" aria-hidden />
                      <dt className="sr-only">Kit</dt>
                      <dd>{kit?.name ?? "—"}</dd>
                    </div>
                  </dl>
                  <h3 className="annot mt-6 text-paper/60">By the end, students can</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-paper/90">
                    {band.outcomes.map((o) => (
                      <li key={o} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 bg-paper/60" aria-hidden />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="annot text-paper/60">Session at a glance</h3>
                  <ol className="mt-2 divide-y divide-paper/15 border-y border-paper/15">
                    {band.activities.map((a, i) => (
                      <li key={a.title} className="flex items-start gap-3 py-2.5 text-sm">
                        <span className="tabular mt-0.5 font-mono text-xs text-paper/50">{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex-1">
                          <span className="block font-medium">{a.title}</span>
                          <span className="block text-xs text-paper/65">{a.detail}</span>
                        </span>
                        <span className="tabular font-mono text-xs text-paper/70">{a.minutes}′</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {curMd > 0 ? (
                      <Button href={printPackHref([curFolder], `${band.name} — curriculum pack`, back)} external variant="light" size="sm">
                        <Download className="size-4" /> Download full curriculum pack
                      </Button>
                    ) : (
                      <span className="rounded-[var(--radius-sm)] border border-paper/25 px-3 py-2 text-xs text-paper/70">Curriculum pack unlocks when lesson documents are added.</span>
                    )}
                    {packMd > curMd && (
                      <Button href={printPackHref([curFolder, stuFolder, TRAINER], `${band.name} — complete trainer pack`, back)} external variant="outline-light" size="sm">
                        <Printer className="size-4" /> Complete pack (+ student material &amp; manual)
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-paper/55">Opens a print-ready view — choose “Save as PDF” in the print dialog.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <DocPanel title="Lesson plans & curriculum" subtitle={`02 Curriculum / ${band.name}`} folder={curFolder} index={index} loading={loading} back={back} />
              <DocPanel title="Student printables" subtitle={`05 Student material / ${band.name}`} folder={stuFolder} index={index} loading={loading} back={back} />
              <DocPanel title="Trainer manual" subtitle="04 Trainer manual · all grade bands" folder={TRAINER} index={index} loading={loading} back={back} />
            </div>
          </section>

          <section aria-labelledby="program-title" className="mt-12">
            <h2 id="program-title" className="text-xl font-bold tracking-tight">
              Program-wide resources
            </h2>
            <p className="mb-5 mt-1 max-w-2xl text-sm text-charcoal">Shared across every grade band.</p>
            <div className="grid gap-6 lg:grid-cols-2">
              {PROGRAM_SECTIONS.map((s) => (
                <DocPanel key={s.folder} title={s.title} subtitle={s.blurb} folder={`${CURRICULUM}/${s.folder}`} index={index} loading={loading} back={back} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
