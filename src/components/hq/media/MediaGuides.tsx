import Link from "next/link";
import { ArrowUpRight, BookOpen, Clapperboard, FileSignature, Megaphone, Quote, Video } from "lucide-react";
import { mediaPack } from "@/lib/content/business";
import { site } from "@/lib/site";
import { Panel } from "@/components/hq/ui";

const docs = (path: string) => `/hq/docs?path=${encodeURIComponent(path)}`;

const LINKS = [
  { href: docs("OPERATIONS/25_MEDIA_PRODUCTION"), title: "Media production library", detail: "Shot lists, kit checklists, edit and delivery standards for the FrameMind crew.", icon: Clapperboard },
  { href: docs("OPERATIONS/03_SOP/09_Media_Pack_Delivery_SOP.md"), title: "Media Pack delivery SOP", detail: "From the shoot day to the school receiving files: who does what, and by when.", icon: Video },
  { href: docs("OPERATIONS/18_LEGAL_CONSENT"), title: "Consent & usage rights", detail: "Parent consent wording and how student images may be used.", icon: FileSignature },
  { href: docs("OPERATIONS/11_CONTENT"), title: "Content library", detail: "Pillars, hooks, caption bank and the brand voice for JOVE's own channels.", icon: BookOpen },
  { href: docs("OPERATIONS/21_MARKETING"), title: "Marketing playbook", detail: "Launch plan, channels and the founding-partner school offer.", icon: Megaphone },
  { href: "/hq/reputation", title: "Testimonials & case studies", detail: "Clips and quotes collected after each workshop, with consent tracking.", icon: Quote },
];

export function MediaGuides() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div>
        <h2 className="annot mb-3 text-blueprint">FrameMind media SOP · quick links</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group flex h-full gap-3 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 transition-all hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-paper)]">
                <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper">
                  <l.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    {l.title}
                    <ArrowUpRight className="size-3.5 text-blueprint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-charcoal">{l.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-blueprint">
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
