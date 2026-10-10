"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, ExternalLink, Printer, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { Tabs } from "@/components/ui/Tabs";
import { CornerMarks } from "@/components/brand/Blueprint";
import { useCollection, useHq, useLookup } from "@/components/hq/data";
import { PageHeader } from "@/components/hq/ui";
import { gradeBands, kits } from "@/lib/content/business";
import { boxesOf, layoutSheets, showOf, SHOW_OPTIONS } from "@/components/hq/product/stickers/layout";
import { clampInt, csv, isIso, qs, textLines } from "./util";
import { PrintPreview } from "./PrintPreviews";

/* ───────────────────────────── generator registry ───────────────────────────── */

type F =
  | { k: string; label: string; t: "text" | "date" | "number"; help?: string; ph?: string; min?: number; max?: number; half?: boolean }
  | { k: string; label: string; t: "textarea"; help?: string; ph?: string }
  | { k: string; label: string; t: "select"; options: [string, string][]; help?: string; half?: boolean }
  | { k: string; label: string; t: "checkbox"; help?: string }
  | { k: string; label: string; t: "team"; help?: string }
  | { k: string; label: string; t: "bands"; help?: string };

type Values = Record<string, string>;
type Group = "brochures" | "forms" | "badges" | "stationery";

interface Gen {
  id: string;
  group: Group;
  title: string;
  blurb: string;
  route: string;
  /** short layout note shown on the card */
  sheet: string;
  fields: F[];
  defaults?: Values;
  summary?: (v: Values) => string;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const school: F = { k: "school", label: "School", t: "text", ph: "e.g. Sri Vidya High School", half: true };
const date: F = { k: "date", label: "Workshop date", t: "date", half: true };
const pages = (label: string, max = 40, help?: string): F => ({ k: "pages", label, t: "number", min: 1, max, help, half: true });

/* Brochures are for schools we have not worked with yet, so they take a typed name instead of a workshop. */
const preparedFor: F = { k: "for", label: "Prepared for (optional)", t: "text", ph: "e.g. Sri Vidya High School", help: "Printed on the cover. Leave empty for copies you can hand to any school." };
const contactPerson: F = { k: "contact", label: "Who the school should call (optional)", t: "text", ph: "e.g. Shivaprasad Reddy S S", half: true };
const contactPhone: F = { k: "phone", label: "Phone to print (optional)", t: "text", ph: "Empty = the phone in Settings", half: true };
const sheets: F = {
  k: "sides",
  label: "Sheets",
  t: "select",
  options: [
    ["both", "Both sides: outside and inside (fold to A4)"],
    ["outside", "Outside sheet only (the two covers)"],
    ["inside", "Inside sheet only (a flat A3 handout)"],
  ],
  help: "Both sides: print double-sided on A3, flip on the short edge, then fold in half.",
};
const brochureSummary = (v: Values) => (v.sides === "outside" || v.sides === "inside" ? `A3 landscape · ${v.sides} sheet only` : "A3 landscape · 2 sides · folds to A4");
const brochureSheet = "A3 · 2 sides · folds to A4";

const GENERATORS: Gen[] = [
  {
    id: "brochure-intro",
    group: "brochures",
    title: "Brochure: Meet JOVE",
    blurb: "The introduction to hand over at a first meeting: who we are, what a JOVE Day is, and how it helps the school and its students. Blueprint design on a light ground.",
    route: "/hq/print/brochures/intro",
    sheet: brochureSheet,
    fields: [preparedFor, contactPerson, contactPhone, sheets],
    defaults: { sides: "both" },
    summary: brochureSummary,
  },
  {
    id: "brochure-pricing",
    group: "brochures",
    title: "Brochure: Packages & pricing",
    blurb: "The price sheet for the management meeting: per-student prices by grade, JOVE Day, Quarter, Year and Club, add-ons and payment terms. Prices come from the live price list. Dark graphite design.",
    route: "/hq/print/brochures/pricing",
    sheet: brochureSheet,
    fields: [preparedFor, { k: "valid", label: "Prices valid until (optional)", t: "text", ph: "e.g. 31 March 2027", help: "Printed on the front cover." }, contactPerson, contactPhone, sheets],
    defaults: { sides: "both" },
    summary: brochureSummary,
  },
  {
    id: "brochure-studio",
    group: "brochures",
    title: "Brochure: The free Media Pack",
    blurb: "Your school, on film: the reels, full-day film, drone shots and photos our in-house studio delivers free with every JOVE Day. Picture-led cinema design.",
    route: "/hq/print/brochures/studio",
    sheet: brochureSheet,
    fields: [preparedFor, contactPerson, contactPhone, sheets],
    defaults: { sides: "both" },
    summary: brochureSummary,
  },
  {
    id: "consent",
    group: "forms",
    title: "Photo, video & drone consent",
    blurb: "Per-student parent slip in plain language with separate opt-ins for photos, video, drone and social media, plus a parent signature.",
    route: "/hq/print/forms/consent",
    sheet: "2 slips per A4",
    fields: [school, date, { k: "names", label: "Student names (optional)", t: "textarea", ph: "One name per line to pre-print each slip", help: "Leave empty for blank slips." }, pages("Sheets, when no names are pasted", 40, "2 slips on each sheet.")],
    defaults: { pages: "1" },
    summary: (v) => {
      const n = textLines(v.names).length;
      return n ? `${plural(n, "slip")} · ${plural(Math.ceil(n / 2), "sheet")}` : `${plural(clampInt(v.pages, 1, 40, 1) * 2, "blank slip")} · ${plural(clampInt(v.pages, 1, 40, 1), "sheet")}`;
    },
  },
  {
    id: "student-feedback",
    group: "forms",
    title: "Student feedback form",
    blurb: "Smiley-face version for Grades 1 to 5 and a short written form for Grades 6 to 10. Feeds the Reputation tab once entered.",
    route: "/hq/print/forms/student-feedback",
    sheet: "4 per A4 (smiley) · 2 per A4 (short)",
    fields: [
      { k: "version", label: "Version", t: "select", options: [["smiley", "Smiley faces · Grades 1–5 (4 per A4)"], ["short", "Short form · Grades 6–10 (2 per A4)"]] },
      school,
      date,
      pages("Sheets", 60),
    ],
    defaults: { version: "smiley", pages: "5" },
    summary: (v) => {
      const sheets = clampInt(v.pages, 1, 60, 1);
      const per = v.version === "short" ? 2 : 4;
      return `${plural(sheets * per, "form")} · ${plural(sheets, "sheet")}`;
    },
  },
  {
    id: "teacher-feedback",
    group: "forms",
    title: "Teacher & principal feedback",
    blurb: "One-page school feedback form with ratings, what worked, what to improve and a would-you-rebook question.",
    route: "/hq/print/forms/teacher-feedback",
    sheet: "1 per A4",
    fields: [school, date, pages("Copies", 60)],
    defaults: { pages: "2" },
    summary: (v) => plural(clampInt(v.pages, 1, 60, 1), "copy", "copies"),
  },
  {
    id: "attendance",
    group: "forms",
    title: "Attendance sheet",
    blurb: "Generic roll sheet with name, class, station and a signature or tick column. Paste a roster to pre-fill it.",
    route: "/hq/print/forms/attendance",
    sheet: "10 to 40 rows per A4",
    fields: [
      { k: "title", label: "Session title", t: "text", ph: "JOVE Day · Session 1" },
      school,
      date,
      { k: "grade", label: "Class / section", t: "text", ph: "Grade 7B", half: true },
      { k: "trainer", label: "Trainer", t: "text", half: true },
      { k: "rows", label: "Rows per page", t: "number", min: 10, max: 40, half: true },
      pages("Blank pages, when no roster", 40),
      { k: "names", label: "Roster (optional)", t: "textarea", ph: "Aarav Sharma, Grade 7B", help: "One per line; add a class after a comma." },
    ],
    defaults: { rows: "30", pages: "1" },
    summary: (v) => {
      const per = clampInt(v.rows, 10, 40, 30);
      const n = textLines(v.names).length;
      const sheets = n ? Math.ceil(n / per) : clampInt(v.pages, 1, 40, 1);
      return `${plural(sheets, "page")} · ${per} rows each${n ? ` · ${plural(n, "name")}` : ""}`;
    },
  },
  {
    id: "name-tags",
    group: "badges",
    title: "Student name tags",
    blurb: "Big, friendly name tags with the JOVE header and a team slot. Print blank ones or paste names.",
    route: "/hq/print/badges/name-tags",
    sheet: "10 tags per A4 (95 × 54 mm)",
    fields: [school, { k: "names", label: "Names (optional)", t: "textarea", ph: "Aarav Sharma, Grade 7B", help: "One per line; add the class after a comma." }, pages("Sheets, when no names", 60)],
    defaults: { pages: "2" },
    summary: (v) => {
      const n = textLines(v.names).length;
      return n ? `${plural(n, "tag")} · ${plural(Math.ceil(n / 10), "sheet")}` : `${plural(clampInt(v.pages, 1, 60, 1) * 10, "blank tag")}`;
    },
  },
  {
    id: "id-cards",
    group: "badges",
    title: "Team ID cards",
    blurb: "CR80 cards (85.6 × 54 mm), front and back, from your team records, with a verified-trainer line and emergency return details.",
    route: "/hq/print/badges/id-cards",
    sheet: "5 people per A4 · front + back",
    fields: [
      { k: "ids", label: "Team members", t: "team", help: "Leave everyone unticked to print all active team members." },
      { k: "valid", label: "Valid until (optional)", t: "text", ph: "e.g. 31 Mar 2027" },
    ],
  },
  {
    id: "visiting-cards",
    group: "stationery",
    title: "Visiting cards",
    blurb: "90 × 54 mm cards with name, title, phone, email and website taken from your team records and company settings.",
    route: "/hq/print/stationery/visiting-cards",
    sheet: "10 per A4 · per person",
    fields: [
      { k: "ids", label: "People", t: "team", help: "Leave everyone unticked to print all active team members." },
      { k: "back", label: "Sheets", t: "select", options: [["1", "Front and back sheets"], ["0", "Front only"]] },
    ],
    defaults: { back: "1" },
  },
  {
    id: "letterhead",
    group: "stationery",
    title: "Letterhead",
    blurb: "Blank A4 with the JOVE header, address strip and footer, using the details in Settings. Optional faint ruling for hand-written notes.",
    route: "/hq/print/stationery/letterhead",
    sheet: "1 per A4",
    fields: [pages("Sheets", 50), { k: "ruled", label: "Add faint writing lines", t: "checkbox" }],
    defaults: { pages: "1" },
  },
  {
    id: "poster",
    group: "stationery",
    title: "Workshop announcement poster",
    blurb: "“JOVE Day is coming to your school” poster: date, grade sessions, what students will build and a note about the film crew.",
    route: "/hq/print/stationery/poster",
    sheet: "A4 portrait",
    fields: [school, date, { k: "bands", label: "Grade sessions to list", t: "bands", help: "Leave all unticked to show every grade band." }, { k: "note", label: "Extra note (optional)", t: "text", ph: "e.g. Please return consent slips by Friday" }, pages("Copies", 20)],
    defaults: { pages: "1" },
    summary: (v) => plural(clampInt(v.pages, 1, 20, 1), "copy", "copies"),
  },
  {
    id: "kit-stickers",
    group: "stationery",
    title: "Kit box stickers",
    blurb: "The sticker set that dresses a plain brown kit box: a lid label sized to the box, a round grade badge, a round seal for the lid flap and the back label with contents, MRP and packer details.",
    route: "/hq/print/kit-stickers",
    sheet: "A4 sticker paper · cut by hand",
    fields: [
      { k: "kit", label: "Kit", t: "select", options: kits.map((k): [string, string] => [k.id, `${k.name} · box ${k.box.label}`]) },
      { k: "count", label: "Boxes to dress", t: "number", min: 1, max: 60, half: true },
      { k: "show", label: "Print", t: "select", options: SHOW_OPTIONS, half: true },
      { k: "batch", label: "Batch number (optional)", t: "text", ph: "e.g. B-2610-01", help: "Leave empty to print a line you can write on.", half: true },
      { k: "origin", label: "Country of origin to print (optional)", t: "text", ph: "Leave empty until this is confirmed", half: true },
    ],
    defaults: { kit: kits[0].id, count: "4", show: "all" },
    summary: (v) => {
      const kit = kits.find((k) => k.id === v.kit) ?? kits[0];
      const boxes = boxesOf(v.count);
      return `${plural(boxes, "box", "boxes")} · ${plural(layoutSheets(kit, boxes, showOf(v.show)).length, "A4 sheet")}`;
    },
  },
  {
    id: "table-tents",
    group: "stationery",
    title: "Station table tents",
    blurb: "Folded A5 tents with a big station number and team name so every table is easy to find in the hall.",
    route: "/hq/print/stationery/table-tents",
    sheet: "2 tents per A4 · fold at the dashed line",
    fields: [
      { k: "label", label: "Sign says", t: "text", ph: "Station", half: true },
      { k: "count", label: "How many tents", t: "number", min: 1, max: 120, half: true },
      { k: "from", label: "First number", t: "number", min: 1, max: 999, half: true },
      { k: "names", label: "Team names (optional)", t: "textarea", ph: "Team Sparks\nTeam Gears", help: "One per line. Overrides the tent count." },
    ],
    defaults: { label: "Station", count: "10", from: "1" },
    summary: (v) => {
      const n = textLines(v.names).length || clampInt(v.count, 1, 120, 10);
      return `${plural(n, "tent")} · ${plural(Math.ceil(n / 2), "sheet")}`;
    },
  },
  {
    id: "safety",
    group: "stationery",
    title: "Workshop room safety rules",
    blurb: "A4 poster of plain-language rules for the workshop hall: power, tools, batteries, movement and who to ask for help.",
    route: "/hq/print/stationery/safety",
    sheet: "A4 portrait",
    fields: [school, pages("Copies", 20)],
    defaults: { pages: "1" },
    summary: (v) => plural(clampInt(v.pages, 1, 20, 1), "copy", "copies"),
  },
  {
    id: "checklist",
    group: "stationery",
    title: "Trainer day checklist card",
    blurb: "Pocket-friendly card for the day: pack list, set-up, safety, filming handshake and wrap-up. One per trainer.",
    route: "/hq/print/stationery/checklist",
    sheet: "2 cards per A4",
    fields: [school, date, { k: "lead", label: "Lead trainer", t: "text", half: true }, pages("Sheets", 20, "2 cards on each sheet.")],
    defaults: { pages: "1" },
    summary: (v) => `${plural(clampInt(v.pages, 1, 20, 1) * 2, "card")} · ${plural(clampInt(v.pages, 1, 20, 1), "sheet")}`,
  },
];

const GROUPS: { value: Group; label: string; blurb: string }[] = [
  { value: "brochures", label: "Brochures", blurb: "A3 brochures to hand over when you meet a school." },
  { value: "forms", label: "Forms & feedback", blurb: "Consent, feedback and attendance for the day." },
  { value: "badges", label: "Badges & IDs", blurb: "Name tags and team identity cards." },
  { value: "stationery", label: "Stationery & posters", blurb: "Letterhead, cards, posters and station signs." },
];

/* ───────────────────────────── modal form ───────────────────────────── */

function TeamPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { records, loading, error } = useCollection("team");
  const people = records.filter((r) => r.status !== "inactive");
  const picked = new Set(csv(value));
  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next].join(","));
  };
  if (loading) return <p className="text-sm text-blueprint">Loading team…</p>;
  if (error) return <p className="text-sm text-bad">Could not load the team list: {error}</p>;
  if (!people.length) return <p className="text-sm text-blueprint">No team members yet. Add people in HQ → Team &amp; Payroll.</p>;
  return (
    <div>
      <div className="mb-2 flex gap-3 text-xs font-medium">
        <button type="button" className="underline underline-offset-2 hover:text-graphite" onClick={() => onChange(people.map((p) => p.id).join(","))}>
          Select everyone
        </button>
        <button type="button" className="underline underline-offset-2 hover:text-graphite" onClick={() => onChange("")}>
          Clear
        </button>
        <span className="ml-auto text-blueprint">{picked.size ? `${picked.size} selected` : `Everyone (${people.length})`}</span>
      </div>
      <ul className="hq-scroll max-h-48 space-y-1 overflow-y-auto rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-2" data-lenis-prevent>
        {people.map((p) => (
          <li key={p.id}>
            <Checkbox label={<span>{String(p.name)} <span className="text-xs text-blueprint">· {String(p.role ?? "")}</span></span>} checked={picked.has(p.id)} onChange={() => toggle(p.id)} className="w-full rounded px-1.5 py-1 hover:bg-graphite/[0.04]" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GeneratorForm({ gen, values, set, shared }: { gen: Gen; values: Values; set: (k: string, v: string) => void; shared: (patch: Values) => void }) {
  const { records: workshopRecords } = useCollection("workshops");
  const schools = useLookup("schools");
  const keys = new Set(gen.fields.map((f) => f.k));
  const wantsWorkshop = ["school", "date", "lead", "trainer", "title"].some((k) => keys.has(k));
  const workshops = useMemo(() => [...workshopRecords].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))), [workshopRecords]);

  function prefill(id: string) {
    const w = workshops.find((x) => x.id === id);
    if (!w) return;
    const schoolName = String(schools.get(String(w.schoolId ?? ""))?.name ?? "");
    const lead = String(w.leadTrainer ?? "");
    const patch: Values = {};
    if (keys.has("school") && schoolName) patch.school = schoolName;
    if (keys.has("date") && isIso(w.date)) patch.date = String(w.date).slice(0, 10);
    if (keys.has("lead") && lead) patch.lead = lead;
    if (keys.has("trainer") && lead) patch.trainer = lead;
    if (keys.has("title") && w.title) patch.title = String(w.title);
    Object.entries(patch).forEach(([k, v]) => set(k, v));
    shared({ school: patch.school ?? "", date: patch.date ?? "" });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {wantsWorkshop && (
        <Field label="Prefill from a workshop (optional)" htmlFor="pf-workshop" className="sm:col-span-2">
          <Select id="pf-workshop" value="" onChange={(e) => prefill(e.target.value)}>
            <option value="">Choose a workshop to fill school, date and trainer…</option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {String(w.title || "Untitled workshop")}
                {isIso(w.date) ? ` · ${String(w.date).slice(0, 10)}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {gen.fields.map((f) => {
        const id = `pf-${f.k}`;
        const full = !("half" in f && f.half);
        const cls = full ? "sm:col-span-2" : "";
        if (f.t === "textarea")
          return (
            <Field key={f.k} label={f.label} htmlFor={id} help={f.help} className={cls}>
              <Textarea id={id} rows={6} value={values[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} placeholder={f.ph} spellCheck={false} className="font-mono text-[13px]" />
            </Field>
          );
        if (f.t === "select")
          return (
            <Field key={f.k} label={f.label} htmlFor={id} help={f.help} className={cls}>
              <Select id={id} value={values[f.k] ?? f.options[0][0]} onChange={(e) => set(f.k, e.target.value)}>
                {f.options.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          );
        if (f.t === "checkbox")
          return (
            <div key={f.k} className="sm:col-span-2">
              <Checkbox label={f.label} checked={values[f.k] === "1"} onChange={(e) => set(f.k, e.target.checked ? "1" : "")} />
              {f.help && <p className="mt-1 text-xs text-blueprint">{f.help}</p>}
            </div>
          );
        if (f.t === "team")
          return (
            <Field key={f.k} label={f.label} help={f.help} className="sm:col-span-2">
              <TeamPicker value={values[f.k] ?? ""} onChange={(v) => set(f.k, v)} />
            </Field>
          );
        if (f.t === "bands") {
          const picked = new Set(csv(values[f.k]));
          return (
            <Field key={f.k} label={f.label} help={f.help} className="sm:col-span-2">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {gradeBands.map((b) => (
                  <Checkbox
                    key={b.id}
                    label={`${b.grades}: ${b.name}`}
                    checked={picked.has(b.id)}
                    onChange={() => {
                      const next = new Set(picked);
                      if (next.has(b.id)) next.delete(b.id);
                      else next.add(b.id);
                      set(f.k, gradeBands.filter((x) => next.has(x.id)).map((x) => x.id).join(","));
                    }}
                  />
                ))}
              </div>
            </Field>
          );
        }
        return (
          <Field key={f.k} label={f.label} htmlFor={id} help={f.help} className={cls}>
            <Input
              id={id}
              type={f.t}
              value={values[f.k] ?? ""}
              onChange={(e) => {
                set(f.k, e.target.value);
                if (f.k === "school" || f.k === "date") shared({ [f.k]: e.target.value });
              }}
              placeholder={f.ph}
              min={f.t === "number" ? f.min : undefined}
              max={f.t === "number" ? f.max : undefined}
              inputMode={f.t === "number" ? "numeric" : undefined}
            />
          </Field>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── studio ───────────────────────────── */

export function PrintStudio() {
  const { store } = useHq();
  const [group, setGroup] = useState<"all" | Group>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [all, setAll] = useState<Record<string, Values>>({});
  const [sharedVals, setSharedVals] = useState<Values>({});

  const gen = GENERATORS.find((g) => g.id === openId) ?? null;
  const values: Values = gen ? { ...gen.defaults, ...sharedVals, ...(all[gen.id] ?? {}) } : {};
  // Shared school/date are only applied to forms that have those fields, and never override what was typed there.
  const clean = gen ? Object.fromEntries(Object.entries(values).filter(([k]) => gen.fields.some((f) => f.k === k))) : {};
  const href = gen ? gen.route + qs(clean) : "#";

  const needle = search.trim().toLowerCase();
  const visible = GENERATORS.filter((g) => (group === "all" || g.group === group) && (!needle || `${g.title} ${g.blurb}`.toLowerCase().includes(needle)));
  const showCert = group === "all" && (!needle || "certificates certificate qr verify".includes(needle));

  function card(g: Gen) {
    return (
      <li key={g.id}>
        <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)] transition-shadow hover:shadow-[var(--shadow-lift)]">
          <div className="relative aspect-[160/112] border-b border-graphite/10 bg-paper-200/40">
            <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <div className="relative h-full p-3">
              <PrintPreview id={g.id} />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div>
              <h3 className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-graphite">{g.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-charcoal">{g.blurb}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 pt-1">
              <Badge tone="outline">{g.sheet}</Badge>
              <Button size="sm" onClick={() => setOpenId(g.id)} aria-label={`Customise and print: ${g.title}`}>
                <Printer className="size-3.5" /> Customise
              </Button>
            </div>
          </div>
        </article>
      </li>
    );
  }

  return (
    <div>
      <PageHeader
        icon="Printer"
        eyebrow="Print Studio"
        title="Printables"
        description="Everything JOVE prints, in one place: brochures for school meetings and every sheet for a JOVE Day. Pick a template, fill in a few details, and print or save as PDF. All sheets are laid out in millimetres, so they come out as they preview."
        actions={
          <Button href="/hq/settings" variant="secondary" size="sm">
            Company details &amp; letterhead data
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Tabs
          className="2xl:border-0"
          value={group}
          onChange={setGroup}
          tabs={[{ value: "all", label: "All printables", count: GENERATORS.length + 1 }, ...GROUPS.map((g) => ({ value: g.value, label: g.label, count: GENERATORS.filter((x) => x.group === g.value).length }))]}
        />
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search printables"
            placeholder="Search printables…"
            className="h-10 w-full rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 pl-9 pr-3 text-sm outline-none focus:border-graphite"
          />
        </div>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {showCert && (
          <li className="sm:col-span-2 xl:col-span-3">
            <article className="relative grid gap-0 overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite text-paper shadow-[var(--shadow-lift)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
              <CornerMarks className="text-paper/40" />
              <div className="relative flex flex-col justify-center gap-4 p-6 sm:p-8">
                <span className="annot flex items-center gap-2 text-paper/60">
                  <Award className="size-4" aria-hidden /> Certificates · A4 landscape
                </span>
                <h2 className="text-2xl font-bold leading-tight tracking-[-0.03em]">Bulk certificates with QR verification</h2>
                <p className="max-w-md text-sm leading-relaxed text-paper/75">Paste names, generate unique IDs and print one premium certificate per page. Every QR code opens a public page that confirms the certificate is genuine, or shows it as revoked.</p>
                <div className="flex flex-wrap gap-2">
                  <Button href="/hq/certificates" variant="light">
                    <Award className="size-4" /> {store.writable ? "Issue certificates" : "Open certificates"}
                  </Button>
                  <Button href="/hq/print/certificates?sample=1" external variant="outline-light">
                    <ExternalLink className="size-4" /> Preview design
                  </Button>
                </div>
              </div>
              <div className="relative hidden min-h-48 items-center justify-center bg-paper/[0.04] p-6 md:flex">
                <div className="aspect-[160/112] w-full max-w-md text-paper">
                  <PrintPreview id="certificate" />
                </div>
              </div>
            </article>
          </li>
        )}
        {visible.map(card)}
      </ul>

      {!visible.length && !showCert && (
        <p className="mt-10 text-center text-sm text-blueprint">
          Nothing matches “{search}”. <button className="underline underline-offset-2" onClick={() => { setSearch(""); setGroup("all"); }}>Clear search</button>
        </p>
      )}

      <p className="mt-8 text-xs text-blueprint">
        Tip: in the print dialog set <strong>Margins: None</strong> and tick <strong>Background graphics</strong>. Brochures are A3: choose <strong>Save as PDF</strong> and take the file to a print shop, or pick an A3 printer and print on both sides (flip on short edge). Looking for invoices, proposals or packing slips? Those open from their own modules.{" "}
        <Link href="/hq/docs" className="underline underline-offset-2">
          Document templates live in the Operations Library
        </Link>
        .
      </p>

      <Modal
        open={!!gen}
        onClose={() => setOpenId(null)}
        title={gen?.title ?? ""}
        size="max-w-2xl"
        footer={
          gen && (
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-blueprint" aria-live="polite">
                {gen.summary ? gen.summary(values) : gen.sheet}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setOpenId(null)}>
                  Close
                </Button>
                <Button href={href} external>
                  <Printer className="size-4" /> Open print page
                </Button>
              </div>
            </div>
          )
        }
      >
        {gen && (
          <div className="grid gap-5">
            <p className="text-sm text-charcoal">{gen.blurb}</p>
            <GeneratorForm
              gen={gen}
              values={values}
              set={(k, v) => setAll((a) => ({ ...a, [gen.id]: { ...(a[gen.id] ?? {}), [k]: v } }))}
              shared={(patch) => setSharedVals((s) => ({ ...s, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v)) }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
