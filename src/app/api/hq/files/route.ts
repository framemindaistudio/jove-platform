import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { store } from "@/lib/store";
import { ALL, OPS_MEDIA } from "@/lib/hq/roles";

/**
 * File vault — small files (receipts, signed forms, photos, PDFs) committed to vault/ in the repo.
 * GET  ?dir=vault/receipts  → listing
 * POST multipart: file, folder → vault/<folder>/<yyyy-mm-dd>_<name>
 * Max 4 MB per file (Vercel request limit). Put big media on Drive/YouTube and link it.
 */
const MAX = 4 * 1024 * 1024;

export async function GET(req: Request) {
  const { error } = await apiUser(ALL);
  if (error) return error;
  const dir = new URL(req.url).searchParams.get("dir") || "vault";
  try {
    const entries = await store.tree(dir);
    return NextResponse.json({ entries: entries.filter((e) => e.type === "file") });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  const { user, error } = await apiUser(OPS_MEDIA);
  if (error) return error;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: "File is larger than 4 MB. Upload it to Google Drive and save the link instead." }, { status: 413 });
    const folder = String(form.get("folder") || "general")
      .toLowerCase()
      .replace(/[^a-z0-9/_-]/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "") || "general";
    const safeName = file.name.replace(/[^\w.\- ]/g, "_").replace(/\s+/g, "_").slice(-90);
    const stamp = new Date().toISOString().slice(0, 10);
    const path = `vault/${folder}/${stamp}_${safeName}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await store.write(path, buf, `Upload ${safeName} to ${folder}`, { author: user.name });
    return NextResponse.json({ ok: true, path });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: Request) {
  const { user, error } = await apiUser(["founder", "admin", "ops"]);
  if (error) return error;
  const path = new URL(req.url).searchParams.get("path");
  if (!path || !path.startsWith("vault/")) return NextResponse.json({ error: "Only vault files can be deleted here" }, { status: 400 });
  try {
    await store.remove(path, `Delete ${path.split("/").pop()}`, { author: user.name });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
