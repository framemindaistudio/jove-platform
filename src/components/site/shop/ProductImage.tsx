import Image from "next/image";
import { cn } from "@/lib/utils";
import { isLocalImage } from "./catalog";

/**
 * Product image that fills its (relative) parent.
 * Local paths use next/image; external URLs entered in HQ fall back to a plain <img>
 * (next/image would reject hosts that aren't configured). Missing images get a hatched placeholder.
 *
 * Loading: lazy by default. `eager` loads straight away (above-the-fold thumbnails);
 * `preload` additionally hints the browser from <head> — use it for the one LCP image only.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  eager,
  preload,
  className,
  quality = 85,
  fit = "cover",
}: {
  src?: string;
  alt: string;
  sizes: string;
  eager?: boolean;
  preload?: boolean;
  className?: string;
  quality?: 60 | 75 | 85 | 90;
  fit?: "cover" | "contain";
}) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  if (!src) {
    return (
      <div className="hatch-light absolute inset-0 grid place-items-center bg-paper-200" role="img" aria-label={alt}>
        <div className="hatch absolute inset-0 opacity-60" aria-hidden />
        <Image src="/brand/jove-mark.png" alt="" width={1024} height={1178} className="relative w-[22%] max-w-24 opacity-40" />
      </div>
    );
  }
  if (isLocalImage(src)) {
    // next/image: `preload` and `loading` must not be combined (Next 16 — `priority` is deprecated).
    const load = preload ? { preload: true } : { loading: eager ? ("eager" as const) : ("lazy" as const) };
    return <Image src={src} alt={alt} fill sizes={sizes} quality={quality} className={cn(fitClass, className)} {...load} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external product images set in HQ are not in next/image remotePatterns
    <img src={src} alt={alt} loading={eager || preload ? "eager" : "lazy"} decoding="async" className={cn("absolute inset-0 size-full", fitClass, className)} />
  );
}
