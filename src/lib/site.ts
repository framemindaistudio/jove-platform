/**
 * Public-facing company profile + navigation.
 * Contact details come from env so they can be changed on Vercel without a code change.
 * Anything left empty is hidden gracefully in the UI (forms always work — they land in HQ → Leads).
 */
export const site = {
  name: "JOVE",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "JOVE — Journey of Visionation & Excellence",
  expansion: "Journey of Visionation & Excellence",
  tagline: "Precision · Learning · Innovation · Automation",
  pillars: ["Robotics", "AI", "STEM Education", "Real-World Skills"],
  headline: "Building Real-World Skills Through Robotics & AI",
  description:
    "JOVE brings full-day Robotics, AI & Machine Learning workshops to schools — Grades 1 to 10 — and is the first school workshop company with its own in-house cinematic film studio. Every workshop ships with reels, a full-day film and drone shots for your school.",
  // the live domain is the default in production, so links, QR codes and share previews are right even if the env var is missing
  url: (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://www.jove.website" : "http://localhost:3000")).replace(/\/+$/, ""),
  location: process.env.NEXT_PUBLIC_LOCATION || "India",
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
    /** digits only, with country code, e.g. 919876543210 */
    whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, ""),
  },
  socials: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE || "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN || "",
  },
  studio: {
    name: "FrameMind AI Studio",
    url: "https://framemind-ai-studio.figma.site/",
  },
  founders: [
    {
      id: "shivaprasad",
      name: "Shivaprasad Reddy S S",
      role: "Founder & CEO",
      focus: "Operations · School Partnerships · Sales · Marketing · Finance · Logistics",
      bio: "Shivaprasad runs JOVE end-to-end — from the first call with a principal to the last kit packed into the van. He leads school partnerships, closes every deal personally, and owns operations, finance, transport and travel so that every JOVE Day runs like clockwork.",
      initials: "SR",
      photo: "/team/shivaprasad.jpg",
    },
    {
      id: "chinmay",
      name: "Chinmay R M",
      role: "Co-Founder & Chief Creative Officer",
      focus: "Cinematic Studio · Brand · Curriculum Design · Technology",
      bio: "Chinmay is the founder of FrameMind AI Studio, the in-house production studio behind every JOVE film, reel and drone shot. He leads brand, content and technology at JOVE — and makes sure every school walks away with world-class media of its students building the future.",
      initials: "CR",
      photo: "/team/chinmay.jpg",
    },
  ],
} as const;

export type NavItem = { label: string; href: string; description?: string };

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about", description: "Our story, mission and founders" },
  { label: "Programs", href: "/programs", description: "Full-day workshops for Grades 1–10" },
  { label: "Packages", href: "/packages", description: "JOVE Day, Quarter, Year & add-ons" },
  { label: "Studio", href: "/studio", description: "Reels, films & drone shots for your school" },
  { label: "Virtual Labs", href: "/labs", description: "Free online robotics & AI journeys" },
  { label: "Shop", href: "/shop", description: "Robotics & AI kits" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "For Schools",
    items: [
      { label: "Programs", href: "/programs" },
      { label: "Packages & Pricing", href: "/packages" },
      { label: "Media Studio", href: "/studio" },
      { label: "Book a Workshop", href: "/contact" },
      { label: "Testimonials", href: "/testimonials" },
    ],
  },
  {
    title: "Learn & Shop",
    items: [
      { label: "Virtual Labs", href: "/labs" },
      { label: "Robotics Kits", href: "/shop" },
      { label: "Verify a Certificate", href: "/verify" },
      { label: "Careers — Join as Trainer", href: "/careers" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About JOVE", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund & Cancellation", href: "/refund-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
    ],
  },
];

export function whatsappLink(message: string) {
  if (!site.contact.whatsapp) return null;
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
