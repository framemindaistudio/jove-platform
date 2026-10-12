/**
 * One-tap contact links (call / WhatsApp / email) and polite first messages.
 * Indian numbers without a country code get +91.
 */

/** Digits with country code, e.g. "919876543210" — or "" when unusable. */
export function phoneDigits(phone: unknown) {
  let d = String(phone ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d.length >= 10 ? d : "";
}

export function telHref(phone: unknown) {
  const raw = String(phone ?? "").trim();
  if (!raw) return null;
  const d = phoneDigits(raw);
  return d ? `tel:+${d}` : `tel:${raw.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(phone: unknown, text: string) {
  const d = phoneDigits(phone);
  if (!d) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function mailHref(email: unknown, subject?: string, body?: string) {
  const e = String(email ?? "").trim();
  if (!e || !/^\S+@\S+\.\S+$/.test(e)) return null;
  const q = new URLSearchParams();
  if (subject) q.set("subject", subject);
  if (body) q.set("body", body);
  const qs = q.toString().replace(/\+/g, "%20");
  return `mailto:${e}${qs ? `?${qs}` : ""}`;
}

export function firstName(name: unknown) {
  const n = String(name ?? "").trim();
  if (!n) return "";
  const parts = n.split(/\s+/);
  // skip honorifics like "Dr." / "Mrs."
  const first = /^(dr|mr|mrs|ms|miss|prof|sri|smt|shri)\.?$/i.test(parts[0]) && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
  return first;
}

type IntroKind = "workshop" | "trainer" | "contact" | "kits" | "studio" | "partner" | "school";

const TOPIC: Record<IntroKind, string> = {
  workshop: "a Robotics & AI workshop",
  trainer: "joining JOVE as a trainer",
  contact: "JOVE",
  kits: "JOVE robotics kits for your students",
  studio: "media and film services from our in-house studio, FrameMind AI Studio",
  partner: "partnering with JOVE",
  school: "a Robotics & AI programme",
};

/** A warm, short first message — used for WhatsApp and email bodies. */
export function introMessage({ kind, name, organisation, sender }: { kind: string; name?: unknown; organisation?: unknown; sender: string }) {
  const k = (kind in TOPIC ? kind : "contact") as IntroKind;
  const hello = firstName(name) ? `Namaste ${firstName(name)},` : "Namaste,";
  const org = String(organisation ?? "").trim();
  const me = `this is ${sender} from JOVE — Journey of Visionation & Excellence.`;
  switch (k) {
    case "trainer":
      return `${hello} ${me} Thank you for applying to join JOVE as a trainer. We'd love to know more about your experience with robotics, coding or teaching. Could we set up a short call this week?`;
    case "kits":
      return `${hello} ${me} Thank you for your enquiry about JOVE robotics kits${org ? ` for ${org}` : ""}. I can share kit options by grade, bulk school pricing and delivery timelines. When would be a good time for a quick call?`;
    case "studio":
      return `${hello} ${me} Thank you for your interest in ${TOPIC.studio}${org ? ` for ${org}` : ""}. I'd love to understand what you have in mind — reels, an admissions film or monthly social media — and share a plan. When can we talk?`;
    case "partner":
      return `${hello} ${me} Thank you for reaching out about ${TOPIC.partner}. I'd be glad to understand your idea and explore how we could work together. Would a quick call this week suit you?`;
    case "workshop":
    case "school":
      return `${hello} ${me} Thank you for your interest in ${TOPIC[k]}${org ? ` for ${org}` : ""}. I'd love to understand your requirements and share our JOVE Day plan — every school also receives a free Media Pack (reels, a full-day film and drone shots) from our in-house film studio. When would be a good time for a quick call or a visit?`;
    default:
      return `${hello} ${me} Thank you for reaching out to us. How can we help? Happy to set up a quick call at a time that suits you.`;
  }
}

export function introSubject(kind: string, organisation?: unknown) {
  const org = String(organisation ?? "").trim();
  switch (kind) {
    case "trainer":
      return "Your trainer application — JOVE";
    case "kits":
      return "JOVE robotics kits — your enquiry";
    case "studio":
      return "FrameMind AI Studio × JOVE — your enquiry";
    case "partner":
      return "Partnering with JOVE";
    case "workshop":
    case "school":
      return `Robotics & AI workshop${org ? ` for ${org}` : ""} — JOVE`;
    default:
      return "Thank you for contacting JOVE";
  }
}
