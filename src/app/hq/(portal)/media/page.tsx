import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_MEDIA } from "@/lib/hq/roles";
import { MediaStudio } from "@/components/hq/media/MediaStudio";

export const metadata: Metadata = { title: "Media Studio" };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** /hq/media  ·  ?tab=pipeline|deliverables|calendar|posts|guides  ·  ?workshop=<id> */
export default async function MediaPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(OPS_MEDIA);
  const sp = await searchParams;
  return <MediaStudio initialTab={one(sp.tab)} initialWorkshop={one(sp.workshop)} />;
}
