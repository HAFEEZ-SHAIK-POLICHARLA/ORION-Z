/**
 * DgaVisualization.tsx
 * Visual: Domain Generation Algorithm — malware DGA engine generating pseudo-random domains.
 * Distinct from DNS Tunnelling: focuses on the generation process, not encoded payloads.
 */
import { SharedDefs, OrionSensorNode, DnsResolverNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const DGA_DOMAINS = [
  "q8x2m7kl.net",
  "z91kqp4r.com",
  "m3v8xzdf.io",
  "7pq19d2c.net",
  "x4k2b9wz.org",
];

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
}

export function DgaVisualization({ step, hasAlert }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const extracting = ["extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  const visibleDomains = step === "attack" ? 2
    : step === "observe" ? 3
    : step === "extract" ? 4
    : active ? 5 : 0;

  // Seed / iteration counter (visual)
  const iteration = step === "attack" ? 7
    : step === "observe" ? 23
    : step === "extract" ? 51
    : active ? 89 : 0;

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── INFECTED ENDPOINT with DGA ENGINE ── */}
      <g transform="translate(120,115)">
        <rect x="-44" y="-55" width="88" height="110" rx="4" fill="#0A060E" stroke={active ? "#EF4444" : "#2A1040"} strokeWidth="1.5" />
        {/* Label */}
        <text y="-64" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">INFECTED HOST</text>
        <text y="-54" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">10.0.0.22</text>

        {/* DGA Engine box */}
        <rect x="-40" y="-50" width="80" height="38" rx="3" fill="#130820" stroke={active ? "#7C3AED" : "#2A1040"} strokeWidth="1" />
        <text x="0" y="-39" textAnchor="middle" fill="#A78BFA" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">DGA ENGINE</text>
        {active && (
          <>
            <text x="-34" y="-28" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">SEED:</text>
            <text x="-10" y="-28" fill="#EF4444" fontSize="7" fontFamily="Space Mono, monospace">0xDEAD3F</text>
            <text x="-34" y="-18" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">ITER:</text>
            <text x="-10" y="-18" fill="#F59E0B" fontSize="7" fontFamily="Space Mono, monospace">{String(iteration).padStart(3,"0")}</text>
            <text x="-34" y="-8" fill="#A78BFA" fontSize="5" fontFamily="Space Mono, monospace">GENERATING…</text>
          </>
        )}
        {/* Malware process status */}
        <rect x="-40" y="-8" width="80" height="16" rx="2" fill={active ? "rgba(239,68,68,0.15)" : "#0A120F"} stroke={active ? "#EF4444" : "#1B2B26"} strokeWidth="0.8" />
        <text x="0" y="4" textAnchor="middle" fill={active ? "#EF4444" : "#4A6055"} fontSize="6.5" fontWeight="700" fontFamily="Space Mono, monospace">
          {active ? "MALWARE ACTIVE" : "DORMANT"}
        </text>
        {/* Port / socket indicators */}
        {active && <circle r="34" fill="none" stroke="#EF4444" strokeWidth="0.6" opacity="0.4" className="svg-pulse-ring" />}

        {/* Generated domain stream going right */}
        {active && (
          <line x1="44" y1="0" x2="100" y2="0"
            stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="5 4" className="svg-flow-path-animated" />
        )}
      </g>

      {/* ── GENERATED DOMAIN CARDS (cascading right) ── */}
      {active && DGA_DOMAINS.slice(0, visibleDomains).map((domain, i) => {
        const xPos = 220 + i * 50;
        const yPos = 90 + (i % 2 === 0 ? -15 : 15);
        return (
          <g key={domain} transform={`translate(${xPos},${yPos})`}>
            <rect x="-36" y="-12" width="72" height="24" rx="3" fill="#090812" stroke="#7C3AED" strokeWidth="0.9" />
            <text x="0" y="-3" textAnchor="middle" fill="#A78BFA" fontSize="6" fontWeight="700" fontFamily="Space Mono, monospace">GEN DOMAIN</text>
            <text x="0" y="8" textAnchor="middle" fill="#C9D4CF" fontSize="6" fontFamily="Space Mono, monospace">
              {domain.length > 12 ? domain.substring(0, 12) + "…" : domain}
            </text>
          </g>
        );
      })}

      {/* Flow line to resolver */}
      <line x1="166" y1="115" x2="450" y2="115"
        stroke={active ? "#A78BFA" : "#0D1828"} strokeWidth="1.5"
        strokeDasharray={active ? "6 4" : "2 6"}
        className={active ? "svg-flow-path-animated" : ""} />

      {/* ── DNS RESOLVER (center) ── */}
      <DnsResolverNode x={490} y={115} active={observing} label="DNS RESOLVER" />
      <text x="490" y="154" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">NXDOMAIN × many</text>

      {/* Resolver → sensor */}
      <line x1="518" y1="115" x2="690" y2="130"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />

      {/* ── LEXICAL ANALYSIS PANEL ── */}
      {extracting && (
        <g transform="translate(616,100)">
          <rect x="-56" y="-42" width="112" height="84" rx="5" fill="#060F0B" stroke="#00D084" strokeWidth="1" />
          <text x="0" y="-30" textAnchor="middle" fill="#00D084" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">LEXICAL ANALYSIS</text>
          {[
            { label: "DGA SCORE", val: "0.847", hi: true },
            { label: "UNIQUE RATIO", val: "0.912", hi: true },
            { label: "QUERY COUNT", val: `${Math.min(visibleDomains + 3, 12)}`, hi: visibleDomains >= 4 },
          ].map((f, i) => (
            <g key={i} transform={`translate(0,${-14 + i * 22})`}>
              <rect x="-50" y="-8" width="100" height="16" rx="2"
                fill={f.hi ? "rgba(239,68,68,0.08)" : "#0A120F"}
                stroke={f.hi ? "#EF4444" : "#1B2B26"} strokeWidth="0.7" />
              <text x="-44" y="3" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">{f.label}</text>
              <text x="22" y="3" fill={f.hi ? "#EF4444" : "#00D084"} fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">{f.val}</text>
            </g>
          ))}
        </g>
      )}

      {/* ── ORION SENSOR ── */}
      <OrionSensorNode x={770} y={130} active={observing} alert={decided && hasAlert} />

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="620" y="188" width="210" height="30" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="725" y="207" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ DGA C2 DETECTED</text>
        </g>
      )}

      {/* Pipeline */}
      <g transform="translate(480,237)">
        {[
          { label: "1.FLOW INGEST", done: observing },
          { label: "2.FEATURE EXTRACT", done: extracting },
          { label: "3.RULE EVAL", done: ["evaluate","enrich","decision","complete"].includes(step) },
          { label: "4.ML ENRICH", done: ["enrich","decision","complete"].includes(step) },
          { label: "5.DECISION", done: decided },
        ].map((s, i, arr) => {
          const W = 128; const GAP = 14; const total = arr.length; const totalW = total * W + (total - 1) * GAP; const startX = -totalW / 2;
          return (
            <g key={i} transform={`translate(${startX + i * (W + GAP)},0)`}>
              <rect x="0" y="-9" width={W} height="18" rx="4" fill={s.done ? "#0A251E" : "#0A120F"} stroke={s.done ? "#00D084" : "#1B2B26"} strokeWidth="1" />
              <text x={W / 2} y="3" textAnchor="middle" fill={s.done ? "#F4F7F5" : "#4A6055"} fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">
                {s.done ? `${s.label} ✓` : s.label}
              </text>
              {i < arr.length - 1 && (<text x={W + GAP / 2} y="4" textAnchor="middle" fill={s.done ? "#30B894" : "#1B2B26"} fontSize="10" fontFamily="Space Mono, monospace">→</text>)}
            </g>
          );
        })}
      </g>

      {step === "ready" && (
        <text x="480" y="130" textAnchor="middle" fill="#4A6055" fontSize="13" fontWeight="700" fontFamily="Space Mono, monospace">DORMANT · AWAITING REPLAY</text>
      )}
    </svg>
  );
}
