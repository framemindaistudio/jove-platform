import type { Metadata } from "next";
import { TeacherFeedback } from "@/components/hq/printables/forms/TeacherFeedback";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "School feedback form" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <TeacherFeedback q={flatten(await searchParams)} />;
}
