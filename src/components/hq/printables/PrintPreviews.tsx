/**
 * Hand-drawn style miniature previews for the Print Studio cards.
 * Pure SVG (no state, server-safe); everything inherits currentColor so it themes with the card.
 */

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 160 112" role="img" aria-label={label} className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="pv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <path d="M0 0v5" strokeWidth="0.7" opacity="0.55" />
        </pattern>
      </defs>
      {children}
    </svg>
  );
}

const Page = ({ x = 46, w = 68 }: { x?: number; w?: number }) => <rect x={x} y="6" width={w} height="100" rx="1.5" fill="var(--color-paper-50, #fbf9f4)" />;
const Lines = ({ x, y, w, n, gap = 4 }: { x: number; y: number; w: number; n: number; gap?: number }) => (
  <g strokeWidth="0.8" opacity="0.7">
    {Array.from({ length: n }, (_, i) => (
      <path key={i} d={`M${x} ${y + i * gap}h${i === n - 1 ? w * 0.6 : w}`} />
    ))}
  </g>
);
const Tick = ({ x, y }: { x: number; y: number }) => <rect x={x} y={y} width="4" height="4" rx="0.6" />;
const Face = ({ cx, cy, mood }: { cx: number; cy: number; mood: -1 | 0 | 1 }) => (
  <g strokeWidth="0.8">
    <circle cx={cx} cy={cy} r="4" />
    <path d={`M${cx - 1.6} ${cy - 1}v0.1M${cx + 1.6} ${cy - 1}v0.1`} strokeWidth="1.1" />
    <path d={mood > 0 ? `M${cx - 2} ${cy + 1}q2 2.6 4 0` : mood < 0 ? `M${cx - 2} ${cy + 2.4}q2 -2.6 4 0` : `M${cx - 2} ${cy + 1.6}h4`} />
  </g>
);

