import { redirect } from "next/navigation";

/** The old kit label page: the box now carries a set of four stickers, printed from one page. */
export default async function KitLabelPage({ params }: { params: Promise<{ kitId: string }> }) {
  const { kitId } = await params;
  redirect(`/hq/print/kit-stickers?kit=${encodeURIComponent(kitId)}&from=kits`);
}
