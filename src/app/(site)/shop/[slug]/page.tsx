import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, FlaskConical, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { CornerMarks, Crosshair, DimensionLine, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { CTASection } from "@/components/site/CTASection";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { CartToast } from "@/components/site/shop/CartToast";
import { JsonLd } from "@/components/site/shop/JsonLd";
import { Price } from "@/components/site/shop/Price";
import { ProductCard } from "@/components/site/shop/ProductCard";
import { ProductGallery, type GalleryImage } from "@/components/site/shop/ProductGallery";
import { PurchasePanel } from "@/components/site/shop/PurchasePanel";
import { TrustStrip } from "@/components/site/shop/TrustStrip";
import { BULK_DISCOUNT_PCT, BULK_MIN_KITS, bandForKit, kitById, labsFor, splitGrades, toList, toNumber, toShopProduct } from "@/components/site/shop/catalog";
import { gradeBands, type GradeBandId } from "@/lib/content/business";
import { getPublicProducts } from "@/lib/public-data";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT, dispatchWindow, isMadeToOrder } from "@/lib/shop";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

/** Alt text for the grade-band sketches in /images/age (illustrative, not a JOVE event). */
const AGE_SKETCH_ALT: Record<GradeBandId, string> = {
  "g1-2": "Pencil sketch of a friendly little wheeled robot on warm paper",
  "g3-5": "Exploded-view pencil sketch of a light-seeking robot car with its sensors, motors and wheels",
  "g6-8": "Pencil sketch of an Arduino-powered obstacle-avoiding robot car with an ultrasonic sensor",
  "g9-10": "Pencil sketch of an AI vision pan-tilt robot beside a neural-network diagram",
};

async function load(slug: string) {
  const all = await getPublicProducts();
  const index = all.findIndex((p) => p.slug === slug);
  if (index < 0) return null;
  return { all, index, raw: all[index] };
}

