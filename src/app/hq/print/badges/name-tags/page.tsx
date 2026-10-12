import type { Metadata } from "next";
import { NameTags } from "@/components/hq/printables/badges/NameTags";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Student name tags" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <NameTags q={flatten(await searchParams)} />;
}
