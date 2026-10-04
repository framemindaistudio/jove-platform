"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { analyticsStatus, hasPrivacySignal, saveAnalyticsChoice, subscribeAnalytics } from "@/lib/analytics";
import { Note } from "./prose";

const noopSubscribe = () => () => {};

/** The visitor's analytics switch, shown inside the privacy policy. The choice is kept in their own browser. */
export function AnalyticsPreference() {
  const status = useSyncExternalStore(subscribeAnalytics, analyticsStatus, () => "pending" as const);
  const signal = useSyncExternalStore(noopSubscribe, hasPrivacySignal, () => false);
  const on = status === "on";

  return (
    <Note title="Your analytics setting on this device">
      <p aria-live="polite">
        {status === "pending" ? "Checking…" : on ? "Analytics is on. Thank you — it helps us improve the site." : "Analytics is off. From now on nothing is sent to Google Analytics from this browser."}
        {signal && !on ? " Your browser sends a Global Privacy Control signal, so we keep it off unless you turn it on here." : ""}
      </p>
      <Button size="sm" variant="secondary" className="mt-3" disabled={status === "pending"} onClick={() => saveAnalyticsChoice(on ? "denied" : "granted")}>
        {on ? "Turn analytics off" : "Allow analytics"}
      </Button>
    </Note>
  );
}
