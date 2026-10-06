"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/form";
import { joveDayRules } from "@/lib/content/business";
import { formatINR, formatNumber } from "@/lib/utils";
import { KV, Panel } from "@/components/hq/ui";
import { NumberCommit, Switch } from "./controls";
import { Notice } from "./bits";
import { bandPlan, dayWarnings, DRONE_OPTIONS, list, money, num, optionLabel, PACKAGE_OPTIONS, shortDate, str, workshopValue, type Rec } from "./logic";
import type { PatchFn } from "./useWorkshopDoc";

export function OverviewTab({ w, patch, canWrite, school, canSchools, showMoney }: { w: Rec; patch: PatchFn; canWrite: boolean; school?: Rec; canSchools: boolean; showMoney: boolean }) {
  const value = workshopValue(w);
  const m = money(w);
  const warnings = dayWarnings(w);
  const team = list(w.team);
  const drone = str(w.droneAllowed) || "Pending";
  const diff = m.difference;

  return (
    <div className="space-y-5">
      {warnings.map((x) => (
        <Notice key={x} tone="warn">
          {x}
        </Notice>
      ))}

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Students by grade band" subtitle={optionLabel(PACKAGE_OPTIONS, value.pkg)} className={showMoney ? "lg:col-span-2" : "lg:col-span-3"} bodyClassName="p-0">
          {value.lines.length ? (
            <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-graphite/10 text-left">
                    {["Band", "Students", "Sessions", ...(showMoney ? ["Rate / student", "Amount"] : [])].map((h, i) => (
                      <th key={h} scope="col" className={`annot px-5 py-2.5 text-[10px] text-blueprint ${i > 0 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {value.lines.map((l) => {
                    const plan = bandPlan(w, l.band);
                    return (
                      <tr key={l.band.id} className="border-b border-dashed border-graphite/10 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-semibold">{l.band.name}</p>
                          <p className="text-xs text-blueprint">{l.band.grades}</p>
                        </td>
                        <td className="tabular px-5 py-3 text-right font-mono">{formatNumber(l.students)}</td>
                        <td className="tabular px-5 py-3 text-right font-mono text-charcoal">
                          {plan.sessions}
                          <span className="text-blueprint"> × {plan.perSession}</span>
                        </td>
                        {showMoney && <td className="tabular px-5 py-3 text-right font-mono">{formatINR(l.rate)}</td>}
                        {showMoney && <td className="tabular px-5 py-3 text-right font-mono font-semibold">{formatINR(l.amount)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-graphite/20 bg-graphite/[0.035]">
                    <th scope="row" className="px-5 py-3 text-left font-semibold">
                      Total
                    </th>
                    <td className="tabular px-5 py-3 text-right font-mono font-bold">{formatNumber(value.students)}</td>
                    <td />
                    {showMoney && <td className="px-5 py-3 text-right text-xs text-blueprint">{value.minimumApplies ? `Minimum billing ${formatINR(joveDayRules.minimumBilling)} applies` : "Subtotal"}</td>}
                    {showMoney && <td className="tabular px-5 py-3 text-right font-mono font-bold">{formatINR(value.value)}</td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-blueprint">No student counts yet. Open Edit and add the number of students per grade band — kits, run sheet, certificates and value all follow from them.</p>
          )}
        </Panel>

        {showMoney && (
        <Panel title="Commercials" subtitle="All amounts ex-GST unless stated">
          <div>
            <KV k="Computed from counts" v={<span className="tabular font-mono">{formatINR(m.computed)}</span>} />
            <KV
              k="Agreed amount"
              v={
                m.agreed ? (
                  <span className="tabular font-mono">
                    {formatINR(m.agreed)}
                    {diff !== 0 && <span className={`ml-2 text-xs ${diff > 0 ? "text-ok" : "text-warn"}`}>{diff > 0 ? "+" : "−"}{formatINR(Math.abs(diff))}</span>}
                  </span>
                ) : (
                  <span className="text-blueprint">Not set — using computed</span>
                )
              }
            />
            <KV k={`GST ${joveDayRules.gstPercent}%`} v={<span className="tabular font-mono">{formatINR(m.gst)}</span>} />
            <KV k="Total with GST" v={<span className="tabular font-mono font-bold">{formatINR(m.totalWithGst)}</span>} />
            <KV k={`Advance due (${joveDayRules.advancePercent}%)`} v={<span className="tabular font-mono">{formatINR(m.advanceDue)}</span>} />
            <KV
              k="Advance received"
              v={<NumberCommit label="Advance received (₹)" prefix="₹" value={m.advanceReceived} disabled={!canWrite} onCommit={(n) => patch({ advanceReceived: n }, { immediate: true })} className="w-36" />}
            />
            <KV
              k="Advance status"
              v={m.basis ? m.advanceOk ? <Badge tone="ok">Received</Badge> : <Badge tone="warn">{formatINR(m.advanceShort)} short</Badge> : <span className="text-blueprint">—</span>}
            />
            <KV k="Balance after advance" v={<span className="tabular font-mono">{formatINR(m.balance)}</span>} />
            <KV k={`Balance due (${joveDayRules.balanceDueDays} days after)`} v={<span className="tabular font-mono">{m.balanceDueDate ? shortDate(m.balanceDueDate) : "—"}</span>} />
          </div>
          {canWrite && m.computed > 0 && m.agreed !== m.computed && (
            <button type="button" className="mt-3 text-xs font-semibold text-graphite underline-offset-2 hover:underline" onClick={() => patch({ agreedAmount: m.computed }, { immediate: true })}>
              Set agreed amount to the computed {formatINR(m.computed)}
            </button>
          )}
        </Panel>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Team & timings">
          <KV k="Lead" v={str(w.leadTrainer) || <span className="text-blueprint">Not assigned</span>} />
          <KV k="Report time at school" v={<span className="tabular font-mono">{str(w.startTime) || "—"}</span>} />
          <KV k="Depart base at" v={<span className="tabular font-mono">{str(w.departTime) || "—"}</span>} />
          <KV k="Vehicle" v={str(w.vehicle) || <span className="text-blueprint">—</span>} />
          <KV k="Distance (one way)" v={<span className="tabular font-mono">{num(w.distanceKm) ? `${formatNumber(num(w.distanceKm))} km` : "—"}</span>} />
          <div className="pt-3">
            <p className="annot mb-2 text-[10px] text-blueprint">Team on site ({joveDayRules.teamSize.founders + joveDayRules.teamSize.trainers + joveDayRules.teamSize.media} planned)</p>
            {team.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {team.map((t) => (
                  <li key={t}>
                    <Badge tone="outline">{t}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-blueprint">Nobody assigned yet — add names in Edit. Plan: {joveDayRules.teamSize.founders} founders, {joveDayRules.teamSize.trainers} trainers, {joveDayRules.teamSize.media} media crew.</p>
            )}
          </div>
        </Panel>

        <Panel title="School & venue">
          <KV
            k="School"
            v={
              school && canSchools ? (
                <Link href={`/hq/crm/${school.id}`} className="underline underline-offset-2 hover:text-ink">
                  {str(school.name)}
                </Link>
              ) : (
                str(school?.name) || <span className="text-blueprint">Not linked</span>
              )
            }
          />
          <KV k="On-day contact" v={str(w.schoolContact) || <span className="text-blueprint">—</span>} />
          <KV
            k="Contact phone"
            v={
              str(w.schoolContactPhone) ? (
                <a href={`tel:${str(w.schoolContactPhone).replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 underline underline-offset-2">
                  <Phone className="size-3.5" aria-hidden /> {str(w.schoolContactPhone)}
                </a>
              ) : (
                <span className="text-blueprint">—</span>
              )
            }
          />
          <div className="pt-3">
            <p className="annot mb-1.5 text-[10px] text-blueprint">Venue — halls, power, projector</p>
            {str(w.venue) ? <p className="whitespace-pre-wrap text-sm text-charcoal">{str(w.venue)}</p> : <p className="text-xs text-blueprint">Nothing recorded yet. Add hall names, power points and projector details in Edit — they print on the run sheet.</p>}
          </div>
        </Panel>

        <Panel title="Media & permissions" subtitle="FrameMind AI Studio needs these before the day">
          <div className="divide-y divide-dashed divide-graphite/10">
            <Switch label="Media Pack included" description="Reels, film, photos, testimonial clip, posting kit." checked={!!w.mediaPack} disabled={!canWrite} onChange={(v) => patch({ mediaPack: v }, { immediate: true })} />
            <Switch label="Photo & video consent collected" description="Parents' consent forms collected; opt-out list received." checked={!!w.consentCollected} disabled={!canWrite} onChange={(v) => patch({ consentCollected: v }, { immediate: true })} />
            <div className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="drone-permission" className="text-sm font-medium">
                  Drone permission
                </label>
                {canWrite ? (
                  <Select id="drone-permission" className="h-9 w-40" value={drone} onChange={(e) => patch({ droneAllowed: e.target.value }, { immediate: true })}>
                    {DRONE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Badge tone={drone === "Granted" ? "ok" : drone === "Pending" ? "warn" : "bad"}>{drone}</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-blueprint">Written school permission plus a Digital Sky airspace check. Verify current drone rules before every flight.</p>
            </div>
          </div>
        </Panel>
      </div>

      {str(w.notes) && (
        <Panel title="Internal notes">
          <p className="whitespace-pre-wrap text-sm text-charcoal">{str(w.notes)}</p>
        </Panel>
      )}
    </div>
  );
}
