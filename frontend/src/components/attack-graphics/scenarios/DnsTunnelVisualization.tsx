/**
 * DnsTunnelVisualization.tsx
 * Visual: DNS Tunnelling — secret data encoded into DNS query labels.
 * Shows encode → chunk → DNS packet → DNS infrastructure → ORION feature extraction.
 */
import { SharedDefs, OrionSensorNode, DnsResolverNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const ENCODED_CHUNKS = ["A8F3K2", "91Q7XZ", "4M8P2L", "Z3X9QR", "7PD1MV"];

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
  avgQueryLen: number;
}

export function DnsTunnelVisualization({ step, hasAlert, avgQueryLen }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const extracting = ["extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  const visibleChunks = step === "attack" ? 2
    : step === "observe" ? 3
    : active ? 5 : 0;

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── COMPROMISED HOST (left) ── */}
      <g transform="translate(100,115)">
        <rect x="-32" y="-40" width="64" height="80" rx="4" fill="#090C18" stroke={active ? "#A78BFA" : "#1A1530"} strokeWidth="1.5" />
        <rect x="-26" y="-34" width="52" height="50" rx="2" fill="#0D1020" stroke="#1E1A40" strokeWidth="0.8" />
        {/* Data block */}
        {active && (
          <>
            <rect x="-22" y="-28" width="44" height="8" rx="1" fill="#4B0082" opacity="0.6" />
            <text x="-20" y="-22" fill="#A78BFA" fontSize="6" fontFamily="Space Mono, monospace">SECRET DATA</text>
            {/* Encoder */}
            <rect x="-22" y="-14" width="44" height="8" rx="1" fill="#240048" stroke="#7C3AED" strokeWidth="0.7" />
            <text x="-20" y="-8" fill="#7C3AED" fontSize="5" fontFamily="Space Mono, monospace">ENCODER ▸</text>
          </>
        )}
        {/* Status LED */}
        <circle cx="22" cy="-28" r="2" fill={active ? "#A78BFA" : "#1A1530"} />
        <text y="52" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">COMPROMISED</text>
        <text y="64" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">10.0.0.14</text>
        {active && (
          <circle r="42" fill="none" stroke="#A78BFA" strokeWidth="0.6" opacity="0.4" className="svg-pulse-ring" />
        )}
      </g>

      {/* ── ENCODED CHUNK PACKETS flowing right ── */}
      {active && ENCODED_CHUNKS.slice(0, visibleChunks).map((chunk, i) => {
        const xBase = 175 + i * 44;
        const yOffset = [-18, 0, 18, -10, 8][i] ?? 0;
        return (
          <g key={chunk} transform={`translate(${xBase},${115 + yOffset})`}>
            <rect x="-22" y="-10" width="44" height="20" rx="3" fill="#090A18" stroke="#7C3AED" strokeWidth="0.8" />
            <text x="0" y="-2" textAnchor="middle" fill="#A78BFA" fontSize="6" fontWeight="700" fontFamily="Space Mono, monospace">DNS LABEL</text>
            <text x="0" y="8" textAnchor="middle" fill="#C9D4CF" fontSize="6" fontFamily="Space Mono, monospace">{chunk}</text>
          </g>
        );
      })}

      {/* Animated flow line host → resolver */}
      <line x1="135" y1="115" x2="390" y2="115"
        stroke={active ? "#7C3AED" : "#0D1828"} strokeWidth="1.5"
        strokeDasharray={active ? "6 4" : "2 6"}
        className={active ? "svg-flow-path-animated" : ""} />

      {/* ── DNS QUERY PACKET CARDS ── */}
      {observing && (
        <g transform="translate(300,115)">
          <rect x="-36" y="-28" width="72" height="56" rx="3" fill="#060812" stroke="#A78BFA" strokeWidth="1" />
          <rect x="-36" y="-28" width="72" height="12" rx="3" fill="#1A1040" />
          <text x="0" y="-19" textAnchor="middle" fill="#A78BFA" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">DNS QUERY</text>
          <text x="-30" y="-6" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">TYPE: TXT</text>
          <text x="-30" y="4" fill="#C9D4CF" fontSize="5.5" fontFamily="Space Mono, monospace">LABEL: A8F3K2.91Q7…</text>
          <text x="-30" y="13" fill="#7C8785" fontSize="5.5" fontFamily="Space Mono, monospace">LEN: 47 chars</text>
          <text x="-30" y="22" fill="#7C3AED" fontSize="5" fontFamily="Space Mono, monospace">ID: 8A31 / ENT: HIGH</text>
        </g>
      )}

      {/* ── DNS RESOLVER (center) ── */}
      <DnsResolverNode x={430} y={115} active={observing} label="DNS INFRA" />
      <text x="430" y="154" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">8.8.8.8 / C2 NS</text>

      {/* Resolver → sensor path */}
      <line x1="458" y1="115" x2="680" y2="130"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />

      {/* ── FEATURE EXTRACTION PANEL ── */}
      {extracting && (
        <g transform="translate(580,100)">
          <rect x="-60" y="-46" width="120" height="92" rx="5" fill="#060F0B" stroke="#00D084" strokeWidth="1" />
          <text x="0" y="-34" textAnchor="middle" fill="#00D084" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">FEATURE EXTRACT</text>
          {[
            { label: "QUERY ENTROPY", val: "3.82 bits", hi: true },
            { label: "AVG LABEL LEN", val: `${avgQueryLen || 47} chars`, hi: avgQueryLen >= 30 },
            { label: "UNIQUE RATIO", val: "0.94", hi: true },
          ].map((f, i) => (
            <g key={i} transform={`translate(0,${-20 + i * 22})`}>
              <rect x="-54" y="-8" width="108" height="16" rx="2"
                fill={f.hi ? "rgba(239,68,68,0.08)" : "#0A120F"}
                stroke={f.hi ? "#EF4444" : "#1B2B26"} strokeWidth="0.7" />
              <text x="-48" y="3" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">{f.label}</text>
              <text x="30" y="3" fill={f.hi ? "#EF4444" : "#00D084"} fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">{f.val}</text>
            </g>
          ))}
        </g>
      )}

      {/* ── ORION SENSOR ── */}
      <OrionSensorNode x={760} y={130} active={observing} alert={decided && hasAlert} />

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="620" y="185" width="220" height="32" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="730" y="204" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ DNS TUNNEL DETECTED</text>
        </g>
      )}

      {/* Pipeline */}
      <g transform="translate(480,235)">
        {[
          { label: "1.FLOW INGEST", done: observing },
          { label: "2.FEATURE EXTRACT", done: extracting },
          { label: "3.RULE EVAL", done: ["evaluate","enrich","decision","complete"].includes(step) },
          { label: "4.ML ENRICH", done: ["enrich","decision","complete"].includes(step) },
          { label: "5.DECISION", done: decided },
        ].map((s, i, arr) => {
          const W = 128; const GAP = 14;
          const total = arr.length; const totalW = total * W + (total - 1) * GAP; const startX = -totalW / 2;
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
