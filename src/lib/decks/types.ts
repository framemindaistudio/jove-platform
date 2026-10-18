/**
 * Presentations in HQ: the school meeting deck, one classroom deck per grade group, and the trainer handbook.
 * A deck is data; src/components/hq/decks draws it at 1600×900 and scales it to any screen or to a 16:9 PDF page.
 * Wording follows the Operations Library (session plans, pitch script, trainer manual); numbers come from
 * src/lib/content/business.ts, never typed in a slide.
 */

export type Phase = "Wow" | "Why" | "Build" | "Test" | "Show";

/** Lucide icon names the renderer knows (see src/components/hq/decks/icons.ts). */
export type IconName =
  | "Bot" | "Eye" | "Brain" | "Hand" | "Zap" | "Lightbulb" | "Battery" | "Fan" | "Sparkles" | "Star" | "Map" | "ArrowUp" | "RotateCcw"
  | "RotateCw" | "Bug" | "Wrench" | "Car" | "Sun" | "Flashlight" | "Cpu" | "Code" | "Radar" | "Waves" | "Camera" | "Scan" | "Target"
  | "Users" | "Trophy" | "ShieldCheck" | "Film" | "Clapperboard" | "Plane" | "School" | "GraduationCap" | "CalendarDays" | "IndianRupee"
  | "Handshake" | "Mic" | "Clock" | "ListChecks" | "Heart" | "MessageCircle" | "Scale" | "Lock" | "Globe" | "Rocket" | "Package"
  | "Gauge" | "Sliders" | "Layers" | "Puzzle" | "Smile" | "Megaphone" | "Phone" | "Shirt" | "ClipboardList" | "Search" | "Volume2";

export interface Card {
  icon: IconName;
  title: string;
  text?: string;
}

/** What a slide shows. Every kind takes the same optional extras (see Slide). */
export type SlideBody =
  | { kind: "cover"; kicker: string; title: string; sub?: string; art?: string }
  | { kind: "statement"; big: string; sub?: string; icon?: IconName; art?: string }
  | { kind: "points"; title: string; points: string[]; art?: string; icon?: IconName }
  | { kind: "cards"; title: string; cards: Card[]; sub?: string }
  | { kind: "steps"; title: string; steps: { title: string; detail?: string; icon?: IconName }[]; sub?: string }
  | { kind: "agenda"; title: string; rows: { time: string; title: string; detail?: string; phase?: Phase }[] }
  | { kind: "code"; title: string; code: string; bullets?: string[]; highlight?: number[] }
  | { kind: "quiz"; question: string; options: string[]; answer: number; explain?: string }
  | { kind: "compare"; title: string; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { kind: "table"; title: string; head: string[]; rows: string[][]; foot?: string }
  | { kind: "image"; title: string; src: string; caption?: string; points?: string[] }
  | { kind: "big-number"; number: string; label: string; sub?: string }
  | { kind: "closing"; title: string; sub?: string; points?: string[] };

export type Slide = SlideBody & {
  /** what to say: shown in the presenter's notes, never on the projected slide */
  notes?: string;
  /** the part of the lesson arc, shown as a small chip */
  phase?: Phase;
  /** minutes this slide covers, for the presenter's clock */
  minutes?: number;
};

export type DeckGroup = "school" | "classroom" | "trainer";

/** Look and reading level: younger groups get fewer, bigger words and a brighter accent. */
export interface DeckTheme {
  /** accent colour (hex) */
  accent: string;
  /** soft background tint of the accent */
  tint: string;
  /** 1 = Grades 1–2 (largest type) … 4 = adults */
  level: 1 | 2 | 3 | 4;
  /** colours for cards and steps in turn, so a row of ideas reads as separate things */
  palette: string[];
}

export interface Deck {
  id: string;
  group: DeckGroup;
  title: string;
  /** who it is for, one line */
  audience: string;
  /** what it is for, one or two lines, for the library */
  blurb: string;
  minutes: number;
  theme: DeckTheme;
  /** the source documents in the Operations Library */
  sources: string[];
  /** a slide list, built when shown (the school deck carries the school's name) */
  slides: (o: { school?: string }) => Slide[];
}

/** Pictures used on slides that are illustrations, not photographs: they are labelled as such. */
export const ILLUSTRATIONS = ["/images/age/", "/images/kits/", "/images/labs/", "/images/studio/", "/images/hero/", "/images/misc/"];
export const isIllustration = (src: string) => ILLUSTRATIONS.some((p) => src.startsWith(p));
