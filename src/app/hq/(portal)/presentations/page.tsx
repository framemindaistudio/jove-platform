import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { DeckLibrary } from "@/components/hq/decks/DeckLibrary";

export const metadata: Metadata = { title: "Presentations" };

export default async function PresentationsPage() {
  await requireUser(ALL);
  return <DeckLibrary />;
}
