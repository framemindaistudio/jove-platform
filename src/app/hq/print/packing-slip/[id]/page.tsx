import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { PackingSlipPrint } from "@/components/hq/product/PackingSlipPrint";

export const metadata: Metadata = { title: "Packing slip", robots: { index: false, follow: false } };

export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(OPS);
  const { id } = await params;
  return <PackingSlipPrint id={id} />;
}
