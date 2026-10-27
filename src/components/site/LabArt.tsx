import Image from "next/image";
import { Code, CircuitBoard, Cpu, Lightbulb } from "lucide-react";
import type { LabMeta } from "@/lib/content/labs";
import { cn } from "@/lib/utils";

const ICON = { "robot-buddy": Lightbulb, "first-led": CircuitBoard, blink: Code } as Record<string, typeof Cpu>;

/** A lab card's picture: the lab's image, or a blueprint tile with its icon. Fills its (relative) parent. */
export function LabArt({ lab, sizes, className }: { lab: LabMeta; sizes: string; className?: string }) {
  if (lab.image) return <Image src={lab.image} alt="" fill sizes={sizes} quality={75} className={cn("object-cover mix-blend-multiply", className)} />;
  const Icon = ICON[lab.slug] ?? Cpu;
  return (
    <div aria-hidden className="bp-grid absolute inset-0 grid place-items-center bg-paper">
      <span className="grid aspect-square w-[38%] max-w-24 place-items-center rounded-full border border-dashed border-graphite/35 bg-paper-50">
        <Icon className="h-1/2 w-1/2 text-graphite" strokeWidth={1.4} />
      </span>
    </div>
  );
}
