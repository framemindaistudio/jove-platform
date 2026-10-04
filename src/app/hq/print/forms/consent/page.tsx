import type { Metadata } from "next";
import { ConsentForm } from "@/components/hq/printables/forms/ConsentForm";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Photo, video & drone consent form" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ConsentForm q={flatten(await searchParams)} />;
}
