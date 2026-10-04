"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Button } from "@/components/ui/Button";
import { GA_ID, analyticsStatus, isMeasuredHost, isMeasuredPath, recheckAnalyticsChoice, saveAnalyticsChoice, subscribeAnalytics } from "@/lib/analytics";

/**
 * Google Analytics 4 for the public site (mounted in the (site) layout only — HQ never loads it).
 *
 * - Nothing is requested from Google Analytics until the visitor allows it (or, in "always" mode, unless they opt out).
 * - The tag is never alive in a document that shows an unmeasured page (lab journeys, certificate pages, HQ):
 *   it is not loaded there, and once it has loaded, going to such a page is a full page load into a clean document.
 *   That matters because the tag reports the previous address with every in-site page view.
 * - Advertising features are off: no Google signals, no ad personalisation, ad storage denied.
 */

const ENABLED = process.env.NODE_ENV === "production" && !!GA_ID;
const DISABLE_FLAG = `ga-disable-${GA_ID}`;
/** GA's default cookie life is two years, renewed on every visit; here the ID ends thirteen months after it was created. */
const COOKIE_SECONDS = 395 * 24 * 60 * 60;

let started = false;
/** What GA was last told about analytics storage. */
let storageGranted = true;
/** What the component last decided for this page — restored after a back/forward-cache restore. */
let wantSending = false;
/**
 * Set once this document has shown (or is about to show) an unmeasured address while the tag was alive.
 * From then on the tag stays silent here and every further move is a full page load.
 */
let retired = false;

/** GA's own kill-switch: while it is set, the tag sends nothing. */
function setSending(on: boolean) {
  (window as unknown as Record<string, boolean>)[DISABLE_FLAG] = !on;
}

function retire() {
  retired = true;
  setSending(false);
}

/** The URL if it is on this site, otherwise null. */
function onSite(url: string | URL): URL | null {
  try {
    const target = new URL(url, window.location.href);
    return target.origin === window.location.origin ? target : null;
  } catch {
    return null;
  }
}

/** Installed once the tag is running: every way into an unmeasured page ends in a fresh document without the tag. */
function installGuards() {
  // a link: skip the client-side transition and load the page (the address of this document never changes)
  document.addEventListener(
    "click",
    (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const target = onSite(a.href);
      if (!target || !(retired || !isMeasuredPath(target.pathname))) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(target.href);
    },
    true,
  );
  // router.push / redirects: never let the tag see the address — leave by a full page load instead
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method];
    window.history[method] = function (this: History, data: unknown, unused: string, url?: string | URL | null) {
      const target = url == null ? null : onSite(url);
      if (target && target.href !== window.location.href && (retired || !isMeasuredPath(target.pathname))) {
        retire();
        if (method === "pushState") window.location.assign(target.href);
        else window.location.replace(target.href);
        return;
      }
      return original.call(this, data, unused, url);
    };
  }
  // back / forward: the address has already changed, so silence the tag for good and reload
  window.addEventListener(
    "popstate",
    () => {
      if (!retired && isMeasuredPath(window.location.pathname)) return;
      retire();
      window.location.reload();
    },
    true,
  );
  // restored from the back/forward cache: put the switch back, pick up a choice made elsewhere meanwhile
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    if (retired || !isMeasuredPath(window.location.pathname)) {
      retire();
      window.location.reload();
      return;
    }
    setSending(wantSending);
    recheckAnalyticsChoice();
  });
}

/** The landing referrer, without the path of an unmeasured page on this site (an HQ record, a certificate ID). */
function safeReferrer(): string | undefined {
  try {
    const ref = new URL(document.referrer);
    if (ref.origin === window.location.origin && !isMeasuredPath(ref.pathname)) return `${ref.origin}/`;
  } catch {
    /* no referrer */
  }
  return undefined;
}

