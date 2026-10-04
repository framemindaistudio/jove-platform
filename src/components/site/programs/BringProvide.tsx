import { Award, BatteryCharging, Building2, Camera, ClipboardList, Clapperboard, FileText, GraduationCap, Plug, Presentation, Projector, Table, UserCheck, Wrench } from "lucide-react";
import { gradeBands, joveDayRules } from "@/lib/content/business";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";

const stationsPerHall = gradeBands.map((b) => Math.ceil(b.maxPerSession / b.studentsPerStation));
const tablesRange = `${Math.min(...stationsPerHall)}–${Math.max(...stationsPerHall)}`;
const perStation = [...new Set(gradeBands.map((b) => b.studentsPerStation))].sort().join("–");
const team = joveDayRules.teamSize;

const weBring = [
  { icon: UserCheck, title: "Trainers", detail: `${team.founders} founders and ${team.trainers} trained facilitators run the sessions; ${team.media} media lead runs the shoot.` },
  { icon: Wrench, title: "All kits & tools", detail: `A build kit for every station of ${perStation} students, plus tools, multimeters and spares.` },
  { icon: BatteryCharging, title: "Consumables", detail: "Cells, LEDs, cardboard, tape and wires — reset and refilled between batches." },
  { icon: Award, title: "Certificates", detail: "A certificate for every participant, handed over at the closing ceremony." },
  { icon: FileText, title: "Worksheets", detail: "Grade-specific worksheets so the learning carries on in class." },
  { icon: Projector, title: "Projector backup", detail: "Our own portable projector, speaker and wireless mic — in case a hall has none." },
  { icon: Clapperboard, title: "Film crew & drone", detail: "FrameMind AI Studio crew for your free Media Pack. Drone flights follow local rules and your permission." },
];

const youProvide = [
  { icon: Building2, title: "Halls or classrooms", detail: "Two rooms for the parallel sessions (Hall A & Hall B), plus an assembly space for the opening and closing." },
  { icon: Table, title: "Tables", detail: `One table per build station — about ${tablesRange} per hall.` },
  { icon: Plug, title: "Power points", detail: "A few working sockets in each hall for laptops, the projector and charging." },
  { icon: Presentation, title: "Projector / screen", detail: "If you have one. If not, we bring ours." },
  { icon: ClipboardList, title: "Student lists", detail: "Names by grade and section before the day — for batches and certificates." },
  { icon: Camera, title: "Photo & drone permission", detail: "The school's go-ahead for photography and drone shots. We share consent forms; faces are blurred on request." },
  { icon: GraduationCap, title: "A teacher in each session", detail: "One school teacher per batch, alongside our trainers, for class management." },
];

function Column({ title, kicker, items, dark }: { title: string; kicker: string; items: typeof weBring; dark?: boolean }) {
  return (
    <div className={cn("relative h-full overflow-hidden rounded-[var(--radius-lg)] p-6 sm:p-8", dark ? "bg-graphite text-paper shadow-[var(--shadow-lift)]" : "border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]")}>
      {dark ? <div aria-hidden className="bp-grid-dark absolute inset-0 opacity-70" /> : <div aria-hidden className="bp-grid-fine absolute inset-0 opacity-60" />}
      <CornerMarks className={cn("m-3", dark ? "text-paper/40" : "text-graphite/40")} />
      <div className="relative">
        <p className={cn("annot", dark ? "text-paper/55" : "text-blueprint")}>{kicker}</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
        <ul className="mt-7 space-y-5">
          {items.map(({ icon: Icon, title: t, detail }) => (
            <li key={t} className="flex gap-4">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border", dark ? "border-paper/20 bg-paper/5" : "border-graphite/15 bg-paper")}>
                <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{t}</span>
                <span className={cn("mt-0.5 block text-sm leading-relaxed", dark ? "text-paper/65" : "text-charcoal")}>{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** "What we bring vs what your school provides" — a two-column checklist for principals and coordinators. */
export function BringProvide() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Reveal className="h-full">
        <Column dark kicker="Packed in our van" title="JOVE brings" items={weBring} />
      </Reveal>
      <Reveal delay={0.1} className="h-full">
        <Column kicker="Ready on campus" title="Your school provides" items={youProvide} />
      </Reveal>
    </div>
  );
}
