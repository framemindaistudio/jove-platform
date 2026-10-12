import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { mediaPack } from "@/lib/content/business";
import { site } from "@/lib/site";
import { Panel } from "@/components/hq/ui";
import { OWN_CHANNELS, SCHOOL_SIDE, type Guide } from "./guides";

const docs = (path: string) => `/hq/docs?path=${encodeURIComponent(path)}`;

function GuideList({ guides }: { guides: Guide[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {guides.map((g) => (
        <li key={g.title}>
          <Link
            href={g.doc ? docs(g.doc) : (g.href ?? "/hq")}
            className="group flex h-full gap-3 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 transition-all hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-paper)]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper">
              <g.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-sm font-semibold">
                {g.title}
                <ArrowUpRight className="size-3.5 text-blueprint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-charcoal">{g.detail}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** `closedDocs`: library documents this account may not open. Their links are left out, so nothing leads to a refusal. */
export function MediaGuides({ closedDocs = [] }: { closedDocs?: string[] }) {
  const mayOpen = (g: Guide) => !g.doc || !closedDocs.includes(g.doc);
  const school = SCHOOL_SIDE.filter(mayOpen);
  const own = OWN_CHANNELS.filter(mayOpen);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div>
        <h2 className="annot mb-3 text-blueprint">FrameMind media SOP · shooting and school deliverables</h2>
        <GuideList guides={school} />

        <h2 className="annot mb-1 mt-8 text-blueprint">JOVE&apos;s own channels · now in Social Studio</h2>
        <p className="mb-3 max-w-xl text-xs leading-relaxed text-charcoal">
          The content calendar and the posts that used to sit in Media Studio are now the plan in{" "}
          <Link href="/hq/social" className="font-semibold text-graphite underline underline-offset-2">
            Social Studio
          </Link>
          , next to the designs and captions. Nothing was removed.
        </p>
        <GuideList guides={own} />

        <p className="mt-6 text-xs text-blueprint">
          {site.studio.name} is JOVE&apos;s in-house studio.{" "}
          <a href={site.studio.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-graphite">
            Visit the studio site
          </a>
          .
        </p>
      </div>

      <Panel title="What every JOVE Day promises" subtitle={`${mediaPack.name}`}>
        <ul className="divide-y divide-graphite/10">
          {mediaPack.items.map((i) => (
            <li key={i.title} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold">{i.title}</p>
              <p className="text-xs text-blueprint">{i.delivery}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-graphite/10 pt-3 text-xs leading-relaxed text-charcoal">{mediaPack.rights}</p>
      </Panel>
    </div>
  );
}
