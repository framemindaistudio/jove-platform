import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { getRecord } from "@/lib/hq/records";
import { OPS } from "@/lib/hq/roles";
import { cleanRoster, type Roster } from "@/lib/hq/roster";
import { store } from "@/lib/store";

/**
 * A workshop's student list (lib/hq/roster.ts), one file per workshop at data/rosters/<id>.json.
 * GET → { students, updatedAt, updatedBy, sha }: founders, admins and operations (never interns, trainers or media:
 *       these are children's names).
 * PUT { students, sha } → saves the whole list: founders and admins (proxy.ts already refuses everyone else).
 * The commit message gives only the count, never a name.
 */
type Ctx = { params: Promise<{ id: string }> };

const pathOf = (id: string) => `data/rosters/${id}.json`;

async function workshopOf(id: string) {
  if (!/^[\w-]{1,64}$/.test(id)) return null;
  return getRecord<{ id: string; title?: string }>("workshops", id);
}

export async function GET(_req: Request, ctx: Ctx) {
  const { error } = await apiUser(OPS);
  if (error) return error;
  const { id } = await ctx.params;
  try {
    if (!(await workshopOf(id))) return NextResponse.json({ error: "No such workshop" }, { status: 404 });
    const { data, sha } = await store.readJSON<Roster>(pathOf(id), { students: [] });
    return NextResponse.json({ students: Array.isArray(data.students) ? data.students : [], updatedAt: data.updatedAt ?? "", updatedBy: data.updatedBy ?? "", sha: sha ?? "" });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const { user, error } = await apiEditor(OPS);
  if (error) return error;
  const { id } = await ctx.params;
  try {
    const w = await workshopOf(id);
    if (!w) return NextResponse.json({ error: "No such workshop" }, { status: 404 });
    const body = await req.json().catch(() => null);
    const cleaned = cleanRoster(body);
    if ("error" in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 });
    const roster: Roster = { students: cleaned.students, updatedAt: new Date().toISOString(), updatedBy: user.name };
    const sha = typeof body?.sha === "string" && body.sha ? body.sha : undefined;
    const res = await store.write(pathOf(id), JSON.stringify(roster, null, 2) + "\n", `Students: ${roster.students.length} on the list for ${w.title ?? id}`, { sha, author: user.name });
    return NextResponse.json({ ok: true, ...roster, sha: res?.sha ?? "" });
  } catch (e) {
    return apiError(e);
  }
}
