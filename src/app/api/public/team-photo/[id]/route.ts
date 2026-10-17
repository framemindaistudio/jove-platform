import { NextResponse } from "next/server";
import { listRecords } from "@/lib/hq/records";
import { store } from "@/lib/store";
import { FOUNDERS } from "@/lib/sign/context";

/**
 * GET /api/public/team-photo/<member id>: a team member's photo for the public website, only while they are shown
 * on it (Team & Payroll → "Show on the website") and active. Founders' photos are shown on their founder cards.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const member = (await listRecords("team", { revalidate: 300 })).find((m) => m.id === id);
    const founder = member && FOUNDERS.some((f) => f.name.toLowerCase() === String(member.name ?? "").trim().toLowerCase());
    const shown = member && (founder || (member.showOnWebsite === true && String(member.status ?? "active") === "active"));
    const path = shown && typeof member.photo === "string" && member.photo.startsWith("vault/team-photos/") ? member.photo : "";
    const buf = path ? await store.readBinary(path) : null;
    if (!buf) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
