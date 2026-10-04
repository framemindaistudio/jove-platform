import Link from "next/link";
import { CornerMarks } from "@/components/brand/Blueprint";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Typographic building blocks shared by every legal page (server components). */

export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-4 text-[15px] leading-[1.75] text-charcoal first:mt-0", className)}>{children}</p>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-[15px] font-bold tracking-[-0.01em] text-graphite first:mt-0">{children}</h3>;
}

export function UL({ items, className }: { items: React.ReactNode[]; className?: string }) {
  return (
    <ul className={cn("mt-4 space-y-2.5 text-[15px] leading-[1.7] text-charcoal", className)}>
      {items.map((item, i) => (
        <li key={i} className="relative pl-5">
          <span aria-hidden className="absolute left-0 top-[0.62em] size-[5px] rotate-45 border border-graphite/70" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-4 space-y-3 text-[15px] leading-[1.7] text-charcoal">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[2rem_1fr] gap-2">
          <span className="pt-[0.2em] font-mono text-xs tracking-widest text-blueprint">{String(i + 1).padStart(2, "0")}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function Note({ title, children, tone = "paper" }: { title?: string; children: React.ReactNode; tone?: "paper" | "dark" }) {
  return (
    <aside
      className={cn(
        "relative mt-6 rounded-[var(--radius-md)] border px-5 py-4 text-sm leading-relaxed",
        tone === "dark" ? "border-graphite bg-graphite text-paper/85" : "border-graphite/20 bg-graphite/[0.035] text-charcoal",
      )}
    >
      <CornerMarks className={tone === "dark" ? "text-paper/40" : undefined} />
      {title && <p className={cn("annot mb-1.5", tone === "dark" ? "text-paper/60" : "text-blueprint")}>{title}</p>}
      <div className="[&_p+p]:mt-2">{children}</div>
    </aside>
  );
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50" role="region" aria-label={caption} tabIndex={0}>
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-graphite/15 bg-graphite/[0.05]">
            {head.map((h) => (
              <th key={h} scope="col" className="annot px-4 py-3 text-charcoal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-graphite/10 align-top last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className={cn("px-4 py-3 leading-relaxed text-charcoal", j === 0 && "font-semibold text-graphite")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Inline link that works for internal routes, mailto: and external URLs. */
export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "font-medium text-graphite underline decoration-graphite/40 underline-offset-4 transition-colors hover:decoration-graphite";
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** "How to reach us" line — only shows channels that are configured; always links the contact form. */
export function ReachUs({ subject }: { subject?: string }) {
  const { email, phone } = site.contact;
  return (
    <UL
      items={[
        <span key="form">
          Our <A href="/contact">contact page</A>
          {subject ? ` (choose “General” and mention “${subject}”)` : ""} — every message reaches a founder directly.
        </span>,
        ...(email ? [<span key="mail">Email: <A href={`mailto:${email}`}>{email}</A></span>] : []),
        ...(phone ? [<span key="tel">Phone: <A href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</A></span>] : []),
      ]}
    />
  );
}
