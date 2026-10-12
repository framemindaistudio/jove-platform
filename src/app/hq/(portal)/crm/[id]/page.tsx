import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { SchoolDetail } from "@/components/hq/sales/SchoolDetail";

export const metadata: Metadata = { title: "School" };

export default async function SchoolPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(OPS_MEDIA);
  const { id } = await params;
  return <SchoolDetail id={id} />;
}
