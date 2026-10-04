import type { Metadata } from "next";
import { SectionLabel } from "@/components/brand/Blueprint";
import { CTASection } from "@/components/site/CTASection";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { CartToast } from "@/components/site/shop/CartToast";
import { LabPairings } from "@/components/site/shop/LabPairings";
import { SchoolsBulk } from "@/components/site/shop/SchoolsBulk";
import { ShopCatalog } from "@/components/site/shop/ShopCatalog";
import { ShopFaq, shopFaqs } from "@/components/site/shop/ShopFaq";
import { ShopHero } from "@/components/site/shop/ShopHero";
import { TrustStrip } from "@/components/site/shop/TrustStrip";
import { toShopProduct } from "@/components/site/shop/catalog";
import { JsonLd } from "@/components/site/shop/JsonLd";
import { getPublicProducts } from "@/lib/public-data";
import { FREE_SHIPPING_ABOVE } from "@/lib/shop";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Robotics & AI Kits — Shop",
  description: `Robotics and AI kits for Grades 1–10, designed by the JOVE team. Every kit pairs with a free Virtual Lab. Prices include GST · free shipping above ${formatINR(FREE_SHIPPING_ABOVE)}.`,
  alternates: { canonical: "/shop" },
  openGraph: {
    title: `Robotics & AI Kits | ${site.name}`,
    description: "Kits for Grades 1–10, designed by the JOVE team — each paired with a free online Virtual Lab.",
    images: ["/images/kits/kit-knolling.webp"],
  },
};

export default async function ShopPage() {
  const products = (await getPublicProducts()).map(toShopProduct);
  const prices = products.map((p) => p.price).filter((n) => n > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const labCount = new Set(products.flatMap((p) => p.labSlugs)).size;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: shopFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <ShopHero kitCount={products.length} minPrice={minPrice} maxPrice={maxPrice} labCount={labCount} />

      <section id="kits" className="relative scroll-mt-24 pb-20 pt-6 sm:pb-28" aria-labelledby="kits-title">
        <div className="container-bp">
          <div className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionLabel index="01">The kits</SectionLabel>
              </Reveal>
              <h2 id="kits-title" className="mt-6 text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[0.98] tracking-[-0.03em] text-graphite">
                <RevealLines lines={["Pick a grade.", "Build something real."]} />
              </h2>
            </div>
            <Reveal delay={0.15} className="lg:col-span-5">
              <p className="leading-relaxed text-charcoal">
                A kit for every JOVE grade band — from a glowing cardboard robot for six-year-olds to an ESP32 camera robot that learns to see. Prices include GST.
              </p>
            </Reveal>
          </div>

          {products.length ? (
            <ShopCatalog products={products} />
          ) : (
            <p className="rounded-[var(--radius-md)] border border-dashed border-graphite/25 p-10 text-center text-charcoal">The store is being restocked — please check back shortly.</p>
          )}

          <TrustStrip className="mt-16 sm:mt-20" />
        </div>
      </section>

      <LabPairings products={products} />
      <SchoolsBulk index="03" />
      <ShopFaq index="04" />

      <CTASection
        eyebrow="Try before you buy"
        title={["Not sure yet?", "Start with a free lab."]}
        body="Every JOVE Virtual Lab is free — theory, demo, a hands-on simulation and a challenge. Fifteen minutes in, you'll know exactly which kit to pick."
        primary={{ label: "Explore Virtual Labs", href: "/labs" }}
        secondary={{ label: "Bring JOVE to your school", href: "/contact" }}
      />
      <CartToast />
    </>
  );
}
