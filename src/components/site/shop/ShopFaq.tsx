import Link from "next/link";
import { Plus } from "lucide-react";
import { SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { kits } from "@/lib/content/business";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT } from "@/lib/shop";
import { formatINR } from "@/lib/utils";
import { BULK_DISCOUNT_PCT, BULK_MIN_KITS } from "./catalog";

/** Plain-text Q&A (also used for the FAQPage JSON-LD on /shop). */
export const shopFaqs: { q: string; a: string }[] = [
  {
    q: "How much is shipping?",
    a: `A flat ${formatINR(SHIPPING_FLAT)} on orders below ${formatINR(FREE_SHIPPING_ABOVE)}. Orders of ${formatINR(FREE_SHIPPING_ABOVE)} or more ship free.`,
  },
  {
    q: "When will my order ship?",
    a: "Kits in stock are dispatched within 2–4 working days of confirming your order and payment; kits marked “Made to order” are assembled for you and dispatched within 5–7 working days. We share the tracking details either way. Delivery time after dispatch depends on your PIN code.",
  },
  {
    q: "How do I pay?",
    a: "Place your order here — no card details needed. We'll call or WhatsApp you within 24 hours to confirm it and share a secure UPI / payment link. If a kit has an online payment link, you'll also see a 'Pay now' button right after ordering.",
  },
  {
    q: "What if something arrives damaged or doesn't work?",
    a: "Tell us within 7 days of delivery — a photo or short video helps — and we'll replace the defective item. Please keep the original box and parts until it's sorted.",
  },
  {
    q: "Are the prices inclusive of GST?",
    a: "Yes. Every price on this store includes GST. Your total is simply the kits plus shipping (if any) — nothing is added at the end.",
  },
  {
    q: "Which kit is right for my child?",
    a: `Start with their grade: ${kits.map((k) => `${k.name.replace(/^JOVE\s+/, "")} (${k.grades.split("·")[0].trim()})`).join(", ")}. Not sure? Try the free Virtual Lab paired with the kit first — if they enjoy it, they're ready for the build.`,
  },
  {
    q: "Do you offer school or bulk pricing?",
    a: `Yes — ${BULK_DISCOUNT_PCT}% off MRP for orders of ${BULK_MIN_KITS} or more kits. Ask us for a school quote and we'll confirm it in writing.`,
  },
];

/** Shipping, payment & returns FAQ as an accessible native accordion. */
export function ShopFaq({ index = "04" }: { index?: string }) {
  return (
    <section className="relative border-t border-graphite/10 py-24 sm:py-32" aria-labelledby="shop-faq-title">
      <div className="container-bp grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <SectionLabel index={index}>Shipping &amp; returns</SectionLabel>
            </Reveal>
            <h2 id="shop-faq-title" className="mt-6 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">
              <RevealLines lines={["Good to know", "before you order."]} />
            </h2>
            <Reveal delay={0.15}>
              <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-graphite/15 text-center">
                {[
                  ["Shipping", `${formatINR(SHIPPING_FLAT)}`, `Free ≥ ${formatINR(FREE_SHIPPING_ABOVE)}`],
                  ["Dispatch", "2–4", "working days"],
                  ["Replacement", "7-day", "if defective"],
                ].map(([k, v, s]) => (
                  <div key={k} className="bg-paper-50 px-2 py-4">
                    <dt className="annot text-blueprint">{k}</dt>
                    <dd className="mt-1.5 font-mono text-lg font-bold text-graphite">{v}</dd>
                    <dd className="text-[11px] text-charcoal">{s}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm leading-relaxed text-charcoal">
                Full details in our{" "}
                <Link href="/shipping-policy" className="font-semibold underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
                  Shipping Policy
                </Link>{" "}
                and{" "}
                <Link href="/refund-policy" className="font-semibold underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
                  Refund &amp; Cancellation Policy
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-8">
          <ul className="border-t border-graphite/20">
            {shopFaqs.map((f, i) => (
              <Reveal as="li" key={f.q} delay={i * 0.04} className="border-b border-graphite/20">
                <details className="group" name="shop-faq">
                  <summary className="flex cursor-pointer list-none items-start gap-4 py-6 text-left outline-none transition-colors hover:text-ink focus-visible:bg-graphite/[0.04] [&::-webkit-details-marker]:hidden">
                    <span className="mt-1 font-mono text-xs tracking-widest text-blueprint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-lg font-semibold tracking-[-0.01em] text-graphite sm:text-xl">{f.q}</span>
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-graphite/25 transition-all duration-300 group-open:rotate-45 group-open:bg-graphite group-open:text-paper" aria-hidden>
                      <Plus className="size-4" />
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-7 pl-9 pr-12 leading-relaxed text-charcoal">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
