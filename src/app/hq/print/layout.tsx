import { requireUser } from "@/lib/hq/auth";
import { storeInfoChecked } from "@/lib/store";
import { storeForUser } from "@/lib/hq/access";
import { HqProvider } from "@/components/hq/data";

export const dynamic = "force-dynamic";

/** Printable documents: authenticated, but without the HQ chrome. */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <HqProvider user={user} store={storeForUser(await storeInfoChecked(), user)}>
      {children}
    </HqProvider>
  );
}
