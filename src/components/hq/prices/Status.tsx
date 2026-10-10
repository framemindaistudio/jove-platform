"use client";

import { CircleCheck, Clock, Globe, Info, Lock, TriangleAlert, X } from "lucide-react";
import type { PriceBook } from "@/lib/pricebook/types";
import { cn, formatDateTime } from "@/lib/utils";

/** What GET /api/hq/pricebook sends besides the book: is the website built with the saved prices yet? */
export interface BookStatus {
  /** fingerprint of the prices the running website was built with ("" = its starting prices) */
  builtStamp: string;
  /** is the automatic rebuild (a Vercel Deploy Hook) set up? */
  hook: boolean;
  storeMode: "github" | "local" | "readonly";
}
export interface Loaded extends BookStatus {
  book: PriceBook;
  /** false until a price book has been saved for the first time */
  exists: boolean;
}
export interface SaveResult extends Loaded {
  pricesChanged: boolean;
  /** how many shop products had their price brought in line */
  synced: number;
  /** what the save did to Inventory (null: it could not be updated this time) */
  stock: { updated: number; added: number; mixed: string[] } | null;
  deploy: "triggered" | "missing" | "invalid" | "failed" | "current";
}

const PLACES = "the website, shop, brochures, proposals and the quote calculator";

/** The manual way to publish, and the one-time set-up that makes it automatic. */
function RedeployNow() {
  return (
    <p>
      To publish the prices now, open <Path>Vercel → project jove-platform → Deployments → ⋯ → Redeploy</Path>.
    </p>
  );
}
function HookSteps({ lead }: { lead: string }) {
  return (
    <div>
      <p>{lead}</p>
      <ol className="mt-1.5 list-decimal space-y-1 pl-5">
        <li>
          Open <Path>Vercel → project jove-platform → Settings → Git → Deploy Hooks</Path>.
        </li>
        <li>
          Create a hook named <Path>Price book</Path> for the branch <Path>main</Path>, and copy its address.
        </li>
        <li>
          Open <Path>Settings → Environment Variables</Path>, add <Path>VERCEL_DEPLOY_HOOK_URL</Path> with that address, and press Save.
        </li>
        <li>
          Open <Path>Deployments → ⋯ → Redeploy</Path>.
        </li>
      </ol>
      <p className="mt-1.5">From then on the website rebuilds itself after every price change.</p>
    </div>
  );
}
const Path = ({ children }: { children: React.ReactNode }) => <span className="font-semibold text-graphite">{children}</span>;

/* ───────────────────────────── the line at the top ───────────────────────────── */

/** Always on screen: is the website on the saved prices, and who saved last. */
export function StatusLine({ data }: { data: Loaded }) {
  const { book, exists, builtStamp, hook, storeMode } = data;
  const live = exists && !!builtStamp && builtStamp === book.published?.stamp;
  const tone = !exists ? "info" : live ? "ok" : "warn";
  const Icon = !exists ? Info : live ? CircleCheck : Clock;
  const text = !exists ? "Nothing has been saved here yet. The website shows its starting prices." : live ? "The website shows the saved prices." : "The website still shows the previous prices; it changes when the next build finishes.";
  const lastSaved = book.updatedAt ? `Last saved ${formatDateTime(book.updatedAt)}${book.updatedBy ? ` by ${book.updatedBy}` : ""}` : null;

  return (
    <div className={cn("rounded-[var(--radius-md)] border px-4 py-3", tone === "ok" && "border-ok/30 bg-ok/[0.07]", tone === "warn" && "border-warn/35 bg-warn/[0.08]", tone === "info" && "border-graphite/15 bg-graphite/[0.035]")}>
      <div role="status" className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="flex items-start gap-2 text-sm font-medium text-graphite">
          <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "info" && "text-blueprint")} aria-hidden />
          {text}
        </p>
        {lastSaved && <p className="pl-6 text-xs text-charcoal">{lastSaved}</p>}
      </div>
      {exists && !live && storeMode === "local" && <p className="mt-1.5 pl-6 text-xs text-charcoal">This is this computer&rsquo;s copy of HQ: here the prices apply after the dev server restarts or the site is built again.</p>}
      {exists && !live && storeMode !== "local" && (
        <details className="mt-1.5 pl-6 text-xs text-charcoal">
          <summary className="cursor-pointer font-semibold text-graphite underline-offset-2 hover:underline">{hook ? "Taking more than a few minutes?" : "The automatic rebuild is not set up yet. How to publish the prices"}</summary>
          <div className="mt-2 space-y-2 leading-relaxed">
            <RedeployNow />
            {!hook && <HookSteps lead="To make the website rebuild by itself after every price change, set it up once:" />}
          </div>
        </details>
      )}
    </div>
  );
}

/* ───────────────────────────── what changes where ───────────────────────────── */

