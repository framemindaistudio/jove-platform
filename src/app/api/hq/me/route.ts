import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { storeInfoChecked } from "@/lib/store";

export async function GET() {
  const { user, error } = await apiUser();
  if (error) return error;
  return NextResponse.json({ user, store: await storeInfoChecked() });
}
