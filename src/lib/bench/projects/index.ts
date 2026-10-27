/** Every JOVE Bench project, in teaching order. `public: true` ones also appear on the public Virtual Labs. */
import type { BenchProject } from "../types";
import { avoiderProject, blinkProject } from "./builder";
import { missionProject, seekerProject } from "./explorer";
import { panTiltProject } from "./innovator";
import { sparkProject } from "./spark";

export const BENCH_PROJECTS: BenchProject[] = [sparkProject, missionProject, seekerProject, blinkProject, avoiderProject, panTiltProject];

export const benchProject = (id: string) => BENCH_PROJECTS.find((p) => p.id === id);
export const publicBenchProjects = () => BENCH_PROJECTS.filter((p) => p.public);
