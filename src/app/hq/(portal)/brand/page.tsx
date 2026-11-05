import type { Metadata } from "next";
import Image from "next/image";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { BRAND_COLOURS, SITE_FILES, SITE_FILMS, SITE_PICTURES } from "@/lib/brand/kit";
import { PageHeader, Panel } from "@/components/hq/ui";
import { KitFiles } from "@/components/hq/brand/KitFiles";

export const metadata: Metadata = { title: "Brand Kit" };

const SECTIONS = [
  { id: "logos", name: "Logo files" },
  { id: "site", name: "Website files" },
  { id: "colours", name: "Colours" },
  { id: "type", name: "Type" },
  { id: "pictures", name: "Pictures and films" },
];

/** HQ → Brand Kit: every JOVE logo file to download, the colours, the type, and the pictures the website uses. */
export default async function BrandKitPage() {
  await requireUser(ALL);
  return (
    <div>
      <PageHeader
        eyebrow="Brand & Social"
        title="Brand Kit"
        icon="Palette"
        description="Every JOVE logo file at full size, the colours and the type. Built from the 4K logo masters: never redraw, recolour, stretch or re-type the logo, and add no glows or shadows."
      />
      <nav aria-label="On this page" className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-[var(--radius-sm)] border border-graphite/20 px-3 py-1.5 text-xs font-semibold text-graphite transition-colors hover:border-graphite/50 hover:bg-graphite/5">
            {s.name}
          </a>
        ))}
      </nav>

      <div className="space-y-5">
        <div id="logos" className="scroll-mt-20">
          <Panel title="Logo files" subtitle="Full-size PNGs. The O is a robotic arm curling into a ring, drawn like a pencil sketch: these files keep it exactly as drawn.">
            <KitFiles />
          </Panel>
        </div>

        <div id="site" className="scroll-mt-20">
          <Panel title="Website files" subtitle="Smaller files the website, HQ screens and printables use. Built by the same script.">
            <ul className="grid gap-x-8 gap-y-1.5 text-xs text-charcoal md:grid-cols-2">
              {SITE_FILES.map((f) => (
                <li key={f.file}>
                  <a href={`/brand/${f.file}`} download className="font-mono font-medium text-graphite underline underline-offset-2">
                    {f.file}
                  </a>{" "}
                  · {f.what}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div id="colours" className="scroll-mt-20">
          <Panel title="Colours" subtitle="Monochrome graphite on warm paper. Colour comes from photographs and the children's work, never from the brand.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {BRAND_COLOURS.map((c) => (
                <li key={c.name} className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50">
                  <div aria-hidden className="h-16 border-b border-graphite/10" style={{ background: c.hex }} />
                  <div className="px-3 pb-3 pt-2.5">
                    <p className="text-sm font-semibold text-graphite">{c.name}</p>
                    <p className="font-mono text-xs text-graphite">{c.hex}</p>
                    <p className="mt-1 text-xs leading-snug text-charcoal">{c.role}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-charcoal">No gradient: the brand is flat graphite and paper. HQ&apos;s status colours (green, amber, red, blue) never appear in brand material.</p>
          </Panel>
        </div>

        <div id="type" className="scroll-mt-20">
          <Panel title="Type" subtitle="Montserrat for everything people read, JetBrains Mono for numbers and labels. Both are free on Google Fonts.">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-5">
                <p className="annot mb-3 text-[10px] text-blueprint">The wordmark</p>
                <Image src="/brand/jove-wordmark.png" alt="JOVE — Journey of Visionation & Excellence" width={1400} height={669} sizes="520px" className="h-auto w-full max-w-[520px]" />
                <p className="mt-3 text-xs leading-relaxed text-charcoal">
                  The letters J, V and E and the arm-ring O are drawn, never typed. Only the tagline is set, in Montserrat with wide letter-spacing:
                </p>
                <p className="mt-2 font-sans text-lg font-medium tracking-[0.09em] text-graphite">Journey of Visionation &amp; Excellence</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                  <p className="font-sans text-3xl font-extrabold tracking-[-0.01em] text-graphite">Montserrat</p>
                  <p className="mt-1 text-xs text-charcoal">Headings 700–800, body 400–500, the tagline. Display tracking −1%.</p>
                  <p className="mt-2 font-sans text-base font-medium text-graphite">Aa Bb Cc Dd Ee Ff Gg 0123456789 ₹</p>
                </div>
                <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                  <p className="font-mono text-2xl font-medium text-graphite">JetBrains Mono</p>
                  <p className="mt-1 text-xs text-charcoal">Prices, codes, schedules, section indices and uppercase annotation labels (+12% tracking).</p>
                  <p className="mt-2 font-mono text-base font-medium text-graphite">JOVE DAY · 01 · 08:30</p>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div id="pictures" className="scroll-mt-20">
          <Panel title="Pictures and films on the website" subtitle="All of these are illustrations (generated or drawn), not photographs of JOVE events. Never caption them as a real workshop or school.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {SITE_PICTURES.map((p) => (
                <li key={p.src} className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50">
                  <div className="relative aspect-[4/3] bg-paper">
                    <Image src={p.src} alt={`${p.name} (illustration)`} fill sizes="240px" className="object-cover" />
                    <span className="annot absolute left-2 top-2 rounded-[2px] bg-graphite/85 px-1.5 py-0.5 text-[9px] text-paper">Illustration</span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-graphite">{p.name}</p>
                    <p className="text-[11px] text-charcoal">{p.use}</p>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {SITE_FILMS.map((f) => (
                <li key={f.file} className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50">
                  <a href={f.file} target="_blank" rel="noopener noreferrer" className="relative block aspect-video bg-graphite">
                    <Image src={f.poster} alt={`${f.name} (illustrative film): poster`} fill sizes="240px" className="object-cover" />
                    <span className="annot absolute left-2 top-2 rounded-[2px] bg-graphite/85 px-1.5 py-0.5 text-[9px] text-paper">Illustrative film</span>
                  </a>
                  <p className="p-2.5 text-xs font-semibold text-graphite">{f.name}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
