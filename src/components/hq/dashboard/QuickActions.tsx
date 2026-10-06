import Link from "next/link";
import { Award, BookOpenCheck, CalendarPlus, Clapperboard, FilePlus2, FolderOpen, Inbox, MessageSquareHeart, Printer, ReceiptIndianRupee, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { OPS, type Role } from "@/lib/hq/roles";
import { Widget } from "./Widget";

interface Action {
  label: string;
  hint: string;
  href: string;
  Icon: LucideIcon;
  roles: Role[];
}

/** Role-aware shortcuts: each one only shows when the role can act on that module. */
const ACTIONS: Action[] = [
  { label: "New lead", hint: "Add a school to the CRM", href: "/hq/crm", Icon: UserPlus, roles: OPS },
  { label: "Schedule workshop", hint: "Book a JOVE Day", href: "/hq/workshops", Icon: CalendarPlus, roles: OPS },
  { label: "New invoice", hint: "GST tax invoice", href: "/hq/finance", Icon: ReceiptIndianRupee, roles: OPS },
  { label: "Log expense", hint: "Fuel, kits, printing…", href: "/hq/finance", Icon: Wallet, roles: OPS },
  { label: "Issue certificates", hint: "Bulk, with QR verify", href: "/hq/certificates", Icon: Award, roles: [...OPS, "trainer"] },
  { label: "New proposal", hint: "Printable quotation", href: "/hq/proposals", Icon: FilePlus2, roles: OPS },
  { label: "Media deliverables", hint: "Reels, film, drone", href: "/hq/media", Icon: Clapperboard, roles: ["media"] },
  { label: "Website leads", hint: "Studio & media enquiries", href: "/hq/leads", Icon: Inbox, roles: ["media"] },
  { label: "Testimonials", hint: "Feedback & case studies", href: "/hq/reputation", Icon: MessageSquareHeart, roles: ["media"] },
  { label: "Lesson plans", hint: "Curriculum by grade", href: "/hq/curriculum", Icon: BookOpenCheck, roles: ["trainer"] },
  { label: "Printables", hint: "Badges, forms, letterhead", href: "/hq/printables", Icon: Printer, roles: ["trainer"] },
  { label: "Operations library", hint: "SOPs & manuals", href: "/hq/docs", Icon: FolderOpen, roles: ["trainer", "media", "viewer"] },
  { label: "Workshops", hint: "Calendar & run sheets", href: "/hq/workshops", Icon: CalendarPlus, roles: ["viewer"] },
  { label: "Media Studio", hint: "Reels, film, drone", href: "/hq/media", Icon: Clapperboard, roles: ["viewer"] },
  { label: "Lesson plans", hint: "Curriculum by grade", href: "/hq/curriculum", Icon: BookOpenCheck, roles: ["viewer"] },
  { label: "Printables", hint: "Badges, forms, letterhead", href: "/hq/printables", Icon: Printer, roles: ["viewer"] },
  { label: "Certificates", hint: "Registry & reprints", href: "/hq/certificates", Icon: Award, roles: ["viewer"] },
];

export function QuickActions({ index, role }: { index: string; role: Role }) {
  const actions = ACTIONS.filter((a) => a.roles.includes(role)).slice(0, 6);
  return (
    <Widget index={index} title="Quick actions" icon="LayoutDashboard">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-b-[var(--radius-md)] bg-graphite/10">
        {actions.map(({ label, hint, href, Icon }) => (
          <li key={label} className="bg-paper-50">
            <Link href={href} className="group flex h-full items-start gap-3 p-3.5 transition-colors hover:bg-graphite hover:text-paper sm:p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper transition-colors group-hover:border-paper/20 group-hover:bg-paper/10">
                <Icon className="size-4" strokeWidth={1.7} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">{label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-blueprint group-hover:text-paper/60">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  );
}
