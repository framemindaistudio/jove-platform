import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_TRAINER } from "@/lib/hq/roles";
import { TravelHome } from "@/components/hq/workshops/TravelHome";

export const metadata: Metadata = { title: "Travel & Transport" };

export default async function TravelPage() {
  await requireUser(OPS_TRAINER);
  return <TravelHome />;
}
