import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { LeadsInbox } from "@/components/hq/sales/LeadsInbox";

export const metadata: Metadata = { title: "Website Leads" };

export default async function LeadsPage() {
  await requireUser(OPS_MEDIA);
  return <LeadsInbox />;
}
