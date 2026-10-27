import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { benchProject } from "@/lib/bench/projects";
import BenchApp from "@/components/bench/BenchApp";

export const metadata: Metadata = { title: "Practice Lab" };

/** /hq/bench/<project>: the 3D bench on its own page, for practice and for the projector. */
export default async function BenchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(ALL);
  const { id } = await params;
  const project = benchProject(id);
  if (!project) notFound();
  const sp = await searchParams;
  return (
    <main className="h-dvh">
      <BenchApp project={project} backHref="/hq/practice" backLabel="Practice Lab" present={sp.present === "1"} />
    </main>
  );
}
