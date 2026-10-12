import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Monogram } from "./Monogram";

/** True when a real photo has been dropped into /public (e.g. /team/chinmay.jpg). Checked on the server at render/build time. */
function hasPublicFile(src?: string) {
  if (!src || !src.startsWith("/")) return false;
  try {
    return existsSync(path.join(process.cwd(), "public", ...src.split("/").filter(Boolean)));
  } catch {
    return false;
  }
}

/**
 * Founder portrait: shows the real photo once it exists at `photo`,
 * otherwise a blueprint monogram. Never a stock or generated face.
 */
export function FounderAvatar({ name, initials, photo, className }: { name: string; initials: string; photo?: string; className?: string }) {
  if (hasPublicFile(photo)) {
    return (
      <span className={cn("relative block size-36 shrink-0 overflow-hidden rounded-full border border-graphite/15 shadow-[var(--shadow-paper)] sm:size-44", className)}>
        <Image src={photo!} alt={`Portrait of ${name}`} fill sizes="176px" quality={85} className="object-cover grayscale" />
      </span>
    );
  }
  return <Monogram initials={initials} size="lg" label={`${name} — monogram`} className={className} />;
}
