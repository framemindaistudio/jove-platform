import type { Metadata } from "next";
import { PricingBrochure } from "@/components/hq/printables/brochures/PricingBrochure";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Brochure: Packages and pricing" };

/** A3 school brochure, printed from HQ → Printables with the options chosen there. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <PricingBrochure q={flatten(await searchParams)} />;
}
