import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { PricesApp } from "@/components/hq/prices/PricesApp";

export const metadata: Metadata = { title: "Prices & Costs" };

/** /hq/prices: the price book. Founders edit; the roles that see Finance can read. */
export default async function PricesPage() {
  await requireUser(OPS);
  return <PricesApp />;
}
