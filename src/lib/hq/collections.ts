/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HQ COLLECTION REGISTRY
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every operational record in JOVE lives in   data/<collection>.json
 *  (a JSON array committed to the private GitHub repo).
 *  The field definitions below drive:
 *    • the generic table + form UI   (components/hq/CollectionManager)
 *    • server-side validation        (lib/hq/records.ts)
 *    • role-based access             (read / write roles)
 *  Modules may store extra keys on a record (e.g. a workshop checklist);
 *  unknown keys are preserved.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ALL, LEADERSHIP, OPS, OPS_MEDIA, OPS_TRAINER, type Role } from "./roles";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "month"
  | "time"
  | "select"
  | "multiselect"
  | "boolean"
  | "email"
  | "phone"
  | "url"
  | "ref"
  | "tags"
  | "lineItems";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  /** for type "ref": target collection name */
  ref?: string;
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** form layout width on md+ screens */
  width?: "full" | "half" | "third";
  /** show as a column in the default table */
  table?: boolean;
  /** hide in the generic form (module manages it) */
  hidden?: boolean;
  default?: unknown;
}

export interface CollectionDef {
  name: string;
  label: string;
  singular: string;
  description: string;
  /** lucide icon name (resolved in the UI) */
  icon: string;
  titleField: string;
  subtitleField?: string;
  sortField?: string;
  sortDir?: "asc" | "desc";
  read: Role[];
  write: Role[];
  fields: FieldDef[];
  /** id prefix, e.g. "sch" → sch_k3z9x1a7f2 */
  idPrefix: string;
}

export interface BaseRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
}

export interface LineItem {
  description: string;
  qty: number;
  rate: number;
  sac?: string;
}

const opts = (...values: (string | [string, string])[]): FieldOption[] =>
  values.map((v) => (Array.isArray(v) ? { value: v[0], label: v[1] } : { value: v, label: v.replace(/(^|-)(\w)/g, (_, s, c) => (s ? " " : "") + c.toUpperCase()) }));

export const SCHOOL_STAGES = opts(
  ["lead", "Lead"],
  ["contacted", "Contacted"],
  ["meeting", "Meeting set"],
  ["proposal", "Proposal sent"],
  ["negotiation", "Negotiation"],
  ["won", "Won"],
  ["lost", "Lost"],
  ["nurture", "Nurture later"],
);

export const EXPENSE_CATEGORIES = opts(
  "Kits & components",
  "Travel & fuel",
  "Food & refreshments",
  "Accommodation",
  "Printing & branding",
  "Salaries & stipends",
  "Freelance trainers",
  "Marketing & ads",
  "Software & subscriptions",
  "Rent & storage",
  "Equipment & tools",
  "Media production",
  "Legal & compliance",
  "Bank & payment charges",
  "Miscellaneous",
);

const GRADE_BAND_OPTS = opts(["g1-2", "Grades 1–2"], ["g3-5", "Grades 3–5"], ["g6-8", "Grades 6–8"], ["g9-10", "Grades 9–10"]);
const PACKAGE_OPTS = opts(["jove-day", "JOVE Day"], ["jove-quarter", "JOVE Quarter"], ["jove-year", "JOVE Year"], ["jove-club", "JOVE Club"], ["custom", "Custom"]);
const KIT_OPTS = opts(["spark", "Spark Kit"], ["explorer", "Explorer Kit"], ["builder", "Builder Kit"], ["innovator", "Innovator AI Kit"]);
const PAY_MODES = opts(["upi", "UPI"], ["bank", "Bank transfer"], ["cheque", "Cheque"], ["card", "Card"], ["cash", "Cash"], ["gateway", "Payment gateway"]);

