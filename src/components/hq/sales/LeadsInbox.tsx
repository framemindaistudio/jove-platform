"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCheck, Loader2, MessageCircle, Pencil, Phone, RotateCcw, School, ShieldX, Trash2, X } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, Modal } from "@/components/ui/Overlay";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { RecordForm } from "@/components/hq/fields";
import { PageHeader, StatCard } from "@/components/hq/ui";
import { cn, formatDate, formatDateTime, formatNumber, isoDate } from "@/lib/utils";
import { introMessage, introSubject, phoneDigits, telHref, whatsappHref } from "./contact";
import { addDays, isWithinDays, relativeDay, str, todayIso } from "./crm";
import { ContactButtons, Notice } from "./bits";
import { packageName } from "./pricing";
import { useToday } from "./useToday";

const leadsDef = getCollection("leads")!;
const KIND_OPTIONS = leadsDef.fields.find((f) => f.key === "kind")?.options ?? [];
const STATUS_OPTIONS = leadsDef.fields.find((f) => f.key === "status")?.options ?? [];
const BAND_OPTIONS = leadsDef.fields.find((f) => f.key === "gradeBands")?.options ?? [];
const PACKAGE_VALUES = (getCollection("schools")!.fields.find((f) => f.key === "interestedIn")?.options ?? []).map((o) => o.value);

type KindTab = "all" | "workshop" | "kits" | "studio" | "partner" | "contact" | "trainer";
const TAB_LABELS: Record<KindTab, string> = {
  all: "All",
  workshop: "Workshops",
  kits: "Bulk kits",
  studio: "Studio",
  partner: "Partners",
  contact: "Contact",
  trainer: "Trainers",
};

const kindLabel = (k: unknown) => KIND_OPTIONS.find((o) => o.value === k)?.label ?? (k ? String(k) : "Enquiry");
const statusLabel = (s: unknown) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? (s ? String(s) : "New");
const isNew = (r: BaseRecord) => !r.status || r.status === "new";

