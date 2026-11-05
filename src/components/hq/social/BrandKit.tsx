"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { AnnotationStack, ConstructionCircle, CornerMarks, Crosshair, DimensionLine, SpecIndex } from "@/components/brand/Blueprint";
import { Checkbox } from "@/components/ui/form";
import { Panel } from "@/components/hq/ui";
import { joveDayRules } from "@/lib/content/business";
import { C } from "@/lib/social/canvas";
import { FORMATS } from "@/lib/social/types";
import { rupees } from "@/lib/social/words";
import { cn } from "@/lib/utils";
import { KitFiles } from "@/components/hq/brand/KitFiles";
import { SITE_FILES } from "@/lib/brand/kit";
import { Bullets } from "./parts/bits";
import { CopyButton } from "./parts/CopyButton";

/*
 * Everything on this page is taken from OPERATIONS/01_BRAND: 01_Brand_Guidelines.md (logo, colour, type, blueprint
 * elements, photographs), 02_Voice_and_Tone.md (the 30-second check), 03_Social_Media_Templates_Spec.md (sizes,
 * safe zones, file naming) and 05_Brand_Asset_Index.md (the files). Change a rule there and here together.
 */

const SECTIONS = [
  { id: "kit-logo", name: "Logo files" },
  { id: "kit-logo-rules", name: "Logo rules" },
  { id: "kit-colour", name: "Colours" },
  { id: "kit-type", name: "Type" },
  { id: "kit-blueprint", name: "Blueprint elements" },
  { id: "kit-sizes", name: "Sizes and safe zones" },
  { id: "kit-pictures", name: "Pictures" },
  { id: "kit-naming", name: "File naming" },
  { id: "kit-check", name: "Before you publish" },
];

/* ───────────────────────────── logo files: the brand kit (public/brand/kit), see src/lib/brand/kit.ts ───────────────────────────── */

const LOGO_DO = [
  "Clear space: the height of the O ring on all four sides. No text, edge or other logo enters it.",
  "Smallest on screen: full lockup 140 px wide, wordmark 96 px, symbol 24 px. In print: 30 mm, 22 mm, 8 mm.",
  "On a post: the symbol top-left, or the wordmark bottom-left. Never both.",
  "On a photograph: the white version, with a solid or darkened panel behind it.",
  "With a school: school logo left, JOVE right, the same height, a thin vertical graphite rule between.",
  "With the studio: “Media by FrameMind AI Studio” as text beneath. Never a second logo.",
];

const LOGO_DONT = [
  "Stretch, skew, rotate or outline it.",
  "Recolour it. No blue, red, gold or gradients.",
  "Place it on a busy photograph without a panel behind it.",
  "Re-type the name in another font, or add shadows, glows or bevels.",
  "Crop the symbol, or take the arm off the O.",
  "Use a low-resolution copy. Start from the 4K master.",
];

/* ───────────────────────────── colour ───────────────────────────── */

const COLOURS: { name: string; hex: string; role: string }[] = [
  { name: "Paper", hex: C.paper, role: "Primary background" },
  { name: "Paper 50", hex: C.paper50, role: "Cards and panels on paper" },
  { name: "Paper 200", hex: C.paper200, role: "Panels on paper" },
  { name: "Paper 300", hex: C.paper300, role: "Rules on paper" },
  { name: "Line", hex: "#d9d2c2", role: "Hairlines on paper" },
  { name: "Graphite", hex: C.graphite, role: "Primary text, dark sections, the logo" },
  { name: "Charcoal", hex: C.charcoal, role: "Body text on paper" },
  { name: "Blueprint grey", hex: C.blueprint, role: "Annotations, secondary text, grid" },
  { name: "Accent grey", hex: C.accent, role: "Borders, dividers, disabled" },
  { name: "Ink", hex: C.ink, role: "Deepest dark, print black" },
];

/** how much of any layout each colour takes; the bar is drawn from the middle of each range */
const SHARES = [
  { name: "Paper", hex: C.paper, share: "55 to 60%", width: 57.5 },
  { name: "Graphite", hex: C.graphite, share: "25 to 30%", width: 27.5 },
  { name: "Blueprint grey", hex: C.blueprint, share: "8 to 10%", width: 9 },
  { name: "Accent grey", hex: C.accent, share: "3 to 5%", width: 4 },
  { name: "Ink and Line", hex: C.ink, share: "sparingly", width: 2 },
];

