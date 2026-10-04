import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { FilesApp } from "@/components/hq/docs/FilesApp";

export const metadata: Metadata = { title: "File Vault" };

export default async function FilesPage() {
  await requireUser(ALL);
  return <FilesApp />;
}
