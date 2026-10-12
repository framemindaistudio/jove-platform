import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { priceStamp } from "@/lib/content/business";
import { deployHookConfigured, readPriceBook, syncInventory, syncShopPrices, triggerDeploy, writePriceBook, type StockSync } from "@/lib/hq/pricebook";
import { LEADERSHIP, OPS } from "@/lib/hq/roles";
import { storeMode } from "@/lib/store";

/** What the Prices & Costs screen needs besides the book itself: is the website built with the saved prices yet? */
const status = () => ({ builtStamp: priceStamp, hook: deployHookConfigured(), storeMode: storeMode() });

/** GET → the whole price book, for the roles that see Finance. */
export async function GET() {
  const { error } = await apiUser(OPS);
  if (error) return error;
  try {
    const { book, exists } = await readPriceBook();
    return NextResponse.json({ book, exists, ...status() });
  } catch (e) {
    return apiError(e);
  }
}

/**
 * PUT { book } → check and save it, bring Inventory's unit costs and the shop's product prices in line, and ask
 * Vercel to rebuild the site so the website, brochures and proposals pick the new prices up.
 */
export async function PUT(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = await req.json();
    const before = (await readPriceBook()).book.published?.stamp ?? "";
    const book = await writePriceBook(body?.book, user.name);
    const pricesChanged = book.published!.stamp !== before;
    // the book is saved; if Inventory cannot be updated now, say so instead of failing the save (the next save retries)
    let stock: StockSync | null = null;
    try {
      stock = await syncInventory(book, user.name);
    } catch {
      stock = null;
    }
    // costs and planning numbers reach HQ at once; only a change in what customers pay needs the shop and the site
    const synced = pricesChanged ? await syncShopPrices(book.published!, user.name) : 0;
    const deploy = pricesChanged || book.published!.stamp !== priceStamp ? await triggerDeploy() : "current";
    return NextResponse.json({ book, exists: true, pricesChanged, synced, stock, deploy, ...status() });
  } catch (e) {
    return apiError(e);
  }
}
