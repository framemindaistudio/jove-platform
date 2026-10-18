import type { Metadata } from "next";
import { configuredUsers, requireUser } from "@/lib/hq/auth";
import { hqNav } from "@/lib/hq/nav";
import { roleLabels } from "@/lib/hq/roles";
import { MyAccount } from "@/components/hq/account/MyAccount";

export const metadata: Metadata = { title: "My account" };

/** Every login's own page: who it is, what it can open, and its password. proxy.ts sends a login with a one-time password here. */
export default async function Page() {
  const user = await requireUser();
  const modules = hqNav.flatMap((g) => g.items).filter((i) => i.roles.includes(user.role)).map((i) => i.label);
  return (
    <MyAccount
      name={user.name}
      username={user.username}
      roleLabel={roleLabels[user.role]}
      modules={modules}
      first={!!user.mustChange}
      builtIn={configuredUsers().some((u) => u.username === user.username)}
    />
  );
}
