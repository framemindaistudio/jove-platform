/** Client-only scroll helpers shared by the /programs and /packages interactions. */
type LenisLike = { scrollTo: (target: HTMLElement | number, opts?: { offset?: number; immediate?: boolean }) => void };

/** Smooth-scroll to an element (through Lenis when it is running), clearing the fixed site header. */
export function scrollToElement(el: HTMLElement, extra = 16) {
  const header = document.querySelector<HTMLElement>("header.site-header");
  const offset = -((header?.getBoundingClientRect().height ?? 72) + extra);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
  if (lenis) lenis.scrollTo(el, { offset, immediate: reduce });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? "auto" : "smooth" });
}
