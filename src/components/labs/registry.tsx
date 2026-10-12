"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const loading = () => (
  <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-blueprint">
    <Loader2 className="size-4 animate-spin" /> Calibrating the lab…
  </div>
);

/** slug → lab component (client-only; simulations use canvas/WebGL & localStorage). */
const LABS: Record<string, React.ComponentType> = {
  "code-the-rover": dynamic(() => import("./code-the-rover/Lab"), { ssr: false, loading }),
  "logic-gates": dynamic(() => import("./logic-gates/Lab"), { ssr: false, loading }),
  "echo-sensor": dynamic(() => import("./echo-sensor/Lab"), { ssr: false, loading }),
  "line-follower": dynamic(() => import("./line-follower/Lab"), { ssr: false, loading }),
  "robot-arm": dynamic(() => import("./robot-arm/Lab"), { ssr: false, loading }),
  "teach-the-machine": dynamic(() => import("./teach-the-machine/Lab"), { ssr: false, loading }),
};

export function LabLoader({ slug }: { slug: string }) {
  const L = LABS[slug];
  return L ? <L /> : <p className="py-20 text-center text-blueprint">This lab is coming soon.</p>;
}
