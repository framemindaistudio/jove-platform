"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Loading, PageHeader } from "@/components/hq/ui";
import { fyLabel, fyStartYear } from "./finance";
import { useFinanceData, useToday, writeParams } from "./hooks";
import { ExpensesTab } from "./ExpensesTab";
import { IncomeTab } from "./IncomeTab";
import { InvoicesTab, type InvoiceIntent } from "./InvoicesTab";
import { OverviewTab } from "./OverviewTab";
import { ReportsTab } from "./ReportsTab";

export type FinanceTab = "overview" | "invoices" | "expenses" | "income" | "reports";

export interface FinanceAppProps {
  initialTab: FinanceTab;
  initialInvoiceId?: string | null;
  initialNew?: boolean;
  initialWorkshopId?: string | null;
}

export function FinanceApp({ initialTab, initialInvoiceId = null, initialNew = false, initialWorkshopId = null }: FinanceAppProps) {
  const today = useToday();
  const data = useFinanceData();
  const [tab, setTab] = useState<FinanceTab>(initialTab);
  // what the invoices tab should do the moment it mounts (open a record / the workshop wizard)
  const [intent, setIntent] = useState<InvoiceIntent>({ id: initialInvoiceId, wizard: initialNew || !!initialWorkshopId, workshop: initialWorkshopId });

  const go = useCallback((next: FinanceTab, params: Record<string, string> = {}) => {
    setIntent({ id: params.id ?? null, wizard: params.new === "1" || !!params.workshop, workshop: params.workshop ?? null });
    setTab(next);
    writeParams({ tab: next === "overview" ? null : next, id: params.id ?? null, new: params.new ?? null, workshop: params.workshop ?? null });
  }, []);

  const empty = !data.invoices.length && !data.expenses.length && !data.income.length;
  const { settings } = data;
  const needsSetup = !data.loading && (!settings.gstin || !settings.bankAccountNumber);

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        icon="ReceiptIndianRupee"
        title="Finance"
        description={`GST tax invoices, expenses and income — with a live P&L for ${today ? fyLabel(fyStartYear(today)) : "the financial year"}. Revenue is shown ex-GST.`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => void data.refresh()} aria-label="Reload finance data">
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        }
      />

      {needsSetup && (
        <p className="mb-5 flex items-start gap-2 rounded-[var(--radius-sm)] border border-graphite/15 bg-graphite/[0.04] px-4 py-3 text-xs text-charcoal">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {!settings.gstin ? "GSTIN" : "Bank account"} details are missing, so printed invoices will show blanks.{" "}
            <Link href="/hq/settings" className="font-semibold text-graphite underline underline-offset-2">
              Complete company, GST and bank details in Settings
            </Link>{" "}
            before you issue your first invoice.
          </span>
        </p>
      )}

      <Tabs<FinanceTab>
        value={tab}
        onChange={(t) => go(t)}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "invoices", label: "Invoices", count: data.invoices.length || undefined },
          { value: "expenses", label: "Expenses", count: data.expenses.length || undefined },
          { value: "income", label: "Other income", count: data.income.length || undefined },
          { value: "reports", label: "Reports" },
        ]}
        className="mb-6"
      />

      <div role="tabpanel" aria-label={tab}>
        {!today || data.loading ? (
          <Loading label="Loading finance data…" />
        ) : (
          <>
            {data.error && <p className="mb-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{data.error}</p>}
            {tab === "overview" && <OverviewTab ledger={data.ledger} settings={settings} today={today} onNavigate={go} empty={empty} />}
            {tab === "invoices" && <InvoicesTab ledger={data.ledger} settings={settings} today={today} intent={intent} />}
            {tab === "expenses" && <ExpensesTab ledger={data.ledger} today={today} />}
            {tab === "income" && <IncomeTab ledger={data.ledger} today={today} />}
            {tab === "reports" && <ReportsTab ledger={data.ledger} settings={settings} today={today} />}
          </>
        )}
      </div>
    </div>
  );
}
