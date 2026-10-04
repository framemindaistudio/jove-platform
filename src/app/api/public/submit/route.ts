import { NextResponse } from "next/server";
import { upsertRecord } from "@/lib/hq/records";
import { apiError, clientIp, rateLimit } from "@/lib/hq/api";
import { StoreReadOnlyError } from "@/lib/store";

/**
 * Public website forms → HQ "Website Leads" (data/leads.json).
 * POST { kind, name, phone, email, organisation, role, city, students, gradeBands[], package, preferredDate, message, page, website(honeypot) }
 */
const KINDS = ["workshop", "trainer", "contact", "kits", "studio", "partner"];

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`submit:${ip}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many submissions — please try again in a few minutes." }, { status: 429 });
  }
  // overall ceiling per server instance, so a distributed burst cannot flood HQ with commits
  if (!rateLimit("submit:all", 40, 60 * 1000)) {
    return NextResponse.json({ error: "We are receiving a lot of requests right now — please try again in a minute." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // honeypot: real people never fill the hidden "website" field
  if (body.website) return NextResponse.json({ ok: true });

  const str = (k: string, max = 200) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const kind = KINDS.includes(str("kind")) ? str("kind") : "contact";
  const name = str("name", 120);
  const phone = str("phone", 30);
  const email = str("email", 160);
  if (!name) return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  if (!phone && !email) return NextResponse.json({ error: "Please share a phone number or email so we can reach you." }, { status: 400 });
  if (phone && !/^[+\d][\d\s-]{7,15}$/.test(phone)) return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  const bands = Array.isArray(body.gradeBands) ? (body.gradeBands as unknown[]).map(String).filter((b) => ["g1-2", "g3-5", "g6-8", "g9-10"].includes(b)) : [];
  const pkg = ["jove-day", "jove-quarter", "jove-year", "jove-club", "custom"].includes(str("package")) ? str("package") : undefined;

  try {
    await upsertRecord(
      "leads",
      {
        kind,
        status: "new",
        name,
        phone,
        email,
        organisation: str("organisation", 160),
        role: str("role", 80),
        city: str("city", 80),
        students: Number(body.students) || undefined,
        gradeBands: bands,
        package: pkg,
        preferredDate: /^\d{4}-\d{2}-\d{2}$/.test(str("preferredDate")) ? str("preferredDate") : undefined,
        message: str("message", 3000),
        page: str("page", 120),
      },
      "Website",
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Visitors must never see internal setup messages (missing token, public data repo…).
    if (e instanceof StoreReadOnlyError) {
      console.error("[public form] store is not writable:", e.message);
      return NextResponse.json({ error: "We can't take this online right now. Please try again a little later, or contact us directly." }, { status: 503 });
    }
    return apiError(e);
  }
}