export function LeadsInbox() {
  const { user } = useHq();
  const today = useToday();
  const { records } = useCollection("leads");
  const [tab, setTab] = useState<KindTab>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const unread = records.filter(isNew).length;
    const week = records.filter((r) => isWithinDays(r.createdAt, 7, today)).length;
    const openSchool = records.filter((r) => r.kind === "workshop" && ["new", "in-progress", undefined, ""].includes(r.status as string)).length;
    const qualifying = records.filter((r) => r.kind !== "trainer" && r.status !== "spam");
    const converted = qualifying.filter((r) => r.status === "converted").length;
    return { unread, week, openSchool, converted, rate: qualifying.length ? converted / qualifying.length : 0 };
  }, [records, today]);

  const tabs = useMemo(
    () =>
      (Object.keys(TAB_LABELS) as KindTab[])
        .map((k) => {
          const list = k === "all" ? records : records.filter((r) => r.kind === k);
          const unread = list.filter(isNew).length;
          return {
            value: k,
            count: list.length,
            unread,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {TAB_LABELS[k]}
                {unread > 0 && <span className="size-1.5 rounded-full bg-graphite" aria-label={`${unread} unread`} />}
              </span>
            ),
          };
        })
        .filter((t) => t.value === "all" || t.value === "workshop" || t.count > 0),
    [records],
  );

  const columns: ExtraColumn<BaseRecord>[] = useMemo(
    () => [
      {
        key: "createdAt",
        label: "Received",
        sortValue: (r) => str(r.createdAt),
        render: (r) => (
          <span className="flex items-center gap-2.5 whitespace-nowrap">
            <span className={cn("size-2 shrink-0 rounded-full", isNew(r) ? "bg-graphite" : "border border-graphite/25")} aria-hidden />
            <span className={cn("tabular text-xs", isNew(r) ? "font-semibold text-graphite" : "text-charcoal")}>{today ? relativeDay(r.createdAt, today) : formatDate(str(r.createdAt))}</span>
            {isNew(r) && <span className="sr-only">Unread</span>}
          </span>
        ),
      },
      {
        key: "name",
        label: "From",
        sortValue: (r) => str(r.name).toLowerCase(),
        render: (r) => (
          <span className="block min-w-[10rem]">
            <span className={cn("block truncate", isNew(r) ? "font-bold text-ink" : "font-medium text-graphite")}>{str(r.name) || "—"}</span>
            <span className="block truncate text-xs text-blueprint">{[r.role, r.organisation].filter(Boolean).map(String).join(" · ") || "—"}</span>
          </span>
        ),
      },
      {
        key: "kind",
        label: "Type",
        sortValue: (r) => str(r.kind),
        render: (r) => <Badge tone={r.kind === "workshop" ? "dark" : "outline"}>{kindLabel(r.kind)}</Badge>,
      },
      {
        key: "details",
        label: "Details",
        sortValue: (r) => Number(r.students) || 0,
        render: (r) => (
          <span className="block min-w-[9rem] text-xs text-charcoal">
            {[r.city, Number(r.students) > 0 ? `${formatNumber(Number(r.students))} students` : "", r.package ? packageName(r.package) : ""].filter(Boolean).map(String).join(" · ") || "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortValue: (r) => str(r.status),
        render: (r) => <Badge tone={statusTone(r.status || "new")}>{statusLabel(r.status || "new")}</Badge>,
      },
    ],
    [today],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Sales · 01"
        title="Website Leads"
        icon="Inbox"
        description="Every enquiry, application and message from the public website — reply in one tap, convert schools into the CRM."
        actions={
          <Button variant="secondary" size="sm" className="h-10" href="/hq/crm">
            Schools CRM <ArrowRight className="size-4" aria-hidden />
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Unread" value={formatNumber(stats.unread)} sub={stats.unread ? "Reply within a working day" : "Inbox zero — nicely done"} />
        <StatCard label="Last 7 days" value={formatNumber(stats.week)} sub="New submissions this week" />
        <StatCard label="Open workshop enquiries" value={formatNumber(stats.openSchool)} sub="New or in progress" />
        <StatCard label="Converted" value={formatNumber(stats.converted)} sub={`${Math.round(stats.rate * 100)}% of genuine enquiries`} progress={stats.rate} />
      </div>

      <Tabs tabs={tabs.map(({ value, label, count }) => ({ value, label, count }))} value={tab} onChange={setTab} className="mb-4" />

      <CollectionManager
        name="leads"
        columns={[]}
        extraColumns={columns}
        filter={tab === "all" ? undefined : (r) => r.kind === tab}
        onOpen={(r) => setOpenId(r.id)}
        defaults={{ kind: tab !== "all" ? tab : "workshop", status: "new", page: "Added manually in HQ" }}
        newLabel="Add lead"
        emptyText="Enquiries submitted on the website land here automatically. Phone or walk-in enquiries can be added by hand."
        rowActions={(r) => <RowQuickActions lead={r} sender={user.name} />}
      />

      <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ─────────────────────────── row quick actions ─────────────────────────── */

function useMarkInProgress() {
  const { user, store } = useHq();
  const { save } = useCollection("leads");
  const canWrite = can(user, leadsDef.write) && store.writable;
  return (lead: BaseRecord) => {
    if (!canWrite || !isNew(lead)) return;
    save({ ...lead, status: "in-progress" }).catch(() => {});
  };
}

function RowQuickActions({ lead, sender }: { lead: BaseRecord; sender: string }) {
  const mark = useMarkInProgress();
  const text = introMessage({ kind: str(lead.kind), name: lead.name, organisation: lead.organisation, sender });
  const tel = telHref(lead.phone);
  const wa = whatsappHref(lead.phone, text);
  const cls = "grid size-8 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 text-charcoal transition-colors hover:border-graphite hover:bg-graphite hover:text-paper focus-visible:outline-2 focus-visible:outline-graphite";
  return (
    <span className="inline-flex gap-1.5">
      {tel && (
        <a href={tel} className={cls} aria-label={`Call ${str(lead.name)}`} title="Call" onClick={() => mark(lead)}>
          <Phone className="size-3.5" aria-hidden />
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`WhatsApp ${str(lead.name)}`} title="WhatsApp" onClick={() => mark(lead)}>
          <MessageCircle className="size-3.5" aria-hidden />
        </a>
      )}
    </span>
  );
}

/* ─────────────────────────── lead drawer ─────────────────────────── */

function LeadDrawer({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const { user, store } = useHq();
  const { records, save, remove } = useCollection("leads");
  const lead = leadId ? records.find((r) => r.id === leadId) ?? null : null;
  const canWrite = can(user, leadsDef.write) && store.writable;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);

  async function setStatus(status: string) {
    if (!lead) return;
    setBusy(true);
    setError("");
    try {
      await save({ ...lead, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!lead) return;
    if (!window.confirm("Delete this lead? The change is kept in the history and can be restored.")) return;
    setBusy(true);
    try {
      await remove(lead.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  const status = str(lead?.status) || "new";
  const canConvert = !!lead && lead.kind !== "trainer" && status !== "converted";

  return (
    <>
      <Drawer
        open={!!lead}
        onClose={onClose}
        title={str(lead?.name) || "Lead"}
        subtitle={lead ? `${kindLabel(lead.kind)} · received ${formatDateTime(str(lead.createdAt))}` : undefined}
        footer={
          lead && canWrite ? (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={onDelete} disabled={busy} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10 focus-visible:outline-2 focus-visible:outline-bad">
                <Trash2 className="size-3.5" aria-hidden /> Delete
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {busy && <Loader2 className="size-4 animate-spin text-blueprint" aria-label="Saving" />}
                {status === "new" && (
                  <Button variant="ghost" size="sm" onClick={() => setStatus("in-progress")} disabled={busy}>
                    <CheckCheck className="size-4" aria-hidden /> Mark in progress
                  </Button>
                )}
                {["closed", "spam"].includes(status) ? (
                  <Button variant="ghost" size="sm" onClick={() => setStatus("in-progress")} disabled={busy}>
                    <RotateCcw className="size-4" aria-hidden /> Reopen
                  </Button>
                ) : (
                  status !== "converted" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setStatus("spam")} disabled={busy}>
                        <ShieldX className="size-4" aria-hidden /> Spam
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setStatus("closed")} disabled={busy}>
                        <X className="size-4" aria-hidden /> Close
                      </Button>
                    </>
                  )
                )}
                {canConvert && (
                  <Button size="sm" onClick={() => setConverting(true)} disabled={busy}>
                    <School className="size-4" aria-hidden /> Convert to school
                  </Button>
                )}
              </div>
            </div>
          ) : undefined
        }
      >
        {lead && <LeadDetail key={lead.id} lead={lead} canWrite={canWrite} />}
        {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
      </Drawer>
      {lead && converting && <ConvertModal lead={lead} onClose={() => setConverting(false)} />}
    </>
  );
}

function LeadDetail({ lead, canWrite }: { lead: BaseRecord; canWrite: boolean }) {
  const { user } = useHq();
  const { save } = useCollection("leads");
  const mark = useMarkInProgress();
  const [message, setMessage] = useState(() => introMessage({ kind: str(lead.kind), name: lead.name, organisation: lead.organisation, sender: user.name }));
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const status = str(lead.status) || "new";
  const bands = Array.isArray(lead.gradeBands) ? (lead.gradeBands as string[]).map((b) => BAND_OPTIONS.find((o) => o.value === b)?.label ?? b) : [];
  const facts: [string, React.ReactNode][] = [
    ["Organisation", str(lead.organisation)],
    ["Role", str(lead.role)],
    ["City", str(lead.city)],
    ["Phone", lead.phone ? <span className="tabular">{str(lead.phone)}</span> : ""],
    ["Email", lead.email ? <span className="break-all">{str(lead.email)}</span> : ""],
    ["Approx. students", Number(lead.students) > 0 ? formatNumber(Number(lead.students)) : ""],
    ["Grade groups", bands.join(", ")],
    ["Interested in", lead.package ? packageName(lead.package) : ""],
    ["Preferred date", lead.preferredDate ? formatDate(str(lead.preferredDate)) : ""],
    ["Submitted from", str(lead.page)],
  ];

  async function onSave() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await save(editing);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(status)} dot>
          {statusLabel(status)}
        </Badge>
        <Badge tone={lead.kind === "workshop" ? "dark" : "outline"}>{kindLabel(lead.kind)}</Badge>
        {status === "converted" && lead.schoolId ? (
          <Link href={`/hq/crm/${str(lead.schoolId)}`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-graphite underline-offset-4 hover:underline">
            Open school in CRM <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {lead.message ? (
        <figure className="relative rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-5 py-4">
          <span className="annot absolute -top-2 left-4 bg-paper px-1.5 text-[10px] text-blueprint">Message</span>
          <blockquote className="whitespace-pre-line text-sm leading-relaxed text-graphite">{str(lead.message)}</blockquote>
        </figure>
      ) : null}

      <section aria-labelledby="lead-reply">
        <h3 id="lead-reply" className="annot mb-2 text-charcoal">
          Reply
        </h3>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} aria-label="Reply message used for WhatsApp and email" />
        <p className="mt-1.5 text-[11px] text-blueprint">Used as the WhatsApp text and email body. Edit before sending.</p>
        <ContactButtons
          className="mt-3"
          phone={lead.phone}
          email={lead.email}
          whatsappText={message}
          emailSubject={introSubject(str(lead.kind), lead.organisation)}
          emailBody={message}
          onContact={() => mark(lead)}
        />
      </section>

      <section aria-labelledby="lead-facts">
        <div className="mb-2 flex items-center justify-between">
          <h3 id="lead-facts" className="annot text-charcoal">
            Details
          </h3>
          {canWrite && !editing && (
            <button onClick={() => setEditing({ ...lead })} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-graphite hover:bg-graphite/5 focus-visible:outline-2 focus-visible:outline-graphite">
              <Pencil className="size-3.5" aria-hidden /> Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4">
            <RecordForm def={leadsDef} value={editing} onChange={setEditing} />
            {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} Save
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid gap-x-6 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-4 py-2 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 border-b border-dashed border-graphite/10 py-2 text-sm">
                <dt className="text-blueprint">{k}</dt>
                <dd className="text-right font-medium text-graphite">{v || <span className="text-blueprint/60">—</span>}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {lead.kind === "trainer" && (
        <Notice tone="info">Trainer applications are not schools — reply, then add promising candidates in Team &amp; Payroll.</Notice>
      )}
    </div>
  );
}

/* ─────────────────────────── convert to school ─────────────────────────── */

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\b(the|school|public|international|vidyalaya|high|english|medium|cbse|icse)\b/g, "")
    .replace(/[^a-z0-9]/g, "");

function ConvertModal({ lead, onClose }: { lead: BaseRecord; onClose: () => void }) {
  const router = useRouter();
  const { user } = useHq();
  const schools = useCollection("schools");
  const activities = useCollection("activities");
  const leads = useCollection("leads");
  const [name, setName] = useState(str(lead.organisation) || str(lead.name));
  const [city, setCity] = useState(str(lead.city));
  const [students, setStudents] = useState(Number(lead.students) > 0 ? String(lead.students) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = useMemo(() => {
    const digits = phoneDigits(lead.phone);
    const key = norm(name);
    return schools.records
      .filter((s) => (digits && phoneDigits(s.phone) === digits) || (key.length >= 4 && (norm(s.name) === key || norm(s.name).includes(key) || key.includes(norm(s.name) || "∅"))))
      .slice(0, 4);
  }, [schools.records, lead.phone, name]);

  function enquiryNotes() {
    const bands = Array.isArray(lead.gradeBands) ? (lead.gradeBands as string[]).map((b) => BAND_OPTIONS.find((o) => o.value === b)?.label ?? b) : [];
    return [
      `Website enquiry (${kindLabel(lead.kind)}) received ${formatDate(str(lead.createdAt))}.`,
      bands.length ? `Grade groups: ${bands.join(", ")}.` : "",
      lead.preferredDate ? `Preferred date: ${formatDate(str(lead.preferredDate))}.` : "",
      lead.message ? `Message: “${str(lead.message)}”` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function finish(schoolId: string, created: boolean) {
    const today = todayIso();
    await activities.save({
      schoolId,
      type: "Note",
      date: today,
      summary: created ? `Converted from website lead — ${kindLabel(lead.kind).toLowerCase()} from ${str(lead.name)}` : `Website lead linked — ${kindLabel(lead.kind).toLowerCase()} from ${str(lead.name)}`,
      details: enquiryNotes(),
      nextStep: "Call to understand requirements and share the JOVE Day plan",
      nextDate: addDays(today, 1),
      by: user.name,
    });
    await leads.save({ ...lead, status: "converted", schoolId });
    router.push(`/hq/crm/${schoolId}`);
  }

  async function create() {
    if (!name.trim()) {
      setError("Enter the school name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const today = todayIso();
      const created = lead.createdAt ? isoDate(new Date(str(lead.createdAt))) : today;
      const school = await schools.save({
        name: name.trim(),
        stage: "contacted",
        city: city.trim(),
        contactName: str(lead.name),
        contactRole: str(lead.role),
        phone: str(lead.phone),
        email: str(lead.email),
        studentsTotal: Number(students) > 0 ? Number(students) : "",
        interestedIn: lead.package && PACKAGE_VALUES.includes(str(lead.package)) ? [str(lead.package)] : [],
        source: "Website",
        owner: user.name,
        lastContact: created,
        nextFollowUp: addDays(today, 1),
        notes: enquiryNotes(),
      });
      await finish(school.id, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not convert");
      setBusy(false);
    }
  }

  async function link(schoolId: string) {
    setBusy(true);
    setError("");
    try {
      await finish(schoolId, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not link");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="Convert to school"
      size="max-w-xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <School className="size-4" aria-hidden />} Create school &amp; open
          </Button>
        </>
      }
    >
      <p className="text-sm text-charcoal">
        Creates a school in the CRM at stage <strong>Contacted</strong> with {str(lead.name) || "this contact"} as the key contact, a follow-up for tomorrow, and the enquiry logged on its timeline.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <Label htmlFor="cv-name">School name</Label>
          <Input id="cv-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="sm:col-span-4">
          <Label htmlFor="cv-city">City</Label>
          <Input id="cv-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cv-students">Students</Label>
          <Input id="cv-students" type="number" inputMode="numeric" min={0} value={students} onChange={(e) => setStudents(e.target.value)} className="tabular" />
        </div>
      </div>
      {matches.length > 0 && (
        <div className="mt-6">
          <p className="annot mb-2 text-charcoal">Already in the CRM?</p>
          <ul className="divide-y divide-graphite/10 rounded-[var(--radius-sm)] border border-graphite/15">
            {matches.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{str(s.name)}</span>
                  <span className="block truncate text-xs text-blueprint">{[s.city, s.contactName, s.phone].filter(Boolean).map(String).join(" · ")}</span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => link(s.id)} disabled={busy}>
                  Link lead
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
    </Modal>
  );
}
