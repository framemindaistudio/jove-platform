import { ALL, DELIVERY_SIDE, LEADERSHIP, MEDIA_SIDE, OPS, OPS_MEDIA, OPS_TRAINER, STAFF, type Role } from "./roles";

export interface HqNavItem {
  label: string;
  href: string;
  icon: string; // lucide-react export name
  roles: Role[];
  description: string;
}

export interface HqNavGroup {
  title: string;
  items: HqNavItem[];
}

/** The HQ sidebar. Every module route lives under /hq. */
export const hqNav: HqNavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Command Center", href: "/hq", icon: "LayoutDashboard", roles: ALL, description: "Targets, pipeline, cash and what's next" },
      { label: "Tasks", href: "/hq/tasks", icon: "ListChecks", roles: ALL, description: "Shared to-do board" },
      { label: "Activity Log", href: "/hq/activity", icon: "History", roles: LEADERSHIP, description: "Every change, who made it, when" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Website Leads", href: "/hq/leads", icon: "Inbox", roles: OPS_MEDIA, description: "Enquiries from the public website" },
      { label: "Schools CRM", href: "/hq/crm", icon: "School", roles: OPS_MEDIA, description: "Pipeline from lead to partner" },
      { label: "Proposals", href: "/hq/proposals", icon: "FileSignature", roles: OPS_MEDIA, description: "Quotes & printable proposals" },
    ],
  },
  {
    title: "Delivery",
    items: [
      { label: "Workshops", href: "/hq/workshops", icon: "CalendarRange", roles: ALL, description: "Calendar, run sheets, checklists" },
      { label: "Travel & Transport", href: "/hq/travel", icon: "Truck", roles: OPS_TRAINER, description: "Trips, vehicles, travel costs" },
      { label: "Media Studio", href: "/hq/media", icon: "Clapperboard", roles: MEDIA_SIDE, description: "Reels, films, drone & content calendar" },
      { label: "Certificates", href: "/hq/certificates", icon: "Award", roles: DELIVERY_SIDE, description: "Bulk-issue & verify certificates" },
      { label: "Feedback & Testimonials", href: "/hq/reputation", icon: "MessageSquareHeart", roles: MEDIA_SIDE, description: "Feedback, testimonials, case studies" },
    ],
  },
  {
    title: "Money",
    items: [
      { label: "Finance", href: "/hq/finance", icon: "ReceiptIndianRupee", roles: OPS, description: "P&L, invoices, expenses, income" },
      { label: "Prices & Costs", href: "/hq/prices", icon: "BadgeIndianRupee", roles: OPS, description: "Kit costs, margins and every price customers pay" },
      { label: "Team & Payroll", href: "/hq/team", icon: "Users", roles: OPS_TRAINER, description: "People, salaries, payslips" },
      { label: "Business Planner", href: "/hq/planner", icon: "Calculator", roles: OPS, description: "Unit economics, targets, revenue streams" },
    ],
  },
  {
    title: "Product",
    items: [
      { label: "Kits & BOM", href: "/hq/kits", icon: "Cpu", roles: OPS_TRAINER, description: "Kit designs, bills of materials, costs" },
      { label: "Inventory & Vendors", href: "/hq/inventory", icon: "Boxes", roles: OPS_TRAINER, description: "Stock, purchase orders, suppliers" },
      { label: "Online Shop", href: "/hq/shop", icon: "ShoppingBag", roles: OPS, description: "Products & customer orders" },
    ],
  },
  {
    title: "Knowledge",
    items: [
      { label: "Curriculum", href: "/hq/curriculum", icon: "GraduationCap", roles: ALL, description: "Lesson plans by grade — print & download" },
      { label: "Operations Library", href: "/hq/docs", icon: "FolderOpen", roles: ALL, description: "SOPs, manuals, policies — versioned" },
      { label: "Printables", href: "/hq/printables", icon: "Printer", roles: ALL, description: "Certificates, badges, forms, letterhead" },
      { label: "File Vault", href: "/hq/files", icon: "Archive", roles: STAFF, description: "Receipts, signed forms, assets" },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/hq/settings", icon: "Settings", roles: LEADERSHIP, description: "Company profile, numbering, data" }],
  },
];

export function navForRole(role: Role) {
  return hqNav.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter((g) => g.items.length);
}

export function findNavItem(href: string) {
  for (const g of hqNav) for (const i of g.items) if (i.href === href) return i;
  return undefined;
}
