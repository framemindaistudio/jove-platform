import type { Metadata } from "next";
import { ActivityLog } from "./ActivityLog";

export const metadata: Metadata = { title: "Activity Log" };

/** Timeline of every saved change, read from the repository's commit history. */
export default function ActivityPage() {
  return <ActivityLog />;
}