function start() {
  if (started) return;
  started = true;
  const dataLayer = (window.dataLayer = window.dataLayer || []);
  // gtag.js only understands the `arguments` object here, not an array
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
  installGuards();
  window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
  window.gtag("js", new Date());
  const referrer = safeReferrer();
  window.gtag("config", GA_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: COOKIE_SECONDS,
    cookie_update: false,
    ...(referrer ? { page_referrer: referrer } : {}),
  });
}

function clearGaCookies() {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0].trim();
    if (!/^_ga(_|$)/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}

const noopSubscribe = () => () => {};

export function Analytics() {
  const pathname = usePathname();
  const status = useSyncExternalStore(subscribeAnalytics, analyticsStatus, () => "pending" as const);
  const liveHost = useSyncExternalStore(noopSubscribe, () => isMeasuredHost(window.location.hostname), () => false);
  const active = ENABLED && liveHost;
  const on = active && status === "on";
  const measuring = on && isMeasuredPath(pathname);

  useEffect(() => {
    if (!active) return;
    if (status === "off") clearGaCookies(); // also removes cookies left by an earlier "yes"
    if (measuring) start();
    if (!started) return;
    wantSending = measuring;
    setSending(measuring && !retired);
    if (storageGranted !== on) {
      storageGranted = on;
      window.gtag?.("consent", "update", { analytics_storage: on ? "granted" : "denied" });
    }
  }, [active, on, measuring, status]);

  if (!active) return null;
  return (
    <>
      {measuring && <Script id="jove-ga" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />}
      <ConsentNotice show={status === "ask" && isMeasuredPath(pathname)} />
    </>
  );
}

/** How far a phone visitor scrolls before the question appears, so it never lands on a page's opening call to action. */
const PHONE_SCROLL = 160;

/**
 * Small, non-blocking question in a bottom corner, once the page (and its preloader) has settled.
 * While it is on screen <html> carries --consent-offset, which the site's own bottom bars and toasts add to their
 * position so they sit above the question instead of under it.
 */
function ConsentNotice({ show }: { show: boolean }) {
  const [settled, setSettled] = useState(false);
  const reduce = useReducedMotion();
  const box = useRef<HTMLElement>(null);
  const visible = show && settled;

  useEffect(() => {
    let timer = 0;
    const settle = () => setSettled(true);
    const onScroll = () => {
      if (window.scrollY < PHONE_SCROLL) return;
      window.removeEventListener("scroll", onScroll);
      settle();
    };
    const arm = () => {
      timer = window.setTimeout(() => {
        if (window.matchMedia("(min-width: 640px)").matches || window.scrollY >= PHONE_SCROLL) settle();
        else window.addEventListener("scroll", onScroll, { passive: true });
      }, 1400);
    };
    if (document.documentElement.classList.contains("jove-preloaded")) arm();
    else window.addEventListener("jove:preloaded", arm, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("jove:preloaded", arm);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!visible || !el) return;
    const root = document.documentElement;
    const sync = () => root.style.setProperty("--consent-offset", `${Math.round(el.getBoundingClientRect().height) + 12}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--consent-offset");
    };
  }, [visible]);

  return (
    <>
      <p role="status" className="sr-only">
        {visible ? "A question about analytics is waiting for your answer at the start of this page." : ""}
      </p>
      <AnimatePresence>
        {visible && (
          <motion.aside
            ref={box}
            aria-label="Analytics preference"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: reduce ? 0.01 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 bottom-3 z-[55] rounded-[var(--radius-md)] border border-graphite/20 bg-paper-50 p-4 shadow-[var(--shadow-lift)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22.5rem] print:hidden"
          >
            <CornerMarks />
            <p className="annot text-charcoal">Analytics · your choice</p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">
              May we count visits with Google Analytics? It shows us which pages are useful. No advertising, and never inside a Virtual Lab.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={() => saveAnalyticsChoice("granted")}>
                Allow
              </Button>
              <Button size="sm" variant="secondary" onClick={() => saveAnalyticsChoice("denied")}>
                No thanks
              </Button>
              <Link href="/privacy#cookies" className="annot ml-auto text-charcoal underline underline-offset-4 hover:text-graphite">
                Details
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
