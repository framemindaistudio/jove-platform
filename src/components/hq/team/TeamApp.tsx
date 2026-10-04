"use client";

import { useState } from "react";
import { PageHeader } from "@/components/hq/ui";
import { Tabs } from "@/components/ui/Tabs";
import { PayrollTab } from "./PayrollTab";
import { PeopleTab } from "./PeopleTab";

export type TeamTab = "people" | "payroll";

export function TeamApp({ initialTab }: { initialTab: TeamTab }) {
  const [tab, setTab] = useState<TeamTab>(initialTab);

  function change(next: TeamTab) {
    setTab(next);
    try {
      window.history.replaceState(null, "", next === "people" ? "/hq/team" : `/hq/team?tab=${next}`);
    } catch {
      /* URL sync is a convenience only */
    }
  }

  return (
    <>
      <PageHeader
        title="Team & Payroll"
        eyebrow="People"
        icon="Users"
        description="Founders, trainers and freelancers: who is cleared for school visits, who ran which workshop, and what each person is paid."
      />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={change}
        tabs={[
          { value: "people", label: "People" },
          { value: "payroll", label: "Payroll" },
        ]}
      />
      <div role="tabpanel">{tab === "people" ? <PeopleTab /> : <PayrollTab />}</div>
    </>
  );
}
