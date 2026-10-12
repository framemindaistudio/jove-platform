/**
 * The quick links of Media Studio → Guides & SOPs. Kept apart from the screen so that the page (on the server) can
 * check each document against what the signed-in account may read, and the screen only shows links that open.
 */
import { BookOpen, CalendarDays, Camera, Clapperboard, FileSignature, Megaphone, Quote, Send, Video, type LucideIcon } from "lucide-react";

export interface Guide {
  title: string;
  detail: string;
  icon: LucideIcon;
  /** a document or folder of the Operations Library… */
  doc?: string;
  /** …or a page of HQ */
  href?: string;
}

/** Shooting a JOVE Day and handing the school what it was promised. */
export const SCHOOL_SIDE: Guide[] = [
  { doc: "OPERATIONS/25_MEDIA_PRODUCTION", title: "Media production library", detail: "Shot lists, kit checklists, edit and delivery standards for the FrameMind crew.", icon: Clapperboard },
  { doc: "OPERATIONS/03_SOP/09_Media_Pack_Delivery_SOP.md", title: "Media Pack delivery SOP", detail: "From the shoot day to the school receiving files: who does what, and by when.", icon: Video },
  { doc: "OPERATIONS/11_CONTENT/02_JOVE_Day_Shot_List.md", title: "JOVE Day shot list", detail: "The exact shots by schedule time: reels, film, drone, photos and the interview.", icon: Camera },
  { doc: "OPERATIONS/11_CONTENT/06_School_Social_Posting_Kit_Template.md", title: "School posting kit template", detail: "The captions and posting notes a school receives with its reels.", icon: Send },
  { doc: "OPERATIONS/18_LEGAL_CONSENT", title: "Consent & usage rights", detail: "Parent consent wording and how student images may be used.", icon: FileSignature },
  { href: "/hq/reputation", title: "Testimonials & case studies", detail: "Clips and quotes collected after each workshop, with consent tracking.", icon: Quote },
];

/** JOVE's own posting used to be planned in Media Studio. The work moved to Social Studio; the reading is still in the library. */
export const OWN_CHANNELS: Guide[] = [
  { href: "/hq/social?tab=plan", title: "Content plan", detail: "The calendar and list of JOVE's own posts, with the designs and captions that go with them.", icon: CalendarDays },
  { doc: "OPERATIONS/11_CONTENT", title: "Content library", detail: "Pillars, reel scripts, the caption bank and the 90-day launch calendar for JOVE's own channels.", icon: BookOpen },
  { doc: "OPERATIONS/21_MARKETING", title: "Marketing playbook", detail: "Launch plan, channels and the founding-partner school offer.", icon: Megaphone },
];

/** Every library document the guides link to. */
export const GUIDE_DOCS = [...SCHOOL_SIDE, ...OWN_CHANNELS].flatMap((g) => (g.doc ? [g.doc] : []));
