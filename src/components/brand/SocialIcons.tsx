/** Minimal line-style social icons (lucide v1 no longer ships brand marks). */
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true };

export function InstagramIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
export function YoutubeIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" />
    </svg>
  );
}
export function LinkedinIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V16M8 7.8v.01M12 16v-3.2a2.3 2.3 0 0 1 4.6 0V16M12 10.5V16" />
    </svg>
  );
}
export function WhatsappIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.4-2-1-1 .9a3.5 3.5 0 0 1-2-2l.9-1-1-2z" />
    </svg>
  );
}
