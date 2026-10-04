"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useLookup } from "@/components/hq/data";
import { PageHeader } from "@/components/hq/ui";
import { isIso, shortDate } from "@/components/hq/printables/util";
import { ContentCalendar } from "./ContentCalendar";
import { MediaGuides } from "./MediaGuides";
import { useToday } from "@/components/hq/printables/hooks";
import { Pipeline, daysBetween, isOverdue, type Job } from "./Pipeline";

type Tab = "pipeline" | "deliverables" | "calendar" | "posts" | "guides";
const TABS: Tab[] = ["pipeline", "deliverables", "calendar", "posts", "guides"];

export function MediaStudio({ initialTab, initialWorkshop }: { initialTab?: string; initialWorkshop?: string }) {
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "pipeline");
  const [workshopId, setWorkshopId] = useState(initialWorkshop ?? "");
  const { records: workshopRecords } = useCollection("workshops");
  const { records: jobs } = useCollection<Job>("mediaJobs");
  const { records: posts } = useCollection("contentCalendar");
  const workshops = useLookup("workshops");
  const today = useToday();

  const options = useMemo(() => [...workshopRecords].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))), [workshopRecords]);
  const scoped = tab === "pipeline" || tab === "deliverables";

  return (
    <div>
      <PageHeader
        icon="Clapperboard"
        eyebrow="FrameMind AI Studio"
        title="Media Studio"
        description="Track every reel, film, drone shot and photo promised to a school, and plan JOVE's own content calendar."
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Tabs
          className="lg:flex-1"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "pipeline", label: "Pipeline", count: jobs.filter((j) => !["delivered", "posted"].includes(String(j.status))).length },
            { value: "deliverables", label: "Deliverables" },
            { value: "calendar", label: "Content calendar" },
            { value: "posts", label: "Posts", count: posts.length },
            { value: "guides", label: "Guides & SOPs" },
          ]}
        />
        {scoped && (
          <div className="w-full lg:w-80">
            <Select aria-label="Filter by workshop" value={workshopId} onChange={(e) => setWorkshopId(e.target.value)}>
              <option value="">All workshops</option>
              {options.map((w) => (
                <option key={w.id} value={w.id}>
                  {String(w.title || "Untitled workshop")}
                  {isIso(w.date) ? ` · ${shortDate(w.date)}` : ""}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {tab === "pipeline" && <Pipeline workshopId={workshopId} />}

      {tab === "deliverables" && (
        <CollectionManager<Job>
          name="mediaJobs"
          filter={(r) => !workshopId || r.workshopId === workshopId}
          defaults={{ workshopId: workshopId || undefined }}
          columns={["title", "deliverable", "workshopId", "status", "dueDate", "assignee"]}
          extraColumns={[
            {
              key: "timing",
              label: "Timing",
              sortValue: (r) => (isIso(r.dueDate) && today ? daysBetween(today, r.dueDate.slice(0, 10)) : 9999),
              render: (r) => {
                if (["delivered", "posted"].includes(String(r.status))) return <span className="text-xs text-blueprint">Done</span>;
                if (isOverdue(r, today)) return <Badge tone="bad" dot>Overdue {Math.abs(daysBetween(today, String(r.dueDate).slice(0, 10)))}d</Badge>;
                if (today && isIso(r.dueDate)) {
                  const left = daysBetween(today, r.dueDate.slice(0, 10));
                  return <span className={left <= 2 ? "text-xs font-semibold text-warn" : "text-xs text-charcoal"}>{left === 0 ? "Due today" : `In ${left}d`}</span>;
                }
                return <span className="text-xs text-blueprint">No date</span>;
              },
            },
          ]}
          emptyText="Pick a workshop in the Pipeline tab and add its standard Media Pack, or create deliverables here."
        />
      )}

      {tab === "calendar" && <ContentCalendar />}

      {tab === "posts" && (
        <CollectionManager name="contentCalendar" columns={["date", "platform", "format", "title", "pillar", "status", "owner"]} newLabel="New post" emptyText="No posts planned yet. The calendar holds JOVE's own launch content, from teasers to kit reveals." />
      )}

      {tab === "guides" && <MediaGuides />}

      {workshopId && scoped && workshops.get(workshopId) && (
        <p className="mt-4 text-xs text-blueprint">
          Filtered to <strong className="text-graphite">{String(workshops.get(workshopId)?.title ?? "")}</strong>.{" "}
          <button type="button" onClick={() => setWorkshopId("")} className="underline underline-offset-2 hover:text-graphite">
            Show all workshops
          </button>
        </p>
      )}
    </div>
  );
}
