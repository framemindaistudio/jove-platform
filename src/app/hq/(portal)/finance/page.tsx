import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { FinanceApp, type FinanceTab } from "@/components/hq/finance/FinanceApp";

export const metadata: Metadata = { title: "Finance" };

const TABS: FinanceTab[] = ["overview", "invoices", "expenses", "income", "reports"];
type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** /hq/finance?tab=overview|invoices|expenses|income|reports  ·  ?id=<invoice>  ·  ?new=1&workshop=<id> */
export default async function FinancePage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(OPS);
  const sp = await searchParams;
  const tabParam = one(sp.tab);
  const id = one(sp.id) ?? null;
  const workshop = one(sp.workshop) ?? null;
  const wantsNew = one(sp.new) === "1" || !!workshop;
  const tab: FinanceTab = TABS.includes(tabParam as FinanceTab) ? (tabParam as FinanceTab) : id || wantsNew ? "invoices" : "overview";
  return <FinanceApp initialTab={tab} initialInvoiceId={id} initialNew={wantsNew} initialWorkshopId={workshop} />;
}
