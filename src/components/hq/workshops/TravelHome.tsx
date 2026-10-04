"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, ReceiptText } from "lucide-react";
import { can, OPS, OPS_MEDIA } from "@/lib/hq/roles";
import { Badge } from "@/components/ui/Badge";
import { formatINR, formatNumber, isoDate } from "@/lib/utils";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { Loading, PageHeader, StatCard } from "@/components/hq/ui";
import { num, PLAN_FOOD, PLAN_STAY, PLAN_TRAVEL, str, tripCost, type Rec } from "./logic";
import { useToday } from "./time";
import { Notice } from "./bits";
import { TripEstimator } from "./TripEstimator";

const EXTRA_COLUMNS: ExtraColumn<Rec>[] = [
  {
    key: "total",
    label: "Total cost",
    sortValue: (r) => tripCost(r).total,
    render: (r) => {
      const c = tripCost(r);
      return <span className="tabular font-mono text-xs font-semibold">{c.total ? formatINR(c.total) : "—"}</span>;
    },
  },
  {
    key: "perKm",
    label: "₹ / km",
    sortValue: (r) => tripCost(r).perKm,
    render: (r) => {
      const c = tripCost(r);
      return <span className="tabular font-mono text-xs text-charcoal">{c.perKm ? formatINR(c.perKm, { decimals: true }) : "—"}</span>;
    },
  },
];

export function TravelHome() {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const today = useToday();
  const { records: trips, loading, error, save: saveTrip } = useCollection("trips");
  const { records: workshops } = useCollection("workshops");
  const { save: saveExpense } = useCollection(can(user, OPS) ? "expenses" : "__none");
  const schoolsQ = useCollection(can(user, OPS_MEDIA) ? "schools" : "__none");
  const schools = useMemo(() => new Map(schoolsQ.records.map((r) => [r.id, r])), [schoolsQ.records]);

  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const stats = useMemo(() => {
    if (!today) return null;
    const live = trips.filter((t) => str(t.status) !== "cancelled");
    const month = live.filter((t) => str(t.date).startsWith(today.slice(0, 7)));
    const perWorkshop = new Map<string, number>();
    for (const t of live) if (t.workshopId) perWorkshop.set(str(t.workshopId), (perWorkshop.get(str(t.workshopId)) ?? 0) + tripCost(t).total);
    const costs = [...perWorkshop.values()].filter((v) => v > 0);
    return {
      count: month.length,
      km: month.reduce((s, t) => s + num(t.distanceKm), 0),
      spend: month.reduce((s, t) => s + tripCost(t).total, 0),
      avgPerWorkshop: costs.length ? costs.reduce((s, v) => s + v, 0) / costs.length : null,
      workshops: costs.length,
    };
  }, [trips, today]);

  async function logExpense(t: Rec) {
    const total = tripCost(t).total;
    if (!total) {
      setNotice({ tone: "bad", text: "Add the trip costs first — there is nothing to log yet." });
      return;
    }
    setBusyId(t.id);
    setNotice(null);
    try {
      const to = str(t.to) || "school";
      const exp = await saveExpense({
        date: str(t.date).slice(0, 10) || isoDate(),
        category: "Travel & fuel",
        amount: total,
        description: `Trip to ${to}${str(t.vehicle) ? ` — ${str(t.vehicle)}` : ""}${num(t.distanceKm) ? ` (${formatNumber(num(t.distanceKm))} km)` : ""}`,
        vendor: str(t.driver) || undefined,
        workshopId: str(t.workshopId) || undefined,
        paidBy: "Company account",
        notes: `Logged from Travel & Transport — trip ${t.id}.`,
      });
      await saveTrip({ ...t, expenseId: exp.id });
      setNotice({ tone: "ok", text: `Logged ${formatINR(total)} as a “Travel & fuel” expense for the trip to ${to}.` });
    } catch (e) {
      setNotice({ tone: "bad", text: e instanceof Error ? e.message : "Could not log the expense" });
    } finally {
      setBusyId("");
    }
  }

  const plan = PLAN_TRAVEL + PLAN_FOOD + PLAN_STAY;

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Travel & Transport"
        icon="Truck"
        description="Every trip to a school — vehicle, distance and cost — with an estimator to plan before you book."
      />

      {error && (
        <p role="alert" className="mb-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}

      {!today || loading ? (
        <Loading label="Loading trips…" />
      ) : (
        <div className="space-y-8">
          {stats && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Trips this month" value={stats.count} sub="Planned and done, not cancelled" />
              <StatCard label="Distance this month" value={`${formatNumber(Math.round(stats.km))} km`} sub="Round-trip totals" />
              <StatCard label="Spend this month" value={formatINR(stats.spend)} sub="Fuel, rent, tolls, stay, food" tone="dark" />
              <StatCard
                label="Avg cost per workshop"
                value={stats.avgPerWorkshop === null ? "—" : formatINR(Math.round(stats.avgPerWorkshop))}
                sub={stats.workshops ? `Across ${stats.workshops} workshop${stats.workshops === 1 ? "" : "s"} · plan ${formatINR(plan)}` : `Link trips to workshops · plan ${formatINR(plan)}`}
              />
            </div>
          )}

          <TripEstimator workshops={workshops} schools={schools} canWrite={canWrite} />

          <section aria-labelledby="trips-h">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-graphite/40" aria-hidden />
              <h2 id="trips-h" className="annot text-blueprint">
                All trips
              </h2>
            </div>
            {notice && (
              <Notice tone={notice.tone} className="mb-4">
                {notice.text}
              </Notice>
            )}
            <CollectionManager<Rec>
              name="trips"
              columns={["date", "status", "to", "distanceKm", "vehicle"]}
              extraColumns={EXTRA_COLUMNS}
              newLabel="New trip"
              emptyText="No trips yet. Plan one from a workshop, or use the estimator above and save it as a trip."
              rowActions={(t) =>
                t.expenseId ? (
                  <Badge tone="ok">
                    <CheckCircle2 className="size-3" aria-hidden /> Logged
                  </Badge>
                ) : canWrite ? (
                  <button
                    type="button"
                    onClick={() => logExpense(t)}
                    disabled={busyId === t.id || str(t.status) === "cancelled"}
                    className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-graphite/25 px-2.5 text-xs font-semibold hover:border-graphite hover:bg-graphite hover:text-paper disabled:pointer-events-none disabled:opacity-40"
                    title="Create a “Travel & fuel” expense for this trip"
                  >
                    {busyId === t.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ReceiptText className="size-3.5" aria-hidden />} Log as expense
                  </button>
                ) : null
              }
            />
          </section>
        </div>
      )}
    </div>
  );
}
