"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { mainNav, site } from "@/lib/site";
import { cn, pad2 } from "@/lib/utils";
import { useCart } from "./CartProvider";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // close the mobile menu on navigation
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "site-header fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[var(--ease-out-expo)]",
          scrolled ? "border-b border-graphite/10 bg-paper/85 py-2 backdrop-blur-md" : "border-b border-transparent bg-transparent py-4",
        )}
      >
        <nav className="container-bp flex items-center justify-between gap-6" aria-label="Main">
          <Link href="/" className="relative block w-[112px] shrink-0 sm:w-[128px]" aria-label="JOVE home">
            <Logo variant="wordmark" priority />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {mainNav.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative px-3 py-2 text-[13px] font-medium tracking-wide text-charcoal transition-colors hover:text-graphite",
                    isActive(item.href) && "text-graphite",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-graphite transition-transform duration-500 ease-[var(--ease-out-expo)]",
                      isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative rounded-full p-2.5 text-graphite transition-colors hover:bg-graphite/5" aria-label={`Cart (${count} items)`}>
              <ShoppingBag className="size-5" strokeWidth={1.6} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-graphite font-mono text-[10px] font-semibold text-paper">{count}</span>
              )}
            </Link>
            <Button href="/contact" size="sm" arrow className="hidden h-10 px-4 sm:inline-flex">
              Book a Workshop
            </Button>
            <button onClick={() => setOpen(true)} className="rounded-full p-2.5 text-graphite hover:bg-graphite/5 lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-graphite text-paper lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-60" />
            <div className="container-bp relative flex items-center justify-between py-4">
              <div className="w-[112px]">
                <Logo variant="wordmark" tone="white" />
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2.5 hover:bg-paper/10" aria-label="Close menu">
                <X className="size-6" />
              </button>
            </div>
            <ul className="container-bp relative mt-6 flex-1 space-y-1 overflow-y-auto">
              {mainNav.map((item, i) => (
                <motion.li key={item.href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                  <Link href={item.href} className="group flex items-baseline gap-4 border-b border-paper/10 py-3.5">
                    <span className="font-mono text-xs text-paper/40">{pad2(i + 1)}</span>
                    <span className="text-3xl font-bold tracking-tight transition-transform group-hover:translate-x-1">{item.label}</span>
                    {item.description && <span className="ml-auto hidden text-xs text-paper/50 sm:block">{item.description}</span>}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="container-bp relative space-y-3 pb-8 pt-4">
              <Button href="/contact" variant="light" size="lg" arrow className="w-full">
                Book a Workshop
              </Button>
              <div className="annot flex flex-wrap justify-between gap-2 text-paper/50">
                <span>{site.tagline}</span>
                <Link href="/hq" className="inline-flex items-center gap-1 hover:text-paper">
                  Team HQ <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
