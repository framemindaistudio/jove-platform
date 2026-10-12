import { Clock, Mail, Phone, type LucideIcon } from "lucide-react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { InstagramIcon, LinkedinIcon, WhatsappIcon, YoutubeIcon } from "@/components/brand/SocialIcons";
import { site, whatsappLink } from "@/lib/site";

type Channel = { label: string; value: string; href: string; external?: boolean; icon: LucideIcon | ((p: { className?: string }) => React.ReactNode) };

/** Direct channels (only the configured ones), who replies, and the response promise. */
export function ContactChannels() {
  const { email, phone } = site.contact;
  const wa = whatsappLink("Hi JOVE, we would like to know more about a JOVE Day for our school.");

  const channels: Channel[] = [];
  if (wa) channels.push({ label: "WhatsApp", value: "Message a founder", href: wa, external: true, icon: WhatsappIcon });
  if (phone) channels.push({ label: "Call", value: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}`, icon: Phone });
  if (email) channels.push({ label: "Email", value: email, href: `mailto:${email}`, icon: Mail });

  const socials = [
    { label: "Instagram", href: site.socials.instagram, icon: InstagramIcon },
    { label: "YouTube", href: site.socials.youtube, icon: YoutubeIcon },
    { label: "LinkedIn", href: site.socials.linkedin, icon: LinkedinIcon },
  ].filter((s) => s.href);

  return (
    <div className="space-y-5">
      {/* response promise */}
      <div className="relative overflow-hidden rounded-[var(--radius-md)] bg-graphite p-6 text-paper shadow-[var(--shadow-lift)]">
        <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-70" />
        <div className="relative">
          <p className="annot flex items-center gap-2 text-paper/60">
            <Clock className="size-3.5" aria-hidden /> Our promise
          </p>
          <p className="mt-3 text-[2rem] font-bold leading-none tracking-[-0.03em]">
            Within <span className="font-mono">1</span> working day
          </p>
          <p className="mt-3 text-sm leading-relaxed text-paper/70">
            Every enquiry is read by a founder, not a call centre. Ask for a JOVE Day and we will phone you within one working day to understand your school and find a date.
          </p>
        </div>
      </div>

      {/* direct channels */}
      <div className="relative rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5 shadow-[var(--shadow-paper)]">
        <CornerMarks />
        <h2 className="annot text-blueprint">{channels.length ? "Reach us directly" : "The fastest way to reach us"}</h2>
        {channels.length ? (
          <ul className="mt-4 divide-y divide-graphite/10">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-graphite/25 text-graphite transition-colors group-hover:bg-graphite group-hover:text-paper">
                    <c.icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="annot block text-blueprint">{c.label}</span>
                    <span className="block truncate text-[15px] font-semibold text-graphite underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-graphite/50">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-charcoal">
            Use the form. It lands straight in our founders&rsquo; leads inbox, and we reply by phone or WhatsApp on the number you share.
          </p>
        )}
        {socials.length > 0 && (
          <div className="mt-5 flex items-center gap-2 border-t border-dashed border-graphite/25 pt-4">
            <span className="annot mr-1 text-blueprint">Follow</span>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`JOVE on ${s.label}`}
                className="grid size-9 place-items-center rounded-full border border-graphite/25 text-graphite transition-colors hover:bg-graphite hover:text-paper"
              >
                <s.icon className="size-4" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* who replies */}
      <div className="rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5 shadow-[var(--shadow-paper)]">
        <h2 className="annot text-blueprint">Who will reply</h2>
        <ul className="mt-4 space-y-4">
          {site.founders.map((f) => (
            <li key={f.id} className="flex gap-4">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full border border-graphite/30 bg-paper font-mono text-sm font-medium tracking-wider text-graphite hatch-light">
                {f.initials}
              </span>
              <span>
                <span className="block text-[15px] font-bold leading-snug tracking-[-0.01em] text-graphite">{f.name}</span>
                <span className="block text-xs text-blueprint">{f.role}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-charcoal">
                  {f.id === "shivaprasad" ? "Bookings, pricing, school partnerships, logistics." : "Studio and media, curriculum, kits and the website."}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
