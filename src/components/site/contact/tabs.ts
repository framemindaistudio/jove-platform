import { joveDayRules, mediaPack } from "@/lib/content/business";
import { FREE_SHIPPING_ABOVE } from "@/lib/shop";
import { formatINR } from "@/lib/utils";

/**
 * Enquiry types shown as tabs on /contact. Plain serializable data (no icons) so the server page can
 * build it from the single source of truth in business.ts and hand it to the client tab component.
 */
export const contactTabIds = ["workshop", "kits", "studio", "partner", "general"] as const;
export type ContactTabId = (typeof contactTabIds)[number];
export type LeadKind = "workshop" | "kits" | "studio" | "partner" | "contact";

export interface ContactTabData {
  id: ContactTabId;
  /** Short label on the tab. */
  label: string;
  kind: LeadKind;
  title: string;
  blurb: string;
  points: string[];
  submitLabel: string;
}

export function parseContactTab(value: string | string[] | undefined): ContactTabId {
  const v = Array.isArray(value) ? value[0] : value;
  return (contactTabIds as readonly string[]).includes(v ?? "") ? (v as ContactTabId) : "workshop";
}

export function buildContactTabs(): ContactTabData[] {
  return [
    {
      id: "workshop",
      label: "Book a JOVE Day",
      kind: "workshop",
      title: "Book a JOVE Day for your school",
      blurb: "Tell us a little about your school. A founder will call you, understand what you need and come back with a date and a clear proposal.",
      points: [
        `One full day for ${joveDayRules.minimumStudents}+ students across Grades 1–10 (up to ${joveDayRules.maxStudentsPerDay} in a day).`,
        `Billed per student with a ${formatINR(joveDayRules.minimumBilling)} minimum, plus GST. A ${joveDayRules.advancePercent}% advance locks your date.`,
        "Reels, a full-day film and drone shots by our in-house studio are included.",
      ],
      submitLabel: "Request a call back",
    },
    {
      id: "kits",
      label: "Bulk kits",
      kind: "kits",
      title: "Robotics kits for your school or club",
      blurb: "Ordering for a classroom, a tinkering lab or a whole grade? Tell us the kit and the quantity and we will send a quote.",
      points: [
        "Four kits, from the Spark Kit for Grades 1–2 to the Innovator AI Kit for Grades 9–10.",
        "Single kits can be ordered straight from the online store, no enquiry needed.",
        `Store orders ship free above ${formatINR(FREE_SHIPPING_ABOVE)}; bulk orders are quoted individually.`,
      ],
      submitLabel: "Request a kit quote",
    },
    {
      id: "studio",
      label: "Studio & media",
      kind: "studio",
      title: "Cinematic media from FrameMind AI Studio",
      blurb: "Every JOVE Day is filmed by our in-house studio. If you want film, reels or aerial footage beyond that, tell us what you are planning.",
      points: [
        `${mediaPack.name} is included with every JOVE Day (market value ${formatINR(mediaPack.marketValue)}).`,
        "School films, admissions reels, event coverage and drone shots.",
        "Drone shots are subject to local rules and your permission.",
      ],
      submitLabel: "Talk to the studio",
    },
    {
      id: "partner",
      label: "Partnerships & CSR",
      kind: "partner",
      title: "Partnerships, CSR and sponsorships",
      blurb: "Want to sponsor robotics days for under-resourced schools, partner on a programme or collaborate with us? Start the conversation here.",
      points: [
        "CSR and sponsored JOVE Days for schools that could not otherwise afford them.",
        "Education, technology and community partners.",
        "We reply with how we could work together, in writing, so your team can review.",
      ],
      submitLabel: "Start a conversation",
    },
    {
      id: "general",
      label: "General",
      kind: "contact",
      title: "Anything else",
      blurb: "A question that does not fit the other tabs, press, feedback or something we have not thought of. Write to us and we will point you in the right direction.",
      points: [
        "Trainer or creative roles? See our careers page.",
        "Verifying a certificate? Use the certificate checker.",
        "Order questions: include your order number.",
      ],
      submitLabel: "Send message",
    },
  ];
}
