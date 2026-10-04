import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { store } from "@/lib/store";
import { ALL, OPS_MEDIA } from "@/lib/hq/roles";

const TEXT_EXT = /\.(md|markdown|txt|csv|json)$/i;

/**
 * GET ?tree=OPERATIONS          → recursive listing
 * GET ?path=OPERATIONS/x.md     → { path, content, sha, size }
 * PUT { path, content, sha?, message? } → commit (text files only)
 * DELETE ?path=...              → delete file
 */
export async function GET(req: Request) {
  const { error } = await apiUser(ALL);
  if (error) return error;
  const url = new URL(req.url);
  try {
    const tree = url.searchParams.get("tree");
    if (tree) {
      const entries = await store.tree(tree);
      return NextResponse.json({ entries });
    }
    const path = url.searchParams.get("path");
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
    if (!TEXT_EXT.test(path)) return NextResponse.json({ error: "Not a text document — use /api/hq/docs/raw" }, { status: 400 });
    const file = await store.read(path);
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(file);
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: Request) {
  const { user, error } = await apiUser(OPS_MEDIA);
  if (error) return error;
  try {
    const body = await req.json();
    const path = String(body.path || "");
    if (!TEXT_EXT.test(path)) return NextResponse.json({ error: "Only .md, .txt, .csv and .json files can be edited here" }, { status: 400 });
    if (typeof body.content !== "string") return NextResponse.json({ error: "Missing content" }, { status: 400 });
    if (body.content.length > 900_000) return NextResponse.json({ error: "Document too large" }, { status: 400 });
    const name = path.split("/").pop();
    const res = await store.write(path, body.content, String(body.message || `Update ${name}`), { sha: body.sha || undefined, author: user.name });
    return NextResponse.json({ ok: true, sha: res.sha });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: Request) {
  const { user, error } = await apiUser(["founder", "admin"]);
  if (error) return error;
  const path = new URL(req.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  try {
    await store.remove(path, `Delete ${path.split("/").pop()}`, { author: user.name });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
