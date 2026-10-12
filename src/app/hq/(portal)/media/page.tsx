import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canReadPath } from "@/lib/hq/access";
import { requireUser } from "@/lib/hq/auth";
import { MEDIA_SIDE } from "@/lib/hq/roles";
import { GUIDE_DOCS } from "@/components/hq/media/guides";
import { MediaStudio } from "@/components/hq/media/MediaStudio";

export const metadata: Metadata = { title: "Media Studio" };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** JOVE's own content calendar and posts used to be two tabs here. They are now the plan in Social Studio. */
const MOVED_TO_SOCIAL = ["calendar", "posts"];

/** /hq/media  ·  ?tab=pipeline|deliverables|guides  ·  ?workshop=<id> */
export default async function MediaPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireUser(MEDIA_SIDE);
  const sp = await searchParams;
  // old bookmarks and links keep working: they land on the plan
  if (MOVED_TO_SOCIAL.includes(one(sp.tab) ?? "")) redirect("/hq/social?tab=plan");
  // the guides link into the Operations Library: leave out what this account may not open (the interns login)
  const closedDocs = GUIDE_DOCS.filter((path) => !canReadPath(user.role, path));
  return <MediaStudio initialTab={one(sp.tab)} initialWorkshop={one(sp.workshop)} closedDocs={closedDocs} />;
}
