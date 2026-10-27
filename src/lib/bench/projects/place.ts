/** Placing parts with their legs in breadboard holes, so the project files read like the build guide. */
import { pinWorld } from "../circuit";
import type { PlacedPart } from "../types";

/** A part whose first leg sits in hole `row``col` of breadboard `bb`, turned the same way as the board. */
export function inBoard(bb: PlacedPart, hole: string, part: Omit<PlacedPart, "at" | "turn">): PlacedPart {
  const at = pinWorld(bb, hole);
  if (!at) throw new Error(`No hole ${hole}`);
  return { ...part, at, turn: bb.turn ?? 0 };
}
