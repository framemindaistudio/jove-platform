import type { Metadata } from "next";
import { AttendanceSheet } from "@/components/hq/printables/forms/AttendanceSheet";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Attendance sheet" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <AttendanceSheet q={flatten(await searchParams)} />;
}
