import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { ProposalPrint } from "@/components/hq/sales/ProposalPrint";

export const metadata: Metadata = { title: "Proposal", robots: { index: false, follow: false } };

export default async function ProposalPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(OPS_MEDIA);
  const { id } = await params;
  return <ProposalPrint id={id} />;
}
