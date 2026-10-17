"use client";

import { useEffect } from "react";
import { A4Page, PrintShell } from "@/components/print/PrintShell";
import { Paper, type PaperDoc } from "@/components/hq/sign/Paper";
import { pageCss } from "@/components/hq/sign/SignPrint";

/**
 * A paper opened from its private link (/papers/<token>): the A4 paper to print or save as a PDF, with how to
 * sign and return it. Nothing here needs a login; the link itself is the key.
 */
export function PublicPaper({ token, paper, fileName, steps, contact }: { token: string; paper: PaperDoc; fileName: string; steps: string[]; contact: { email: string; phone: string; whatsapp: string } }) {
  // the name the browser offers when it is saved as a PDF, and a note to JOVE that the link was opened
  useEffect(() => {
    document.title = fileName;
    void fetch("/api/public/paper-opened", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), keepalive: true }).catch(() => {});
  }, [fileName, token]);

  return (
    <PrintShell title={paper.name} toolbar={<span className="hidden text-xs text-blueprint sm:inline">Print on A4, or choose “Save as PDF”</span>}>
      <style>{pageCss([paper])}</style>
      <section className="no-print w-full max-w-[210mm] rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5 text-sm leading-relaxed text-charcoal" aria-labelledby="how-title">
        <h2 id="how-title" className="text-base font-bold text-graphite">
          How to sign it
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-blueprint">
          Questions?{" "}
          {[
            contact.email && (
              <a key="e" href={`mailto:${contact.email}`} className="font-semibold text-graphite underline underline-offset-2">
                {contact.email}
              </a>
            ),
            contact.whatsapp && (
              <a key="w" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-graphite underline underline-offset-2">
                WhatsApp
              </a>
            ),
            contact.phone && (
              <a key="p" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-graphite underline underline-offset-2">
                {contact.phone}
              </a>
            ),
          ]
            .filter(Boolean)
            .flatMap((el, i) => (i ? [" · ", el] : [el]))}
          {!contact.email && !contact.whatsapp && !contact.phone && "Reply to the message this link came with."}
        </p>
      </section>
      <A4Page flow padded={false} className="print:min-h-0 print:w-full print:overflow-visible">
        <div className="px-[16mm] pb-[17mm] pt-[13mm] print:p-0" style={{ page: "sd0" } as React.CSSProperties}>
          <Paper doc={paper} />
        </div>
      </A4Page>
    </PrintShell>
  );
}
