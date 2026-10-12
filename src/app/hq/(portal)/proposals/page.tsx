import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { ProposalList } from "@/components/hq/sales/ProposalList";

export const metadata: Metadata = { title: "Proposals" };

export default async function ProposalsPage() {
  await requireUser(OPS_MEDIA);
  return <ProposalList />;
}
