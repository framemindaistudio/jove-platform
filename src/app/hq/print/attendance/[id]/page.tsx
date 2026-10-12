import type { Metadata } from "next";
import { AttendanceDoc } from "@/components/hq/workshops/AttendanceDoc";

export const metadata: Metadata = { title: "Attendance sheets" };

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AttendanceDoc id={id} />;
}
