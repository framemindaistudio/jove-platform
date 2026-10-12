import type { Metadata } from "next";
import { StudioBrochure } from "@/components/hq/printables/brochures/StudioBrochure";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Brochure: The free Media Pack" };

/** A3 school brochure, printed from HQ → Printables with the options chosen there. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <StudioBrochure q={flatten(await searchParams)} />;
}
