import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { ProposalBuilder } from "@/components/hq/sales/ProposalBuilder";

export const metadata: Metadata = { title: "Proposal" };

export default async function ProposalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string | string[] }> }) {
  await requireUser(OPS_MEDIA);
  const { id } = await params;
  const { created } = await searchParams;
  return <ProposalBuilder id={id} created={!!created} />;
}