export function WhatChangesWhere() {
  return (
    <section aria-labelledby="what-changes-where">
      <h2 id="what-changes-where" className="annot mb-2 text-[10px] text-blueprint">
        What changes where
      </h2>
      <div className="grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-graphite/10 sm:grid-cols-2">
        <div className="bg-paper-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-graphite">
            <Lock className="size-3.5 text-blueprint" aria-hidden /> Costs and planning numbers
          </p>
          <p className="mt-1 text-xs leading-relaxed text-charcoal">What parts cost, margins, the costs of a JOVE Day, monthly costs, the launch budget and revenue targets. They change in HQ only, the moment you save, and are never on the website.</p>
        </div>
        <div className="bg-paper-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-graphite">
            <Globe className="size-3.5 text-blueprint" aria-hidden /> Prices customers pay
          </p>
          <p className="mt-1 text-xs leading-relaxed text-charcoal">Kit prices, per-student prices, the rules of a JOVE Day and add-ons. They reach the website, shop, brochures, proposals, invoices and the quote calculator after the website has rebuilt itself.</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── after saving ───────────────────────────── */

/** Says exactly what the save did, from the server's answer. */
export function SaveReport({ result, onDismiss }: { result: SaveResult; onDismiss: () => void }) {
  const { pricesChanged, synced, stock, deploy, storeMode } = result;
  // "current": the website is already on these prices, nothing to rebuild
  const rebuild = deploy !== "current";
  const local = storeMode === "local";
  const trouble = rebuild && !local && deploy !== "triggered";

  return (
    <div role="status" aria-live="polite" className={cn("flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3.5 text-sm text-graphite", trouble ? "border-warn/40 bg-warn/10" : "border-ok/35 bg-ok/10")}>
      {trouble ? <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /> : <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />}
      <div className="min-w-0 flex-1 space-y-2 leading-relaxed">
        <p className="font-semibold">Saved{result.book.updatedAt ? ` · ${formatDateTime(result.book.updatedAt)}` : ""}</p>
        <p>
          <strong className="font-semibold">Inside HQ:</strong> Kits &amp; BOM, the Business Planner and the workshop economics use the new numbers now.
        </p>
        <p>
          <strong className="font-semibold">Inventory:</strong>{" "}
          {!stock
            ? "the unit costs could not be brought in line this time; they will be on the next save."
            : stock.updated || stock.added
              ? `${stock.updated ? `${stock.updated} stock item${stock.updated === 1 ? " now carries" : "s now carry"} the cost from here` : ""}${stock.updated && stock.added ? "; " : ""}${stock.added ? `${stock.added} part${stock.added === 1 ? " was" : "s were"} added to Inventory with a stock of 0` : ""}.`
              : "every kit part already had the same unit cost there."}
          {stock && stock.mixed.length > 0 && ` Left alone, because the kits list it at different costs: ${stock.mixed.join(", ")}.`}
        </p>

        {pricesChanged ? (
          <p>
            <strong className="font-semibold">For customers:</strong> the prices they pay changed.{" "}
            {synced > 0 ? `${synced} shop product${synced === 1 ? " had its price" : "s had their prices"} brought in line.` : "No shop product needed a new price."}
          </p>
        ) : rebuild ? (
          <p>
            <strong className="font-semibold">For customers:</strong> this save did not change what they pay, but the website was not yet showing the saved prices.
          </p>
        ) : (
          <p>
            <strong className="font-semibold">For customers:</strong> nothing they pay changed, so the website stays as it is.
          </p>
        )}

        {rebuild && local && (
          <p>
            This is this computer&rsquo;s copy of HQ. Here {PLACES} show the {pricesChanged ? "new" : "saved"} prices after the dev server restarts or the site is built again.
          </p>
        )}
        {rebuild && !local && deploy === "triggered" && (
          <p>
            The website is rebuilding itself now. In about a minute {PLACES} show the {pricesChanged ? "new" : "saved"} prices.
          </p>
        )}
        {rebuild && !local && deploy === "missing" && (
          <div className="space-y-2">
            <p>
              The automatic rebuild is not set up yet, so {PLACES} still show the previous prices.
            </p>
            <RedeployNow />
            <HookSteps lead="To set the automatic rebuild up (once):" />
          </div>
        )}
        {rebuild && !local && deploy === "invalid" && (
          <div className="space-y-2">
            <p>
              The website was not rebuilt: the address saved in Vercel as <Path>VERCEL_DEPLOY_HOOK_URL</Path> is not a Vercel Deploy Hook address. Until that is fixed, {PLACES} still show the previous prices.
            </p>
            <RedeployNow />
            <HookSteps lead="To fix the automatic rebuild, make a new hook and save its address:" />
          </div>
        )}
        {rebuild && !local && deploy === "failed" && (
          <div className="space-y-2">
            <p>
              Vercel did not accept the request to rebuild the website, so {PLACES} still show the previous prices.
            </p>
            <RedeployNow />
          </div>
        )}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss this message" className="rounded p-0.5 text-blueprint hover:bg-graphite/10 hover:text-graphite">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
