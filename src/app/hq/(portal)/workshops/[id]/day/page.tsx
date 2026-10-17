import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { DayMode } from "@/components/hq/workshops/DayMode";

export const metadata: Metadata = { title: "Day mode" };

export default async function WorkshopDayPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  return <DayMode id={id} />;
}
