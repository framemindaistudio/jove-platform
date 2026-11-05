import { Download } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { KIT_FILES, previewOf, sizeLabel, type KitBg, type KitFile } from "@/lib/brand/kit";
import { cn } from "@/lib/utils";

const BG: Record<KitBg, React.CSSProperties> = {
  dark: { background: "#2B2B2B" },
  light: { background: "#F5F1E8" },
  // transparent files on a light checkerboard, so the transparency shows
  checker: { backgroundColor: "#F5F1E8", backgroundImage: "conic-gradient(#e6e0d3 25%, transparent 0 50%, #e6e0d3 0 75%, transparent 0)", backgroundSize: "18px 18px" },
};

/** One kit file: the light preview on the right background, its real size, what it is for and a download button. */
export function KitCard({ f }: { f: KitFile }) {
  const size = sizeLabel(f.file);
  return (
    <li className="flex flex-col overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50" data-kit={f.file}>
      <div className="relative grid aspect-[4/3] place-items-center p-4" style={f.circle ? BG.light : BG[f.bg]}>
        {/* eslint-disable-next-line @next/next/no-img-element -- previews are already small WebPs; the download is the full PNG */}
        <img
          src={previewOf(f.file)}
          alt={`${f.name}: preview`}
          loading="lazy"
          className={cn("max-h-full max-w-full object-contain", f.circle && "aspect-square h-full rounded-full shadow-[0_0_0_1px_rgba(43,43,43,0.15)]")}
        />
      </div>
      <div className="flex flex-1 flex-col border-t border-graphite/10 p-3.5">
        <h3 className="text-sm font-semibold text-graphite">{f.name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-charcoal">{f.use}</p>
        <p className="mb-3 mt-2 font-mono text-[11px] leading-relaxed text-charcoal">
          {f.file}
          {size && (
            <>
              <br />
              {size}
            </>
          )}
        </p>
        <a href={`/brand/kit/${f.file}`} download className={buttonClass("secondary", "sm", "mt-auto self-start")}>
          <Download className="size-3.5" aria-hidden /> Download PNG<span className="sr-only">: {f.name}</span>
        </a>
      </div>
    </li>
  );
}

/** Every file in the brand kit, grouped. */
export function KitFiles({ groups }: { groups?: KitFile["group"][] }) {
  const order: KitFile["group"][] = groups ?? ["Full logo", "Horizontal logo", "Icon", "Profile picture", "Key visual"];
  return (
    <div className="space-y-6">
      {order.map((g) => {
        const files = KIT_FILES.filter((f) => f.group === g);
        if (!files.length) return null;
        return (
          <section key={g} aria-labelledby={`kit-${g}`}>
            <h3 id={`kit-${g}`} className="annot mb-2 text-[10px] text-blueprint">
              {g}
            </h3>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {files.map((f) => (
                <KitCard key={f.file} f={f} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
