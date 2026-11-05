/**
 * The JOVE brand kit: every logo file built by scripts/brand-assets.py (and the key visual by scripts/keyvisual.py),
 * with what each is for. Sizes come from kit-sizes.json, which the script writes from the real files.
 * Colours and type follow OPERATIONS/01_BRAND/01_Brand_Guidelines.md.
 */
import sizes from "./kit-sizes.json";

export type KitBg = "dark" | "light" | "checker";

export interface KitFile {
  file: string;
  name: string;
  /** what the preview is shown on */
  bg: KitBg;
  use: string;
  /** the profile picture is previewed as a circle, as the platforms show it */
  circle?: boolean;
  group: "Full logo" | "Horizontal logo" | "Icon" | "Profile picture" | "Key visual";
}

export const KIT_FILES: KitFile[] = [
  { group: "Full logo", file: "jove-lockup-dark.png", name: "Full logo on graphite", bg: "dark", use: "Title slides, standees, T-shirts, dark covers." },
  { group: "Full logo", file: "jove-lockup-light.png", name: "Full logo on paper", bg: "light", use: "Documents, proposals, certificates, light covers." },
  { group: "Full logo", file: "jove-lockup-transparent.png", name: "Full logo, transparent", bg: "checker", use: "Placing on any light background or a light photo panel." },
  { group: "Full logo", file: "jove-lockup-mono.png", name: "Full logo, one colour", bg: "light", use: "One-colour print: stamps, engraving, embroidery, screen print." },
  { group: "Horizontal logo", file: "jove-horizontal-dark.png", name: "Horizontal on graphite", bg: "dark", use: "Banners, email headers and wide slides on dark." },
  { group: "Horizontal logo", file: "jove-horizontal-for-dark.png", name: "Horizontal for dark", bg: "dark", use: "Transparent: over dark panels and darkened photos." },
  { group: "Horizontal logo", file: "jove-horizontal-for-light.png", name: "Horizontal for light", bg: "checker", use: "Transparent: letterheads, footers, light banners." },
  { group: "Icon", file: "jove-icon-transparent.png", name: "Icon, transparent", bg: "checker", use: "The arm and ring alone: stickers, watermarks, seals." },
  { group: "Icon", file: "jove-icon-mono.png", name: "Icon, one colour", bg: "light", use: "Stamps, embossing, laser engraving." },
  { group: "Icon", file: "jove-icon-dark.png", name: "Icon on graphite", bg: "dark", use: "App icons, small square spaces on dark." },
  { group: "Profile picture", file: "jove-profile-picture.png", name: "Profile picture", bg: "dark", circle: true, use: "Instagram, WhatsApp, LinkedIn, YouTube: the logo stays inside the round crop." },
  { group: "Key visual", file: "jove-keyvisual.png", name: "Key visual", bg: "dark", use: "Hero backgrounds, cover photos, event screens. The symbol stays in the middle band when cropped." },
  { group: "Key visual", file: "jove-keyvisual-1200.png", name: "Key visual, small", bg: "dark", use: "Link previews, LinkedIn and YouTube banners, email." },
];

export const KIT_SIZES = sizes as Record<string, { w: number; h: number; bytes: number }>;

/** the smaller files the website itself uses, also built by the script */
export const SITE_FILES: { file: string; what: string }[] = [
  { file: "logo-on-light.png", what: "Horizontal logo, 900 px, for light backgrounds" },
  { file: "logo-on-dark.png", what: "Horizontal logo, 900 px, for dark backgrounds" },
  { file: "jove-wordmark.png", what: "Logo with the tagline, 1400 × 669 (website header, documents)" },
  { file: "jove-wordmark-white.png", what: "The same in white, for dark" },
  { file: "jove-mark.png", what: "Icon, 1024 × 1178" },
  { file: "jove-mark-white.png", what: "Icon in white, for dark" },
  { file: "jove-logo-ink.png", what: "The full brand sheet with the corner notes, 2000 × 1067" },
  { file: "jove-logo-paper.webp", what: "The same on paper" },
  { file: "emblem-512.png", what: "Icon in a transparent square, 512 px" },
  { file: "icon-512.png", what: "App icon on graphite, 512 px" },
  { file: "apple-touch-icon.png", what: "iPhone home-screen icon, 180 px" },
  { file: "og-image.jpg", what: "Link preview picture, 1200 × 630" },
];

