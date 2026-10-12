import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { Loading } from "@/components/hq/ui";
import { CurriculumApp } from "@/components/hq/docs/CurriculumApp";

export const metadata: Metadata = { title: "Curriculum" };

export default async function CurriculumPage() {
  await requireUser(ALL);
  return (
    <Suspense fallback={<Loading label="Loading curriculum…" />}>
      <CurriculumApp />
    </Suspense>
  );
}
