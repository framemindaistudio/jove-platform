import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { ShopApp } from "@/components/hq/product/ShopApp";

export const metadata: Metadata = { title: "Online Shop" };

export default async function ShopAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser(OPS);
  const { tab } = await searchParams;
  return <ShopApp initialTab={tab} />;
}
