import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { CrmBoard } from "@/components/hq/sales/CrmBoard";

export const metadata: Metadata = { title: "Schools CRM" };

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  await requireUser(OPS_MEDIA);
  const { view } = await searchParams;
  return <CrmBoard initialView={view === "table" ? "table" : "pipeline"} />;
}
