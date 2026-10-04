import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { InstagramIcon as Instagram, LinkedinIcon as Linkedin, YoutubeIcon as Youtube } from "@/components/brand/SocialIcons";
import { Logo } from "@/components/brand/Logo";
import { AnnotationStack, DimensionLine } from "@/components/brand/Blueprint";
import { footerNav, site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  const socials = [
    { href: site.socials.instagram, label: "Instagram", Icon: Instagram },
    { href: site.socials.youtube, label: "YouTube", Icon: Youtube },
    { href: site.socials.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((s) => s.href);

  return (
    <footer className="site-footer relative overflow-hidden bg-graphite text-paper">
      <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-70" />
      <div className="container-bp relative pb-10 pt-20">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="w-56 sm:w-72">
              <Logo variant="wordmark" tone="white" />
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-paper/65">
              Full-day Robotics, AI &amp; Machine Learning workshops for Grades 1–10 — with a cinematic film crew in every school. Precision learning, built for the real world.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              {site.contact.email && (
                <a href={`mailto:${site.contact.email}`} className="inline-flex items-center gap-2 text-paper/80 hover:text-paper">
                  <Mail className="size-4" /> {site.contact.email}
                </a>
              )}
              {site.contact.phone && (
                <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-paper/80 hover:text-paper">
                  <Phone className="size-4" /> {site.contact.phone}
                </a>
              )}
            </div>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-paper/20 text-paper/80 transition-colors hover:bg-paper hover:text-graphite">
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            {footerNav.map((col) => (
              <div key={col.title}>
                <h3 className="annot mb-5 text-paper/45">{col.title}</h3>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-paper/80 transition-colors hover:text-paper">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <DimensionLine label="Journey of Visionation & Excellence" className="mt-20 text-paper/30" />

        <div className="mt-8 flex flex-col gap-6 text-xs text-paper/50 md:flex-row md:items-end md:justify-between">
          <AnnotationStack items={site.pillars} className="text-paper/45" />
          <div className="flex flex-col gap-2 md:items-end">
            <p>
              Media partner:{" "}
              <a href={site.studio.url} target="_blank" rel="noopener noreferrer" className="text-paper/80 underline-offset-4 hover:underline">
                {site.studio.name}
              </a>
            </p>
            <p>
              © {year} {site.legalName}. All rights reserved.
            </p>
            <Link href="/hq" className="inline-flex items-center gap-1 text-paper/40 transition-colors hover:text-paper">
              Team HQ <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
