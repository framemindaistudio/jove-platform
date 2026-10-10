"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, TriangleAlert, Undo2 } from "lucide-react";
import { kits, type KitId } from "@/lib/content/business";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { api, useHq } from "@/components/hq/data";
import { EmptyState, Loading, PageHeader } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { AddOnsTab } from "./AddOnsTab";
import { CostsTab } from "./CostsTab";
import { changedTabs, customersAffected, findIssues, isChanged, toBook, toDraft, type Draft, type Issue, type TabId, type TabProps } from "./draft";
import { ChangedDot, EditableProvider } from "./fields";
import { KitsTab } from "./KitsTab";
import { SaveReport, StatusLine, WhatChangesWhere, type Loaded, type SaveResult } from "./Status";
import { WorkshopsTab } from "./WorkshopsTab";

const TAB_NAMES: Record<TabId, string> = { kits: "Kits", workshops: "Workshops", addons: "Add-ons", costs: "Running costs" };
const LEAVE_QUESTION = "You have changes that are not saved. Leave this page without saving them?";

/**
 * Asks before the page is left with changes that are not saved: closing or reloading the tab, and clicking any
 * link inside HQ (the menu included). The browser's Back button is not covered.
 */
function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const to = new URL(link.href, window.location.href);
      // another site is a full page load (the browser asks through beforeunload); the same page is not leaving
      if (to.origin !== window.location.origin || to.pathname === window.location.pathname) return;
      if (!window.confirm(LEAVE_QUESTION)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    // capture phase on window: runs before the link's own click handler starts the navigation
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [active]);
}

