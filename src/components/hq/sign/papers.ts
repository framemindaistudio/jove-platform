import { blankContext, contextOf, type SignDoc } from "@/lib/sign/context";
import { firstName, plainDate } from "@/lib/sign/text";
import type { Block, Company, DocContext, Signatory, SignTemplate } from "@/lib/sign/types";
import type { PaperDoc } from "./Paper";

/** The words at the foot of every page of an agreement: both sides put their initials there. */
function initialsLine(ctx: DocContext) {
  const p = ctx.party;
  const other = p.kind === "team" ? firstName(p.name) || "Signatory" : p.kind === "school" ? "School" : "Other party";
  return `Initials:   ${ctx.company.brandName || "JOVE"} ________     ${other} ________`;
}

/** A template that fails must not take the page down: the paper says so instead. */
function safeBuild(template: SignTemplate, ctx: DocContext): Block[] {
  try {
    return template.build(ctx);
  } catch (e) {
    return [{ t: "note", text: `This document could not be drawn (${e instanceof Error ? e.message : "unknown error"}). Tell whoever looks after HQ, naming the template "${template.id}".` }];
  }
}

export function paperFromContext(key: string, template: SignTemplate, ctx: DocContext): PaperDoc {
  return { key, name: template.name, ref: ctx.ref, date: plainDate(ctx.date), company: ctx.company, blocks: safeBuild(template, ctx), initials: template.initials ? initialsLine(ctx) : undefined };
}

/** A saved document as paper. `company` is today's company profile, used until the document is printed and keeps its own. */
export const paperOfDoc = (doc: SignDoc, template: SignTemplate, company: Company) => paperFromContext(doc.id, template, contextOf(doc, company));

/** A copy with nothing filled in. */
export const blankPaper = (key: string, template: SignTemplate, company: Company, signatories: Signatory[]) => paperFromContext(key, template, blankContext(template, company, signatories));
