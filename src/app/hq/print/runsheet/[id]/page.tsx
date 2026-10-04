import type { Metadata } from "next";
import { RunSheetDoc } from "@/components/hq/workshops/RunSheetDoc";

export const metadata: Metadata = { title: "Run sheet" };

export default async function RunSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RunSheetDoc id={id} />;
}
