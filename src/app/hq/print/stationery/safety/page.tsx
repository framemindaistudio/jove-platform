import type { Metadata } from "next";
import { SafetyPoster } from "@/components/hq/printables/stationery/SafetyPoster";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Workshop room safety rules" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <SafetyPoster q={flatten(await searchParams)} />;
}
