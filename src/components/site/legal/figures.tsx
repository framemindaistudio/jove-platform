import { CalendarCheck, CircleCheck, MapPin, Package, Truck } from "lucide-react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT } from "@/lib/shop";
import { formatINR } from "@/lib/utils";

/** Cancellation timeline for /refund-policy: three windows leading up to the workshop day. */
export function RefundTimeline() {
  const windows = [
    {
      tag: "More than 7 days before",
      fill: "bg-graphite/[0.04]",
      title: "Reschedule free",
      sub: "Cancel for a full refund of the advance",
    },
    {
      tag: "7 days to 48 hours before",
      fill: "hatch",
      title: "Advance minus 25%",
      sub: "25% of the advance is retained if you cancel",
    },
    {
      tag: "Within 48 hours",
      fill: "hatch-dense",
      title: "Advance non-refundable",
      sub: "Except in a force majeure event",
    },
  ];

  return (
    <figure aria-label="Workshop cancellation timeline" className="relative rounded-[var(--radius-md)] border border-graphite/20 bg-paper-50 p-5 shadow-[var(--shadow-paper)] sm:p-7">
      <CornerMarks />
      <figcaption className="annot flex items-center gap-2 text-blueprint">
        <CalendarCheck className="size-4" aria-hidden /> Cancellation timeline — counted back from your JOVE Day
      </figcaption>
      <ol className="mt-6 grid gap-5 md:grid-cols-3 md:gap-0">
        {windows.map((w, i) => (
          <li key={w.tag} className="relative md:px-5 md:first:pl-0 md:last:pr-0">
            {i > 0 && <span aria-hidden className="absolute -left-px top-0 hidden h-full border-l border-dashed border-graphite/25 md:block" />}
            <div aria-hidden className={`h-3 rounded-[2px] border border-graphite/30 ${w.fill}`} />
            <p className="annot mt-3 text-blueprint">{w.tag}</p>
            <p className="mt-1.5 text-xl font-bold leading-tight tracking-[-0.02em] text-graphite">{w.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{w.sub}</p>
          </li>
        ))}
      </ol>
      <div aria-hidden className="mt-6 hidden items-end justify-between border-t border-graphite/30 pt-1.5 font-mono text-[11px] tracking-wider text-blueprint md:flex">
        <span>T − ∞</span>
        <span>T − 7 days</span>
        <span>T − 48 hrs</span>
        <span className="font-semibold text-graphite">JOVE Day</span>
      </div>
    </figure>
  );
}

/** Order-to-doorstep strip for /shipping-policy, plus the shipping-fee rule. */
export function ShippingJourney() {
  const steps = [
    { icon: CircleCheck, tag: "Day 0", title: "Order confirmed", sub: "You get an order number by SMS / email" },
    { icon: Package, tag: "2–4 working days", title: "Packed & dispatched", sub: "Tracking link sent to you" },
    { icon: Truck, tag: "In transit", title: "With our courier partner", sub: "Live status via SMS / WhatsApp" },
    { icon: MapPin, tag: "4–8 working days", title: "Delivered", sub: "Total time from order confirmation" },
  ];

  return (
    <figure aria-label="Order to delivery journey" className="relative rounded-[var(--radius-md)] border border-graphite/20 bg-paper-50 p-5 shadow-[var(--shadow-paper)] sm:p-7">
      <CornerMarks />
      <figcaption className="annot flex flex-wrap items-center justify-between gap-2 text-blueprint">
        <span className="flex items-center gap-2">
          <Truck className="size-4" aria-hidden /> Order to doorstep
        </span>
        <span className="font-mono tracking-widest text-graphite">
          {formatINR(SHIPPING_FLAT)} below {formatINR(FREE_SHIPPING_ABOVE)} · FREE above
        </span>
      </figcaption>
      <ol className="relative mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <span aria-hidden className="absolute left-0 right-0 top-[22px] hidden border-t border-dashed border-graphite/30 lg:block" />
        {steps.map((s) => (
          <li key={s.title} className="relative">
            <span className="relative z-10 grid size-11 place-items-center rounded-full border border-graphite/40 bg-paper-50 text-graphite shadow-[var(--shadow-paper)]">
              <s.icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="annot mt-4 text-blueprint">{s.tag}</p>
            <p className="mt-1 text-[17px] font-bold leading-tight tracking-[-0.01em] text-graphite">{s.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal">{s.sub}</p>
          </li>
        ))}
      </ol>
    </figure>
  );
}
