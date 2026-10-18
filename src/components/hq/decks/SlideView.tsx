/* eslint-disable @next/next/no-img-element -- slides are drawn at a fixed 1600×900 and scaled as one picture */
import type { CSSProperties, ReactNode } from "react";
import { isIllustration, type Deck, type Phase, type Slide } from "@/lib/decks/types";
import { DECK_ICONS } from "./icons";

export const W = 1600;
export const H = 900;

/** Type sizes by reading level: Grades 1–2 read little, so everything is bigger and shorter. */
const TYPE = {
  1: { title: 88, big: 116, body: 50, card: 50, small: 30, kicker: 26 },
  2: { title: 74, big: 96, body: 42, card: 40, small: 27, kicker: 24 },
  3: { title: 62, big: 82, body: 35, card: 33, small: 24, kicker: 22 },
  4: { title: 58, big: 76, body: 32, card: 30, small: 23, kicker: 21 },
} as const;

const PHASE_COLOUR: Record<Phase, string> = { Wow: "#d9480f", Why: "#1c7ed6", Build: "#2b8a3e", Test: "#e8590c", Show: "#ae3ec9" };
const ink = "#1f1f1f";
const soft = "#4a4a4a";
const paper = "#f7f3ea";
const MONT = "var(--font-montserrat), Montserrat, sans-serif";
const MONO = "var(--font-mono-jb), 'JetBrains Mono', monospace";

/** A colour at some transparency, from #rrggbb. */
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function Icon({ name, size, color, stroke = 1.8 }: { name?: keyof typeof DECK_ICONS; size: number; color: string; stroke?: number }) {
  if (!name) return null;
  const I = DECK_ICONS[name];
  return <I width={size} height={size} color={color} strokeWidth={stroke} aria-hidden />;
}

function Art({ src, style }: { src: string; style?: CSSProperties }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, background: "#fff", boxShadow: "0 40px 70px -40px rgba(0,0,0,.45)", border: "2px solid rgba(31,31,31,.08)", ...style }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {isIllustration(src) && (
        <span style={{ position: "absolute", right: 16, bottom: 16, background: "rgba(31,31,31,.8)", color: "#f5f1e8", font: `600 15px/1 ${MONO}`, letterSpacing: ".14em", padding: "8px 11px", borderRadius: 6, textTransform: "uppercase" }}>
          Illustration
        </span>
      )}
    </div>
  );
}

function Title({ children, size, accent }: { children: ReactNode; size: number; accent: string }) {
  return (
    <h2 style={{ margin: 0, font: `800 ${size}px/1.04 ${MONT}`, letterSpacing: "-0.03em", color: ink, flex: "none" }}>
      {children}
      <span style={{ display: "block", width: 132, height: 9, borderRadius: 5, background: accent, marginTop: 20 }} />
    </h2>
  );
}

/** Body that takes all the height left under a title. */
const Fill = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => <div style={{ flex: 1, minHeight: 0, marginTop: 40, ...style }}>{children}</div>;

/** A soft construction circle in the deck's colour, behind big statements. */
function Halo({ color }: { color: string }) {
  return (
    <svg aria-hidden width="1100" height="1100" viewBox="0 0 1100 1100" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-52%)", pointerEvents: "none" }}>
      <defs>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity=".16" />
          <stop offset="70%" stopColor={color} stopOpacity=".04" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="550" cy="550" r="540" fill="url(#halo)" />
      <circle cx="550" cy="550" r="400" fill="none" stroke={color} strokeOpacity=".22" strokeWidth="2" strokeDasharray="10 12" />
      <circle cx="550" cy="550" r="300" fill="none" stroke={color} strokeOpacity=".14" strokeWidth="2" />
      <line x1="550" y1="60" x2="550" y2="1040" stroke={color} strokeOpacity=".1" strokeWidth="2" />
      <line x1="60" y1="550" x2="1040" y2="550" stroke={color} strokeOpacity=".1" strokeWidth="2" />
    </svg>
  );
}