export const collections: CollectionDef[] = [
  /* ── Sales & CRM ─────────────────────────────────────────────────────── */
  {
    name: "schools",
    label: "Schools",
    singular: "School",
    description: "Every school in the pipeline — from first lead to long-term partner.",
    icon: "School",
    titleField: "name",
    subtitleField: "city",
    sortField: "updatedAt",
    sortDir: "desc",
    idPrefix: "sch",
    read: OPS_MEDIA,
    write: OPS,
    fields: [
      { key: "name", label: "School name", type: "text", required: true, table: true, width: "full" },
      { key: "stage", label: "Stage", type: "select", options: SCHOOL_STAGES, default: "lead", table: true, width: "third" },
      { key: "board", label: "Board", type: "select", options: opts("CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"), width: "third" },
      { key: "schoolType", label: "Type", type: "select", options: opts("Private", "Government", "Aided", "International", "Residential"), width: "third" },
      { key: "city", label: "City", type: "text", table: true, width: "third" },
      { key: "area", label: "Area / locality", type: "text", width: "third" },
      { key: "distanceKm", label: "Distance from base (km)", type: "number", width: "third" },
      { key: "address", label: "Address", type: "textarea", width: "full" },
      { key: "principalName", label: "Principal", type: "text", width: "half" },
      { key: "contactName", label: "Key contact", type: "text", table: true, width: "half" },
      { key: "contactRole", label: "Contact role", type: "text", placeholder: "e.g. Correspondent, Science HOD", width: "half" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "half" },
      { key: "email", label: "Email", type: "email", width: "half" },
      { key: "website", label: "Website", type: "url", width: "half" },
      { key: "studentsTotal", label: "Total students (Gr 1–10)", type: "number", width: "third" },
      { key: "studentsG12", label: "Students Gr 1–2", type: "number", width: "third" },
      { key: "studentsG35", label: "Students Gr 3–5", type: "number", width: "third" },
      { key: "studentsG68", label: "Students Gr 6–8", type: "number", width: "third" },
      { key: "studentsG910", label: "Students Gr 9–10", type: "number", width: "third" },
      { key: "feeBand", label: "Annual fee band", type: "select", options: opts("< ₹30K", "₹30K–₹60K", "₹60K–₹1L", "₹1L–₹2L", "> ₹2L"), width: "third" },
      { key: "dealValue", label: "Expected deal value", type: "currency", table: true, width: "third" },
      { key: "interestedIn", label: "Interested in", type: "multiselect", options: PACKAGE_OPTS, width: "half" },
      { key: "source", label: "Lead source", type: "select", options: opts("Website", "Referral", "Cold visit", "Cold call", "Event", "Instagram", "WhatsApp", "Existing network", "Other"), width: "half" },
      { key: "owner", label: "Owner", type: "text", placeholder: "Who is closing this school", width: "third" },
      { key: "lastContact", label: "Last contact", type: "date", width: "third" },
      { key: "nextFollowUp", label: "Next follow-up", type: "date", table: true, width: "third" },
      { key: "lostReason", label: "Lost / nurture reason", type: "text", width: "full" },
      { key: "tags", label: "Tags", type: "tags", width: "full" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "activities",
    label: "Activities",
    singular: "Activity",
    description: "Calls, visits, demos and follow-ups logged against schools.",
    icon: "PhoneCall",
    titleField: "summary",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "act",
    read: OPS_MEDIA,
    write: OPS,
    fields: [
      { key: "schoolId", label: "School", type: "ref", ref: "schools", required: true, table: true, width: "half" },
      { key: "type", label: "Type", type: "select", options: opts("Call", "Visit", "Meeting", "Demo", "Email", "WhatsApp", "Proposal", "Note"), table: true, width: "third" },
      { key: "date", label: "Date", type: "date", table: true, width: "third" },
      { key: "summary", label: "Summary", type: "text", required: true, table: true, width: "full" },
      { key: "outcome", label: "Outcome", type: "select", options: opts("Positive", "Neutral", "Negative", "No response"), table: true, width: "third" },
      { key: "nextStep", label: "Next step", type: "text", width: "half" },
      { key: "nextDate", label: "Next step date", type: "date", width: "third" },
      { key: "by", label: "Logged by", type: "text", width: "third" },
      { key: "details", label: "Details", type: "textarea", width: "full" },
    ],
  },
  {
    name: "leads",
    label: "Website Leads",
    singular: "Lead",
    description: "Everything submitted through the public website — enquiries, trainer applications, contact messages.",
    icon: "Inbox",
    titleField: "name",
    subtitleField: "organisation",
    sortField: "createdAt",
    sortDir: "desc",
    idPrefix: "lead",
    read: OPS_MEDIA,
    write: OPS,
    fields: [
      { key: "kind", label: "Type", type: "select", options: opts(["workshop", "Workshop enquiry"], ["trainer", "Trainer application"], ["contact", "General contact"], ["kits", "Bulk kit enquiry"], ["studio", "Studio / media enquiry"], ["partner", "Partnership"]), table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts(["new", "New"], ["in-progress", "In progress"], ["converted", "Converted"], ["closed", "Closed"], ["spam", "Spam"]), default: "new", table: true, width: "third" },
      { key: "name", label: "Name", type: "text", required: true, table: true, width: "third" },
      { key: "organisation", label: "School / organisation", type: "text", table: true, width: "half" },
      { key: "role", label: "Role", type: "text", width: "half" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "third" },
      { key: "email", label: "Email", type: "email", width: "third" },
      { key: "city", label: "City", type: "text", table: true, width: "third" },
      { key: "students", label: "Approx. students", type: "number", width: "third" },
      { key: "gradeBands", label: "Grade groups", type: "multiselect", options: GRADE_BAND_OPTS, width: "third" },
      { key: "package", label: "Interested in", type: "select", options: PACKAGE_OPTS, width: "third" },
      { key: "preferredDate", label: "Preferred date", type: "date", width: "third" },
      { key: "message", label: "Message", type: "textarea", width: "full" },
      { key: "page", label: "Submitted from", type: "text", width: "half" },
      { key: "schoolId", label: "Converted to school", type: "ref", ref: "schools", width: "half" },
    ],
  },
  {
    name: "proposals",
    label: "Proposals",
    singular: "Proposal",
    description: "Quotations and proposals sent to schools — printable.",
    icon: "FileSignature",
    titleField: "number",
    subtitleField: "schoolId",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "prp",
    read: OPS_MEDIA,
    write: OPS,
    fields: [
      { key: "number", label: "Proposal no.", type: "text", table: true, width: "third" },
      { key: "date", label: "Date", type: "date", table: true, width: "third" },
      { key: "validUntil", label: "Valid until", type: "date", width: "third" },
      { key: "schoolId", label: "School", type: "ref", ref: "schools", required: true, table: true, width: "half" },
      { key: "packageId", label: "Package", type: "select", options: PACKAGE_OPTS, table: true, width: "half" },
      { key: "studentsG12", label: "Students Gr 1–2", type: "number", width: "third" },
      { key: "studentsG35", label: "Students Gr 3–5", type: "number", width: "third" },
      { key: "studentsG68", label: "Students Gr 6–8", type: "number", width: "third" },
      { key: "studentsG910", label: "Students Gr 9–10", type: "number", width: "third" },
      { key: "discountPercent", label: "Discount %", type: "percent", width: "third" },
      { key: "addOns", label: "Add-ons", type: "multiselect", options: opts(["smm-starter", "SMM Starter"], ["smm-growth", "SMM Growth"], ["smm-premium", "SMM Premium"], ["film-admissions", "Admissions film"], ["film-premium", "Premium brand film"], ["teacher-training", "Teacher training"], ["take-home-kits", "Take-home kits"], ["lab-setup", "Lab setup"]), width: "full" },
      { key: "extraItems", label: "Extra line items", type: "lineItems", width: "full" },
      { key: "total", label: "Total (ex-GST)", type: "currency", table: true, width: "third", help: "Auto-calculated in the proposal builder" },
      { key: "status", label: "Status", type: "select", options: opts("draft", "sent", "accepted", "rejected", "expired"), default: "draft", table: true, width: "third" },
      { key: "notes", label: "Notes / special terms", type: "textarea", width: "full" },
    ],
  },

  /* ── Delivery ────────────────────────────────────────────────────────── */
  {
    name: "workshops",
    label: "Workshops",
    singular: "Workshop",
    description: "Every JOVE Day, Quarter and Club session — planning, run sheet and wrap-up.",
    icon: "CalendarRange",
    titleField: "title",
    subtitleField: "schoolId",
    sortField: "date",
    sortDir: "asc",
    idPrefix: "wks",
    read: ALL,
    write: OPS,
    fields: [
      { key: "title", label: "Title", type: "text", required: true, placeholder: "e.g. JOVE Day — Sri Vidya School", table: true, width: "full" },
      { key: "schoolId", label: "School", type: "ref", ref: "schools", table: true, width: "half" },
      { key: "package", label: "Package", type: "select", options: PACKAGE_OPTS, default: "jove-day", width: "half" },
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "startTime", label: "Report time", type: "time", default: "07:30", width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("tentative", "confirmed", "completed", "postponed", "cancelled"), default: "tentative", table: true, width: "third" },
      { key: "studentsG12", label: "Students Gr 1–2", type: "number", width: "third" },
      { key: "studentsG35", label: "Students Gr 3–5", type: "number", width: "third" },
      { key: "studentsG68", label: "Students Gr 6–8", type: "number", width: "third" },
      { key: "studentsG910", label: "Students Gr 9–10", type: "number", width: "third" },
      { key: "agreedAmount", label: "Agreed amount (ex-GST)", type: "currency", table: true, width: "third" },
      { key: "advanceReceived", label: "Advance received", type: "currency", width: "third" },
      { key: "leadTrainer", label: "Lead", type: "text", width: "third" },
      { key: "team", label: "Team on site", type: "tags", width: "full", help: "Names of everyone travelling" },
      { key: "venue", label: "Venue notes (halls, power, projector)", type: "textarea", width: "full" },
      { key: "distanceKm", label: "Distance (km, one way)", type: "number", width: "third" },
      { key: "vehicle", label: "Vehicle", type: "text", width: "third" },
      { key: "departTime", label: "Depart base at", type: "time", width: "third" },
      { key: "schoolContact", label: "On-day school contact", type: "text", width: "half" },
      { key: "schoolContactPhone", label: "Contact phone", type: "phone", width: "half" },
      { key: "mediaPack", label: "Media Pack included", type: "boolean", default: true, width: "third" },
      { key: "droneAllowed", label: "Drone permission", type: "select", options: opts("Pending", "Granted", "Not allowed"), default: "Pending", width: "third" },
      { key: "consentCollected", label: "Photo consent collected", type: "boolean", width: "third" },
      { key: "feedbackScore", label: "Avg feedback (1–5)", type: "number", width: "third" },
      { key: "report", label: "Post-workshop report", type: "textarea", width: "full" },
      { key: "notes", label: "Internal notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "mediaJobs",
    label: "Media Deliverables",
    singular: "Deliverable",
    description: "Reels, films, drone shots and photos promised to each school.",
    icon: "Clapperboard",
    titleField: "title",
    subtitleField: "workshopId",
    sortField: "dueDate",
    sortDir: "asc",
    idPrefix: "med",
    read: ALL,
    write: OPS_MEDIA,
    fields: [
      { key: "workshopId", label: "Workshop", type: "ref", ref: "workshops", table: true, width: "half" },
      { key: "deliverable", label: "Deliverable", type: "select", options: opts("Reel", "Full-day film", "Drone shots", "Photos", "Testimonial clip", "Posting kit", "Admissions film", "Other"), table: true, width: "half" },
      { key: "title", label: "Title", type: "text", required: true, table: true, width: "full" },
      { key: "status", label: "Status", type: "select", options: opts("planned", "shot", "editing", "review", "delivered", "posted"), default: "planned", table: true, width: "third" },
      { key: "dueDate", label: "Due", type: "date", table: true, width: "third" },
      { key: "assignee", label: "Assignee", type: "text", width: "third" },
      { key: "link", label: "Link (Drive / YouTube / Instagram)", type: "url", width: "full" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "contentCalendar",
    label: "Content Calendar",
    singular: "Post",
    description: "JOVE's own social media pipeline.",
    icon: "CalendarHeart",
    titleField: "title",
    sortField: "date",
    sortDir: "asc",
    idPrefix: "post",
    read: OPS_MEDIA,
    write: OPS_MEDIA,
    fields: [
      { key: "date", label: "Publish date", type: "date", table: true, width: "third" },
      { key: "platform", label: "Platform", type: "select", options: opts("Instagram", "YouTube", "LinkedIn", "Facebook", "WhatsApp", "X"), table: true, width: "third" },
      { key: "format", label: "Format", type: "select", options: opts("Reel", "Post", "Carousel", "Story", "Short", "Long video", "Article"), table: true, width: "third" },
      { key: "title", label: "Title / hook", type: "text", required: true, table: true, width: "full" },
      { key: "pillar", label: "Content pillar", type: "select", options: opts("Workshop highlights", "Student wins", "Behind the scenes", "STEM tips", "Founder story", "Product / kits", "Virtual labs", "Testimonials"), width: "half" },
      { key: "status", label: "Status", type: "select", options: opts("idea", "scripted", "shot", "edited", "scheduled", "published"), default: "idea", table: true, width: "half" },
      { key: "caption", label: "Caption", type: "textarea", width: "full" },
      { key: "link", label: "Published link", type: "url", width: "full" },
      { key: "owner", label: "Owner", type: "text", width: "half" },
    ],
  },
  {
    name: "trips",
    label: "Travel & Transport",
    singular: "Trip",
    description: "Every trip to a school — vehicle, distance, costs and team.",
    icon: "Truck",
    titleField: "to",
    subtitleField: "date",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "trp",
    read: OPS_TRAINER,
    write: OPS,
    fields: [
      { key: "workshopId", label: "Workshop", type: "ref", ref: "workshops", width: "half" },
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("planned", "done", "cancelled"), default: "planned", table: true, width: "third" },
      { key: "from", label: "From", type: "text", default: "Base", width: "third" },
      { key: "to", label: "To", type: "text", required: true, table: true, width: "third" },
      { key: "distanceKm", label: "Round-trip distance (km)", type: "number", table: true, width: "third" },
      { key: "vehicle", label: "Vehicle", type: "select", options: opts("Own car", "Rented tempo traveller", "Rented car + driver", "Cab", "Bus / train", "Two-wheeler", "Courier only"), width: "third" },
      { key: "driver", label: "Driver", type: "text", width: "third" },
      { key: "team", label: "Team travelling", type: "tags", width: "full" },
      { key: "fuelCost", label: "Fuel", type: "currency", width: "third" },
      { key: "vehicleRent", label: "Vehicle rent", type: "currency", width: "third" },
      { key: "tollParking", label: "Toll & parking", type: "currency", width: "third" },
      { key: "accommodation", label: "Accommodation", type: "currency", width: "third" },
      { key: "food", label: "Food", type: "currency", width: "third" },
      { key: "otherCost", label: "Other", type: "currency", width: "third" },
      { key: "departTime", label: "Depart", type: "time", width: "third" },
      { key: "returnTime", label: "Return", type: "time", width: "third" },
      { key: "notes", label: "Notes (route, stay, contacts)", type: "textarea", width: "full" },
    ],
  },
  {
    name: "tasks",
    label: "Tasks",
    singular: "Task",
    description: "The founders' shared to-do board.",
    icon: "ListChecks",
    titleField: "title",
    sortField: "dueDate",
    sortDir: "asc",
    idPrefix: "tsk",
    read: ALL,
    write: ALL,
    fields: [
      { key: "title", label: "Task", type: "text", required: true, table: true, width: "full" },
      { key: "status", label: "Status", type: "select", options: opts(["todo", "To do"], ["doing", "Doing"], ["blocked", "Blocked"], ["done", "Done"]), default: "todo", table: true, width: "third" },
      { key: "priority", label: "Priority", type: "select", options: opts("low", "medium", "high", "urgent"), default: "medium", table: true, width: "third" },
      { key: "area", label: "Area", type: "select", options: opts("Sales", "Operations", "Finance", "Media", "Curriculum", "Kits", "Tech", "Admin", "Hiring"), table: true, width: "third" },
      { key: "assignee", label: "Assignee", type: "text", table: true, width: "half" },
      { key: "dueDate", label: "Due", type: "date", table: true, width: "half" },
      { key: "description", label: "Details", type: "textarea", width: "full" },
    ],
  },

  /* ── Finance ─────────────────────────────────────────────────────────── */
  {
    name: "invoices",
    label: "Invoices",
    singular: "Invoice",
    description: "Tax invoices to schools and customers, with payments received.",
    icon: "ReceiptIndianRupee",
    titleField: "number",
    subtitleField: "customerName",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "inv",
    read: OPS,
    write: OPS,
    fields: [
      { key: "number", label: "Invoice no.", type: "text", table: true, width: "third", help: "Auto-assigned from Settings if left empty" },
      { key: "date", label: "Invoice date", type: "date", required: true, table: true, width: "third" },
      { key: "dueDate", label: "Due date", type: "date", width: "third" },
      { key: "schoolId", label: "School", type: "ref", ref: "schools", width: "half" },
      { key: "workshopId", label: "Workshop", type: "ref", ref: "workshops", width: "half" },
      { key: "customerName", label: "Bill to (name)", type: "text", required: true, table: true, width: "half" },
      { key: "customerGstin", label: "Customer GSTIN", type: "text", width: "half" },
      { key: "customerAddress", label: "Billing address", type: "textarea", width: "full" },
      { key: "placeOfSupply", label: "Place of supply (state)", type: "text", width: "half" },
      { key: "gstPercent", label: "GST %", type: "percent", default: 18, width: "third" },
      { key: "discount", label: "Discount (₹)", type: "currency", width: "third" },
      { key: "items", label: "Line items", type: "lineItems", width: "full" },
      { key: "status", label: "Status", type: "select", options: opts("draft", "sent", "partially-paid", "paid", "overdue", "cancelled"), default: "draft", table: true, width: "third" },
      { key: "total", label: "Total (incl. GST)", type: "currency", table: true, width: "third", help: "Calculated from line items" },
      { key: "amountPaid", label: "Amount received", type: "currency", table: true, width: "third" },
      { key: "notes", label: "Notes on invoice", type: "textarea", width: "full" },
    ],
  },
  {
    name: "expenses",
    label: "Expenses",
    singular: "Expense",
    description: "Every rupee spent — categorised, linked to workshops, with receipts.",
    icon: "Wallet",
    titleField: "description",
    subtitleField: "category",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "exp",
    read: OPS,
    write: OPS,
    fields: [
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "category", label: "Category", type: "select", options: EXPENSE_CATEGORIES, required: true, table: true, width: "third" },
      { key: "amount", label: "Amount (₹, incl. tax)", type: "currency", required: true, table: true, width: "third" },
      { key: "description", label: "Description", type: "text", required: true, table: true, width: "full" },
      { key: "vendor", label: "Paid to", type: "text", width: "half" },
      { key: "workshopId", label: "Workshop (if direct cost)", type: "ref", ref: "workshops", width: "half" },
      { key: "paidBy", label: "Paid by", type: "select", options: opts("Company account", "Shivaprasad", "Chinmay", "Cash box"), table: true, width: "third" },
      { key: "mode", label: "Mode", type: "select", options: PAY_MODES, width: "third" },
      { key: "gstAmount", label: "GST in bill (₹)", type: "currency", width: "third" },
      { key: "reimbursable", label: "Needs reimbursement", type: "boolean", width: "third" },
      { key: "reimbursed", label: "Reimbursed", type: "boolean", width: "third" },
      { key: "receipt", label: "Receipt (vault path or link)", type: "text", width: "third" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "income",
    label: "Other Income",
    singular: "Receipt",
    description: "Money received outside invoices — kit sales, studio retainers, courses.",
    icon: "IndianRupee",
    titleField: "description",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "inc",
    read: OPS,
    write: OPS,
    fields: [
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "stream", label: "Revenue stream", type: "select", options: opts("Workshops", "Kits — school", "Kits — online", "Social media mgmt", "Films & shoots", "Online courses", "Teacher training", "Camps", "Lab setup", "Sponsorship", "Other"), table: true, width: "third" },
      { key: "amount", label: "Amount (₹)", type: "currency", required: true, table: true, width: "third" },
      { key: "description", label: "Description", type: "text", required: true, table: true, width: "full" },
      { key: "from", label: "Received from", type: "text", width: "half" },
      { key: "mode", label: "Mode", type: "select", options: PAY_MODES, width: "half" },
      { key: "reference", label: "Reference / UTR", type: "text", width: "half" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "team",
    label: "Team",
    singular: "Member",
    description: "Founders, trainers, freelancers and interns.",
    icon: "Users",
    titleField: "name",
    subtitleField: "role",
    sortField: "name",
    sortDir: "asc",
    idPrefix: "tm",
    read: OPS_TRAINER,
    write: LEADERSHIP,
    fields: [
      { key: "name", label: "Full name", type: "text", required: true, table: true, width: "half" },
      { key: "role", label: "Role", type: "select", options: opts("Founder & CEO", "Co-Founder & CCO", "Lead Trainer", "Trainer", "Freelance Trainer", "Media / Editor", "Operations", "Intern"), table: true, width: "half" },
      { key: "type", label: "Engagement", type: "select", options: opts("Full-time", "Part-time", "Freelance", "Intern"), table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("onboarding", "active", "inactive"), default: "active", table: true, width: "third" },
      { key: "joinDate", label: "Joined", type: "date", width: "third" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "third" },
      { key: "email", label: "Email", type: "email", width: "third" },
      { key: "city", label: "City", type: "text", width: "third" },
      { key: "monthlyPay", label: "Monthly salary / stipend", type: "currency", width: "third" },
      { key: "perWorkshopRate", label: "Per-workshop rate", type: "currency", width: "third" },
      { key: "payoutDetails", label: "Payout (UPI ID / bank last 4)", type: "text", width: "third", help: "Avoid storing full account numbers" },
      { key: "skills", label: "Skills", type: "tags", width: "full" },
      { key: "backgroundVerified", label: "Background verified", type: "boolean", width: "third" },
      { key: "safetyTrained", label: "Safety & child-protection trained", type: "boolean", width: "third" },
      { key: "agreementSigned", label: "Agreement / NDA signed", type: "boolean", width: "third" },
      { key: "emergencyContact", label: "Emergency contact", type: "text", width: "full" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "payroll",
    label: "Payroll",
    singular: "Payslip",
    description: "Monthly pay runs — salaries, per-workshop pay, deductions, payslips.",
    icon: "BadgeIndianRupee",
    titleField: "memberId",
    subtitleField: "month",
    sortField: "month",
    sortDir: "desc",
    idPrefix: "pay",
    read: LEADERSHIP,
    write: LEADERSHIP,
    fields: [
      { key: "month", label: "Month", type: "month", required: true, table: true, width: "third" },
      { key: "memberId", label: "Team member", type: "ref", ref: "team", required: true, table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("pending", "paid", "on-hold"), default: "pending", table: true, width: "third" },
      { key: "fixedPay", label: "Fixed pay", type: "currency", width: "third" },
      { key: "workshops", label: "Workshops done", type: "number", width: "third" },
      { key: "perWorkshopRate", label: "Rate per workshop", type: "currency", width: "third" },
      { key: "allowances", label: "Travel & other allowances", type: "currency", width: "third" },
      { key: "bonus", label: "Bonus / incentive", type: "currency", width: "third" },
      { key: "deductions", label: "Deductions / advances", type: "currency", width: "third" },
      { key: "tds", label: "TDS", type: "currency", width: "third" },
      { key: "netPay", label: "Net pay", type: "currency", table: true, width: "third", help: "Calculated" },
      { key: "paidOn", label: "Paid on", type: "date", width: "third" },
      { key: "mode", label: "Mode", type: "select", options: PAY_MODES, width: "third" },
      { key: "reference", label: "Reference / UTR", type: "text", width: "third" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },

  /* ── Kits, inventory & shop ──────────────────────────────────────────── */
  {
    name: "inventory",
    label: "Inventory",
    singular: "Item",
    description: "Components, tools, printed material and demo equipment in stock.",
    icon: "Boxes",
    titleField: "name",
    subtitleField: "category",
    sortField: "name",
    sortDir: "asc",
    idPrefix: "itm",
    read: OPS_TRAINER,
    write: OPS,
    fields: [
      { key: "name", label: "Item", type: "text", required: true, table: true, width: "half" },
      { key: "sku", label: "SKU / code", type: "text", width: "half" },
      { key: "category", label: "Category", type: "select", options: opts("Microcontrollers", "Sensors", "Motors & actuators", "Power", "Wires & connectors", "Mechanical", "Consumables", "Tools", "Printed material", "Packaging", "Finished kits", "Demo equipment", "AV & electronics"), table: true, width: "half" },
      { key: "location", label: "Location", type: "text", placeholder: "e.g. Store shelf B2 / Crate 3", width: "half" },
      { key: "unit", label: "Unit", type: "select", options: opts("pcs", "sets", "packs", "metres", "boxes", "kits"), default: "pcs", width: "third" },
      { key: "stockQty", label: "In stock", type: "number", table: true, width: "third" },
      { key: "reorderLevel", label: "Reorder at", type: "number", table: true, width: "third" },
      { key: "unitCost", label: "Unit cost", type: "currency", table: true, width: "third" },
      { key: "vendorId", label: "Preferred vendor", type: "ref", ref: "vendors", width: "half" },
      { key: "usedIn", label: "Used in kits", type: "multiselect", options: KIT_OPTS, width: "full" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "vendors",
    label: "Vendors",
    singular: "Vendor",
    description: "Suppliers for components, printing, packaging, transport and services.",
    icon: "Store",
    titleField: "name",
    subtitleField: "category",
    sortField: "name",
    sortDir: "asc",
    idPrefix: "ven",
    read: OPS,
    write: OPS,
    fields: [
      { key: "name", label: "Vendor", type: "text", required: true, table: true, width: "half" },
      { key: "category", label: "Category", type: "select", options: opts("Electronics components", "Printing", "Packaging", "Laser cutting", "Transport", "Travel & stay", "Merchandise", "Equipment", "Services", "Other"), table: true, width: "half" },
      { key: "contactName", label: "Contact person", type: "text", width: "third" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "third" },
      { key: "email", label: "Email", type: "email", width: "third" },
      { key: "website", label: "Website", type: "url", width: "half" },
      { key: "city", label: "City", type: "text", table: true, width: "half" },
      { key: "gstin", label: "GSTIN", type: "text", width: "third" },
      { key: "paymentTerms", label: "Payment terms", type: "text", width: "third" },
      { key: "rating", label: "Rating (1–5)", type: "number", table: true, width: "third" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "purchases",
    label: "Purchase Orders",
    singular: "Purchase",
    description: "Orders placed with vendors — what, how much, when it arrives.",
    icon: "ShoppingCart",
    titleField: "poNumber",
    subtitleField: "vendorId",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "po",
    read: OPS,
    write: OPS,
    fields: [
      { key: "poNumber", label: "PO no.", type: "text", table: true, width: "third" },
      { key: "date", label: "Order date", type: "date", required: true, table: true, width: "third" },
      { key: "expectedDate", label: "Expected", type: "date", width: "third" },
      { key: "vendorId", label: "Vendor", type: "ref", ref: "vendors", table: true, width: "half" },
      { key: "status", label: "Status", type: "select", options: opts("draft", "ordered", "received", "cancelled"), default: "draft", table: true, width: "half" },
      { key: "items", label: "Items", type: "lineItems", width: "full" },
      { key: "shipping", label: "Shipping", type: "currency", width: "third" },
      { key: "total", label: "Total", type: "currency", table: true, width: "third", help: "Calculated" },
      { key: "paid", label: "Paid", type: "boolean", table: true, width: "third" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "kitBatches",
    label: "Kit Assembly",
    singular: "Batch",
    description: "Kit assembly batches — planned, in progress, ready to ship.",
    icon: "PackageCheck",
    titleField: "kitId",
    subtitleField: "qty",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "kb",
    read: OPS_TRAINER,
    write: OPS,
    fields: [
      { key: "kitId", label: "Kit", type: "select", options: KIT_OPTS, required: true, table: true, width: "third" },
      { key: "qty", label: "Quantity", type: "number", required: true, table: true, width: "third" },
      { key: "date", label: "Date", type: "date", table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("planned", "in-progress", "ready", "dispatched"), default: "planned", table: true, width: "third" },
      { key: "destination", label: "For", type: "select", options: opts("Stock", "School order", "Online orders", "Workshop fleet"), width: "third" },
      { key: "workshopId", label: "Workshop", type: "ref", ref: "workshops", width: "third" },
      { key: "assembledBy", label: "Assembled by", type: "text", width: "half" },
      { key: "qcPassed", label: "QC passed", type: "boolean", width: "half" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "products",
    label: "Shop Products",
    singular: "Product",
    description: "What the public online store sells. Active products appear on /shop.",
    icon: "ShoppingBag",
    titleField: "name",
    subtitleField: "category",
    sortField: "sort",
    sortDir: "asc",
    idPrefix: "prd",
    read: OPS_MEDIA,
    write: OPS,
    fields: [
      { key: "name", label: "Product name", type: "text", required: true, table: true, width: "half" },
      { key: "slug", label: "URL slug", type: "text", required: true, width: "half", help: "shop/<slug>" },
      { key: "category", label: "Category", type: "select", options: opts("Kits", "Add-on packs", "Merchandise", "Online courses", "Bundles"), table: true, width: "third" },
      { key: "kitId", label: "Linked kit (for BOM)", type: "select", options: KIT_OPTS, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("active", "draft", "out-of-stock"), default: "draft", table: true, width: "third" },
      { key: "price", label: "Price (MRP, incl. GST)", type: "currency", required: true, table: true, width: "third" },
      { key: "compareAt", label: "Compare-at price", type: "currency", width: "third" },
      { key: "stock", label: "Stock", type: "number", table: true, width: "third" },
      { key: "grades", label: "Grades / ages", type: "text", width: "half" },
      { key: "image", label: "Image path", type: "text", placeholder: "/images/kits/kit-spark.webp", width: "half" },
      { key: "short", label: "Short description", type: "text", width: "full" },
      { key: "description", label: "Full description", type: "textarea", width: "full" },
      { key: "highlights", label: "Highlights", type: "tags", width: "full" },
      { key: "inTheBox", label: "In the box", type: "tags", width: "full" },
      { key: "paymentLink", label: "Payment link (Razorpay / UPI page)", type: "url", width: "full", help: "Optional — shown as 'Pay now' after an order is placed" },
      { key: "weightGrams", label: "Shipping weight (g)", type: "number", width: "third" },
      { key: "sort", label: "Sort order", type: "number", width: "third" },
    ],
  },
  {
    name: "orders",
    label: "Shop Orders",
    singular: "Order",
    description: "Orders placed on the public online store.",
    icon: "Package",
    titleField: "number",
    subtitleField: "customerName",
    sortField: "createdAt",
    sortDir: "desc",
    idPrefix: "ord",
    read: OPS,
    write: OPS,
    fields: [
      { key: "number", label: "Order no.", type: "text", table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("new", "confirmed", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"), default: "new", table: true, width: "third" },
      { key: "total", label: "Total", type: "currency", table: true, width: "third" },
      { key: "customerName", label: "Customer", type: "text", required: true, table: true, width: "half" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "half" },
      { key: "email", label: "Email", type: "email", width: "half" },
      { key: "city", label: "City", type: "text", width: "half" },
      { key: "address", label: "Shipping address", type: "textarea", width: "full" },
      { key: "pincode", label: "PIN code", type: "text", width: "third" },
      { key: "items", label: "Items", type: "lineItems", width: "full" },
      { key: "shipping", label: "Shipping", type: "currency", width: "third" },
      { key: "paymentMode", label: "Payment", type: "select", options: PAY_MODES, width: "third" },
      { key: "paymentRef", label: "Payment ref", type: "text", width: "third" },
      { key: "courier", label: "Courier", type: "text", width: "half" },
      { key: "awb", label: "Tracking / AWB", type: "text", width: "half" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },

  /* ── Reputation ──────────────────────────────────────────────────────── */
  {
    name: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    description: "Quotes from principals, teachers, parents and students. Published ones appear on the website.",
    icon: "Quote",
    titleField: "name",
    subtitleField: "organisation",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "tst",
    read: OPS_MEDIA,
    write: OPS_MEDIA,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, table: true, width: "half" },
      { key: "role", label: "Role", type: "text", placeholder: "Principal, Parent, Grade 8 student…", table: true, width: "half" },
      { key: "organisation", label: "School / organisation", type: "text", table: true, width: "half" },
      { key: "date", label: "Date", type: "date", width: "half" },
      { key: "quote", label: "Quote", type: "textarea", required: true, width: "full" },
      { key: "rating", label: "Rating (1–5)", type: "number", default: 5, width: "third" },
      { key: "published", label: "Show on website", type: "boolean", table: true, width: "third" },
      { key: "featured", label: "Featured on home page", type: "boolean", width: "third" },
      { key: "photo", label: "Photo path / URL", type: "text", width: "half" },
      { key: "videoUrl", label: "Video URL", type: "url", width: "half" },
      { key: "workshopId", label: "Workshop", type: "ref", ref: "workshops", width: "half" },
      { key: "consent", label: "Written consent to publish", type: "boolean", width: "half" },
    ],
  },
  {
    name: "feedback",
    label: "Feedback",
    singular: "Response",
    description: "Post-workshop feedback from students, teachers, principals and parents.",
    icon: "MessageSquareHeart",
    titleField: "respondent",
    subtitleField: "workshopId",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "fb",
    read: ALL,
    write: OPS_TRAINER,
    fields: [
      { key: "workshopId", label: "Workshop", type: "ref", ref: "workshops", table: true, width: "half" },
      { key: "date", label: "Date", type: "date", table: true, width: "half" },
      { key: "respondent", label: "Respondent", type: "select", options: opts("Student", "Teacher", "Principal", "Parent", "Management"), table: true, width: "third" },
      { key: "name", label: "Name (optional)", type: "text", width: "third" },
      { key: "rating", label: "Rating (1–5)", type: "number", table: true, width: "third" },
      { key: "liked", label: "What they liked", type: "textarea", width: "full" },
      { key: "improve", label: "What to improve", type: "textarea", width: "full" },
      { key: "wouldRebook", label: "Would book again / recommend", type: "boolean", table: true, width: "half" },
    ],
  },
  {
    name: "caseStudies",
    label: "Case Studies",
    singular: "Case study",
    description: "Before/after stories of partner schools — for sales decks and the website.",
    icon: "BookOpenCheck",
    titleField: "title",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "cs",
    read: OPS_MEDIA,
    write: OPS_MEDIA,
    fields: [
      { key: "title", label: "Title", type: "text", required: true, table: true, width: "full" },
      { key: "schoolId", label: "School", type: "ref", ref: "schools", table: true, width: "half" },
      { key: "date", label: "Date", type: "date", table: true, width: "half" },
      { key: "challenge", label: "Challenge", type: "textarea", width: "full" },
      { key: "solution", label: "What JOVE did", type: "textarea", width: "full" },
      { key: "results", label: "Results", type: "textarea", width: "full" },
      { key: "metrics", label: "Key numbers", type: "tags", width: "full", help: "e.g. 420 students, 3 reels, 48K views" },
      { key: "mediaLinks", label: "Media links", type: "tags", width: "full" },
      { key: "published", label: "Published", type: "boolean", table: true, width: "third" },
    ],
  },
  {
    name: "certificates",
    label: "Certificates",
    singular: "Certificate",
    description: "Every certificate issued — publicly verifiable at /verify.",
    icon: "Award",
    titleField: "studentName",
    subtitleField: "schoolName",
    sortField: "issueDate",
    sortDir: "desc",
    idPrefix: "cert",
    read: ALL,
    write: OPS_TRAINER,
    fields: [
      { key: "code", label: "Certificate ID", type: "text", table: true, width: "third", help: "Auto-generated e.g. JOVE-26-7KQ2M" },
      { key: "studentName", label: "Student name", type: "text", required: true, table: true, width: "third" },
      { key: "grade", label: "Grade / class", type: "text", width: "third" },
      { key: "schoolName", label: "School", type: "text", table: true, width: "half" },
      { key: "workshopId", label: "Workshop", type: "ref", ref: "workshops", width: "half" },
      { key: "program", label: "Program", type: "text", placeholder: "e.g. Robo Engineers — Sense · Think · Act", table: true, width: "half" },
      { key: "type", label: "Type", type: "select", options: opts("Participation", "Merit", "Winner", "Lab completion", "Teacher training", "Trainer"), default: "Participation", table: true, width: "half" },
      { key: "issueDate", label: "Issued on", type: "date", table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("valid", "revoked"), default: "valid", width: "third" },
    ],
  },
];

export const collectionMap: Record<string, CollectionDef> = Object.fromEntries(collections.map((c) => [c.name, c]));

export function getCollection(name: string): CollectionDef | undefined {
  return collectionMap[name];
}

export function collectionPath(name: string) {
  return `data/${name}.json`;
}

/** Sum of student counts across grade-band fields on a school / workshop / proposal. */
export function totalStudents(r: Record<string, unknown>) {
  return ["studentsG12", "studentsG35", "studentsG68", "studentsG910"].reduce((s, k) => s + (Number(r[k]) || 0), 0);
}

export function lineItemsTotal(items: unknown): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((s: number, it: Partial<LineItem>) => s + (Number(it?.qty) || 0) * (Number(it?.rate) || 0), 0);
}

/** Invoice maths: subtotal → discount → GST → total. */
export function invoiceTotals(inv: Record<string, unknown>) {
  const subtotal = lineItemsTotal(inv.items);
  const discount = Number(inv.discount) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const gstPercent = inv.gstPercent === undefined || inv.gstPercent === "" ? 18 : Number(inv.gstPercent) || 0;
  const gst = Math.round(taxable * gstPercent) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;
  const paid = Number(inv.amountPaid) || 0;
  return { subtotal, discount, taxable, gstPercent, gst, cgst: gst / 2, sgst: gst / 2, total, paid, balance: Math.max(0, total - paid) };
}

export function payrollNet(p: Record<string, unknown>) {
  const n = (k: string) => Number(p[k]) || 0;
  return n("fixedPay") + n("workshops") * n("perWorkshopRate") + n("allowances") + n("bonus") - n("deductions") - n("tds");
}

export function tripTotal(t: Record<string, unknown>) {
  return ["fuelCost", "vehicleRent", "tollParking", "accommodation", "food", "otherCost"].reduce((s, k) => s + (Number(t[k]) || 0), 0);
}