export interface Colour {
  name: string;
  hex: string;
  role: string;
}

export const BRAND_COLOURS: Colour[] = [
  { name: "Paper", hex: "#F5F1E8", role: "Primary background (55 to 60% of a layout)" },
  { name: "Paper 50", hex: "#FBF9F4", role: "Cards and panels on paper" },
  { name: "Paper 200", hex: "#EDE7DA", role: "Panels on paper" },
  { name: "Paper 300", hex: "#E0D8C6", role: "Rules on paper" },
  { name: "Line", hex: "#D9D2C2", role: "Hairlines on paper" },
  { name: "Graphite", hex: "#2B2B2B", role: "Text, dark sections and the logo (25 to 30%)" },
  { name: "Charcoal", hex: "#4A4A4A", role: "Body text on paper" },
  { name: "Blueprint grey", hex: "#7A7A7A", role: "Annotations, secondary text, grid (8 to 10%)" },
  { name: "Accent grey", hex: "#C9C9C9", role: "Borders, dividers, disabled (3 to 5%)" },
  { name: "Ink", hex: "#161616", role: "Deepest dark, print black, one-colour logo" },
];

/** website pictures and films (OPERATIONS/01_BRAND/05_Brand_Asset_Index.md): all are illustrations */
export const SITE_PICTURES: { src: string; name: string; use: string }[] = [
  { src: "/images/hero/hero-arm.webp", name: "Sketch robotic arm", use: "Home hero" },
  { src: "/images/age/age-1.webp", name: "Wheeled robot sketch", use: "Grades 1–2" },
  { src: "/images/age/age-2.webp", name: "Light-seeking car sketch", use: "Grades 3–5" },
  { src: "/images/age/age-3.webp", name: "Arduino obstacle car sketch", use: "Grades 6–8" },
  { src: "/images/age/age-4.webp", name: "AI vision pan-tilt sketch", use: "Grades 9–10" },
  { src: "/images/studio/media-crew.webp", name: "Film crew with students", use: "Studio sections" },
  { src: "/images/studio/kids-build.webp", name: "Hands building a robot", use: "Workshop sections" },
  { src: "/images/studio/trainer-class.webp", name: "Trainer with a class", use: "Trainer sections" },
  { src: "/images/kits/kit-knolling.webp", name: "Kit components sketch", use: "Kit overview" },
];

export const SITE_FILMS: { poster: string; file: string; name: string }[] = [
  { poster: "/videos/hero-arm-3d-poster.webp", file: "/videos/hero-arm-3d.mp4", name: "The arm comes alive (3D)" },
  { poster: "/videos/drone-poster.webp", file: "/videos/drone.mp4", name: "Aerial campus" },
  { poster: "/videos/kids-build-poster.webp", file: "/videos/kids-build.mp4", name: "Hands building" },
  { poster: "/videos/crew-poster.webp", file: "/videos/crew.mp4", name: "Film crew at work" },
  { poster: "/videos/trainer-poster.webp", file: "/videos/trainer.mp4", name: "Trainer demonstration" },
];

export function sizeLabel(file: string): string | null {
  const s = KIT_SIZES[file];
  if (!s) return null;
  const mb = s.bytes / 1024 / 1024;
  return `${s.w} × ${s.h} px · ${mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(s.bytes / 1024)} KB`}`;
}

export const previewOf = (file: string) => `/brand/kit/preview/${file.replace(/\.png$/, ".webp")}`;
