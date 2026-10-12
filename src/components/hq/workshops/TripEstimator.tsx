"use client";

import { useId, useMemo, useState } from "react";
import { Calculator, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { formatINR, formatNumber } from "@/lib/utils";
import { useBook, useCollection, useSettings } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Notice, PricesLink } from "./bits";
import { isIso, list, num, planCosts, str, TEAM_SIZE, VEHICLE_PRESETS, type Rec } from "./logic";

const toNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
/** an amount in the estimate: a dash while it is nothing */
const amount = (v: number) => (v > 0 ? formatINR(v) : "—");

export function TripEstimator({ workshops, schools, canWrite }: { workshops: Rec[]; schools: Map<string, Rec>; canWrite: boolean }) {
  const uid = useId();
  const { settings } = useSettings();
  const { save } = useCollection("trips");
  // What the JOVE Day plan allows for travel, food and stay is in the price book. A trainer has no price book:
  // the estimator works the same, without the comparison with the plan.
  const book = useBook();
  const costs = useMemo(() => planCosts(book), [book]);

  const [km, setKm] = useState("120");
  const [vehicle, setVehicle] = useState(VEHICLE_PRESETS[0].value);
  const [rateOverride, setRateOverride] = useState<string | null>(null);
  const [toll, setToll] = useState("0");
  const [nights, setNights] = useState("0");
  const [stayRate, setStayRate] = useState("3000");
  const [people, setPeople] = useState(String(TEAM_SIZE));
  const [food, setFood] = useState(() => (costs.foodPerPersonDay > 0 ? String(costs.foodPerPersonDay) : ""));

  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const preset = VEHICLE_PRESETS.find((p) => p.value === vehicle) ?? VEHICLE_PRESETS[0];
  const presetRate = preset.ratePerKm ?? num(settings.fuelCostPerKm);
  const rate = rateOverride !== null ? toNum(rateOverride) : presetRate;

  const calc = useMemo(() => {
    const distance = toNum(km);
    const vehicleCost = Math.round(distance * rate);
    const tolls = Math.round(toNum(toll));
    const stay = Math.round(toNum(nights) * toNum(stayRate));
    const foodTotal = Math.round(toNum(people) * toNum(food));
    const total = vehicleCost + tolls + stay + foodTotal;
    return { distance, vehicleCost, tolls, stay, foodTotal, total, perKm: distance ? total / distance : 0 };
  }, [km, rate, toll, nights, stayRate, people, food]);

  /** 0 = no plan to compare with (no price book for this login, or those cost lines are not filled in yet) */
  const plan = costs.trip;
  const delta = calc.total - plan;

  const upcoming = useMemo(() => [...workshops].filter((w) => str(w.status) !== "cancelled").sort((a, b) => str(b.date).localeCompare(str(a.date))), [workshops]);

  function pickWorkshop(id: string) {
    setWorkshopId(id);
    const w = workshops.find((x) => x.id === id);
    if (!w) return;
    if (!date && isIso(w.date)) setDate(str(w.date).slice(0, 10));
    if (!to) setTo(str(schools.get(str(w.schoolId))?.name) || str(w.title));
  }

  async function saveTrip() {
    if (!isIso(date) || !to.trim()) {
      setError("Add the date and destination.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const w = workshops.find((x) => x.id === workshopId);
      await save({
        workshopId: workshopId || undefined,
        date,
        status: "planned",
        from: settings.baseLocation || "Base",
        to: to.trim(),
        distanceKm: calc.distance,
        vehicle: preset.value,
        team: list(w?.team),
        fuelCost: preset.line === "fuelCost" ? calc.vehicleCost : 0,
        vehicleRent: preset.line === "vehicleRent" ? calc.vehicleCost : 0,
        tollParking: calc.tolls,
        accommodation: calc.stay,
        food: calc.foodTotal,
        notes: `Saved from the trip cost estimator: ${formatNumber(calc.distance)} km at ${formatINR(rate)} per km (${preset.label}), ${toNum(nights)} night(s) stay, ${toNum(people)} people.`,
      });
      setOpen(false);
      setSaved(`Trip to ${to.trim()} saved — ${formatINR(calc.total)} estimated.`);
      setDate("");
      setTo("");
      setWorkshopId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the trip");
    } finally {
      setSaving(false);
    }
  }

  const f = (name: string) => `${uid}-${name}`;

  return (
    <Panel title="Trip cost estimator" subtitle="Plan the cost before you commit — rates are typical figures; replace them with your actual quote" bodyClassName="p-0">
      <div className="grid lg:grid-cols-[1fr_21rem]">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Round-trip distance (km)" htmlFor={f("km")}>
            <Input id={f("km")} type="number" inputMode="decimal" min={0} value={km} onChange={(e) => setKm(e.target.value)} />
          </Field>
          <Field label="Vehicle" htmlFor={f("vehicle")} help={preset.note}>
            <Select
              id={f("vehicle")}
              value={vehicle}
              onChange={(e) => {
                setVehicle(e.target.value);
                setRateOverride(null);
              }}
            >
              {VEHICLE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rate (₹ per km)" htmlFor={f("rate")} help={preset.ratePerKm !== null ? "Preset — edit to match your quote" : presetRate > 0 ? "From Settings → fuel cost per km" : "Type what the fuel costs per km"}>
            <Input id={f("rate")} type="number" inputMode="decimal" min={0} step="0.5" value={rateOverride ?? String(presetRate)} onChange={(e) => setRateOverride(e.target.value)} />
          </Field>
          <Field label="Tolls & parking (₹)" htmlFor={f("toll")}>
            <Input id={f("toll")} type="number" inputMode="decimal" min={0} value={toll} onChange={(e) => setToll(e.target.value)} />
          </Field>
          <Field label="Stay (nights)" htmlFor={f("nights")} help="0 for same-day trips">
            <Input id={f("nights")} type="number" inputMode="numeric" min={0} value={nights} onChange={(e) => setNights(e.target.value)} />
          </Field>
          <Field label="Stay cost per night (₹, whole team)" htmlFor={f("stay")} help="Editable estimate — use the actual booking">
            <Input id={f("stay")} type="number" inputMode="decimal" min={0} value={stayRate} onChange={(e) => setStayRate(e.target.value)} />
          </Field>
          <Field label="People travelling" htmlFor={f("people")} help={`JOVE Day plan: ${TEAM_SIZE} people`}>
            <Input id={f("people")} type="number" inputMode="numeric" min={0} value={people} onChange={(e) => setPeople(e.target.value)} />
          </Field>
          <Field label="Food per person (₹)" htmlFor={f("food")} help={costs.foodPerPersonDay > 0 ? `Cost plan: ${formatINR(costs.foodPerPersonDay)} a day` : "What one person spends on food in a day"}>
            <Input id={f("food")} type="number" inputMode="decimal" min={0} placeholder="0" value={food} onChange={(e) => setFood(e.target.value)} />
          </Field>
        </div>

        <aside className="relative overflow-hidden border-t border-graphite bg-graphite p-5 text-paper lg:border-l lg:border-t-0" aria-label="Estimate">
          <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="relative">
            <p className="annot flex items-center gap-2 text-paper/55">
              <Calculator className="size-3.5" aria-hidden /> Estimated trip cost
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                // a rate or a cost that has not been typed shows a dash: not a trip that costs nothing
                rate > 0 ? [`${preset.label} · ${formatNumber(calc.distance)} km × ${formatINR(rate)}`, amount(calc.vehicleCost)] : [`${preset.label} · rate per km not typed yet`, "—"],
                ["Tolls & parking", amount(calc.tolls)],
                [`Stay · ${toNum(nights)} night${toNum(nights) === 1 ? "" : "s"}`, amount(calc.stay)],
                toNum(food) > 0 ? [`Food · ${toNum(people)} × ${formatINR(toNum(food))}`, amount(calc.foodTotal)] : ["Food · cost per person not typed yet", "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dashed border-paper/15 pb-2">
                  <dt className="text-paper/70">{k}</dt>
                  <dd className="tabular font-mono">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="tabular mt-4 font-mono text-3xl font-bold tracking-tight">{amount(calc.total)}</p>
            <p className="mt-1 text-xs text-paper/60">{calc.perKm ? `${formatINR(calc.perKm)} per km all-in` : calc.distance ? "Type the costs to see the total" : "Enter a distance to see the cost per km"}</p>
            {plan > 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-paper/60">
                The JOVE Day cost plan allows {formatINR(plan)} for travel, food and stay.{" "}
                {calc.total > 0 && <span className="text-paper">{delta > 0 ? `This trip is ${formatINR(delta)} over plan.` : delta < 0 ? `This trip is ${formatINR(-delta)} under plan.` : "Exactly on plan."}</span>}
              </p>
            ) : (
              book && (
                <p className="mt-3 text-xs leading-relaxed text-paper/60">
                  To compare a trip with the plan, add the travel, food and stay cost lines of a JOVE Day in <PricesLink className="text-paper" />.
                </p>
              )
            )}
            {canWrite && (
              <Button variant="light" size="md" className="mt-5 w-full" disabled={!calc.total} onClick={() => { setError(""); setOpen(true); }}>
                <Save className="size-4" aria-hidden /> Save as trip
              </Button>
            )}
          </div>
        </aside>
      </div>
      {saved && (
        <div className="border-t border-graphite/10 p-4">
          <Notice tone="ok">{saved}</Notice>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Save as trip"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveTrip} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} Save trip
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal">
            {preset.label} · {formatNumber(calc.distance)} km · <span className="tabular font-mono font-semibold">{formatINR(calc.total)}</span>
          </p>
          <Field label="Workshop (optional)" htmlFor={f("m-workshop")} help="Links the trip so costs roll into that workshop. Fills the date and destination.">
            <Select id={f("m-workshop")} value={workshopId} onChange={(e) => pickWorkshop(e.target.value)}>
              <option value="">Not linked to a workshop</option>
              {upcoming.map((w) => (
                <option key={w.id} value={w.id}>
                  {str(w.date) || "No date"} — {str(w.title)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trip date" htmlFor={f("m-date")} required>
            <Input id={f("m-date")} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Destination" htmlFor={f("m-to")} required>
            <Input id={f("m-to")} value={to} onChange={(e) => setTo(e.target.value)} placeholder="School or city" />
          </Field>
          {error && <Notice tone="bad">{error}</Notice>}
        </div>
      </Modal>
    </Panel>
  );
}