/* ───────────────────────────── type ───────────────────────────── */

const SCALE: { style: string; font: string; size: string; px: number; line: number; track: string; use: string; sample: string; cls: string }[] = [
  { style: "Display / H1", font: "Montserrat 800", size: "64 / 72", px: 64, line: 72, track: "-1%", use: "Hero lines, covers", sample: "JOVE Day", cls: "font-extrabold tracking-[-0.01em]" },
  { style: "H2", font: "Montserrat 700", size: "44 / 52", px: 44, line: 52, track: "-1%", use: "Section titles", sample: "Build it", cls: "font-bold tracking-[-0.01em]" },
  { style: "H3", font: "Montserrat 700", size: "28 / 36", px: 28, line: 36, track: "-0.5%", use: "Sub-sections", sample: "Sense, think, act", cls: "font-bold tracking-[-0.005em]" },
  { style: "H4", font: "Montserrat 700", size: "20 / 28", px: 20, line: 28, track: "0", use: "Card titles", sample: "Inside the kit", cls: "font-bold" },
  { style: "Body L", font: "Montserrat 500", size: "18 / 30", px: 18, line: 30, track: "0", use: "Intros", sample: "A full day of Robotics and AI.", cls: "font-medium" },
  { style: "Body", font: "Montserrat 400 / 500", size: "16 / 26", px: 16, line: 26, track: "0", use: "Paragraphs", sample: "Every kit, trainer and cable is ours.", cls: "font-normal" },
  { style: "Small", font: "Montserrat 500", size: "14 / 22", px: 14, line: 22, track: "0", use: "Captions, help text", sample: "The film is on us.", cls: "font-medium" },
  { style: "Caption", font: "Montserrat 500", size: "12 / 18", px: 12, line: 18, track: "+1%", use: "Photo credits, footnotes", sample: "Film by FrameMind AI Studio", cls: "font-medium tracking-[0.01em]" },
  { style: "Label", font: "JetBrains Mono 500, uppercase", size: "11 / 16", px: 11, line: 16, track: "+12%", use: "Section index, spec tags", sample: "JOVE Day · 01", cls: "font-mono font-medium uppercase tracking-[0.12em]" },
  { style: "Numerals", font: "JetBrains Mono 500", size: "any", px: 16, line: 26, track: "0", use: "Prices, codes, schedules", sample: "08:30 · 1080 × 1350", cls: "font-mono font-medium tabular" },
];

const WORDS_ON_A_DESIGN = [
  "One headline in Montserrat 800 and one mono annotation. No more.",
  "Feed post: one idea, one image. Headline 8 words at most. A source line for any number.",
  "Reel cover: 2 to 6 words, 3 lines at most.",
  "Carousel: one point a slide, 25 words at most.",
  "YouTube thumbnail: 2 words at most.",
  "No exclamation marks and no emoji on a design.",
];

/* ───────────────────────────── blueprint elements ───────────────────────────── */

const ELEMENTS: { name: string; what: string; rule: string; draw: React.ReactNode }[] = [
  { name: "Engineering grid", what: "24 px minor and 120 px major lines, very faint.", rule: "Behind hero and dark sections. Never over a block of text without a fade.", draw: <div className="bp-grid absolute inset-0" /> },
  {
    name: "Corner marks",
    what: "L-shaped crop marks on a frame.",
    rule: "One frame in a composition, on the card that deserves focus.",
    draw: (
      <div className="relative h-12 w-24">
        <CornerMarks size={9} className="text-graphite/70" />
      </div>
    ),
  },
  { name: "Crosshair", what: "A small registration cross.", rule: "As a bullet or an anchor. Three in a view at most.", draw: <Crosshair className="text-graphite/60" /> },
  { name: "Dimension line", what: "A line with end ticks and a mono label.", rule: "Annotates a picture or a diagram.", draw: <DimensionLine label="6 AXES" className="w-4/5 text-graphite/70" /> },
  { name: "Annotation stack", what: "Small uppercase mono notes with a leader line.", rule: "Four on a picture at most.", draw: <AnnotationStack items={["Sense", "Think", "Act"]} className="text-[10px] text-graphite/75" /> },
  {
    name: "Hatching",
    what: "Pencil cross-hatch, in light, regular and dense weights.",
    rule: "Background fills and shading. Never behind text.",
    draw: (
      <div className="flex gap-2">
        <span className="hatch block size-12 border border-graphite/25" />
        <span className="hatch-dense block size-12 border border-graphite/25" />
      </div>
    ),
  },
  { name: "Construction circle", what: "A thin circle that echoes the O of the logo.", rule: "Behind the hero object. One in a layout.", draw: <ConstructionCircle size={76} className="text-graphite/45" /> },
  {
    name: "Spec index",
    what: "A numbered mono tag.",
    rule: "Numbers sections and steps.",
    draw: (
      <div className="flex gap-4">
        {[1, 2, 3].map((n) => (
          <SpecIndex key={n} n={n} className="text-sm text-graphite/80" />
        ))}
      </div>
    ),
  },
];

