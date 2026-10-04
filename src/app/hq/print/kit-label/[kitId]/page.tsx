import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_TRAINER } from "@/lib/hq/roles";
import { KitLabelPrint } from "@/components/hq/product/KitLabelPrint";

export const metadata: Metadata = { title: "Kit box labels", robots: { index: false, follow: false } };

export default async function KitLabelPage({ params }: { params: Promise<{ kitId: string }> }) {
  await requireUser(OPS_TRAINER);
  const { kitId } = await params;
  return <KitLabelPrint kitId={kitId} />;
}
