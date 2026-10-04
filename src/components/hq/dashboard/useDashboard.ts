"use client";

import { useEffect, useMemo, useState } from "react";
import { getCollection, totalStudents, type BaseRecord } from "@/lib/hq/collections";
import { can, LEADERSHIP, OPS, type SessionUser } from "@/lib/hq/roles";
import { api, useCollection, useHq, useSettings } from "@/components/hq/data";
import {
  compareTasks,
  expensesForMonth,
  followUpsDue,
  isMine,
  isOverdueInvoice,
  lowStock,
  mediaDue,
  pipeline,
  receivables,
  revenueForMonth,
  upcomingWorkshops,
  workshopsInMonth,
} from "./metrics";
import { addDays, lastMonths, monthLabel, useNow } from "./time";

/** Collection name if the signed-in role may read it, else a never-fetched placeholder. */
function readable(user: SessionUser, name: string) {
  const def = getCollection(name);
  return def && can(user, def.read) ? name : `__none_${name}`;
}

export interface ChartRow {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
}

/**
 * Everything the Command Center needs, derived from the shared collection cache.
 * Collections the role cannot read are never requested (no 403 noise),
 * and money is only computed for founder / admin / ops.
 */
export function useDashboard() {
  const { user, store } = useHq();
  const now = useNow();
  const money = can(user, OPS);
  const leadership = can(user, LEADERSHIP);

  const workshops = useCollection(readable(user, "workshops"));
  const tasks = useCollection(readable(user, "tasks"));
  const media = useCollection(readable(user, "mediaJobs"));
  const schools = useCollection(readable(user, "schools"));
  const leads = useCollection(readable(user, "leads"));
  const inventory = useCollection(readable(user, "inventory"));
  const products = useCollection(readable(user, "products"));
  const team = useCollection(readable(user, "team"));
  const invoices = useCollection(money ? "invoices" : "__none_invoices");
  const expenses = useCollection(money ? "expenses" : "__none_expenses");
  const income = useCollection(money ? "income" : "__none_income");
  const { settings, loading: settingsLoading } = useSettings();

  /* HQ login count — leadership only (the endpoint is LEADERSHIP-gated). */
  const [userCount, setUserCount] = useState<number | null>(null);
  useEffect(() => {
    if (!leadership) return;
    let alive = true;
    api<{ users: unknown[] }>("/api/hq/users")
      .then((j) => alive && setUserCount(j.users.length))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [leadership]);

  const derived = useMemo(() => {
    if (!now) return null;
    const today = now.today;
    const month = today.slice(0, 7);
    const in3 = addDays(today, 3);
    const in7 = addDays(today, 7);
    const in30 = addDays(today, 30);

    const revenue = revenueForMonth(month, invoices.records, income.records);
    const wsMonth = workshopsInMonth(workshops.records, month);
    const pipe = pipeline(schools.records);
    const recv = receivables(invoices.records, today);
    const newLeads = leads.records.filter((l) => String(l.status ?? "new") === "new");

    const upcoming = upcomingWorkshops(workshops.records, today, in30);
    const followUps = followUpsDue(schools.records, in3);
    const mediaSoon = mediaDue(media.records, in7);
    const stock = lowStock(inventory.records);
    const myTasks = tasks.records.filter((t) => String(t.status) !== "done" && isMine(t.assignee, user)).sort(compareTasks);
    const openTasks = tasks.records.filter((t) => String(t.status) !== "done");
    const recentLeads = [...leads.records].sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))).slice(0, 5);

    const chart: ChartRow[] = lastMonths(today, 6).map((m) => ({
      month: m,
      label: monthLabel(m),
      revenue: revenueForMonth(m, invoices.records, income.records).total,
      expenses: expensesForMonth(m, expenses.records),
    }));

    const [y, mo, d] = today.split("-").map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();

    return {
      today,
      month,
      dayOfMonth: d,
      daysInMonth,
      revenue,
      wsMonth,
      pipe,
      recv,
      newLeads,
      upcoming,
      upcomingStudents: upcoming.reduce((a, w) => a + totalStudents(w), 0),
      upcomingWeek: upcoming.filter((w) => String(w.date) <= in7),
      followUps,
      followUpsOverdue: followUps.filter((x) => String(x.nextFollowUp).slice(0, 10) < today),
      mediaSoon,
      mediaOverdue: mediaSoon.filter((j) => String(j.dueDate).slice(0, 10) < today),
      stock,
      myTasks,
      myTasksDue: myTasks.filter((t) => t.dueDate && String(t.dueDate).slice(0, 10) <= today),
      openTasks,
      recentLeads,
      chart,
      overdueInvoices: invoices.records.filter((i) => isOverdueInvoice(i, today)),
    };
  }, [now, invoices.records, income.records, expenses.records, workshops.records, schools.records, leads.records, media.records, inventory.records, tasks.records, user]);

  const schoolLookup = useMemo(() => new Map<string, BaseRecord>(schools.records.map((r) => [r.id, r])), [schools.records]);
  const workshopLookup = useMemo(() => new Map<string, BaseRecord>(workshops.records.map((r) => [r.id, r])), [workshops.records]);

  return {
    user,
    store,
    now,
    money,
    leadership,
    settings,
    settingsLoading,
    userCount,
    d: derived,
    schoolLookup,
    workshopLookup,
    collections: { workshops, tasks, media, schools, leads, inventory, products, team, invoices, expenses, income },
  };
}

export type Dashboard = ReturnType<typeof useDashboard>;
