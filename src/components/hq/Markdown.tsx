"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders OPERATIONS markdown with JOVE document styling (.doc-prose in globals.css). */
export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("doc-prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const internal = href?.startsWith("/") || href?.startsWith("#");
            return (
              <a href={href} target={internal ? undefined : "_blank"} rel={internal ? undefined : "noopener noreferrer"}>
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="hq-scroll overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
