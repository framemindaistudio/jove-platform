import type { LevelDef, Spec } from "./engine";

/**
 * Hands-on levels (increasing difficulty). Every level has a known solution (see `solutions`)
 * which is verified by the engine — `par` is that solution's block count.
 */
export const LEVELS: LevelDef[] = [
  {
    id: "l1",
    name: "Hello, Rover",
    mission: "Drive to the flag and pick up the gem on the way.",
    hint: "The rover is already facing the flag. How many squares away is it? Use that many Forward blocks.",
    map: [".....", ">..*F", "....."],
    par: 4,
    allowed: ["forward", "left", "right"],
  },
  {
    id: "l2",
    name: "Turn the Corner",
    mission: "Collect the gem, then turn and reach the flag.",
    hint: "Go up three squares first. A Turn Right block spins the rover on the spot — it does not move to a new square.",
    map: ["...F", "*...", "....", "^..."],
    par: 7,
    allowed: ["forward", "left", "right"],
  },
  {
    id: "l3",
    name: "Rock Garden",
    mission: "A rock blocks the road! Find a way around it and grab the gem.",
    hint: "Go one square, then turn LEFT to climb above the rock. If the rover bumps, find the wrong block and fix it — that is debugging.",
    map: ["..*.F", ">.#..", "...#."],
    par: 7,
    allowed: ["forward", "left", "right"],
  },
  {
    id: "l4",
    name: "Loop-de-Loop",
    mission: "A long straight road. Can you do it with only 2 blocks?",
    hint: "Six Forward blocks works… but a Repeat block can do the same job. Put ONE Forward inside a Repeat and set it to 6.",
    map: ["..#..#.", ">.*.*.F", ".#..#.."],
    par: 2,
    allowed: ["forward", "left", "right", "repeat"],
  },
  {
    id: "l5",
    name: "Staircase",
    mission: "Climb the stairs to the flag, collecting both gems.",
    hint: "One stair = Forward, Turn Left, Forward, Turn Right. How many stairs are there? Repeat that pattern!",
    map: ["....F", "...*.", "....#", ".*.##", ">.###"],
    par: 5,
    allowed: ["forward", "left", "right", "repeat"],
  },
  {
    id: "l6",
    name: "Crater Lap",
    mission: "Drive around the crater, collect both gems and finish at the flag.",
    hint: "Each side of the crater is 3 squares, then a Turn Right. Repeat that 3 times.",
    map: [">..*", ".##.", ".##.", "F..*"],
    par: 5,
    allowed: ["forward", "left", "right", "repeat"],
  },
  {
    id: "l7",
    name: "Zig-Zag Canyon",
    mission: "Wind down the canyon without touching the walls.",
    hint: "Spot the pattern: Forward, Forward, Turn Right, Forward, Turn Left. Repeat it 3 times.",
    map: [">..####", "##.*.##", "####.*.", "...###F"],
    par: 6,
    allowed: ["forward", "left", "right", "repeat"],
  },
  {
    id: "l8",
    name: "Mountain Pass",
    mission: "Up the mountain, over the peak, down the other side.",
    hint: "Use TWO Repeat blocks: one for climbing up (Forward, Left, Forward, Right) and one for going down (Forward, Right, Forward, Left).",
    map: ["...*...", ".....*.", ".*.##..", ">.####F"],
    par: 10,
    allowed: ["forward", "left", "right", "repeat"],
  },
];

/** Challenge levels — a block limit forces a loop inside a loop. */
export const CHALLENGE_LEVELS: LevelDef[] = [
  {
    id: "c1",
    name: "Crater Rim",
    mission: "Collect all 3 gems around the crater rim and come back to base — using at most 7 blocks.",
    hint: "Three sides are 4 squares long, each followed by a Turn Right. Try putting a Repeat INSIDE another Repeat.",
    map: ["*...*", ".###.", ".###.", ".###.", "^F..*"],
    par: 6,
    maxBlocks: 7,
    allowed: ["forward", "left", "right", "repeat"],
  },
  {
    id: "c2",
    name: "Giant Stairs",
    mission: "Each giant stair is 3 squares wide and 3 squares tall. Collect all 4 gems using at most 8 blocks.",
    hint: "One giant stair = Repeat 3 { Forward }, Turn Left, Repeat 3 { Forward }, Turn Right. Now repeat the whole stair!",
    map: ["###...F", "###...*", "###....", ".....*.", "...*###", "....###", ">.*.###"],
    par: 7,
    maxBlocks: 8,
    allowed: ["forward", "left", "right", "repeat"],
  },
];

/** Reference solutions (also used by the self-test). */
export const SOLUTIONS: Record<string, Spec[]> = {
  l1: ["F", "F", "F", "F"],
  l2: ["F", "F", "F", "R", "F", "F", "F"],
  l3: ["F", "L", "F", "R", "F", "F", "F"],
  l4: [["R", 6, ["F"]]],
  l5: [["R", 4, ["F", "L", "F", "R"]]],
  l6: [["R", 3, ["F", "F", "F", "R"]]],
  l7: [["R", 3, ["F", "F", "R", "F", "L"]]],
  l8: [
    ["R", 3, ["F", "L", "F", "R"]],
    ["R", 3, ["F", "R", "F", "L"]],
  ],
  c1: [["R", 3, [["R", 4, ["F"]], "R"]], ["R", 3, ["F"]]],
  c2: [["R", 2, [["R", 3, ["F"]], "L", ["R", 3, ["F"]], "R"]]],
};

/** The program the Demo stage plays. */
export const DEMO_LEVEL: LevelDef = {
  id: "demo",
  name: "Demo run",
  mission: "Reach the flag and collect both gems.",
  hint: "",
  map: [".....", ">.*#.", "...#.", "..*.F"],
  par: 6,
  allowed: ["forward", "left", "right", "repeat"],
};
export const DEMO_PROGRAM: Spec[] = ["F", "F", "R", ["R", 2, ["F"]], "L", "F", "F"];
