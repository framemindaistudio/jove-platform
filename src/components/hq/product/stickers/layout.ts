/**
 * Kit box stickers: the sizes of the four stickers and how they are laid out on A4 sheets.
 * Pure functions (no React), shared by the print page and by the card in HQ → Printables that says how many sheets come out.
 *
 * Everything is in millimetres.
 */
import { kits, type Kit, type KitId } from "@/lib/content/business";

export type StickerKind = "lid" | "back" | "badge" | "seal";
export type StickerShow = "all" | "lid" | "rounds" | "back";

/** The paper: A4 portrait. */
export const A4 = { w: 210, h: 297 } as const;
/** Nothing, cut lines included, is printed closer to the sheet edge than this: an ordinary printer cannot print there. */
export const SHEET_MARGIN = 6;
/** Clear space between two stickers on a sheet, so there is room for scissors. */
export const GAP = 3;
/** Brown box left showing around the lid label, on every side, before rounding the label down to a whole 5 mm. */
export const BROWN_BORDER = 16;
/** A lid label is never wider or taller than this, so it always fits an A4 sheet. */
export const LID_MAX = { w: 186, h: 270 } as const;
/** Grade badge: diameter of the round sticker. */
export const BADGE_MM = 50;
/** Seal: diameter of the round sticker. */
export const SEAL_MM = 36;
/** Back label: one size for every kit. It fits the underside of the smallest box with brown showing all round. */
export const BACK_MM = { w: 145, h: 89 } as const;
/** The most boxes one print run dresses. */
export const MAX_BOXES = 60;

export const SHOW_OPTIONS: [StickerShow, string][] = [
  ["all", "The whole set: lid label, grade badge, seal and back label"],
  ["lid", "Lid labels only"],
  ["rounds", "Grade badges and seals only"],
  ["back", "Back labels only"],
];

export const showOf = (v: unknown): StickerShow => (v === "lid" || v === "rounds" || v === "back" ? v : "all");
export const kitOf = (v: unknown): Kit => kits.find((k) => k.id === v) ?? kits[0];
export function boxesOf(v: unknown, fallback = 4) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? Math.min(MAX_BOXES, Math.max(1, n)) : fallback;
}

const down5 = (v: number) => Math.floor(v / 5) * 5;

/**
 * The lid label for one kit, sized from the top of its box (length × width): the box face less the brown border on
 * every side, rounded down to a whole 5 mm, and never larger than LID_MAX. It always reads along the long side.
 */
export function lidSize(kit: Pick<Kit, "box">) {
  const long = Math.max(kit.box.length, kit.box.width);
  const short = Math.min(kit.box.length, kit.box.width);
  return {
    w: Math.max(60, Math.min(LID_MAX.w, down5(long - 2 * BROWN_BORDER))),
    h: Math.max(60, Math.min(LID_MAX.h, down5(short - 2 * BROWN_BORDER))),
  };
}

/** Brown box left showing beside (x) and above/below (y) the lid label once it is centred on the lid. */
export function lidBorder(kit: Pick<Kit, "box">) {
  const { w, h } = lidSize(kit);
  return { x: (Math.max(kit.box.length, kit.box.width) - w) / 2, y: (Math.min(kit.box.length, kit.box.width) - h) / 2 };
}

/** Width and height of one sticker of this kind for this kit. */
export function stickerSize(kind: StickerKind, kit: Pick<Kit, "box">) {
  if (kind === "lid") return lidSize(kit);
  if (kind === "back") return { w: BACK_MM.w, h: BACK_MM.h };
  const d = kind === "badge" ? BADGE_MM : SEAL_MM;
  return { w: d, h: d };
}