/* ───────────────────────────── sizes ───────────────────────────── */

const safe = FORMATS.story.safe;
const px = (f: keyof typeof FORMATS) => `${FORMATS[f].w} × ${FORMATS[f].h}`;

const SIZES: { format: string; canvas: string; ratio: string; count: string; note: string; create: string }[] = [
  { format: "Feed post, portrait", canvas: px("post"), ratio: "4:5", count: "1", note: "The default for Instagram and LinkedIn. A 60 px margin all round. Keep the subject and the headline inside the centre 1080 × 1080: the profile grid crops to it.", create: FORMATS.post.label },
  { format: "Feed post, square", canvas: px("square"), ratio: "1:1", count: "1", note: "Quotes and numbers.", create: FORMATS.square.label },
  { format: "Carousel", canvas: px("post"), ratio: "4:5", count: "5 to 10 slides", note: "Slide 1 is the hook, the last slide the call to action. One point a slide.", create: FORMATS.post.label },
  { format: "LinkedIn post", canvas: px("post"), ratio: "4:5", count: "1 to 10 slides", note: "The feed post file as it is. Several slides can go up as one PDF.", create: FORMATS.post.label },
  { format: "Story", canvas: px("story"), ratio: "9:16", count: "1 to 5 frames", note: `Keep clear: top ${safe.top} px, bottom ${safe.bottom} px, right ${safe.right} px. Text ${safe.left} px from the sides. A video frame runs 15 s at most. A poll or a question sticker on every third story.`, create: FORMATS.story.label },
  { format: "Reel cover", canvas: px("story"), ratio: "9:16", count: "1", note: "It must also read as a 4:5 crop on the profile grid: the key area is the centre 1080 × 1350. No face cut by the crop.", create: FORMATS.story.label },
  { format: "Reel, Short, Status", canvas: px("story"), ratio: "9:16", count: "30 to 60 s", note: "H.264 MP4, 30 fps, 10 to 15 Mbps, AAC 48 kHz. Captions burned in: most people watch muted.", create: "Video: made in the edit" },
  { format: "YouTube thumbnail", canvas: px("wide"), ratio: "16:9", count: "1", note: "Two words of text at most.", create: FORMATS.wide.label },
  { format: "Profile picture", canvas: "3840 × 3840", ratio: "1:1", count: "1", note: "jove-profile-picture.png above: the whole logo sits inside the round crop of every platform.", create: "The profile picture above" },
];

/* ───────────────────────────── pictures, naming, the check ───────────────────────────── */

const PICTURE_RULES = [
  "Consent first. Every child in a frame is covered by the school's consent process. No consent, no frame. Blur on request.",
  "No child's name, class or uniform crest without the school's approval.",
  "A generated or drawn picture is labelled as an illustration, and never captioned as a real JOVE event.",
  "Drone footage only within the drone rules and with the school's permission.",
];

const NEW_ASSET = [
  "Name it Descriptive_Name_Version.ext, with no spaces.",
  "Web pictures as WebP, quality 80 to 85, under 400 KB where possible.",
  "Add a row to the Brand Asset Index the same day: size, purpose and rights (own, licensed or generated).",
  "For a generated picture, note the tool and the word “illustrative”.",
];

