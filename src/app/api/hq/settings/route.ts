import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { readSettings, writeSettings } from "@/lib/hq/records";
import { ALL, LEADERSHIP } from "@/lib/hq/roles";

export async function GET() {
  const { error } = await apiUser(ALL);
  if (error) return error;
  try {
    const { settings } = await readSettings();
    return NextResponse.json({ settings });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: Request) {
  const { user, error } = await apiUser(LEADERSHIP);
  if (error) return error;
  try {
    const body = await req.json();
    const settings = await writeSettings(body.settings || {}, user.name);
    return NextResponse.json({ settings });
  } catch (e) {
    return apiError(e);
  }
}
