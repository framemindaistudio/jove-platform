import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_TRAINER } from "@/lib/hq/roles";
import { InventoryApp } from "@/components/hq/product/InventoryApp";

export const metadata: Metadata = { title: "Inventory & Vendors" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ tab?: string; id?: string }> }) {
  await requireUser(OPS_TRAINER);
  const { tab, id } = await searchParams;
  return <InventoryApp initialTab={tab} initialId={id} />;
}
