import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { WorkshopsHome } from "@/components/hq/workshops/WorkshopsHome";

export const metadata: Metadata = { title: "Workshops" };

type SearchParams = Promise<{ new?: string | string[]; school?: string | string[] }>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function WorkshopsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const sp = await searchParams;
  return <WorkshopsHome initialNew={first(sp.new) === "1"} initialSchool={first(sp.school)} />;
}
