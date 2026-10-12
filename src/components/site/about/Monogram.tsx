import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-12", text: "text-sm" },
  md: { box: "size-20", text: "text-xl" },
  lg: { box: "size-36 sm:size-44", text: "text-4xl sm:text-5xl" },
} as const;

/**
 * Initials avatar drawn like a blueprint detail: a double construction circle,
 * dashed centre lines and the initials set in bold Montserrat.
 * Used wherever a real photo is not (yet) available — we never fake faces.
 */
export function Monogram({
  initials,
  size = "md",
  tone = "light",
  className,
  label,
}: {
  initials: string;
  size?: keyof typeof SIZES;
  tone?: "light" | "dark";
  className?: string;
  /** Accessible label; when omitted the monogram is decorative. */
  label?: string;
}) {
  const s = SIZES[size];
  const dark = tone === "dark";
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full",
        dark ? "bg-graphite text-paper" : "bg-paper-50 text-graphite shadow-[var(--shadow-paper)]",
        s.box,
        className,
      )}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" fill="none" stroke="currentColor" aria-hidden>
        <circle cx="50" cy="50" r="49" strokeWidth="0.75" opacity="0.5" />
        <circle cx="50" cy="50" r="42" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.45" />
        <path d="M50 0v14M50 86v14M0 50h14M86 50h14" strokeWidth="0.6" opacity="0.5" />
      </svg>
      <span className={cn("relative font-bold tracking-[-0.04em]", s.text)}>{initials}</span>
    </span>
  );
}
