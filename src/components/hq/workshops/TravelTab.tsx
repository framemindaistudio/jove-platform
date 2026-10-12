"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Fuel, Loader2, Plus } from "lucide-react";
import { can, OPS, OPS_TRAINER } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR, formatNumber } from "@/lib/utils";
import { useCollection, useHq, useSettings } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Metric, Notice } from "./bits";
import { list, num, shortDate, str, tripCost, TRIP_VEHICLES, type Rec } from "./logic";

export function TravelTab({ w, schoolName }: { w: Rec; schoolName: string }) {
  const { user, store } = useHq();
  const canRead = can(user, OPS_TRAINER);
  const canWrite = can(user, OPS) && store.writable;
  const { records, loading, save } = useCollection(canRead ? "trips" : "__none");
  const { settings } = useSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const trips = useMemo(() => records.filter((t) => t.workshopId === w.id).sort((a, b) => str(a.date).localeCompare(str(b.date))), [records, w.id]);

  const oneWay = num(w.distanceKm);
  const roundTrip = Math.round(oneWay * 2);
  const rate = num(settings.fuelCostPerKm);
  const fuel = Math.round(roundTrip * rate);
  const vehicle = TRIP_VEHICLES.find((v) => v.value.toLowerCase() === str(w.vehicle).trim().toLowerCase())?.value ?? "Own car";

  async function planTrip() {
    setBusy(true);
    setError("");
    try {
      await save({
        workshopId: w.id,
        date: str(w.date),
        status: "planned",
        from: settings.baseLocation || "Base",
        to: schoolName || str(w.title),
        distanceKm: roundTrip,
        vehicle,
        team: list(w.team),
        fuelCost: fuel,
        departTime: str(w.departTime),
        notes: `Planned from workshop "${str(w.title)}". Fuel estimate: ${roundTrip} km round trip × ${formatINR(rate)} per km. Add tolls, stay and food once known.`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the trip");
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return <Notice>Travel plans are visible to operations and trainers.</Notice>;

  return (
    <div className="space-y-5">
      <Panel title="Fuel estimate" subtitle="Distance from the workshop record × fuel cost per km from Settings">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="One way" value={oneWay ? `${formatNumber(oneWay)} km` : "—"} />
          <Metric label="Round trip" value={roundTrip ? `${formatNumber(roundTrip)} km` : "—"} />
          <Metric label="Fuel cost per km" value={rate ? formatINR(rate) : "Set in Settings"} sub="Settings → fuel cost per km" />
          <Metric label="Fuel estimate" value={fuel ? formatINR(fuel) : "—"} sub="Excludes tolls, stay and food" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-dashed border-graphite/15 pt-4">
          {canWrite ? (
            <Button size="sm" onClick={planTrip} disabled={busy || !roundTrip || !str(w.date)}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />} Plan trip
            </Button>
          ) : null}
          {!roundTrip && <p className="text-xs text-blueprint">Add the one-way distance in Edit to plan a trip.</p>}
          {!!roundTrip && !str(w.date) && <p className="text-xs text-blueprint">Set the workshop date first.</p>}
          <Link href="/hq/travel" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline">
            Open Travel & Transport <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        {error && (
          <Notice tone="bad" className="mt-3">
            {error}
          </Notice>
        )}
      </Panel>

      <Panel title="Trips for this workshop" bodyClassName="p-0">
        {loading ? (
          <p className="px-5 py-8 text-sm text-blueprint">Loading trips…</p>
        ) : trips.length ? (
          <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-graphite/10 text-left">
                  {["Date", "Route", "Vehicle", "Distance", "Total cost", "Status"].map((h, i) => (
                    <th key={h} scope="col" className={`annot px-5 py-2.5 text-[10px] text-blueprint ${i === 3 || i === 4 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => {
                  const c = tripCost(t);
                  return (
                    <tr key={t.id} className="border-b border-dashed border-graphite/10 last:border-0">
                      <td className="tabular whitespace-nowrap px-5 py-3 font-mono text-xs">{shortDate(str(t.date))}</td>
                      <td className="px-5 py-3">
                        {str(t.from) || "Base"} → <span className="font-semibold">{str(t.to) || "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-charcoal">{str(t.vehicle) || "—"}</td>
                      <td className="tabular px-5 py-3 text-right font-mono">{c.km ? `${formatNumber(c.km)} km` : "—"}</td>
                      <td className="tabular px-5 py-3 text-right font-mono font-semibold">
                        {c.total ? formatINR(c.total) : "—"}
                        {c.perKm > 0 && <span className="ml-1 text-[10px] font-normal text-blueprint">{formatINR(c.perKm)}/km</span>}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone(t.status)} dot>
                          {str(t.status)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <Fuel className="size-6 text-blueprint" aria-hidden />
            <p className="text-sm font-medium">No trip planned yet</p>
            <p className="max-w-sm text-xs text-blueprint">Use “Plan trip” to create a trip with the round-trip distance and fuel estimate. Edit costs, vehicle and team in Travel & Transport.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
