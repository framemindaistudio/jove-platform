import type { Metadata } from "next";
import { IntroBrochure } from "@/components/hq/printables/brochures/IntroBrochure";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Brochure: Meet JOVE" };

/** A3 school brochure, printed from HQ → Printables with the options chosen there. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <IntroBrochure q={flatten(await searchParams)} />;
}
