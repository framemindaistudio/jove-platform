"use client";

import { useRef, useState } from "react";
import { CalendarCheck, Clapperboard, Handshake, MessageSquare, Package, type LucideIcon } from "lucide-react";
import { CornerMarks, SpecIndex } from "@/components/brand/Blueprint";
import { LeadForm } from "@/components/site/LeadForm";
import { analyticsRunning } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { ContactTabData, ContactTabId } from "./tabs";

const ICONS: Record<ContactTabId, LucideIcon> = {
  workshop: CalendarCheck,
  kits: Package,
  studio: Clapperboard,
  partner: Handshake,
  general: MessageSquare,
};

/**
 * Enquiry-type tabs + the matching LeadForm.
 * Accessible tablist (arrow keys / Home / End, roving tabindex) and a shareable ?type= in the URL.
 */
export function ContactForms({ tabs, initial }: { tabs: ContactTabData[]; initial: ContactTabId }) {
  const [active, setActive] = useState<ContactTabId>(initial);
  const refs = useRef<Partial<Record<ContactTabId, HTMLButtonElement | null>>>({});
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  function select(id: ContactTabId, focus = false) {
    setActive(id);
    // The shareable ?type= is a nicety only — and with analytics running, the Google tag would count each change as a page view.
    if (!analyticsRunning()) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("type", id);
        window.history.replaceState(null, "", url.toString());
      } catch {
        /* ignore */
      }
    }
    if (focus) refs.current[id]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    select(tabs[next].id, true);
  }

  return (
    <div>
      <div role="tablist" aria-label="What would you like to talk about?" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tabs.map((t, i) => {
          const on = t.id === active;
          const Icon = ICONS[t.id];
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`contact-tab-${t.id}`}
              aria-selected={on}
              aria-controls={on ? `contact-panel-${t.id}` : undefined}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "group relative flex min-h-[4.5rem] flex-col items-start justify-between gap-2 rounded-[var(--radius-md)] border px-3.5 py-3 text-left transition-all duration-300 ease-[var(--ease-out-expo)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite",
                i === tabs.length - 1 && tabs.length % 2 === 1 && "max-sm:col-span-2",
                on
                  ? "border-graphite bg-graphite text-paper shadow-[var(--shadow-lift)]"
                  : "border-graphite/15 bg-paper-50 text-graphite hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-paper)]",
              )}
            >
              <Icon className={cn("size-[18px]", on ? "text-paper" : "text-blueprint group-hover:text-graphite")} strokeWidth={1.5} aria-hidden />
              <span className="text-[13px] font-semibold leading-tight tracking-[-0.005em]">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`contact-panel-${current.id}`}
        aria-labelledby={`contact-tab-${current.id}`}
        className="relative mt-5 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5 shadow-[var(--shadow-paper)] sm:p-8"
      >
        <CornerMarks />
        <h2 className="text-[1.6rem] font-bold leading-tight tracking-[-0.025em] text-graphite sm:text-[1.9rem]">{current.title}</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-charcoal">{current.blurb}</p>
        <ul className="mt-5 grid gap-2.5 border-y border-dashed border-graphite/25 py-5">
          {current.points.map((p, i) => (
            <li key={p} className="grid grid-cols-[2rem_1fr] gap-2 text-sm leading-relaxed text-charcoal">
              <SpecIndex n={i + 1} className="pt-[0.15em]" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <LeadForm key={current.id} kind={current.kind} submitLabel={current.submitLabel} className="mt-7" />
      </div>
    </div>
  );
}