/** The 30-second check of Voice and Tone, section 6. */
const CHECKS = [
  "Is every claim true today, with a source, or written as a plan?",
  "Are the prices right against the current price list, with GST stated?",
  "Does it sound like a person, not a brochure?",
  "Is consent confirmed for every child shown or named?",
  "Are the school, the names and the ₹ amounts spelled exactly right?",
];

/** A file name or a naming pattern on its own line. It may wrap after an underscore, never inside a word. */
function Code({ text }: { text: string }) {
  const bits = text.split("_");
  return (
    <code className="my-1 block w-fit max-w-full rounded-[3px] bg-graphite/[0.07] px-2 py-1 font-mono text-xs leading-relaxed text-graphite">
      {bits.map((bit, i) => (
        <span key={i}>
          {bit}
          {i < bits.length - 1 && (
            <>
              _<wbr />
            </>
          )}
        </span>
      ))}
    </code>
  );
}
const Sub = ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={cn("annot mb-2 text-[10px] text-blueprint", className)}>{children}</p>;

/** a thin diagonal line from corner to corner, in the "bad" tone of HQ */
const STRIKE = "linear-gradient(to top right, transparent calc(50% - 0.75px), rgb(139 58 58 / 0.75) calc(50% - 0.75px), rgb(139 58 58 / 0.75) calc(50% + 0.75px), transparent calc(50% + 0.75px))";

/** A "do not" shown on the wordmark itself, crossed out. */
function Misuse({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0">
      <div aria-hidden className="relative grid h-20 place-items-center overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper">
        {children}
        <span className="absolute inset-0" style={{ background: STRIKE }} />
      </div>
      <figcaption className="mt-1.5 flex items-center gap-1 text-xs text-charcoal">
        <X className="size-3.5 shrink-0 text-bad" aria-hidden /> {label}
      </figcaption>
    </figure>
  );
}

/** The wordmark as a small picture inside a diagram (the diagram's caption says what it shows). */
function Wordmark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <Image src="/brand/jove-wordmark.png" alt="" width={1400} height={669} sizes="160px" className={cn("h-auto w-28 select-none", className)} style={style} draggable={false} />;
}

/**
 * Social Studio → Brand kit: what someone needs while making a post, on one page. Logo files to download, colours,
 * type, the blueprint elements, sizes and safe zones, file naming and the check before publishing.
 */
