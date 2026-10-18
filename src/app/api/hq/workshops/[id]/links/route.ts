import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { OPS } from "@/lib/hq/roles";
import { workshopLinks } from "@/lib/hq/workshop-delete";

/** GET → what deleting this workshop would remove, unlink, or be blocked by (for the confirmation). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await apiUser(OPS);
  if (error) return error;
  const { id } = await ctx.params;
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: "No such workshop" }, { status: 404 });
  try {
    return NextResponse.json(await workshopLinks(id));
  } catch (e) {
    return apiError(e);
  }
}
