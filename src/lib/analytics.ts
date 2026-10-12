import { site } from "@/lib/site";

/**
 * Website analytics — Google Analytics 4, on the public site only.
 *
 * The measurement ID is public by design (it is readable in the page source of every site that uses GA),
 * so it lives here instead of in a secret. Override it on Vercel without a code change:
 *   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX          use another GA property
 *   NEXT_PUBLIC_GA_ID=off                   no analytics at all
 *   NEXT_PUBLIC_ANALYTICS_CONSENT=always    measure without asking first (visitors can still opt out on /privacy)
 *
 * What is never measured, whatever the visitor chose: the internal portal, the Virtual Lab journeys
 * (the pages built for children) and individual certificate pages. See UNMEASURED below — keep the
 * Referrer-Policy rules in next.config.ts in step with it.
 */
const id = (process.env.NEXT_PUBLIC_GA_ID ?? "G-P2TR6P7RXW").trim();

/** Empty when analytics is switched off or the ID is malformed. */
export const GA_ID = /^G-[A-Z0-9]{6,}$/.test(id) ? id : "";

/** "ask": nothing is loaded until the visitor allows it. "always": measured unless the visitor turns it off. */
export const ANALYTICS_MODE: "ask" | "always" = process.env.NEXT_PUBLIC_ANALYTICS_CONSENT === "always" ? "always" : "ask";

const UNMEASURED = [
  /^\/hq(\/|$)/, // internal portal
  /^\/api(\/|$)/,
  /^\/labs\/[^/]+/, // Virtual Lab journeys — used by children, so never tracked (the /labs catalogue is measured)
  /^\/verify\/[^/]+/, // a certificate ID resolves to a student's name
];

export function isMeasuredPath(pathname: string) {
  return !UNMEASURED.some((re) => re.test(pathname));
}

const bare = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");
const LIVE_HOST = (() => {
  try {
    return bare(new URL(site.url).hostname);
  } catch {
    return "";
  }
})();
const LOCAL_HOST = /^(localhost|.*\.localhost|.*\.local|[\d.]+|\[?[0-9a-f]*:[0-9a-f:.]*\]?)$/i;

/** Only the site's own address (with or without www) sends hits — never a local build, a LAN preview, a tunnel or a *.vercel.app deployment. */
export function isMeasuredHost(hostname: string) {
  const host = bare(hostname);
  return !!LIVE_HOST && host === LIVE_HOST && !LOCAL_HOST.test(host);
}

// ── the visitor's choice (kept in their own browser) ─────────────────────────

export type AnalyticsChoice = "granted" | "denied";
/** "pending" is the server / pre-hydration value: nothing loads and nothing is asked. */
export type AnalyticsStatus = "on" | "off" | "ask" | "pending";

export const ANALYTICS_STORAGE_KEY = "jove-analytics";
const CHANGE_EVENT = "jove:analytics-choice";
// used when the browser blocks localStorage: the choice then lasts for this page only
let memory: AnalyticsChoice | null = null;

function readChoice(): AnalyticsChoice | null {
  try {
    const v = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {
    /* storage blocked */
  }
  return memory;
}

export function saveAnalyticsChoice(choice: AnalyticsChoice) {
  memory = choice;
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, choice);
  } catch {
    /* storage blocked — remembered for this page only */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Re-read the stored choice (e.g. after a page comes back from the back/forward cache). */
export function recheckAnalyticsChoice() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeAnalytics(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** True when the browser sends a Global Privacy Control signal — treated as "no" until the visitor says otherwise. */
export function hasPrivacySignal() {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function analyticsStatus(): AnalyticsStatus {
  const choice = readChoice();
  if (choice) return choice === "granted" ? "on" : "off";
  if (hasPrivacySignal()) return "off";
  return ANALYTICS_MODE === "always" ? "on" : "ask";
}

// ── events ───────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** True once the Google tag is running in this document (the visitor allowed analytics on a measured page). */
export function analyticsRunning() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/**
 * Send a GA4 event. A no-op until the visitor has allowed analytics, and on unmeasured pages.
 * Never pass personal data, or anything that can be looked up to a person (names, phone numbers, emails,
 * addresses, certificate IDs, order numbers).
 */
export function track(event: string, params?: Record<string, unknown>) {
  try {
    if (analyticsRunning()) window.gtag?.("event", event, params ?? {});
  } catch {
    /* measuring must never break the thing being measured */
  }
}

/** A one-off ID that lets GA de-duplicate an event. Never use an ID that exists in HQ: it would link a visitor to a customer. */
export function throwawayId() {
  try {
    return crypto.randomUUID(); // only exists on secure (https) pages
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
