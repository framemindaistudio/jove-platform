import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { mediaPack } from "@/lib/content/business";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { LazyVideo } from "./LazyVideo";

const REELS = [
  { src: "/videos/kids-build-sm.mp4", poster: "/videos/kids-build-poster.webp", label: "Reel 01", caption: "Build day", offset: "lg:translate-y-10" },
  { src: "/videos/crew-sm.mp4", poster: "/videos/crew-poster.webp", label: "Reel 02", caption: "Behind the lens", offset: "-translate-y-4 lg:-translate-y-8 z-10 scale-[1.06]" },
  { src: "/videos/trainer-sm.mp4", poster: "/videos/trainer-poster.webp", label: "Reel 03", caption: "The big demo", offset: "lg:translate-y-16" },
];

function Phone({ src, poster, label, caption, className }: { src: string; poster: string; label: string; caption: string; className?: string }) {
  return (
    <figure className={`relative w-full max-w-[230px] ${className ?? ""}`}>
      <div className="relative aspect-[9/19] rounded-[1.75rem] border border-paper/25 bg-ink p-[6px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
        <div className="relative h-full overflow-hidden rounded-[1.35rem] bg-graphite">
          <LazyVideo src={src} poster={poster} className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-ink/70 to-transparent px-3 pb-6 pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/85">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-paper motion-safe:animate-pulse" />
              {label}
            </span>
            <span>9:16</span>
          </div>
          <div aria-hidden className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-3 pb-3 pt-10">
            <span className="block text-sm font-semibold text-paper">{caption}</span>
            <span className="mt-1 block h-0.5 w-full overflow-hidden rounded bg-paper/25">
              <span className="block h-full w-2/3 bg-paper/80" />
            </span>
          </div>
          <span aria-hidden className="absolute left-1/2 top-1.5 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />
        </div>
      </div>
      <figcaption className="sr-only">
        {label}: {caption}
      </figcaption>
    </figure>
  );
}

/** Cinematic graphite section — the free Media Pack, with drone footage behind and three reel phones. */
export function MediaPack() {
  return (
    <section aria-labelledby="media-title" className="relative isolate overflow-hidden bg-ink text-paper">
      <LazyVideo
        src="/videos/drone.mp4"
        srcSm="/videos/drone-sm.mp4"
        poster="/videos/drone-poster.webp"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40 grayscale"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--color-ink)_0%,rgb(22_22_22/0.55)_30%,rgb(22_22_22/0.7)_70%,var(--color-ink)_100%)]" />
      <GridBackdrop dark vignette={false} className="-z-10 opacity-60" />
      {/* letterbox bars */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-3 bg-ink sm:h-5" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-3 bg-ink sm:h-5" />

      <div className="container-bp relative py-24 sm:py-32 lg:py-40">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 xl:col-span-5">
            <SectionLabel index="04" light>
              Media Pack · {site.studio.name}
            </SectionLabel>
            <h2 id="media-title" className="mt-5 text-[clamp(2.2rem,1.2rem+3.6vw,4.5rem)] font-bold leading-[1] tracking-[-0.035em]">
              <RevealLines lines={["Every JOVE Day", "becomes a film."]} />
            </h2>
            <Reveal delay={0.1}>
              <p className="mt-6 inline-flex items-center gap-2 border border-paper/30 bg-paper/[0.06] px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-paper backdrop-blur-sm">
                <Clapperboard className="size-4" aria-hidden />
                Worth {formatINR(mediaPack.marketValue)} — free with every JOVE Day
              </p>
              <p className="mt-6 max-w-lg leading-relaxed text-paper/70 sm:text-[17px]">
                Our in-house studio shoots the whole day — the build, the breakthroughs, the certificate ceremony — and hands your school content made for
                admissions season and social media.
              </p>
            </Reveal>

            <ol className="mt-10 divide-y divide-paper/10 border-y border-paper/10">
              {mediaPack.items.map((item, i) => (
                <Reveal as="li" key={item.title} delay={i * 0.05} className="grid grid-cols-[2rem_1fr] gap-x-3 py-4 sm:grid-cols-[2rem_1fr_auto] sm:gap-x-5">
                  <span className="font-mono text-xs text-paper/40">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-paper/60">{item.detail}</p>
                  </div>
                  <span className="col-start-2 mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/45 sm:col-start-auto sm:mt-1 sm:text-right">
                    {item.delivery}
                  </span>
                </Reveal>
              ))}
            </ol>

            <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="/studio" variant="light" arrow>
                Inside the studio
              </Button>
              <Button href={site.studio.url} external variant="outline-light">
                {site.studio.name} ↗
              </Button>
            </Reveal>
          </div>

          <div className="lg:col-span-6 xl:col-span-7">
            <div className="flex items-center justify-center gap-3 pt-4 sm:gap-6 lg:sticky lg:top-24 lg:pt-10">
              {REELS.map((r, i) => (
                <Reveal key={r.label} delay={0.1 + i * 0.12} y={60} className={`flex w-1/3 justify-center ${r.offset}`}>
                  <Phone src={r.src} poster={r.poster} label={r.label} caption={r.caption} />
                </Reveal>
              ))}
            </div>
            <p className="annot mt-10 text-center text-paper/40 lg:mt-24">Illustrative footage · your reels are shot on your JOVE Day</p>
          </div>
        </div>
        <p className="mt-14 max-w-3xl text-xs leading-relaxed text-paper/40">{mediaPack.rights}</p>
      </div>
    </section>
  );
}
