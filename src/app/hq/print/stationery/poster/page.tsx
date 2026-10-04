import type { Metadata } from "next";
import { WorkshopPoster } from "@/components/hq/printables/stationery/WorkshopPoster";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Workshop announcement poster" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <WorkshopPoster q={flatten(await searchParams)} />;
}
