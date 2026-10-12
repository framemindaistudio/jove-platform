import type { Metadata } from "next";
import { site } from "@/lib/site";
import { getPublishedTestimonials } from "@/lib/public-data";
import { Hero } from "@/components/site/home/Hero";
import { Marquee } from "@/components/site/home/Marquee";
import { Manifesto } from "@/components/site/home/Manifesto";
import { JoveDayTimeline } from "@/components/site/home/JoveDayTimeline";
import { Programs } from "@/components/site/home/Programs";
import { MediaPack } from "@/components/site/home/MediaPack";
import { LabsTeaser } from "@/components/site/home/LabsTeaser";
import { PackagesTeaser } from "@/components/site/home/PackagesTeaser";
import { KitsTeaser } from "@/components/site/home/KitsTeaser";
import { Founders } from "@/components/site/home/Founders";
import { Testimonials } from "@/components/site/home/Testimonials";
import { Faq } from "@/components/site/home/Faq";
import { Booking } from "@/components/site/home/Booking";

export const revalidate = 300;

const title = `${site.name} — Robotics, AI & ML Workshops for Schools, with a Film Studio`;
const description =
  "Full-day, hands-on Robotics, AI & Machine Learning workshops for Grades 1–10 — and the first school workshop company with its own in-house cinematic film studio. Every JOVE Day includes free reels, a full-day film and drone shots.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title,
    description,
    locale: "en_IN",
    images: [{ url: "/brand/og-image.jpg", alt: "JOVE — Building real-world skills through Robotics & AI" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/brand/og-image.jpg"] },
};

export default async function HomePage() {
  const testimonials = await getPublishedTestimonials();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.name,
    alternateName: site.expansion,
    url: site.url,
    logo: new URL("/brand/icon-512.png", site.url).toString(),
    description: site.description,
    slogan: site.tagline,
    areaServed: "IN",
    founder: site.founders.map((f) => ({ "@type": "Person", name: f.name, jobTitle: f.role })),
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <Marquee />
      <Manifesto />
      <JoveDayTimeline />
      <Programs />
      <MediaPack />
      <LabsTeaser />
      <PackagesTeaser />
      <KitsTeaser />
      <Founders />
      <Testimonials items={testimonials} />
      <Faq />
      <Booking />
    </>
  );
}
