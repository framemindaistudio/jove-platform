import "server-only";
import { store } from "@/lib/store";
import { deleteRecord, getRecord, listRecords, mutateCollection } from "./records";
import type { BaseRecord } from "./collections";

/**
 * Deleting a workshop takes what belongs only to it with it, so nothing is left pointing at a workshop that no
 * longer exists (a demo workshop's certificates in the registry, its reels in Media Studio…):
 *
 *   deleted with it  certificates, Media Studio jobs, trips, feedback, testimonials, its student list
 *   kept, unlinked   expenses (the money was really spent), kit batches, the proposal's booking
 *   blocks it        invoices: a tax invoice is never removed silently. Delete the draft, or cancel the
 *                    invoice in Finance, first
 *
 * workshopLinks() says what would happen, for the confirmation; deleteWorkshop() does it, the workshop last, so a
 * failure half-way never leaves orphans behind a deleted workshop.
 */

export const DELETED_WITH = [
  { name: "certificates", label: "certificates", one: "certificate" },
  { name: "mediaJobs", label: "Media Studio jobs", one: "Media Studio job" },
  { name: "trips", label: "trips", one: "trip" },
  { name: "feedback", label: "feedback entries", one: "feedback entry" },
  { name: "testimonials", label: "testimonials", one: "testimonial" },
] as const;

export const UNLINKED = [
  { name: "expenses", label: "expenses", one: "expense" },
  { name: "kitBatches", label: "kit batches", one: "kit batch" },
] as const;

const rosterPath = (id: string) => `data/rosters/${id}.json`;

export interface WorkshopLinks {
  deleted: { name: string; label: string; one: string; count: number }[];
  students: number;
  unlinked: { name: string; label: string; one: string; count: number }[];
  proposals: number;
  invoices: { id: string; number: string; status: string }[];
}

const linked = (r: BaseRecord, id: string) => r.workshopId === id;
const bookedIn = (r: BaseRecord, id: string) => {
  const b = r.booking as { workshopIds?: unknown } | undefined;
  return !!b && Array.isArray(b.workshopIds) && b.workshopIds.includes(id);
};

export async function workshopLinks(id: string): Promise<WorkshopLinks> {
  const count = async (name: string) => (await listRecords(name)).filter((r) => linked(r, id)).length;
  const [deleted, unlinked, invoices, proposals, roster] = await Promise.all([
    Promise.all(DELETED_WITH.map(async (c) => ({ ...c, count: await count(c.name) }))),
    Promise.all(UNLINKED.map(async (c) => ({ ...c, count: await count(c.name) }))),
    listRecords("invoices").then((list) => list.filter((r) => linked(r, id)).map((r) => ({ id: r.id, number: String(r.number ?? ""), status: String(r.status ?? "draft") }))),
    listRecords("proposals").then((list) => list.filter((r) => bookedIn(r, id)).length),
    store.readJSON<{ students?: unknown[] }>(rosterPath(id), { students: [] }).then((r) => (Array.isArray(r.data.students) ? r.data.students.length : 0)),
  ]);
  return { deleted: [...deleted], students: roster, unlinked: [...unlinked], proposals, invoices };
}

export class WorkshopHasInvoices extends Error {
  constructor(public invoices: WorkshopLinks["invoices"]) {
    super(`This workshop has ${invoices.length === 1 ? "an invoice" : `${invoices.length} invoices`} (${invoices.map((i) => i.number || "draft").join(", ")}). Delete the draft or cancel the invoice in Finance first: a tax invoice is never removed with a workshop.`);
    this.name = "WorkshopHasInvoices";
  }
}

export async function deleteWorkshop(id: string, author: string) {
  const w = await getRecord("workshops", id);
  if (!w) return { removed: 0 };
  const title = String(w.title ?? id).slice(0, 60);
  const invoices = (await listRecords("invoices")).filter((r) => linked(r, id));
  if (invoices.length) throw new WorkshopHasInvoices(invoices.map((r) => ({ id: r.id, number: String(r.number ?? ""), status: String(r.status ?? "draft") })));

  let removed = 0;
  for (const c of DELETED_WITH) {
    const before = (await listRecords(c.name)).filter((r) => linked(r, id)).length;
    if (!before) continue;
    await mutateCollection(c.name, (list) => list.filter((r) => !linked(r, id)), `Delete ${before} ${c.label} of the deleted workshop ${title}`, author);
    removed += before;
  }
  for (const c of UNLINKED) {
    const n = (await listRecords(c.name)).filter((r) => linked(r, id)).length;
    if (!n) continue;
    await mutateCollection(c.name, (list) => list.map((r) => (linked(r, id) ? { ...r, workshopId: undefined } : r)), `Unlink ${n} ${c.label} from the deleted workshop ${title}`, author);
  }
  if ((await listRecords("proposals")).some((r) => bookedIn(r, id))) {
    await mutateCollection(
      "proposals",
      (list) =>
        list.map((r) => {
          if (!bookedIn(r, id)) return r;
          const b = r.booking as { workshopIds: string[] };
          return { ...r, booking: { ...b, workshopIds: b.workshopIds.filter((x) => x !== id) } };
        }),
      `Unlink the deleted workshop ${title} from its proposal`,
      author,
    );
  }
  if (await store.read(rosterPath(id))) {
    await store.remove(rosterPath(id), `Delete the student list of the deleted workshop ${title}`, { author });
  }
  await deleteRecord("workshops", id, author);
  return { removed };
}
