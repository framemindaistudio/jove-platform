import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Official JOVE logo (from the 4K master, transparent ink).
 * variant: "wordmark" (JOVE + tagline line) · "mark" (O + robotic arm) · "full" (with corner annotations)
 * tone: "ink" (graphite on light) · "white" (paper on dark)
 */
const SRC = {
  wordmark: { ink: "/brand/jove-wordmark.png", white: "/brand/jove-wordmark-white.png", w: 1400, h: 669 },
  mark: { ink: "/brand/jove-mark.png", white: "/brand/jove-mark-white.png", w: 1024, h: 1178 },
  full: { ink: "/brand/jove-logo-ink.png", white: "/brand/jove-logo-ink-white.png", w: 2000, h: 1067 },
} as const;

export function Logo({
  variant = "wordmark",
  tone = "ink",
  className,
  href,
  priority,
  alt = "JOVE — Journey of Visionation & Excellence",
}: {
  variant?: keyof typeof SRC;
  tone?: "ink" | "white";
  className?: string;
  href?: string;
  priority?: boolean;
  alt?: string;
}) {
  const s = SRC[variant];
  const img = (
    <Image
      src={s[tone]}
      alt={alt}
      width={s.w}
      height={s.h}
      priority={priority}
      sizes="(max-width: 768px) 200px, 320px"
      className={cn("h-auto w-full select-none", className)}
      draggable={false}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label="JOVE home" className="inline-block">
      {img}
    </Link>
  );
}