export function BrandKit() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-charcoal">
        What you need while making a post, on one page. The designs in Create follow all of this already: use it when you make something by hand, or brief someone else.
      </p>
      <nav aria-label="On this page" className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-[var(--radius-sm)] border border-graphite/20 px-3 py-1.5 text-xs font-semibold text-graphite transition-colors hover:border-graphite/50 hover:bg-graphite/5">
            {s.name}
          </a>
        ))}
      </nav>

      <div className="space-y-5">
        {/* ── logo files ── */}
        <div id="kit-logo" className="scroll-mt-20">
          <Panel title="Logo files" subtitle="Never redraw, recolour, stretch or re-type the logo. Use these files: full size, built from the 4K masters.">
            <KitFiles />

            <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-graphite/10 pt-4 lg:grid-cols-2">
              <div>
                <Sub>Also here</Sub>
                <ul className="space-y-1 text-xs text-charcoal">
                  {SITE_FILES.map((f) => (
                    <li key={f.file}>
                      <a href={`/brand/${f.file}`} download className="font-mono font-medium text-graphite underline underline-offset-2">
                        {f.file}
                      </a>{" "}
                      · {f.what}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Sub>For print</Sub>
                <p className="text-xs leading-relaxed text-charcoal">
                  Use the full-size kit files above (3840 to 4096 px). They are built from the 4K masters in the company&apos;s brand folder (<span className="font-mono">01_BRAND/logo</span>), which are not edited or renamed. Every file is also in HQ → Brand Kit.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        {/* ── logo rules ── */}
        <div id="kit-logo-rules" className="scroll-mt-20">
          <Panel title="Logo: do and do not" subtitle="The O is a robotic arm curling into a ring, drawn like a pencil sketch on a drafting sheet.">
            <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-graphite">
                  <Check className="size-4 text-ok" aria-hidden /> Do
                </p>
                <Bullets items={LOGO_DO} />
                <figure className="mt-4">
                  <div aria-hidden className="grid place-items-center rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                    {/* the O ring is about a fifth of the wordmark's width: that much space on every side */}
                    <div className="relative border border-dashed border-graphite/45 p-[26px]">
                      <Wordmark className="w-32" />
                      <span className="absolute left-1/2 top-0 h-[26px] w-px bg-graphite/45" />
                      <span className="absolute left-0 top-1/2 h-px w-[26px] bg-graphite/45" />
                      <span className="annot absolute left-[calc(50%+6px)] top-1.5 text-[9px] text-graphite/70">1 O</span>
                      <span className="annot absolute left-1 top-[calc(50%+3px)] text-[9px] text-graphite/70">1 O</span>
                    </div>
                  </div>
                  <figcaption className="mt-1.5 text-xs text-charcoal">Clear space: one O ring on every side.</figcaption>
                </figure>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-graphite">
                  <X className="size-4 text-bad" aria-hidden /> Do not
                </p>
                <Bullets items={LOGO_DONT} />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Misuse label="Stretched">
                    <Wordmark style={{ transform: "scale(1.45, 0.75)" }} />
                  </Misuse>
                  <Misuse label="Rotated">
                    <Wordmark style={{ transform: "rotate(-12deg)" }} />
                  </Misuse>
                  <Misuse label="Recoloured">
                    <Wordmark style={{ filter: "invert(0.5) sepia(1) saturate(5) hue-rotate(175deg)" }} />
                  </Misuse>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* ── colour ── */}
        <div id="kit-colour" className="scroll-mt-20">
          <Panel title="Colours" subtitle="Monochrome graphite on warm paper. Press a hex to copy it.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {COLOURS.map((c) => (
                <li key={c.name} className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50">
                  <div aria-hidden className="h-14 border-b border-graphite/10" style={{ background: c.hex }} />
                  <div className="px-3 pb-2 pt-2.5">
                    <p className="text-sm font-semibold text-graphite">{c.name}</p>
                    <p className="min-h-8 text-xs leading-snug text-charcoal">{c.role}</p>
                    <CopyButton text={c.hex.toUpperCase()} label={c.hex.toUpperCase()} what={`copy the hex of ${c.name}`} variant="ghost" className="-ml-3 mt-0.5 font-mono" />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-graphite/10 pt-4 lg:grid-cols-2">
              <div>
                <Sub>Share of any layout</Sub>
                <div aria-hidden className="flex h-5 overflow-hidden rounded-[3px] border border-graphite/20">
                  {SHARES.map((s) => (
                    <span key={s.name} style={{ width: `${s.width}%`, background: s.hex }} />
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-charcoal">{SHARES.map((s) => `${s.name} ${s.share}`).join(" · ")}</p>
              </div>
              <div>
                <Sub>Rules</Sub>
                <Bullets
                  className="text-xs"
                  items={[
                    "Colour comes from photographs and from the children's work, never from the brand.",
                    "Text on paper is Charcoal or darker. Blueprint grey only for annotation-size text, 12 px bold or above.",
                    "The status colours of HQ (green, amber, red, blue) never appear in a post.",
                  ]}
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* ── type ── */}
        <div id="kit-type" className="scroll-mt-20">
          <Panel title="Type" subtitle="Two fonts. Both are free on Google Fonts.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                <p className="font-sans text-4xl font-extrabold tracking-[-0.01em] text-graphite">Montserrat</p>
                <p className="mt-2 font-sans text-sm text-charcoal">Everything a person reads. Weights 400 to 800.</p>
                <p className="mt-2 font-sans text-lg font-medium text-graphite">Aa Bb Cc Dd Ee Ff Gg 0123456789 ₹</p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                <p className="font-mono text-4xl font-medium text-graphite">JetBrains Mono</p>
                <p className="mt-2 font-sans text-sm text-charcoal">Numbers, codes, indices and annotation labels. Weight 500.</p>
                <p className="mt-2 font-mono text-lg font-medium text-graphite">Aa Bb Cc Dd Ee 0123456789 ₹</p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <caption className="sr-only">The type scale</caption>
                <thead>
                  <tr className="border-b border-graphite/15">
                    {["Style", "Looks like", "Font and weight", "Size / line", "Tracking", "Use"].map((h) => (
                      <th key={h} scope="col" className="annot whitespace-nowrap px-2 pb-2 text-[10px] font-medium text-blueprint first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-graphite/12">
                  {SCALE.map((r) => (
                    <tr key={r.style}>
                      <th scope="row" className="whitespace-nowrap py-2 pr-2 font-semibold text-graphite">
                        {r.style}
                      </th>
                      <td className="px-2 py-2">
                        <span className={cn("block whitespace-nowrap text-graphite", r.cls)} style={{ fontSize: r.px, lineHeight: `${r.line}px` }}>
                          {r.sample}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-charcoal">{r.font}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-charcoal">{r.size}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-charcoal">{r.track}</td>
                      <td className="px-2 py-2 text-charcoal">{r.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-graphite/10 pt-4 lg:grid-cols-2">
              <div>
                <Sub>Words on a design</Sub>
                <Bullets className="text-xs" items={WORDS_ON_A_DESIGN} />
              </div>
              <div>
                <Sub>Also</Sub>
                <Bullets
                  className="text-xs"
                  items={[
                    "Sizes are for screens, in px. For print multiply by 0.75 to get points. Body never below 8 pt, fine print never below 6.5 pt.",
                    "Kannada text: Noto Sans Kannada at the same sizes, with 10% more line height. A native speaker reads it before it goes out.",
                    `Numbers as numerals with Indian grouping (${rupees(joveDayRules.minimumBilling)}). Dates as 2 Oct 2026.`,
                  ]}
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* ── blueprint elements ── */}
        <div id="kit-blueprint" className="scroll-mt-20">
          <Panel title="Blueprint elements" subtitle="What makes a JOVE design look like a drafting sheet and not a template.">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ELEMENTS.map((e) => (
                <li key={e.name} className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50">
                  <div aria-hidden className="relative grid h-24 place-items-center border-b border-graphite/10 bg-paper">
                    {e.draw}
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-sm font-semibold text-graphite">{e.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-charcoal">{e.what}</p>
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-graphite">{e.rule}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-charcoal">Alternate paper sections and dark graphite sections to give a set of posts rhythm. Line icons only, with a 1.5 to 2 px stroke: no filled icons, no colour.</p>
          </Panel>
        </div>

        {/* ── sizes ── */}
        <div id="kit-sizes" className="scroll-mt-20">
          <Panel title="Sizes and safe zones" subtitle="Export stills as PNG or high-quality JPG, sRGB, under 8 MB.">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <caption className="sr-only">Formats, their canvas sizes and what to keep in mind</caption>
                  <thead>
                    <tr className="border-b border-graphite/15">
                      {["Format", "Canvas, px", "Ratio", "How many", "Keep in mind"].map((h) => (
                        <th key={h} scope="col" className="annot whitespace-nowrap px-2 pb-2 text-[10px] font-medium text-blueprint first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-graphite/12">
                    {SIZES.map((r) => (
                      <tr key={r.format}>
                        <th scope="row" className="py-2 pr-2 align-top font-semibold text-graphite">
                          {r.format}
                          <span className="mt-0.5 block whitespace-nowrap font-normal text-charcoal">{r.create}</span>
                        </th>
                        <td className="whitespace-nowrap px-2 py-2 align-top font-mono text-graphite">{r.canvas}</td>
                        <td className="whitespace-nowrap px-2 py-2 align-top font-mono text-charcoal">{r.ratio}</td>
                        <td className="whitespace-nowrap px-2 py-2 align-top text-charcoal">{r.count}</td>
                        <td className="px-2 py-2 align-top leading-relaxed text-charcoal">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-start gap-6">
                <figure>
                  <div aria-hidden className="relative h-[240px] w-[135px] border border-graphite/40 bg-paper">
                    <span className="hatch absolute inset-x-0 top-0 border-b border-dashed border-graphite/50" style={{ height: `${(safe.top / FORMATS.story.h) * 100}%` }} />
                    <span className="hatch absolute inset-x-0 bottom-0 border-t border-dashed border-graphite/50" style={{ height: `${(safe.bottom / FORMATS.story.h) * 100}%` }} />
                    <span
                      className="hatch absolute right-0 border-l border-dashed border-graphite/50"
                      style={{ width: `${(safe.right / FORMATS.story.w) * 100}%`, top: `${(safe.top / FORMATS.story.h) * 100}%`, bottom: `${(safe.bottom / FORMATS.story.h) * 100}%` }}
                    />
                    <span className="annot absolute left-1.5 top-1.5 bg-paper px-1 text-[9px] text-graphite">{safe.top}</span>
                    <span className="annot absolute bottom-1.5 left-1.5 bg-paper px-1 text-[9px] text-graphite">{safe.bottom}</span>
                    <span className="annot absolute right-5 top-1/2 -translate-y-1/2 bg-paper px-1 text-[9px] text-graphite">{safe.right}</span>
                    <span className="annot absolute left-3 top-[42%] text-[9px] leading-tight text-graphite/80">
                      Live area
                      <br />
                      888 × 1290
                    </span>
                  </div>
                  <figcaption className="mt-1.5 max-w-[135px] text-xs leading-snug text-charcoal">Story 9:16. The hatched bands sit under the app&apos;s own bars and buttons.</figcaption>
                </figure>
                <figure>
                  <div aria-hidden className="relative h-[240px] w-[192px] border border-graphite/40 bg-paper">
                    <span className="absolute inset-x-0 border-y border-dashed border-graphite/55" style={{ top: "10%", bottom: "10%" }} />
                    <span className="annot absolute left-1.5 top-[12%] text-[9px] leading-tight text-graphite/80">
                      Grid crop
                      <br />
                      1080 × 1080
                    </span>
                    <span className="absolute border border-graphite/20" style={{ inset: `${(60 / 1350) * 100}% ${(60 / 1080) * 100}%` }} />
                    <span className="annot absolute bottom-[12%] right-[8%] text-[9px] text-graphite/80">60 px margin</span>
                  </div>
                  <figcaption className="mt-1.5 max-w-[192px] text-xs leading-snug text-charcoal">Post 4:5. The profile grid shows the centre square: keep the subject and the headline inside it.</figcaption>
                </figure>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-3">
          {/* ── pictures ── */}
          <div id="kit-pictures" className="scroll-mt-20">
            <Panel title="Pictures" subtitle="Photographs and video.">
              <Sub>Look</Sub>
              <p className="text-sm leading-relaxed text-charcoal">Black and white, or warm-graded. Shallow depth of field, natural light. Warm paper whites, deep graphite blacks, no colour cast, no heavy filters.</p>
              <Sub className="mt-4">Subject</Sub>
              <p className="text-sm leading-relaxed text-charcoal">Real moments: hands building, a face when the motor spins, a trainer at eye level, a whole hall at work. Effort and delight, not posed rows.</p>
              <Sub className="mt-4">Rules</Sub>
              <Bullets items={PICTURE_RULES} />
            </Panel>
          </div>

          {/* ── file naming ── */}
          <div id="kit-naming" className="scroll-mt-20">
            <Panel title="File naming" subtitle="So a file can be found again.">
              <Sub>From Create</Sub>
              <div className="text-sm leading-relaxed text-charcoal">
                Downloads are named for you:
                <Code text="JOVE_<design>_<YYYYMMDD>_<size>.png" />
                For example:
                <Code text="JOVE_hiring_20261012_post.png" />
              </div>
              <Sub className="mt-4">Films and posts for a school</Sub>
              <div className="text-sm leading-relaxed text-charcoal">
                <Code text="JOVE_<SchoolCode>_<YYYYMMDD>_<Format>_<Version>.<ext>" />
                For example:
                <Code text="JOVE_SCH014_20261023_Reel01_v2.mp4" />
              </div>
              <Sub className="mt-4">A new brand file</Sub>
              <Bullets items={NEW_ASSET} />
            </Panel>
          </div>

          {/* ── the check ── */}
          <div id="kit-check" className="scroll-mt-20">
            <Panel title="Before you publish" subtitle="The 30-second check. Tick as you go: nothing is saved.">
              <ul className="space-y-3">
                {CHECKS.map((c) => (
                  <li key={c}>
                    <Checkbox label={<span className="leading-relaxed text-graphite">{c}</span>} className="items-start [&>input]:mt-1 [&>input]:shrink-0" />
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-l-2 border-graphite/25 pl-3 text-xs leading-relaxed text-charcoal">Tag a school only after the school has approved the post. Reply to comments within 24 hours.</p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
