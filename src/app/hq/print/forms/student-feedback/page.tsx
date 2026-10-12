import type { Metadata } from "next";
import { StudentFeedback } from "@/components/hq/printables/forms/StudentFeedback";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Student feedback form" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <StudentFeedback q={flatten(await searchParams)} />;
}