/** The stickers one box needs, in the order they are stuck on. */
export function kindsFor(show: StickerShow): StickerKind[] {
  if (show === "lid") return ["lid"];
  if (show === "back") return ["back"];
  if (show === "rounds") return ["badge", "seal"];
  return ["lid", "back", "badge", "seal"];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** One sticker on a sheet: its top-left corner measured from the top-left corner of the paper. */
export interface Placed extends Rect {
  kind: StickerKind;
}
interface Item {
  kind: StickerKind;
  w: number;
  h: number;
}

const EPS = 0.001;

/**
 * Packs the stickers onto as few areas of `W × H` as it can: each sticker goes into the smallest free rectangle that
 * holds it, and what is left beside and below it stays free for the next sticker. Neighbours are always GAP apart.
 * With `together` the newest sheet is tried first, so the stickers of one box stay on one sheet when they fit there;
 * without it every sticker goes on the first sheet that has room.
 */
function pack(items: Item[], W: number, H: number, together = false): Placed[][] {
  const sheets: { free: Rect[]; placed: Placed[] }[] = [];
  const place = (s: (typeof sheets)[number], it: Item) => {
    let best = -1;
    s.free.forEach((f, i) => {
      if (it.w > f.w + EPS || it.h > f.h + EPS) return;
      if (best < 0 || f.w * f.h < s.free[best].w * s.free[best].h) best = i;
    });
    if (best < 0) return false;
    const f = s.free[best];
    s.placed.push({ kind: it.kind, x: f.x, y: f.y, w: it.w, h: it.h });
    const beside: Rect = { x: f.x + it.w + GAP, y: f.y, w: f.w - it.w - GAP, h: it.h };
    const below: Rect = { x: f.x, y: f.y + it.h + GAP, w: f.w, h: f.h - it.h - GAP };
    s.free.splice(best, 1, ...[beside, below].filter((r) => r.w > EPS && r.h > EPS));
    return true;
  };
  for (const it of items) {
    if (together && sheets.length && place(sheets[sheets.length - 1], it)) continue;
    if (sheets.some((s) => place(s, it))) continue;
    const fresh = { free: [{ x: 0, y: 0, w: W, h: H }], placed: [] as Placed[] };
    // a sticker larger than the printable area cannot happen with the sizes above; if it ever does it still gets a sheet
    if (!place(fresh, it)) fresh.placed.push({ kind: it.kind, x: 0, y: 0, w: it.w, h: it.h });
    sheets.push(fresh);
  }
  return sheets.map((s) => s.placed);
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * The sheets for `count` boxes of one kit. Two orders are tried — box by box (lid, back, badge, seal, then the next
 * box) and kind by kind (all the lid labels, then all the back labels…) — and the one that uses fewer sheets wins.
 * On a tie the whole set goes box by box, so one sheet dresses whole boxes, and a single kind of sticker goes kind by
 * kind, which gives tidy rows. What is on a sheet is then centred on the paper.
 */
export function layoutSheets(kit: Pick<Kit, "box">, count: number, show: StickerShow): Placed[][] {
  const n = Math.min(MAX_BOXES, Math.max(1, Math.round(count) || 1));
  const kinds = kindsFor(show);
  const item = (kind: StickerKind): Item => ({ kind, ...stickerSize(kind, kit) });
  const boxByBox = Array.from({ length: n }, () => kinds.map(item)).flat();
  const kindByKind = kinds.flatMap((k) => Array.from({ length: n }, () => item(k)));
  const W = A4.w - 2 * SHEET_MARGIN;
  const H = A4.h - 2 * SHEET_MARGIN;
  const a = pack(boxByBox, W, H, true);
  const b = pack(kindByKind, W, H);
  const sheets = b.length < a.length || (b.length === a.length && show !== "all") ? b : a;
  return sheets.map((placed) => {
    const right = Math.max(...placed.map((p) => p.x + p.w));
    const bottom = Math.max(...placed.map((p) => p.y + p.h));
    const dx = Math.max(SHEET_MARGIN, (A4.w - right) / 2);
    const dy = Math.max(SHEET_MARGIN, (A4.h - bottom) / 2);
    return placed.map((p) => ({ ...p, x: round1(p.x + dx), y: round1(p.y + dy) }));
  });
}

/** How many A4 sheets a run makes. */
export const sheetCount = (kitId: KitId | string | undefined, count: number, show: StickerShow) => layoutSheets(kitOf(kitId), count, show).length;

/** How many stickers of one kind fit on one A4 sheet when a sheet holds nothing else. */
export function perSheet(kind: StickerKind, kit: Pick<Kit, "box">) {
  const one: Item = { kind, ...stickerSize(kind, kit) };
  return pack(Array.from({ length: 80 }, () => one), A4.w - 2 * SHEET_MARGIN, A4.h - 2 * SHEET_MARGIN)[0].length;
}