export async function generateStaticParams() {
  const products = await getPublicProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) return { title: "Kit not found", robots: { index: false } };
  const p = toShopProduct(found.raw);
  const [gradeLine] = splitGrades(p.grades);
  const description = `${p.short ? `${p.short}. ` : ""}${gradeLine ? `For ${gradeLine}. ` : ""}${formatINR(p.price)} incl. GST · pairs with a free JOVE Virtual Lab.`;
  return {
    title: `${p.name}${gradeLine ? ` — ${gradeLine}` : ""}`,
    description,
    alternates: { canonical: `/shop/${p.slug}` },
    openGraph: { title: `${p.name} | ${site.name}`, description, images: p.image ? [p.image] : ["/images/kits/kit-knolling.webp"] },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) notFound();

  const { all, index, raw } = found;
  const product = toShopProduct(raw);
  const kit = kitById(product.kitId);
  const band = bandForKit(product.kitId) ?? gradeBands.find((b) => b.id === product.bands[0]);
  const [gradeLine, ageLine] = splitGrades(product.grades);
  const description = raw.description || kit?.description;
  const highlights = toList(raw.highlights).length ? toList(raw.highlights) : (kit?.highlights ?? []);
  const inTheBox = toList(raw.inTheBox).length ? toList(raw.inTheBox) : (kit?.inTheBox ?? []);
  const weight = toNumber(raw.weightGrams) ?? kit?.weightGrams;
  const pairedLabs = labsFor(product.kitId);
  const project = kit?.project;

  const related = all
    .map((p, i) => ({ p: toShopProduct(p), d: Math.abs(i - index) }))
    .filter(({ p }) => p.slug !== product.slug)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(({ p }) => p);

  const gallery: GalleryImage[] = [
    { src: product.image, alt: `${product.name} — the kit box`, caption: `${product.name} — the box`, kind: "photo", fit: "cover" },
    {
      src: "/images/kits/kit-knolling.webp",
      alt: "Pencil sketch of robotics kit components laid out in a neat grid — boards, motors, wheels, sensors, wires and tools",
      caption: "Components, laid out · illustrative sketch — see “In the box” for this kit",
      kind: "sketch",
      fit: "contain",
    },
  ];
  if (band) {
    gallery.push({ src: band.image, alt: AGE_SKETCH_ALT[band.id], caption: `${band.grades} · ${band.name} — illustrative sketch`, kind: "sketch", fit: "cover" });
  }

  const url = `${site.url.replace(/\/$/, "")}/shop/${product.slug}`;
  const abs = (src?: string) => (src && src.startsWith("/") ? `${site.url.replace(/\/$/, "")}${src}` : src);

  const spec: [string, string][] = [
    ...(kit ? ([["SKU", kit.sku]] as [string, string][]) : []),
    ...(gradeLine ? ([["Grades", gradeLine]] as [string, string][]) : []),
    ...(ageLine ? ([["Ages", ageLine.replace(/^Ages\s*/i, "")]] as [string, string][]) : []),
    ...(band ? ([["Programme", `${band.name} · ${band.theme}`]] as [string, string][]) : []),
    ...(weight ? ([["Shipping weight", `≈ ${weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight} g`}`]] as [string, string][]) : []),
    ...(pairedLabs.length ? ([["Free online lab", pairedLabs.map((l) => l.title).join(" · ")]] as [string, string][]) : []),
    ["Price", `${formatINR(product.price)} incl. GST`],
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: description || product.short || product.name,
          sku: kit?.sku ?? product.id,
          image: [abs(product.image), abs("/images/kits/kit-knolling.webp")].filter(Boolean),
          brand: { "@type": "Brand", name: site.name },
          category: "Educational robotics kit",
          ...(weight ? { weight: { "@type": "QuantitativeValue", value: weight, unitCode: "GRM" } } : {}),
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "INR",
            price: product.price.toFixed(2),
            availability: !product.available ? "https://schema.org/OutOfStock" : isMadeToOrder(product.stock) ? "https://schema.org/MadeToOrder" : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: site.name },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
              shippingRate: { "@type": "MonetaryAmount", value: product.price >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FLAT, currency: "INR" },
            },
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Shop", item: `${site.url.replace(/\/$/, "")}/shop` },
            { "@type": "ListItem", position: 2, name: product.name, item: url },
          ],
        }}
      />

      {/* ─── Product ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-32">
        <GridBackdrop />
        <Crosshair className="absolute right-[4%] top-32 hidden lg:block" />
        <div className="container-bp relative">
          <nav aria-label="Breadcrumb">
            <ol className="annot flex flex-wrap items-center gap-1.5 text-blueprint">
              <li>
                <Link href="/shop" className="inline-flex items-center gap-1.5 transition-colors hover:text-graphite">
                  <ArrowLeft className="size-3.5" aria-hidden /> Kit store
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3" />
              </li>
              <li aria-current="page" className="text-graphite">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-7" y={32}>
              <ProductGallery images={gallery} name={product.name} outOfStock={!product.available} tag={gradeLine ? gradeLine.replace(/^Grades\s*/i, "Gr ") : undefined} />
            </Reveal>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <Reveal>
                  <SectionLabel index={String(index + 1).padStart(2, "0")}>{band ? band.name : product.category}</SectionLabel>
                </Reveal>
                <h1 className="mt-5 text-[clamp(2.3rem,4.6vw,3.9rem)] font-bold leading-[0.98] tracking-[-0.03em] text-graphite">
                  <RevealLines lines={[product.name]} />
                </h1>
                <Reveal delay={0.1}>
                  {(gradeLine || ageLine) && (
                    <p className="mt-3 text-base font-medium text-charcoal">
                      {gradeLine}
                      {ageLine && <span className="text-blueprint"> · {ageLine}</span>}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-dashed border-graphite/20 py-5">
                    <Price price={product.price} compareAt={product.compareAt} size="lg" />
                    <span className="annot pb-1 text-blueprint">Incl. GST · {product.price >= FREE_SHIPPING_ABOVE ? "free shipping" : `+ ${formatINR(SHIPPING_FLAT)} shipping below ${formatINR(FREE_SHIPPING_ABOVE)}`}</span>
                  </div>
                  {product.short && <p className="mt-6 text-lg font-semibold leading-snug tracking-[-0.01em] text-graphite">{product.short}</p>}
                  {description && <p className="mt-3 leading-relaxed text-charcoal">{description}</p>}
                </Reveal>

                <Reveal delay={0.18} className="mt-7">
                  <PurchasePanel product={product} />
                </Reveal>

                <Reveal delay={0.24}>
                  <ul className="mt-6 grid gap-3 text-sm text-charcoal sm:grid-cols-2">
                    {[
                      { icon: Truck, text: `${formatINR(SHIPPING_FLAT)} shipping · free above ${formatINR(FREE_SHIPPING_ABOVE)}` },
                      { icon: PackageCheck, text: `${isMadeToOrder(product.stock) ? "Made to order · dispatched" : "Dispatched"} in ${dispatchWindow(product.stock)}` },
                      { icon: RotateCcw, text: "7-day replacement if defective" },
                      { icon: FlaskConical, text: pairedLabs.length ? `Free online lab: ${pairedLabs[0].title}` : "Free JOVE Virtual Labs online" },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-2.5">
                        <Icon className="mt-0.5 size-4 shrink-0 text-blueprint" strokeWidth={1.7} aria-hidden />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Overview + In the box ───────────────────────────────── */}
      {(highlights.length > 0 || inTheBox.length > 0) && (
        <section className="relative border-t border-graphite/10 bg-paper-100 py-24 sm:py-28" aria-labelledby="overview-title">
          <div className="paper-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="container-bp relative grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Reveal>
                <SectionLabel index="01">Overview</SectionLabel>
              </Reveal>
              <h2 id="overview-title" className="mt-6 text-[clamp(2rem,4vw,3.3rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">
                <RevealLines lines={["Designed to teach.", "Built to be built."]} />
              </h2>
              {highlights.length > 0 && (
                <ol className="mt-10 border-t border-graphite/20">
                  {highlights.map((h, i) => (
                    <Reveal as="li" key={h} delay={i * 0.05} className="flex items-baseline gap-5 border-b border-graphite/20 py-4">
                      <span className="font-mono text-xs tracking-widest text-blueprint">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-lg font-semibold tracking-[-0.01em] text-graphite">{h}</span>
                    </Reveal>
                  ))}
                </ol>
              )}

              <Reveal delay={0.1}>
                <dl className="mt-10 overflow-hidden rounded-[var(--radius-md)] border border-graphite/20 bg-paper-50">
                  <div className="annot flex items-center justify-between border-b border-graphite/20 bg-graphite px-4 py-2.5 text-paper/75">
                    <span>Specification</span>
                    <span className="font-mono">{kit?.sku ?? product.id}</span>
                  </div>
                  {spec.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[120px_1fr] gap-3 border-b border-graphite/10 px-4 py-3 last:border-b-0 sm:grid-cols-[150px_1fr]">
                      <dt className="annot pt-0.5 text-blueprint">{k}</dt>
                      <dd className="text-sm font-semibold text-graphite">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            {inTheBox.length > 0 && (
              <Reveal delay={0.1} className="lg:col-span-6">
                <div className="relative rounded-[var(--radius-lg)] border border-graphite/20 bg-paper shadow-[var(--shadow-lift)]">
                  <CornerMarks inset={-6} size={12} />
                  <div className="bp-grid-fine pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] opacity-50" aria-hidden />
                  <div className="relative p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <SectionLabel index="02">In the box</SectionLabel>
                        <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em] text-graphite">Everything you need to build.</h3>
                      </div>
                      <span className="annot shrink-0 rounded-full border border-graphite/25 px-2.5 py-1 font-mono text-charcoal">{String(inTheBox.length).padStart(2, "0")} items</span>
                    </div>
                    <ul className="mt-7 grid gap-x-6 sm:grid-cols-2" aria-label={`Contents of the ${product.name}`}>
                      {inTheBox.map((item, i) => (
                        <li key={item} className="flex items-start gap-3 border-t border-dashed border-graphite/20 py-3.5">
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[var(--radius-xs)] border border-graphite bg-graphite text-paper" aria-hidden>
                            <Check className="size-3.5" strokeWidth={2.5} />
                          </span>
                          <span className="text-sm leading-snug text-graphite">
                            <span className="sr-only">Item {i + 1}: </span>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="annot mt-6 border-t border-graphite/20 pt-4 text-blueprint">Contents as listed for the current batch · Questions? We’re a message away</p>
                  </div>
                  <div className="hatch h-3 rounded-b-[var(--radius-lg)] border-t border-graphite/20" aria-hidden />
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ─── What you'll build ──────────────────────────────────── */}
      {project && band && (
        <section className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32" aria-labelledby="build-title">
          <div className="bp-grid-dark absolute inset-0 opacity-90" aria-hidden />
          <div className="paper-grain absolute inset-0 opacity-20 mix-blend-overlay" aria-hidden />
          <div className="container-bp relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6" y={36}>
              <div className="relative rounded-[var(--radius-lg)] bg-paper p-2 shadow-[0_30px_80px_rgb(0_0_0/0.35)]">
                <CornerMarks inset={-10} size={14} className="text-paper/40" />
                <div className="relative aspect-[1600/1195] overflow-hidden rounded-[var(--radius-md)]">
                  <Image src={band.image} alt={AGE_SKETCH_ALT[band.id]} fill sizes="(max-width: 1024px) 100vw, 45vw" quality={85} className="object-cover mix-blend-multiply" />
                </div>
              </div>
              <p className="annot mt-4 text-paper/45">Illustrative sketch · {band.grades} build family</p>
            </Reveal>

            <div className="lg:col-span-6">
              <Reveal>
                <SectionLabel index="03" light>
                  What you&rsquo;ll build
                </SectionLabel>
              </Reveal>
              <h2 id="build-title" className="mt-6 text-[clamp(2.1rem,4.4vw,3.8rem)] font-bold leading-[1] tracking-[-0.03em]">
                <RevealLines lines={[project]} />
              </h2>
              <Reveal delay={0.12}>
                <p className="mt-6 max-w-xl leading-relaxed text-paper/70">
                  The same idea JOVE trainers teach in the <strong className="font-semibold text-paper">{band.name}</strong> workshop for {band.grades} — &ldquo;{band.theme}&rdquo; — boxed so it can be built, broken and rebuilt at home.
                </p>
              </Reveal>
              {band.skills.length > 0 && (
                <Reveal delay={0.18}>
                  <DimensionLine label="Skills they practise" className="mt-10 text-paper/45" />
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {band.skills.map((s) => (
                      <li key={s} className="rounded-full border border-paper/20 bg-paper/[0.05] px-3.5 py-1.5 text-sm text-paper/85">
                        {s}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
              {band.outcomes.length > 0 && (
                <Reveal delay={0.24}>
                  <ul className="mt-8 grid gap-3 border-t border-paper/15 pt-6">
                    {band.outcomes.slice(0, 4).map((o) => (
                      <li key={o} className="flex items-start gap-3 text-sm leading-relaxed text-paper/75">
                        <Check className="mt-0.5 size-4 shrink-0 text-paper/50" aria-hidden />
                        {o}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Pairs with Virtual Labs ─────────────────────────────── */}
      {pairedLabs.length > 0 && (
        <section className="relative py-24 sm:py-28" aria-labelledby="labs-title">
          <div className="container-bp">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <Reveal>
                  <SectionLabel index="04">Pairs with</SectionLabel>
                </Reveal>
                <h2 id="labs-title" className="mt-6 text-[clamp(2rem,4vw,3.3rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">
                  <RevealLines lines={["Learn it free online,", "then build it for real."]} />
                </h2>
              </div>
              <Reveal delay={0.12} className="lg:col-span-5">
                <p className="leading-relaxed text-charcoal">
                  {pairedLabs.length > 1 ? "These JOVE Virtual Labs are" : "This JOVE Virtual Lab is"} free and run in the browser — theory, a demo, a hands-on simulation and a challenge. Do the lab first; open the box after.
                </p>
              </Reveal>
            </div>

            <ul className={`mt-12 grid gap-6 ${pairedLabs.length > 1 ? "md:grid-cols-2" : "md:max-w-2xl"}`}>
              {pairedLabs.map((lab, i) => (
                <Reveal as="li" key={lab.slug} delay={i * 0.08}>
                  <Link
                    href={`/labs/${lab.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:flex-row"
                  >
                    <span className="relative aspect-[4/3] shrink-0 overflow-hidden bg-paper sm:aspect-auto sm:w-[44%]">
                      <Image src={lab.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 22vw" quality={75} className="object-cover mix-blend-multiply transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-105" />
                    </span>
                    <span className="flex flex-1 flex-col p-5 sm:p-6">
                      <span className="annot text-blueprint">
                        Free Virtual Lab · {lab.topic} · {lab.level}
                      </span>
                      <span className="mt-2 text-xl font-bold tracking-[-0.02em] text-graphite">{lab.title}</span>
                      <span className="mt-1 text-sm font-medium text-charcoal">{lab.subtitle}</span>
                      <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-charcoal">{lab.summary}</span>
                      <span className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-blueprint">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden /> ~{lab.minutes} min · {lab.grades}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-graphite">
                          Start free <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                        </span>
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ─── Related kits ─────────────────────────────────────────── */}
      <section className="relative border-t border-graphite/10 bg-paper-100 py-24 sm:py-28" aria-labelledby="related-title">
        <div className="container-bp">
          {related.length > 0 && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <Reveal>
                    <SectionLabel index={pairedLabs.length ? "05" : "04"}>More kits</SectionLabel>
                  </Reveal>
                  <h2 id="related-title" className="mt-6 text-[clamp(2rem,4vw,3.3rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">
                    <RevealLines lines={["One for every grade."]} />
                  </h2>
                </div>
                <Reveal delay={0.1}>
                  <Link href="/shop#kits" className="annot inline-flex items-center gap-2 text-graphite underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
                    All kits <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </Reveal>
              </div>
              <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {related.map((p, i) => (
                  <Reveal as="li" key={p.slug} delay={i * 0.06} className="h-full">
                    <ProductCard product={p} index={all.findIndex((r) => r.slug === p.slug)} />
                  </Reveal>
                ))}
              </ul>
            </>
          )}
          <TrustStrip compact className={related.length ? "mt-16" : undefined} />
        </div>
      </section>

      <CTASection
        eyebrow="For schools"
        title={["Ordering for a class?", `${BULK_DISCOUNT_PCT}% off from ${BULK_MIN_KITS} kits.`]}
        body={`Take-home kits after a JOVE Day, stock for a robotics club or your Atal Tinkering Lab — schools get ${BULK_DISCOUNT_PCT}% off MRP on ${BULK_MIN_KITS} or more kits, confirmed in a written quote.`}
        primary={{ label: "Request a school quote", href: "/contact" }}
        secondary={{ label: "Browse all kits", href: "/shop" }}
      />
      <CartToast />
    </>
  );
}
