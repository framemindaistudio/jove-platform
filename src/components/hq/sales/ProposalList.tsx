"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Printer } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { PageHeader, StatCard } from "@/components/hq/ui";
import { formatDate, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { str } from "./crm";
import { priceProposal } from "./pricing";
import { useToday } from "./useToday";

const proposalsDef = getCollection("proposals")!;

const exGst = (r: BaseRecord) => Number(r.total) || priceProposal(r).subtotal;
const inclGst = (r: BaseRecord) => Number(r.grandTotal) || priceProposal(r).grandTotal;

export function ProposalList() {
  const router = useRouter();
  const today = useToday();
  const { user, store } = useHq();
  const { records } = useCollection("proposals");
  const canWrite = can(user, proposalsDef.write) && store.writable;

  const stats = useMemo(() => {
    const by = (s: string) => records.filter((r) => (str(r.status) || "draft") === s);
    const sum = (list: BaseRecord[]) => list.reduce((a, r) => a + exGst(r), 0);
    const draft = by("draft");
    const sent = by("sent");
    const accepted = by("accepted");
    const decided = accepted.length + by("rejected").length + by("expired").length;
    return { draft, sent, accepted, draftValue: sum(draft), sentValue: sum(sent), acceptedValue: sum(accepted), rate: decided ? accepted.length / decided : 0, decided };
  }, [records]);

  const extra: ExtraColumn<BaseRecord>[] = useMemo(
    () => [
      {
        key: "students",
        label: "Students",
        className: "text-right",
        sortValue: (r) => priceProposal(r).students,
        render: (r) => <span className="tabular block text-right">{priceProposal(r).students ? formatNumber(priceProposal(r).students) : "—"}</span>,
      },
      {
        key: "exGst",
        label: "Ex-GST",
        className: "text-right",
        sortValue: exGst,
        render: (r) => <span className="tabular block whitespace-nowrap text-right">{exGst(r) ? formatINR(exGst(r)) : "—"}</span>,
      },
      {
        key: "inclGst",
        label: "Incl. GST",
        className: "text-right",
        sortValue: inclGst,
        render: (r) => <span className="tabular block whitespace-nowrap text-right font-semibold">{inclGst(r) ? formatINR(inclGst(r)) : "—"}</span>,
      },
      {
        key: "validUntil",
        label: "Valid until",
        sortValue: (r) => str(r.validUntil) || "9999",
        render: (r) => {
          const open = ["draft", "sent", ""].includes(str(r.status));
          const lapsed = open && !!today && !!r.validUntil && str(r.validUntil) < today;
          return (
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-charcoal">
              <span className="tabular">{r.validUntil ? formatDate(str(r.validUntil)) : "—"}</span>
              {lapsed && <Badge tone="bad">Lapsed</Badge>}
            </span>
          );
        },
      },
    ],
    [today],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Sales · 03"
        title="Proposals"
        icon="FileSignature"
        description="Price a JOVE Day, Quarter, Year or Club for a school in minutes — then print a branded proposal PDF."
        actions={
          canWrite ? (
            <Button size="sm" className="h-10" href="/hq/proposals/new">
              <Plus className="size-4" aria-hidden /> New proposal
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Drafts" value={formatNumber(stats.draft.length)} sub={`${formatINRCompact(stats.draftValue)} ex-GST in preparation`} />
        <StatCard tone="dark" label="Awaiting a decision" value={formatINRCompact(stats.sentValue)} sub={`${stats.sent.length} proposal${stats.sent.length === 1 ? "" : "s"} sent, ex-GST`} />
        <StatCard label="Accepted" value={formatINRCompact(stats.acceptedValue)} sub={`${stats.accepted.length} proposal${stats.accepted.length === 1 ? "" : "s"}, ex-GST`} />
        <StatCard
          label="Acceptance rate"
          value={stats.decided ? `${Math.round(stats.rate * 100)}%` : "—"}
          sub={stats.decided ? `${stats.accepted.length} of ${stats.decided} decided` : "Shown once proposals are decided"}
          progress={stats.decided ? stats.rate : undefined}
        />
      </div>

      <CollectionManager
        name="proposals"
        columns={["number", "date", "schoolId", "packageId", "status"]}
        extraColumns={extra}
        hideNew
        onOpen={(r) => router.push(`/hq/proposals/${r.id}`)}
        emptyText="No proposals yet. Create one from here, or from a school's profile in the CRM."
        rowActions={(r) => (
          <Link
            href={`/hq/print/proposal/${r.id}`}
            onClick={(e) => e.stopPropagation()}
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 text-charcoal transition-colors hover:border-graphite hover:bg-graphite hover:text-paper focus-visible:outline-2 focus-visible:outline-graphite"
            aria-label={`Print or save proposal ${str(r.number)} as PDF`}
            title="Print / PDF"
          >
            <Printer className="size-3.5" aria-hidden />
          </Link>
        )}
      />
    </div>
  );
}
