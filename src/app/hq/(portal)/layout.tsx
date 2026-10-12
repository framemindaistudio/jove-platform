import { requireUser } from "@/lib/hq/auth";
import { storeInfoChecked } from "@/lib/store";
import { storeForUser } from "@/lib/hq/access";
import { bookForRole, readPriceBook, startingBook } from "@/lib/hq/pricebook";
import { HqShell } from "@/components/hq/HqShell";

export const dynamic = "force-dynamic";

/** Every HQ module page renders inside the authenticated shell. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // costs and margins go only to the roles that see Finance; a store that cannot be read must not take the portal down
  const { book, parts } = bookForRole(user.role, (await readPriceBook().catch(() => null))?.book ?? startingBook());
  return (
    <HqShell user={user} store={storeForUser(await storeInfoChecked(), user)} book={book} parts={parts}>
      {children}
    </HqShell>
  );
}
