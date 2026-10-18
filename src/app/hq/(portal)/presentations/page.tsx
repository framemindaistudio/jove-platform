import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { getCollection, SCHOOL_STAGES } from "@/lib/hq/collections";
import { listRecords } from "@/lib/hq/records";
import { DeckLibrary, type CrmSchool } from "@/components/hq/decks/DeckLibrary";

export const metadata: Metadata = { title: "Presentations" };

/** schools most likely to need the meeting deck come first; lost schools are left out */
const ORDER = ["meeting", "contacted", "proposal", "negotiation", "lead", "nurture", "won"];

export default async function PresentationsPage() {
  const user = await requireUser(ALL);
  // only logins that may read the Schools CRM get its names (the trainer and view-only logins type the name)
  const canRead = getCollection("schools")?.read.includes(user.role) ?? false;
  const schools: CrmSchool[] = canRead
    ? (await listRecords<{ id: string; name?: string; city?: string; stage?: string }>("schools"))
        .filter((s) => s.name?.trim() && s.stage !== "lost")
        .map((s) => ({ name: s.name!.trim().slice(0, 80), city: s.city?.trim() || undefined, stage: s.stage || "lead" }))
        .sort((a, b) => (ORDER.indexOf(a.stage) + 1 || 99) - (ORDER.indexOf(b.stage) + 1 || 99) || a.name.localeCompare(b.name))
        .map((s) => ({ ...s, stage: SCHOOL_STAGES.find((o) => o.value === s.stage)?.label ?? s.stage }))
    : [];
  return <DeckLibrary schools={schools} />;
}
