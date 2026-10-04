import type { Metadata } from "next";
import { TrainerChecklist } from "@/components/hq/printables/stationery/TrainerChecklist";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Trainer day checklist" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <TrainerChecklist q={flatten(await searchParams)} />;
}
