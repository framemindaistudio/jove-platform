import { NextResponse } from "next/server";
import { nextSequence, upsertRecord } from "@/lib/hq/records";
import { apiError, clientIp, rateLimit } from "@/lib/hq/api";
import { StoreReadOnlyError } from "@/lib/store";
import { getPublicProducts } from "@/lib/public-data";
import { shippingFor } from "@/lib/shop";

/**
 * Online store checkout → HQ "Shop Orders" (data/orders.json).
 * Prices are re-calculated server-side from the catalog — the client total is never trusted.
 * POST { customerName, phone, email, address, city, pincode, items: [{ slug, qty }], notes, website(honeypot) }
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`order:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many orders from this network — please try again shortly." }, { status: 429 });
  }
  // overall ceiling per server instance, so a distributed burst cannot flood HQ with commits
  if (!rateLimit("order:all", 25, 60 * 1000)) {
    return NextResponse.json({ error: "We are receiving a lot of requests right now — please try again in a minute." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ ok: true, number: "—" });

  const str = (k: string, max = 200) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const customerName = str("customerName", 120);
  const phone = str("phone", 20);
  const email = str("email", 160);
  const address = str("address", 600);
  const city = str("city", 80);
  const pincode = str("pincode", 6);
  if (!customerName || !phone || !address || !city || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Please fill your name, phone, full address, city and a 6-digit PIN code." }, { status: 400 });
  }
  if (!/^[+\d][\d\s-]{7,15}$/.test(phone)) return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });

  const catalog = await getPublicProducts();
  const rawItems = Array.isArray(body.items) ? (body.items as { slug?: string; qty?: number }[]) : [];
  const items = rawItems
    .map((it) => {
      const p = catalog.find((c) => c.slug === it.slug);
      const qty = Math.min(50, Math.max(1, Math.floor(Number(it.qty) || 1)));
      return p && p.status === "active" ? { description: p.name, qty, rate: p.price, productId: p.id } : null;
    })
    .filter(Boolean) as { description: string; qty: number; rate: number; productId: string }[];
  if (!items.length) return NextResponse.json({ error: "Your cart is empty or the items are unavailable." }, { status: 400 });

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  try {
    const number = await nextSequence("order", "Website");
    await upsertRecord(
      "orders",
      { number, status: "new", customerName, phone, email, address, city, pincode, items, shipping, total, notes: str("notes", 1000) },
      "Website",
    );
    const paymentLinks = items
      .map((i) => catalog.find((c) => c.id === i.productId)?.paymentLink)
      .filter(Boolean);
    return NextResponse.json({ ok: true, number, total, paymentLink: paymentLinks.length === 1 && items.length === 1 && items[0].qty === 1 ? paymentLinks[0] : null });
  } catch (e) {
    // Visitors must never see internal setup messages (missing token, public data repo…).
    if (e instanceof StoreReadOnlyError) {
      console.error("[public form] store is not writable:", e.message);
      return NextResponse.json({ error: "We can't take this online right now. Please try again a little later, or contact us directly." }, { status: 503 });
    }
    return apiError(e);
  }
}