const previews: Record<string, () => React.ReactNode> = {
  consent: () => (
    <Frame label="Consent form sketch: two slips on one sheet">
      <Page />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(0 ${i * 48})`}>
          <rect x="52" y="12" width="14" height="5" fill="url(#pv-hatch)" />
          <Lines x={52} y={22} w={56} n={3} gap={3} />
          {[0, 1, 2, 3].map((k) => (
            <Tick key={k} x={52 + (k % 2) * 28} y={32 + Math.floor(k / 2) * 5.5} />
          ))}
          <path d="M52 47h34M92 47h16" strokeDasharray="1.5 1.5" />
        </g>
      ))}
      <path d="M46 55h68" strokeDasharray="3 2" />
    </Frame>
  ),
  "student-feedback": () => (
    <Frame label="Student feedback sketch: smiley scale cards">
      <Page />
      {[0, 1, 2, 3].map((i) => {
        const x = 50 + (i % 2) * 31;
        const y = 12 + Math.floor(i / 2) * 47;
        return (
          <g key={i}>
            <rect x={x} y={y} width="29" height="44" strokeDasharray="2 1.5" strokeWidth="0.7" />
            <path d={`M${x + 3} ${y + 5}h14`} strokeWidth="1.4" />
            <Lines x={x + 3} y={y + 11} w={22} n={2} gap={3} />
            <Face cx={x + 6} cy={y + 24} mood={-1} />
            <Face cx={x + 14.5} cy={y + 24} mood={0} />
            <Face cx={x + 23} cy={y + 24} mood={1} />
            <Lines x={x + 3} y={y + 35} w={22} n={2} gap={3} />
          </g>
        );
      })}
    </Frame>
  ),
  "teacher-feedback": () => (
    <Frame label="Teacher feedback sketch: rating rows">
      <Page />
      <rect x="52" y="12" width="20" height="5" fill="url(#pv-hatch)" />
      <path d="M52 22h56" strokeWidth="1.4" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <path d={`M52 ${33 + i * 10}h22`} strokeWidth="0.8" opacity="0.7" />
          {[0, 1, 2, 3, 4].map((k) => (
            <circle key={k} cx={84 + k * 6} cy={32 + i * 10} r="2" strokeWidth="0.8" />
          ))}
        </g>
      ))}
      <Lines x={52} y={95} w={56} n={2} gap={3.5} />
    </Frame>
  ),
  attendance: () => (
    <Frame label="Attendance sheet sketch: table of students">
      <Page />
      <rect x="52" y="12" width="22" height="5" fill="url(#pv-hatch)" />
      <path d="M52 22h56M52 27h56" />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M52 ${33 + i * 6}h56`} strokeWidth="0.7" opacity="0.6" />
      ))}
      <path d="M58 27v70M90 27v70M99 27v70" strokeWidth="0.7" opacity="0.6" />
    </Frame>
  ),
  "name-tags": () => (
    <Frame label="Name tags sketch: ten tags on a sheet">
      <Page />
      {Array.from({ length: 10 }, (_, i) => {
        const x = 49 + (i % 2) * 31;
        const y = 10 + Math.floor(i / 2) * 19;
        return (
          <g key={i} strokeWidth="0.8">
            <rect x={x} y={y} width="30" height="18" strokeDasharray="2 1.5" />
            <rect x={x} y={y} width="30" height="5" fill="currentColor" opacity="0.85" />
            <path d={`M${x + 4} ${y + 12}h14`} strokeWidth="1.2" />
          </g>
        );
      })}
    </Frame>
  ),
  "id-cards": () => (
    <Frame label="ID cards sketch: front and back of a CR80 card">
      <rect x="10" y="14" width="64" height="40" rx="3" fill="var(--color-paper-50, #fbf9f4)" />
      <rect x="10" y="14" width="64" height="12" rx="3" fill="currentColor" opacity="0.85" />
      <circle cx="26" cy="38" r="7" />
      <path d="M38 35h28M38 40h20M38 45h24" strokeWidth="0.9" />
      <rect x="86" y="14" width="64" height="40" rx="3" fill="var(--color-paper-50, #fbf9f4)" />
      <path d="M92 24h30M92 29h42M92 34h36" strokeWidth="0.8" opacity="0.7" />
      <rect x="132" y="40" width="12" height="9" fill="url(#pv-hatch)" />
      <rect x="10" y="62" width="64" height="40" rx="3" strokeDasharray="2 2" opacity="0.5" />
      <rect x="86" y="62" width="64" height="40" rx="3" strokeDasharray="2 2" opacity="0.5" />
    </Frame>
  ),
  "visiting-cards": () => (
    <Frame label="Visiting cards sketch: ten cards on a sheet">
      <Page />
      {Array.from({ length: 10 }, (_, i) => {
        const x = 49 + (i % 2) * 31;
        const y = 10 + Math.floor(i / 2) * 19;
        return (
          <g key={i} strokeWidth="0.8">
            <rect x={x} y={y} width="30" height="18" strokeDasharray="2 1.5" />
            <path d={`M${x + 3} ${y + 5}h12`} strokeWidth="1.3" />
            <path d={`M${x + 3} ${y + 9}h8M${x + 3} ${y + 12}h14M${x + 3} ${y + 15}h10`} opacity="0.6" />
          </g>
        );
      })}
    </Frame>
  ),
  letterhead: () => (
    <Frame label="Letterhead sketch: header and footer on a blank page">
      <Page />
      <path d="M52 12h18" strokeWidth="2" />
      <Lines x={92} y={12} w={16} n={3} gap={3} />
      <path d="M52 24h56" strokeWidth="1.3" />
      <circle cx="80" cy="62" r="14" strokeDasharray="1.5 2.5" opacity="0.45" />
      <path d="M52 94h56" strokeWidth="0.8" />
      <path d="M52 98h26M92 98h16" strokeWidth="0.8" opacity="0.6" />
    </Frame>
  ),
  poster: () => (
    <Frame label="Poster sketch: dark hero band with schedule below">
      <Page />
      <rect x="46" y="6" width="68" height="38" fill="currentColor" opacity="0.88" stroke="none" />
      <path d="M52 14h14M52 24h40M52 29h30" stroke="var(--color-paper, #f5f1e8)" strokeWidth="1.5" />
      <Lines x={52} y={52} w={56} n={2} gap={3.5} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={52 + i * 14.5} y="64" width="12.5" height="18" strokeWidth="0.8" />
          <path d={`M${54 + i * 14.5} 70h8.5M${54 + i * 14.5} 74h6`} strokeWidth="0.7" opacity="0.7" />
        </g>
      ))}
      <path d="M52 94h56" strokeWidth="0.8" />
    </Frame>
  ),
  "table-tents": () => (
    <Frame label="Table tent sketch: folded station sign">
      <path d="M22 96 L40 20 H120 L138 96 Z" fill="var(--color-paper-50, #fbf9f4)" />
      <path d="M22 96 H138" />
      <path d="M31 58 H129" strokeDasharray="3 2.5" opacity="0.6" />
      <text x="80" y="50" textAnchor="middle" fontSize="22" fontWeight="700" fontFamily="monospace" fill="currentColor" stroke="none">
        07
      </text>
      <path d="M62 66h36M68 72h24" strokeWidth="0.9" opacity="0.7" />
    </Frame>
  ),
  safety: () => (
    <Frame label="Safety poster sketch: shield and list of rules">
      <Page />
      <path d="M80 12 L92 16 V28 Q92 36 80 40 Q68 36 68 28 V16 Z" fill="url(#pv-hatch)" />
      <path d="M75 26l4 4 7-8" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <circle cx="56" cy={52 + i * 8} r="2.4" strokeWidth="0.9" />
          <path d={`M62 ${52 + i * 8}h${34 + (i % 3) * 6}`} strokeWidth="0.8" opacity="0.7" />
        </g>
      ))}
    </Frame>
  ),
  checklist: () => (
    <Frame label="Trainer checklist sketch: ticked list on a card">
      <rect x="38" y="8" width="84" height="96" rx="2" fill="var(--color-paper-50, #fbf9f4)" />
      <rect x="44" y="14" width="22" height="5" fill="url(#pv-hatch)" />
      <path d="M44 24h72" strokeWidth="1.3" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i}>
          <Tick x={44} y={30 + i * 10} />
          {i < 3 && <path d={`M45 ${32 + i * 10}l1.4 1.6 2.4-3.2`} strokeWidth="1" />}
          <path d={`M52 ${32 + i * 10}h${40 + (i % 3) * 8}`} strokeWidth="0.8" opacity="0.7" />
        </g>
      ))}
    </Frame>
  ),
  certificate: () => (
    <Frame label="Certificate sketch: framed landscape certificate with seal and QR">
      <rect x="10" y="14" width="140" height="84" fill="var(--color-paper-50, #fbf9f4)" strokeWidth="1.6" />
      <rect x="15" y="19" width="130" height="74" strokeWidth="0.6" />
      <rect x="12.5" y="16.5" width="135" height="79" fill="url(#pv-hatch)" stroke="none" opacity="0.5" />
      <rect x="15" y="19" width="130" height="74" fill="var(--color-paper-50, #fbf9f4)" strokeWidth="0.6" />
      <path d="M62 27h36" strokeWidth="2" />
      <path d="M46 38h68" strokeWidth="1.6" />
      <path d="M58 52h44" strokeWidth="2.4" />
      <path d="M44 56h72" strokeWidth="0.8" />
      <Lines x={52} y={63} w={56} n={2} gap={3.5} />
      <path d="M26 83h30M104 83h30" />
      <rect x="71" y="72" width="18" height="18" fill="url(#pv-hatch)" />
      <rect x="71" y="72" width="18" height="18" />
    </Frame>
  ),
};

export function PrintPreview({ id }: { id: string }) {
  const render = previews[id];
  return <div className="h-full w-full text-graphite">{render ? render() : null}</div>;
}
