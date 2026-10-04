import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_TRAINER } from "@/lib/hq/roles";
import { KitsApp } from "@/components/hq/product/KitsApp";

export const metadata: Metadata = { title: "Kits & BOM" };

export default async function KitsPage() {
  await requireUser(OPS_TRAINER);
  return <KitsApp />;
}
