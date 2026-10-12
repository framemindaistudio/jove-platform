import type { Metadata } from "next";
import { KitStickers } from "@/components/hq/product/KitStickers";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Kit box stickers", robots: { index: false, follow: false } };

/** Printable generated from query-string options chosen in HQ → Printables (or opened from Kits & BOM). */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <KitStickers q={flatten(await searchParams)} />;
}