/** One slide, drawn at 1600×900. `reveal` shows a quiz answer. */
export function SlideView({ deck, slide, index, total, reveal = false }: { deck: Deck; slide: Slide; index: number; total: number; reveal?: boolean }) {
  const t = TYPE[deck.theme.level];
  const { accent, tint } = deck.theme;
  const pal = deck.theme.palette.length ? deck.theme.palette : [accent];
  const colourOf = (i: number) => pal[i % pal.length];
  const young = deck.theme.level <= 2;
  const centred = ["statement", "big-number", "closing"].includes(slide.kind);

  const body = (() => {
    switch (slide.kind) {
      case "cover":
        return (
          <div style={{ display: "grid", gridTemplateColumns: slide.art ? "1.12fr 0.88fr" : "1fr", gap: 70, height: "100%", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, display: "inline-block", font: `700 ${t.kicker}px/1 ${MONO}`, letterSpacing: ".16em", textTransform: "uppercase", color: "#fff", background: accent, padding: "12px 18px", borderRadius: 8 }}>{slide.kicker}</p>
              <h1 style={{ margin: "34px 0 0", font: `800 ${Math.round(t.big * (slide.title.length > 40 ? 0.86 : 1.06))}px/0.98 ${MONT}`, letterSpacing: "-0.04em", color: ink }}>{slide.title}</h1>
              {slide.sub && <p style={{ margin: "34px 0 0", font: `500 ${t.body}px/1.35 ${MONT}`, color: soft, maxWidth: 820 }}>{slide.sub}</p>}
            </div>
            {slide.art && (
              <div style={{ position: "relative", height: 640 }}>
                <div aria-hidden style={{ position: "absolute", inset: "-26px -26px 26px 26px", borderRadius: 30, background: alpha(accent, 0.18) }} />
                <Art src={slide.art} style={{ position: "absolute", inset: 0 }} />
              </div>
            )}
          </div>
        );
      case "statement":
        return (
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <Halo color={accent} />
            {slide.icon && (
              <span style={{ position: "relative", display: "grid", placeItems: "center", width: t.big * 1.9, height: t.big * 1.9, borderRadius: "50%", background: accent, boxShadow: `0 24px 50px -20px ${alpha(accent, 0.7)}`, marginBottom: 46 }}>
                <Icon name={slide.icon} size={Math.round(t.big * 1.05)} color="#fff" />
              </span>
            )}
            <p style={{ position: "relative", margin: 0, font: `800 ${slide.big.length > 34 ? Math.round(t.big * 0.82) : t.big}px/1.06 ${MONT}`, letterSpacing: "-0.03em", color: ink, maxWidth: 1320 }}>{slide.big}</p>
            {slide.sub && <p style={{ position: "relative", margin: "32px 0 0", font: `500 ${t.body}px/1.35 ${MONT}`, color: soft, maxWidth: 1180 }}>{slide.sub}</p>}
          </div>
        );
      case "points":
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Title size={t.title} accent={accent}>{slide.title}</Title>
            <Fill style={{ display: "grid", gridTemplateColumns: slide.art || slide.icon ? "1fr 380px" : "1fr", gap: 56, alignItems: "center" }}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: Math.round(t.body * (slide.points.length > 4 ? 0.55 : 0.85)) }}>
                {slide.points.map((p, i) => (
                  <li key={p} style={{ display: "flex", gap: 28, alignItems: "center", font: `600 ${slide.points.length > 5 ? Math.round(t.body * 0.9) : t.body}px/1.28 ${MONT}`, color: ink }}>
                    <span style={{ flex: "none", display: "grid", placeItems: "center", width: t.body * 1.45, height: t.body * 1.45, borderRadius: "50%", background: colourOf(i), color: "#fff", font: `800 ${Math.round(t.body * 0.7)}px/1 ${MONT}` }}>{i + 1}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {slide.art ? (
                <Art src={slide.art} style={{ height: 520 }} />
              ) : slide.icon ? (
                <span style={{ justifySelf: "center", display: "grid", placeItems: "center", width: 340, height: 340, borderRadius: "50%", background: tint, border: `3px dashed ${alpha(accent, 0.35)}` }}>
                  <Icon name={slide.icon} size={170} color={accent} stroke={1.5} />
                </span>
              ) : null}
            </Fill>
          </div>
        );
      case "cards": {
        const n = slide.cards.length;
        const cols = n <= 4 ? n : n === 5 ? 5 : 3;
        // a few cards get the room: bigger icon and words, more so for older readers whose base size is smaller
        const few = n <= 3 ? (young ? 1 : 1.3) : 1;
        const iconBox = n >= 5 ? t.card * 2.3 : t.card * (young ? 3.4 : 2.9) * (n <= 3 && !young ? 1.15 : 1);
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Title size={t.title} accent={accent}>{slide.title}</Title>
            <Fill style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: n >= 5 ? 22 : 32 }}>
              {slide.cards.map((c, i) => {
                const col = colourOf(i);
                return (
                  <div key={c.title} style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: young ? "center" : "flex-start", justifyContent: "center", textAlign: young ? "center" : "left", background: "#fff", borderRadius: 26, padding: n >= 5 ? "28px 26px" : "40px 38px", boxShadow: "0 24px 50px -32px rgba(0,0,0,.45)", borderTop: `10px solid ${col}` }}>
                    <span style={{ display: "grid", placeItems: "center", width: iconBox, height: iconBox, borderRadius: young ? "50%" : 22, background: alpha(col, 0.13) }}>
                      <Icon name={c.icon} size={Math.round(iconBox * 0.55)} color={col} />
                    </span>
                    <p style={{ margin: "28px 0 0", font: `800 ${n >= 5 ? Math.round(t.card * 0.85) : Math.round(t.card * few)}px/1.12 ${MONT}`, color: ink, letterSpacing: "-0.02em" }}>{c.title}</p>
                    {c.text && <p style={{ margin: "14px 0 0", font: `500 ${Math.round(t.card * (n >= 5 ? 0.62 : 0.72) * few)}px/1.35 ${MONT}`, color: soft }}>{c.text}</p>}
                  </div>
                );
              })}
            </Fill>
            {slide.sub && <p style={{ margin: "28px 0 0", flex: "none", font: `700 ${t.small + 2}px/1.35 ${MONT}`, color: "#fff", background: accent, alignSelf: "flex-start", padding: "14px 24px", borderRadius: 12 }}>{slide.sub}</p>}
          </div>
        );
      }
      case "steps": {
        const n = slide.steps.length;
        const cols = n <= 5 ? n : 3;
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Title size={t.title} accent={accent}>{slide.title}</Title>
            <Fill style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}>
              {slide.steps.map((s, i) => {
                const col = colourOf(i);
                return (
                  <div key={s.title} style={{ position: "relative", display: "flex", flexDirection: "column", background: "#fff", borderRadius: 24, padding: n > 4 ? "26px 24px" : "34px 30px", boxShadow: "0 24px 50px -34px rgba(0,0,0,.45)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "grid", placeItems: "center", width: t.card * 1.75, height: t.card * 1.75, borderRadius: "50%", background: col, color: "#fff", font: `800 ${Math.round(t.card * 0.86)}px/1 ${MONT}` }}>{i + 1}</span>
                      {s.icon && <Icon name={s.icon} size={Math.round(t.card * (young ? 1.9 : 1.5))} color={col} />}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <p style={{ margin: "22px 0 0", font: `800 ${Math.round(t.card * (n > 4 ? 0.88 : 1))}px/1.12 ${MONT}`, color: ink, letterSpacing: "-0.02em" }}>{s.title}</p>
                      {s.detail && <p style={{ margin: "12px 0 0", font: `500 ${Math.round(t.card * (n > 4 ? 0.62 : 0.7))}px/1.35 ${MONT}`, color: soft }}>{s.detail}</p>}
                    </div>
                    {i < n - 1 && cols === n && <span aria-hidden style={{ position: "absolute", right: -18, top: "50%", width: 14, height: 14, borderRadius: "50%", background: alpha(accent, 0.4) }} />}
                  </div>
                );
              })}
            </Fill>
            {slide.sub && <p style={{ margin: "26px 0 0", flex: "none", font: `800 ${t.small + 6}px/1.3 ${MONT}`, color: accent }}>{slide.sub}</p>}
          </div>
        );
      }
      case "agenda": {
        const tight = slide.rows.length > 7;
        const rowFont = tight ? (slide.rows.length > 9 ? t.small - 1 : t.small + 1) : t.small + 4;
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Title size={Math.round(t.title * 0.92)} accent={accent}>{slide.title}</Title>
            <Fill style={{ display: "grid", gap: tight ? 7 : 12, alignContent: "center" }}>
              {slide.rows.map((r, i) => {
                const col = r.phase ? PHASE_COLOUR[r.phase] : colourOf(i);
                return (
                  <div key={r.time + r.title} style={{ display: "grid", gridTemplateColumns: tight ? "130px 1fr" : "190px 1fr", gap: 24, alignItems: "center", background: "#fff", borderRadius: 14, padding: tight ? "10px 22px" : "16px 24px", borderLeft: `8px solid ${col}` }}>
                    <span style={{ font: `700 ${rowFont - 2}px/1 ${MONO}`, color: col }}>{r.time}</span>
                    <span style={{ font: `700 ${rowFont}px/1.25 ${MONT}`, color: ink }}>
                      {r.title}
                      {r.detail && <span style={{ fontWeight: 500, color: soft }}> · {r.detail}</span>}
                    </span>
                  </div>
                );
              })}
            </Fill>
          </div>
        );
      }
      case "code": {
        const lines = slide.code.split("\n");
        const longest = Math.max(...lines.map((l) => l.length));
        const size = longest > 58 ? 22 : longest > 48 ? 25 : 28;
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Title size={t.title} accent={accent}>{slide.title}</Title>
            <Fill style={{ display: "grid", gridTemplateColumns: slide.bullets?.length ? "1fr 330px" : "1fr", gap: 30, alignItems: "center" }}>
              <pre style={{ margin: 0, background: "#1b1d23", color: "#e8e6e1", borderRadius: 20, padding: "26px 0", font: `500 ${size}px/1.58 ${MONO}`, overflow: "hidden", boxShadow: "0 30px 60px -36px rgba(0,0,0,.6)" }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ display: "flex", padding: "0 28px", background: slide.highlight?.includes(i + 1) ? "rgba(255,214,102,.14)" : undefined, borderLeft: slide.highlight?.includes(i + 1) ? "6px solid #ffd666" : "6px solid transparent" }}>
                    <span style={{ width: 42, flex: "none", color: "#5f6170" }}>{i + 1}</span>
                    <span style={{ whiteSpace: "pre" }}>{colour(l)}</span>
                  </div>
                ))}
              </pre>
              {slide.bullets?.length ? (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 18 }}>
                  {slide.bullets.map((b, i) => (
                    <li key={b} style={{ background: "#fff", borderLeft: `8px solid ${colourOf(i)}`, borderRadius: 14, padding: "18px 20px", font: `600 ${t.small + 1}px/1.3 ${MONT}`, color: ink, boxShadow: "0 16px 30px -24px rgba(0,0,0,.4)" }}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </Fill>
          </div>
        );
      }
      case "quiz": {
        const letters = "ABCD";
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <p style={{ margin: 0, alignSelf: "flex-start", font: `700 ${t.kicker}px/1 ${MONO}`, letterSpacing: ".16em", textTransform: "uppercase", color: "#fff", background: accent, padding: "10px 16px", borderRadius: 8 }}>Quiz</p>
            <p style={{ margin: "26px 0 0", font: `800 ${slide.question.length > 40 ? Math.round(t.title * 0.85) : t.title}px/1.08 ${MONT}`, letterSpacing: "-0.03em", color: ink }}>{slide.question}</p>
            <Fill style={{ display: "grid", gridTemplateColumns: `repeat(${slide.options.length}, 1fr)`, gap: 30, maxHeight: young ? 420 : 330 }}>
              {slide.options.map((o, i) => {
                const col = colourOf(i);
                const right = reveal && i === slide.answer;
                const faded = reveal && i !== slide.answer;
                return (
                  <div key={o} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 28, padding: "30px 26px", background: right ? col : "#fff", color: right ? "#fff" : ink, border: `4px solid ${right ? col : alpha(col, 0.35)}`, opacity: faded ? 0.32 : 1, transform: right ? "scale(1.04)" : undefined, transition: "all .35s ease", textAlign: "center", boxShadow: right ? `0 30px 60px -30px ${alpha(col, 0.8)}` : "0 20px 40px -32px rgba(0,0,0,.4)" }}>
                    <span style={{ display: "grid", placeItems: "center", width: 64, height: 64, borderRadius: "50%", background: right ? "rgba(255,255,255,.25)" : alpha(col, 0.14), color: right ? "#fff" : col, font: `800 30px/1 ${MONT}` }}>{right ? "✓" : letters[i]}</span>
                    <span style={{ display: "block", marginTop: 20, font: `800 ${t.card + (young ? 8 : 4)}px/1.12 ${MONT}` }}>{o}</span>
                  </div>
                );
              })}
            </Fill>
            {reveal && slide.explain && <p style={{ margin: "32px 0 0", font: `700 ${t.body}px/1.3 ${MONT}`, color: ink }}>{slide.explain}</p>}
          </div>
        );
      }
      case "compare":
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Title size={t.title} accent={accent}>{slide.title}</Title>
            <Fill style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
              {[slide.left, slide.right].map((side, k) => (
                <div key={side.title} style={{ display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: 26, padding: "40px 44px", background: k ? accent : "#fff", color: k ? "#fff" : ink, boxShadow: "0 30px 60px -38px rgba(0,0,0,.5)" }}>
                  <p style={{ margin: 0, font: `800 ${t.card + 6}px/1.12 ${MONT}` }}>{side.title}</p>
                  <ul style={{ margin: "28px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 18 }}>
                    {side.items.map((it) => (
                      <li key={it} style={{ font: `500 ${Math.round(t.card * 0.86)}px/1.35 ${MONT}`, display: "flex", gap: 16 }}>
                        <span style={{ flex: "none", width: 12, height: 12, borderRadius: "50%", marginTop: 12, background: k ? "#fff" : accent }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Fill>
          </div>
        );
      case "table": {
        const dense = slide.rows.length > 5;
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Title size={Math.round(t.title * 0.9)} accent={accent}>{slide.title}</Title>
            <Fill style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 60px -40px rgba(0,0,0,.5)" }}>
                <thead>
                  <tr>
                    {slide.head.map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: dense ? "14px 22px" : "18px 24px", background: accent, color: "#fff", font: `700 ${t.small - 3}px/1.2 ${MONO}`, letterSpacing: ".08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slide.rows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? alpha(accent, 0.06) : "#fff" }}>
                      {r.map((c, j) => (
                        <td key={j} style={{ padding: dense ? "13px 22px" : "18px 24px", font: `${j === 0 ? 700 : 500} ${dense ? t.small : t.small + 4}px/1.3 ${MONT}`, color: ink }}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {slide.foot && <p style={{ margin: "24px 0 0", font: `500 ${t.small - 1}px/1.4 ${MONT}`, color: soft }}>{slide.foot}</p>}
            </Fill>
          </div>
        );
      }
      case "image":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 70, alignItems: "center", height: "100%" }}>
            <div style={{ position: "relative", height: 640 }}>
              <div aria-hidden style={{ position: "absolute", inset: "26px 26px -26px -26px", borderRadius: 30, background: alpha(accent, 0.16) }} />
              <Art src={slide.src} style={{ position: "absolute", inset: 0 }} />
            </div>
            <div>
              <Title size={t.title} accent={accent}>{slide.title}</Title>
              {slide.points && (
                <ul style={{ listStyle: "none", padding: 0, margin: "46px 0 0", display: "grid", gap: 24 }}>
                  {slide.points.map((p, i) => (
                    <li key={p} style={{ display: "flex", gap: 22, alignItems: "center", font: `600 ${t.body}px/1.25 ${MONT}`, color: ink }}>
                      <span style={{ width: 22, height: 22, flex: "none", borderRadius: "50%", background: colourOf(i) }} />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
              {slide.caption && <p style={{ margin: "28px 0 0", font: `500 ${t.small}px/1.4 ${MONT}`, color: soft }}>{slide.caption}</p>}
            </div>
          </div>
        );
      case "big-number":
        return (
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <Halo color={accent} />
            <p style={{ position: "relative", margin: 0, font: `800 ${slide.number.length > 12 ? 108 : 176}px/1 ${MONT}`, letterSpacing: "-0.04em", color: accent }}>{slide.number}</p>
            <p style={{ position: "relative", margin: "34px 0 0", font: `800 ${t.title}px/1.1 ${MONT}`, color: ink }}>{slide.label}</p>
            {slide.sub && <p style={{ position: "relative", margin: "26px 0 0", font: `500 ${t.body}px/1.35 ${MONT}`, color: soft, maxWidth: 1180 }}>{slide.sub}</p>}
          </div>
        );
      case "closing":
        return (
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <Halo color={accent} />
            <p style={{ position: "relative", margin: 0, font: `800 ${slide.title.length > 30 ? Math.round(t.big * 0.85) : t.big}px/1.04 ${MONT}`, letterSpacing: "-0.035em", color: ink, maxWidth: 1320 }}>{slide.title}</p>
            {slide.sub && <p style={{ position: "relative", margin: "30px 0 0", font: `700 ${t.body}px/1.35 ${MONT}`, color: accent, maxWidth: 1250 }}>{slide.sub}</p>}
            {slide.points && (
              <div style={{ position: "relative", marginTop: 48, display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", maxWidth: 1300 }}>
                {slide.points.map((p, i) => (
                  <span key={p} style={{ background: "#fff", borderRadius: 999, padding: "16px 30px", font: `600 ${t.small + 2}px/1.2 ${MONT}`, color: ink, border: `3px solid ${alpha(colourOf(i), 0.5)}` }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        );
    }
  })();

  return (
    <div className="deck-slide" style={{ position: "relative", width: W, height: H, overflow: "hidden", background: paper, color: ink, fontFamily: MONT }} data-slide={index + 1}>
      {/* the blueprint grid, a wash of the deck's colour, and its band down the left edge */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(31,31,31,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(31,31,31,.045) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      {!centred && <div aria-hidden style={{ position: "absolute", right: -260, top: -260, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(accent, young ? 0.14 : 0.08)} 0%, transparent 68%)` }} />}
      <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: accent }} />
      <div style={{ position: "absolute", left: 96, right: 96, top: 40, display: "flex", justifyContent: "space-between", alignItems: "center", font: `600 ${Math.max(18, t.kicker - 6)}px/1 ${MONO}`, letterSpacing: ".16em", textTransform: "uppercase", color: "#7a7a7a" }}>
        <span>{deck.audience.split(" · ").slice(0, 2).join(" · ")}</span>
        {slide.phase && <span style={{ background: PHASE_COLOUR[slide.phase], color: "#fff", padding: "9px 15px", borderRadius: 8, letterSpacing: ".14em" }}>{slide.phase}</span>}
      </div>
      <div style={{ position: "absolute", left: 96, right: 96, top: 104, bottom: 100 }}>{body}</div>
      <div data-foot style={{ position: "absolute", left: 96, right: 96, bottom: 34, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src="/brand/jove-wordmark.png" alt="JOVE" style={{ height: 36, width: "auto", opacity: 0.85 }} />
        <span style={{ font: `600 18px/1 ${MONO}`, color: "#8a8a8a", letterSpacing: ".12em" }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

/** A little colour for code: comments grey, numbers gold, strings green, a few keywords blue. */
function colour(line: string) {
  const c = line.indexOf("//");
  const code = c >= 0 ? line.slice(0, c) : line;
  const comment = c >= 0 ? line.slice(c) : "";
  const parts = code.split(/(\b(?:void|const|int|float|unsigned|long|if|else|return|for)\b|"[^"]*"|\b\d+(?:\.\d+)?\b)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^(void|const|int|float|unsigned|long|if|else|return|for)$/.test(p) ? (
          <span key={i} style={{ color: "#7cb7ff" }}>{p}</span>
        ) : /^"/.test(p) ? (
          <span key={i} style={{ color: "#a6e3a1" }}>{p}</span>
        ) : /^\d/.test(p) ? (
          <span key={i} style={{ color: "#ffd666" }}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
      {comment && <span style={{ color: "#8b8b95" }}>{comment}</span>}
    </>
  );
}
