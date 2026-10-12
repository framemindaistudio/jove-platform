import type { Metadata } from "next";
import { TableTents } from "@/components/hq/printables/stationery/TableTents";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Station table tents" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <TableTents q={flatten(await searchParams)} />;
}
