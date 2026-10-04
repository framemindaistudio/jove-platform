"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Modal } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/form";
import type { LabMeta } from "@/lib/content/labs";

/** Client-side completion certificate for a Virtual Lab (prints in a clean new window). */
export function LabCertificate({ open, onClose, lab, score, total, completedAt }: { open: boolean; onClose: () => void; lab: LabMeta; score?: number; total?: number; completedAt?: string }) {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  function print() {
    const origin = window.location.origin;
    const date = new Date(completedAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>JOVE Certificate — ${esc(name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
@page{size:A4 landscape;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Montserrat,Arial,sans-serif;color:#2B2B2B;background:#fff}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;background:#F5F1E8;
background-image:linear-gradient(rgba(43,43,43,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(43,43,43,.07) 1px,transparent 1px),linear-gradient(rgba(43,43,43,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(43,43,43,.035) 1px,transparent 1px);
background-size:30mm 30mm,30mm 30mm,6mm 6mm,6mm 6mm}
.frame{position:absolute;inset:10mm;border:1.2px solid #2B2B2B}
.frame2{position:absolute;inset:13mm;border:.5px solid rgba(43,43,43,.4)}
.c{position:absolute;width:8mm;height:8mm;border-color:#2B2B2B;border-style:solid}
.tl{left:6mm;top:6mm;border-width:1px 0 0 1px}.tr{right:6mm;top:6mm;border-width:1px 1px 0 0}.bl{left:6mm;bottom:6mm;border-width:0 0 1px 1px}.br{right:6mm;bottom:6mm;border-width:0 1px 1px 0}
.inner{position:absolute;inset:22mm 26mm;display:flex;flex-direction:column;align-items:center;text-align:center}
.logo{width:62mm}.k{font-size:9pt;letter-spacing:.35em;text-transform:uppercase;color:#7A7A7A;margin-top:6mm}
h1{font-size:34pt;margin:4mm 0 0;letter-spacing:-.01em}
.name{font-size:30pt;font-weight:700;margin-top:8mm;padding:0 10mm 2mm;border-bottom:1px solid #2B2B2B;min-width:150mm}
.body{font-size:11.5pt;line-height:1.6;max-width:200mm;margin-top:6mm;color:#4A4A4A}
.meta{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:flex-end;font-size:8.5pt;color:#4A4A4A}
.sig{text-align:center;width:60mm;border-top:1px solid #2B2B2B;padding-top:2mm}
.mark{position:absolute;right:16mm;top:16mm;width:34mm;opacity:.14}
</style></head><body><div class="page">
<div class="frame"></div><div class="frame2"></div><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span>
<img class="mark" src="${origin}/brand/jove-mark.png" alt="">
<div class="inner">
<img class="logo" src="${origin}/brand/jove-wordmark.png" alt="JOVE">
<div class="k">Certificate of Completion · Virtual Lab</div>
<h1>${esc(lab.title)}</h1>
<div class="k" style="margin-top:2mm;letter-spacing:.2em">${esc(lab.subtitle)}</div>
<div class="name">${esc(name || "Your Name")}</div>
<div class="body">has successfully completed the JOVE Virtual Lab journey — Theory, Demo, Hands-on simulation and Challenge${school ? ` — as a student of <strong>${esc(school)}</strong>` : ""}${score !== undefined && total ? `, scoring <strong>${score}/${total}</strong> in the final challenge` : ""}.</div>
<div class="meta"><div class="sig">${esc(date)}<br><span style="color:#7A7A7A">Date</span></div>
<div style="text-align:center;letter-spacing:.25em;text-transform:uppercase;font-size:7.5pt;color:#7A7A7A">Precision · Learning · Innovation · Automation</div>
<div class="sig">JOVE Virtual Labs<br><span style="color:#7A7A7A">Journey of Visionation &amp; Excellence</span></div></div>
</div></div><script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow pop-ups to print your certificate.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your certificate"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={print} disabled={!name.trim()}>
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </>
      }
    >
      <p className="text-sm text-charcoal">
        You completed <strong>{lab.title}</strong>. Enter your name exactly as it should appear on the certificate.
      </p>
      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="cert-name">Student name</Label>
          <Input id="cert-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="e.g. Ananya Rao" />
        </div>
        <div>
          <Label htmlFor="cert-school">School (optional)</Label>
          <Input id="cert-school" value={school} onChange={(e) => setSchool(e.target.value.slice(0, 80))} placeholder="School name" />
        </div>
      </div>
      <p className="mt-4 text-xs text-blueprint">Want a verified certificate from a real workshop? Ask your school to book a JOVE Day.</p>
    </Modal>
  );
}
