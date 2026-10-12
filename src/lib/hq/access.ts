import { LEADERSHIP, OPS, STAFF, isViewOnly, type Role, type SessionUser } from "./roles";
import type { CompanySettings } from "./settings";

/**
 * Which stored files a role may read through the document, file and history APIs, and how much of the company
 * settings it receives.
 *
 * Records in data/ are served only through /api/hq/collections, where each record type has its own rules —
 * reading the raw files would walk around them (payroll, invoices, settings), so only leadership may.
 */

/** Operations Library folders about money, people and management: visible to the roles that also see Finance. */
export const MANAGEMENT_FOLDERS = ["13_FINANCE", "19_HR_TEAM", "24_BUSINESS_PLAN", "27_IT_SYSTEMS", "28_MEETINGS_REVIEWS"];

/** What the interns login may open in the library: teaching and delivery material. Every other folder is staff-only. */
export const VIEWER_FOLDERS = [
  "01_BRAND",
  "02_CURRICULUM",
  "03_SOP",
  "04_TRAINER_MANUAL",
  "05_STUDENT_MATERIAL",
  "06_ROBOTICS_KITS",
  "11_CONTENT",
  "12_CERTIFICATES",
  "14_TESTIMONIALS",
  "15_CASE_STUDIES",
  "16_FEEDBACK",
  "25_MEDIA_PRODUCTION",
];
/** …except these documents inside them, which are about selling, money, hiring or suppliers (matched by file-name start). */
export const VIEWER_HIDDEN_FILES = [
  "03_SOP/03_", // lead-to-booking sales
  "03_SOP/05_", // booking confirmation and contracting
  "03_SOP/12_", // finance and accounts
  "03_SOP/16_", // online store fulfilment
  "03_SOP/18_", // trainer hiring
  "03_SOP/19_", // vendors and procurement
  "03_SOP/20_", // marketing execution
  "06_ROBOTICS_KITS/02_", // bill of materials and costing
  "06_ROBOTICS_KITS/09_", // classroom fleet plan (budget)
  "06_ROBOTICS_KITS/10_", // sourcing and vendors
  "06_ROBOTICS_KITS/KIT_BOM",
];

function segments(path: string) {
  return path.replace(/\\/g, "/").split("/").filter((p) => p && p !== ".");
}

export function canReadPath(role: Role, path: string): boolean {
  const parts = segments(path);
  if (parts.some((p) => p === "..")) return false;
  // compared without regard to case: a local (Windows / macOS) disk would open "operations/13_finance" just the same
  switch ((parts[0] ?? "").toLowerCase()) {
    case "operations": {
      const folder = (parts[1] ?? "").toUpperCase();
      if (role !== "viewer") return MANAGEMENT_FOLDERS.includes(folder) ? OPS.includes(role) : true;
      if (parts.length <= 2 && !VIEWER_FOLDERS.includes(folder)) return parts.length === 1 || /\.[a-z0-9]+$/i.test(parts[1]); // the root and its own files
      if (!VIEWER_FOLDERS.includes(folder)) return false;
      const inFolder = `${folder}/${(parts[2] ?? "").toUpperCase()}`;
      return !VIEWER_HIDDEN_FILES.some((hidden) => inFolder.startsWith(hidden.toUpperCase()));
    }
    case "vault":
      return STAFF.includes(role);
    case "data":
      return LEADERSHIP.includes(role);
    default:
      return false;
  }
}

/**
 * Whose change history a role may read. The log of the whole repository names every invoice, payslip, order and
 * uploaded file, so only leadership gets it; everyone else may see the history of one document they can open.
 */
export function canReadHistory(role: Role, path: string | undefined): boolean {
  if (LEADERSHIP.includes(role)) return true;
  if (!path) return false;
  const parts = segments(path);
  return parts.length >= 3 && /\.[a-z0-9]+$/i.test(parts[parts.length - 1]) && canReadPath(role, path);
}

/** The part of the company settings that appears on documents anyone may print. Tax, bank, numbering and targets stay with the roles that see Finance. */
const PROFILE_KEYS: (keyof CompanySettings)[] = ["legalName", "brandName", "addressLine1", "addressLine2", "city", "state", "stateCode", "pincode", "phone", "email", "website", "certificatePrefix", "financialYear", "signatoryName", "signatoryTitle", "baseLocation"];

export function settingsFor(role: Role, settings: CompanySettings): Partial<CompanySettings> {
  if (OPS.includes(role)) return settings;
  return Object.fromEntries(PROFILE_KEYS.map((k) => [k, settings[k]])) as Partial<CompanySettings>;
}

/**
 * What the screens are told about saving. For a view-only account `writable` is false, which is the switch every
 * module already uses to hide its edit controls; `viewOnly` lets the shell explain why.
 */
export function storeForUser<T extends { writable: boolean }>(store: T, user: Pick<SessionUser, "role">): T & { viewOnly: boolean } {
  const viewOnly = isViewOnly(user);
  return { ...store, writable: store.writable && !viewOnly, viewOnly };
}
