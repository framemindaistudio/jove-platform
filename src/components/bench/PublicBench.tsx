"use client";

import { useEffect, useState } from "react";
import type { BenchProject } from "@/lib/bench/types";
import BenchApp from "./BenchApp";

/** The public 3D Bench: a few of the builds from our workshops, one at a time. */
export function PublicBench({ projects }: { projects: BenchProject[] }) {
  const [id, setId] = useState(projects[0]?.id);
  // /labs#blink opens that build (links from the shop, programs and home page)
  useEffect(() => {
    const read = () => {
      const want = decodeURIComponent(window.location.hash.slice(1));
      if (projects.some((p) => p.id === want)) setId(want);
    };
    const t = setTimeout(read, 0);
    window.addEventListener("hashchange", read);
    return () => (clearTimeout(t), window.removeEventListener("hashchange", read));
  }, [projects]);
  const project = projects.find((p) => p.id === id) ?? projects[0];
  if (!project) return null;
  return (
    <div id="bench" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Choose a build">
        {projects.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === project.id}
            onClick={() => (setId(p.id), history.replaceState(null, "", `#${p.id}`))}
            className={`rounded-[var(--radius-sm)] border px-3.5 py-2 text-left text-sm transition ${p.id === project.id ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-graphite hover:border-graphite"}`}
          >
            <span className="block font-semibold">{p.title}</span>
            <span className="block text-[11px] opacity-70">{p.audience}</span>
          </button>
        ))}
      </div>
      <div className="h-[min(82vh,780px)] overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 shadow-[var(--shadow-paper)]">
        <BenchApp key={project.id} project={project} />
      </div>
    </div>
  );
}
