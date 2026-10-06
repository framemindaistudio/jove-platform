import { requireUser } from "@/lib/hq/auth";
import { storeInfoChecked } from "@/lib/store";
import { storeForUser } from "@/lib/hq/access";
import { HqShell } from "@/components/hq/HqShell";

export const dynamic = "force-dynamic";

/** Every HQ module page renders inside the authenticated shell. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <HqShell user={user} store={storeForUser(await storeInfoChecked(), user)}>
      {children}
    </HqShell>
  );
}
