import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { WorkshopDetail } from "@/components/hq/workshops/WorkshopDetail";

export const metadata: Metadata = { title: "Workshop" };

export default async function WorkshopPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string | string[] }> }) {
  await requireUser();
  const { id } = await params;
  const { tab } = await searchParams;
  return <WorkshopDetail id={id} initialTab={Array.isArray(tab) ? tab[0] : tab} />;
}
