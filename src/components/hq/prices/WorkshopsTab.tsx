"use client";

import { clubRules, gradeBands, joveDayRules, mediaPack } from "@/lib/content/business";
import type { BandPrices } from "@/lib/pricebook/types";
import { Panel } from "@/components/hq/ui";
import { cn, formatINR } from "@/lib/utils";
import { toNumber, type Draft, type TabProps } from "./draft";
import { Labeled, NumBox, TABLE_WRAP, TD, TH, todayNote } from "./fields";

const PLANS: { key: keyof BandPrices; name: string; what: string }[] = [
  { key: "day", name: "JOVE Day", what: "one full day" },
  { key: "quarter", name: "JOVE Quarter", what: "3 JOVE Days" },
  { key: "year", name: "JOVE Year", what: "8 sessions" },
];

export function WorkshopsTab({ draft, book, update }: TabProps) {
  const setRule = (key: keyof Draft["rules"], v: string) => update((d) => ({ ...d, rules: { ...d.rules, [key]: v } }));
  const setClub = (key: keyof Draft["club"], v: string) => update((d) => ({ ...d, club: { ...d.club, [key]: v } }));
  const gst = book.rules.gstPercent;

  return (
    <div className="space-y-6">
      <Panel title="Price per student" subtitle={`What a school pays for each student, before GST. ${gst}% GST is added on the invoice.`} bodyClassName="p-0">
        <div className={TABLE_WRAP}>
          <table className="w-full min-w-[640px] table-fixed text-sm">
            <caption className="sr-only">Price per student by grade group and programme, before GST</caption>
            <colgroup>
              <col />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-graphite/12 bg-graphite/[0.035]">
                <th scope="col" className={TH}>
                  Grade group
                </th>
                {PLANS.map((p) => (
                  <th key={p.key} scope="col" className={cn(TH, "text-right")}>
                    {p.name} <span className="block normal-case tracking-normal text-blueprint/80">{p.what}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gradeBands.map((b) => {
                const now = book.bands[b.id];
                const today: BandPrices = { day: b.pricePerStudent, quarter: b.quarterPricePerStudent, year: b.yearPricePerStudent };
                // what sits under a box while its price is the one on the website
                const aside: Record<keyof BandPrices, string> = {
                  day: now.day > 0 ? `${formatINR(Math.round(now.day * (1 + gst / 100)))} with GST` : "",
                  quarter: now.day > 0 && now.quarter > 0 && now.quarter < now.day * 3 ? `${Math.round((1 - now.quarter / (now.day * 3)) * 100)}% less than 3 JOVE Days` : "",
                  year: now.year > 0 ? `${formatINR(Math.round(now.year / 8))} a session` : "",
                };
                return (
                  <tr key={b.id} className="border-b border-graphite/[0.07] last:border-0">
                    <th scope="row" className={cn(TD, "py-3 text-left font-normal")}>
                      <span className="block text-sm font-semibold text-graphite">{b.grades}</span>
                      <span className="block text-xs text-blueprint">{b.name}</span>
                    </th>
                    {PLANS.map((p) => {
                      const differs = now[p.key] !== today[p.key];
                      return (
                        <td key={p.key} className={cn(TD, "py-2.5")}>
                          <NumBox
                            kind="money"
                            value={draft.bands[b.id][p.key]}
                            onChange={(v) => update((d) => ({ ...d, bands: { ...d.bands, [b.id]: { ...d.bands[b.id], [p.key]: v } } }))}
                            label={`${p.name}, ${b.grades}, per student before GST`}
                            invalid={toNumber(draft.bands[b.id][p.key]) <= 0}
                            className="ml-auto max-w-[9rem]"
                          />
                          <p className={cn("tabular mt-1 min-h-4 truncate text-right text-[11px] leading-4", differs ? "font-medium text-warn" : "text-blueprint")}>{differs ? `Website today ${formatINR(today[p.key])}` : aside[p.key]}</p>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Rules for a JOVE Day" subtitle="Printed on the website, in proposals and on invoices, and used by the quote calculator.">
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Labeled label="Minimum students" {...todayNote(book.rules.minimumStudents !== joveDayRules.minimumStudents, String(joveDayRules.minimumStudents), "The smallest JOVE Day you take on.")}>
            <NumBox value={draft.rules.minimumStudents} onChange={(v) => setRule("minimumStudents", v)} invalid={toNumber(draft.rules.minimumStudents) < 1} />
          </Labeled>
          <Labeled label="Minimum billing, before GST" {...todayNote(book.rules.minimumBilling !== joveDayRules.minimumBilling, formatINR(joveDayRules.minimumBilling), `${formatINR(book.rules.minimumBilling)}: a smaller booking still pays this.`)}>
            <NumBox kind="money" value={draft.rules.minimumBilling} onChange={(v) => setRule("minimumBilling", v)} />
          </Labeled>
          <Labeled label="Most students in one day" {...todayNote(book.rules.maxStudentsPerDay !== joveDayRules.maxStudentsPerDay, String(joveDayRules.maxStudentsPerDay), "Above this, the school needs a second day.")}>
            <NumBox value={draft.rules.maxStudentsPerDay} onChange={(v) => setRule("maxStudentsPerDay", v)} invalid={toNumber(draft.rules.maxStudentsPerDay) < Math.max(1, toNumber(draft.rules.minimumStudents))} />
          </Labeled>
          <Labeled label="Advance to confirm a date" {...todayNote(book.rules.advancePercent !== joveDayRules.advancePercent, `${joveDayRules.advancePercent}%`, "Of the invoice total.")}>
            <NumBox kind="percent" value={draft.rules.advancePercent} onChange={(v) => setRule("advancePercent", v)} invalid={toNumber(draft.rules.advancePercent) > 100} />
          </Labeled>
          <Labeled label="Days to pay the balance" {...todayNote(book.rules.balanceDueDays !== joveDayRules.balanceDueDays, `${joveDayRules.balanceDueDays} days`, "Counted from the JOVE Day.")}>
            <NumBox value={draft.rules.balanceDueDays} onChange={(v) => setRule("balanceDueDays", v)} />
          </Labeled>
          <Labeled label="GST on workshops" {...todayNote(book.rules.gstPercent !== joveDayRules.gstPercent, `${joveDayRules.gstPercent}%`, "Added on top of the prices above.")}>
            <NumBox kind="percent" value={draft.rules.gstPercent} onChange={(v) => setRule("gstPercent", v)} invalid={toNumber(draft.rules.gstPercent) > 40} />
          </Labeled>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="JOVE Club" subtitle="The weekly after-school club." className="min-w-0">
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Labeled label="Price per student, a month" {...todayNote(book.club.pricePerMonth !== clubRules.pricePerMonth, formatINR(clubRules.pricePerMonth), "Before GST.")}>
              <NumBox kind="money" value={draft.club.pricePerMonth} onChange={(v) => setClub("pricePerMonth", v)} invalid={toNumber(draft.club.pricePerMonth) <= 0} />
            </Labeled>
            <Labeled label="Minimum students" {...todayNote(book.club.minimumStudents !== clubRules.minimumStudents, String(clubRules.minimumStudents), "The smallest batch you run.")}>
              <NumBox value={draft.club.minimumStudents} onChange={(v) => setClub("minimumStudents", v)} invalid={toNumber(draft.club.minimumStudents) < 1} />
            </Labeled>
          </div>
        </Panel>

        <Panel title="Free Media Pack" subtitle="Reels, film, drone shots and photos, included with every JOVE Day." className="min-w-0">
          <Labeled label="Market value you quote" {...todayNote(book.mediaPackValue !== mediaPack.marketValue, formatINR(mediaPack.marketValue), `Shown to schools as "worth ${formatINR(book.mediaPackValue)}". Nobody is charged this.`)} className="max-w-xs">
            <NumBox kind="money" value={draft.mediaPackValue} onChange={(v) => update((d) => ({ ...d, mediaPackValue: v }))} />
          </Labeled>
        </Panel>
      </div>
    </div>
  );
}