/** HQ → Money → Prices & Costs: the one place where costs, margins and every price customers pay are set. */
export function PricesApp() {
  const { user, store } = useHq();
  const router = useRouter();
  // founders and admins change the book; Operations reads it
  const editable = can(user, LEADERSHIP) && store.writable;

  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<TabId>("kits");
  const [kit, setKit] = useState<KitId>(kits[0].id);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<SaveResult | null>(null);
  const [refusal, setRefusal] = useState<string[] | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    api<Loaded>("/api/hq/pricebook")
      .then((json) => {
        if (!alive) return;
        setData(json);
        setDraft(toDraft(json.book));
      })
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : "The price book could not be loaded"));
    return () => {
      alive = false;
    };
  }, [attempt]);

  // both sides go through the same conversion, so "changed" means a number or a word really differs
  const saved = useMemo(() => (data ? toBook(toDraft(data.book)) : null), [data]);
  const book = useMemo(() => (draft ? toBook(draft) : null), [draft]);
  const changed = !!book && !!saved && isChanged(book, saved);
  const issues = useMemo(() => (draft && book ? findIssues(draft, book) : []), [draft, book]);

  useLeaveGuard(changed && editable);

  // after a save, bring the report of what happened into view
  useEffect(() => {
    if (report) reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [report]);

  const update = useCallback((change: (d: Draft) => Draft) => {
    setDraft((d) => (d ? change(d) : d));
    setRefusal(null);
  }, []);

  const header = (
    <PageHeader
      eyebrow="Money"
      icon="BadgeIndianRupee"
      title="Prices & Costs"
      description={
        editable
          ? "What every kit costs to make, the margin you want, and every price customers pay. Change a number here and every HQ screen follows as soon as you save; the website follows after it rebuilds."
          : "What every kit costs to make, the margins, and every price customers pay."
      }
    />
  );

  if (loadError)
    return (
      <>
        {header}
        <EmptyState
          icon="BadgeIndianRupee"
          title="The price book could not be loaded"
          description={loadError}
          action={
            <Button
              size="sm"
              onClick={() => {
                setLoadError(null);
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </Button>
          }
        />
      </>
    );
  if (!data || !draft || !book || !saved)
    return (
      <>
        {header}
        <Loading label="Loading prices and costs…" />
      </>
    );

  const dots = changedTabs(book, saved);
  const forCustomers = changed && customersAffected(book, saved);
  const props: TabProps = { draft, book, saved, update };

  function open(issue: Issue) {
    setTab(issue.tab);
    if (issue.kit) setKit(issue.kit);
  }

  function discard() {
    if (!data || !window.confirm("Discard every change since the last save?")) return;
    setDraft(toDraft(data.book));
    setRefusal(null);
    setShowIssues(false);
  }

  async function save() {
    if (!book || !changed || saving) return;
    if (issues.length) {
      setShowIssues(true);
      open(issues[0]);
      return;
    }
    setSaving(true);
    setRefusal(null);
    try {
      const result = await api<SaveResult>("/api/hq/pricebook", { method: "PUT", body: JSON.stringify({ book }) });
      setData(result);
      setDraft(toDraft(result.book));
      setShowIssues(false);
      setReport(result);
      // every other HQ screen reads the book on the server: this hands them the new one
      router.refresh();
    } catch (e) {
      // the server lists what it refused, joined by "; "
      setRefusal((e instanceof Error ? e.message : "The changes could not be saved").split("; "));
    } finally {
      setSaving(false);
    }
  }

  const problems = refusal ?? (showIssues ? issues.map((i) => i.text) : []);

  return (
    <>
      {header}

      <div className="space-y-4">
        {report && (
          <div ref={reportRef} className="scroll-mt-20">
            <SaveReport result={report} onDismiss={() => setReport(null)} />
          </div>
        )}
        <StatusLine data={data} />
        {!editable && (
          <p className="rounded-[var(--radius-sm)] border border-graphite/15 bg-graphite/[0.035] px-4 py-2.5 text-sm text-charcoal">
            {can(user, LEADERSHIP) ? "HQ is in read-only mode, so prices and costs can be read but not changed. See Settings → System status." : "You can read every number here. Only a founder or an admin can change them."}
          </p>
        )}
        {editable && !data.exists && (
          <p className="rounded-[var(--radius-sm)] border border-graphite/15 bg-graphite/[0.035] px-4 py-2.5 text-sm text-charcoal">
            <strong className="font-semibold text-graphite">Start here.</strong> The prices below are the ones the website shows today; no costs have been entered yet. Add the parts of each kit and what they cost (Kits), then the costs of a JOVE Day and your monthly costs (Running costs), and press Save.
          </p>
        )}
        <WhatChangesWhere />
      </div>

      <div className="mt-8">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={(Object.keys(TAB_NAMES) as TabId[]).map((id) => ({
            value: id,
            label: (
              <>
                {TAB_NAMES[id]}
                {dots[id] && <ChangedDot />}
              </>
            ),
          }))}
        />
        <EditableProvider value={editable}>
          <div className="pt-6" role="tabpanel" aria-label={TAB_NAMES[tab]}>
            {tab === "kits" && <KitsTab {...props} active={kit} onActive={setKit} />}
            {tab === "workshops" && <WorkshopsTab {...props} />}
            {tab === "addons" && <AddOnsTab {...props} />}
            {tab === "costs" && <CostsTab {...props} />}
          </div>
        </EditableProvider>
      </div>

      {editable && changed && (
        <div className="sticky bottom-3 z-30 mt-8 space-y-2">
          {problems.length > 0 && (
            <div role="alert" className="rounded-[var(--radius-md)] border border-bad/40 bg-paper px-4 py-3 shadow-[var(--shadow-lift)]">
              <p className="flex items-center gap-2 text-sm font-semibold text-bad">
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
                {refusal ? "Not saved. HQ could not accept these changes:" : `Not saved yet. ${problems.length === 1 ? "One thing needs" : `${problems.length} things need`} fixing first:`}
              </p>
              <ul className="hq-scroll mt-2 max-h-40 space-y-1 overflow-y-auto pl-6 text-sm text-graphite">
                {refusal
                  ? refusal.map((text) => (
                      <li key={text} className="list-disc">
                        {text}
                      </li>
                    ))
                  : issues.map((issue) => (
                      <li key={issue.text} className="list-disc">
                        {issue.text}{" "}
                        <button type="button" onClick={() => open(issue)} className="whitespace-nowrap text-xs font-semibold text-charcoal underline underline-offset-2 hover:text-ink">
                          Show me
                        </button>
                      </li>
                    ))}
              </ul>
            </div>
          )}
          <div role="region" aria-label="Changes not saved" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-graphite bg-graphite px-4 py-3 text-paper shadow-[var(--shadow-lift)]">
            <p role="status" aria-live="polite" className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">Changes not saved</span>
              <span className="text-paper/70"> · {forCustomers ? "prices customers pay will change" : "only numbers inside HQ change; the website stays as it is"}</span>
            </p>
            <Button type="button" variant="outline-light" size="sm" onClick={discard} disabled={saving}>
              <Undo2 className="size-4" aria-hidden /> Discard
            </Button>
            <Button type="button" variant="light" size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
