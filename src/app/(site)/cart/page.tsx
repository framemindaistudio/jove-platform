import type { Metadata } from "next";
import { CartView } from "@/components/site/shop/CartView";
import { toShopProduct } from "@/components/site/shop/catalog";
import { getPublicProducts } from "@/lib/public-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Your cart & checkout",
  description: "Review your JOVE robotics & AI kits and place your order. Prices include GST; we confirm every order by phone or WhatsApp within 24 hours.",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: true },
};

/** Server wrapper: passes the live catalog so the client cart re-prices lines exactly like the order API. */
export default async function CartPage() {
  const catalog = (await getPublicProducts()).map(toShopProduct);
  return <CartView catalog={catalog} />;
}
