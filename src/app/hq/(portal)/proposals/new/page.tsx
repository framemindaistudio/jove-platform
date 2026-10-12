import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { ProposalBuilder } from "@/components/hq/sales/ProposalBuilder";

export const metadata: Metadata = { title: "New proposal" };

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ school?: string | string[] }> }) {
  await requireUser(OPS_MEDIA);
  const { school } = await searchParams;
  return <ProposalBuilder schoolId={Array.isArray(school) ? school[0] : school} />;
}
