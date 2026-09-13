/**
 * SynFloodVisualization.tsx
 * Visual: TCP SYN Flood — handshake exhaustion, half-open connection pool accumulation.
 * Each phase shows distinct SYN packet streams, half-open table fill, server stress.
 */
import { SharedDefs, AttackerNode, OrionSensorNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const HALF_OPEN_COUNT = 8;
const PACKET_COLS = 3;

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
  flowCount?: number;
}

export function SynFloodVisualization({ step, hasAlert }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  // Half-open slots fill progressively
  const filledSlots = step === "attack" ? 2
    : step === "observe" ? 4
    : step === "extract" ? 6
    : active ? HALF_OPEN_COUNT : 0;

  // SYN packet columns (only during attack phase)
  const synCols = step === "attack" ? 2
    : step === "observe" ? 3
    : step === "extract" ? PACKET_COLS : active ? PACKET_COLS : 0;

  // Rate counter
  const ppsDisplay = active ? (step === "attack" ? "482 pkt/s" : step === "observe" ? "1,247 pkt/s" : "2,840 pkt/s") : "0 pkt/s";

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── ATTACKER (left) ── */}
      <AttackerNode x={110} y={110} active={active} alert={decided && hasAlert} label="ATTACKER" sublabel="192.168.1.105" />

      {/* ── SYN PACKET STREAMS (multiple columns) ── */}
      {active && Array.from({ length: synCols }).map((_, ci) => {
        const yOff = [-20, 0, 20][ci] ?? 0;
        return (
          <g key={ci}>
            {/* Animated flow line */}
            <line x1="145" y1={110 + yOff} x2="330" y2={110 + yOff}
              stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6 4"
              className="svg-flow-path-animated" />
            {/* SYN packet card at different positions along stream */}
            <g transform={`translate(${230 + ci * 10},${100 + yOff})`} opacity={0.9}>
              <rect x="-28" y="-14" width="56" height="28" rx="3" fill="#060806" stroke="#EF4444" strokeWidth="1" />
              <text x="-22" y="-4" fill="#EF4444" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">TCP SYN</text>
              <text x="-22" y="6" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">→ :80/443</text>
              <text x="-22" y="14" fill="#C9D4CF" fontSize="5" fontFamily="Space Mono, monospace">
                {`SEQ:${(0x8F000 + ci * 0x112).toString(16).toUpperCase()}`}
              </text>
            </g>
          </g>
        );
      })}

      {/* ── GHOST NO-ACK ARROWS (pointing back, to show ACK never arrives) ── */}
      {observing && (
        <>
          <line x1="330" y1="85" x2="200" y2="85" stroke="#4A1818" strokeWidth="1" strokeDasharray="3 5" />
          <text x="265" y="80" textAnchor="middle" fill="#6A2828" fontSize="7" fontFamily="Space Mono, monospace">
            ACK NEVER ARRIVES
          </text>
        </>
      )}

      {/* ── TARGET SERVER (center-right) ── */}
      {/* Server + connection pool panel */}
      <g transform="translate(370,70)">
        {/* Server chassis */}
        <rect x="-30" y="-32" width="60" height="64" rx="4" fill="#061310" stroke={decided && hasAlert ? "#EF4444" : observing ? "#30B894" : "#1B2B26"} strokeWidth="1.5" />
        {/* Rack units */}
        {[0, 1, 2, 3].map(i => (
          <rect key={i} x="-24" y={-26 + i * 12} width="48" height="9" rx="2"
            fill={observing ? "rgba(0,208,132,0.1)" : "#0A1E19"} stroke="#143028" strokeWidth="0.8" />
        ))}
        {/* LEDs */}
        {[0, 1, 2, 3].map(i => (
          <circle key={i} cx="18" cy={-22 + i * 12} r="2"
            fill={observing ? (decided && hasAlert ? "#EF4444" : "#00D084") : "#1B2B26"} />
        ))}
        <text y="-42" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">TARGET SERVER</text>
        <text y="44" textAnchor="middle" fill="#9C6A3E" fontSize="8" fontFamily="Space Mono, monospace">10.0.0.1 :80/443</text>
        {/* Stress indicator */}
        {active && (
          <text y="58" textAnchor="middle" fill={filledSlots >= 6 ? "#EF4444" : "#F59E0B"} fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
            {filledSlots >= 8 ? "⚠ EXHAUSTED" : filledSlots >= 6 ? "⚠ STRESSED" : "PROCESSING..."}
          </text>
        )}
      </g>

      {/* ── HALF-OPEN CONNECTION POOL TABLE ── */}
      <g transform="translate(480,35)">
        <rect x="-70" y="-14" width="140" height="16" rx="3" fill="#0A1610" stroke="#1B3028" strokeWidth="1" />
        <text x="0" y="-3" textAnchor="middle" fill="#7C8785" fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
          CONNECTION POOL
        </text>
        {Array.from({ length: HALF_OPEN_COUNT }).map((_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const filled = i < filledSlots;
          return (
            <g key={i} transform={`translate(${-62 + col * 32},${8 + row * 16})`}>
              <rect width="28" height="12" rx="2"
                fill={filled ? "rgba(239,68,68,0.2)" : "#0A1610"}
                stroke={filled ? "#EF4444" : "#1B2B26"} strokeWidth="0.8" />
              <text x="14" y="9" textAnchor="middle" fill={filled ? "#EF4444" : "#1B2B26"}
                fontSize="6" fontWeight="700" fontFamily="Space Mono, monospace">
                {filled ? "HALF-OPEN" : "CLOSED"}
              </text>
            </g>
          );
        })}
        {/* Fill percentage */}
        {active && (
          <text x="0" y="46" textAnchor="middle" fill={filledSlots >= 6 ? "#EF4444" : "#F59E0B"}
            fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
            {`${Math.round((filledSlots / HALF_OPEN_COUNT) * 100)}% FULL`}
          </text>
        )}
      </g>

      {/* ── RATE GAUGE ── */}
      <g transform="translate(480,170)">
        <rect x="-60" y="-12" width="120" height="22" rx="3" fill="#0A1610" stroke="#1B3028" strokeWidth="1" />
        <text x="0" y="-2" textAnchor="middle" fill="#7C8785" fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">PKT RATE</text>
        <text x="0" y="8" textAnchor="middle" fill={active && filledSlots >= 6 ? "#EF4444" : "#00D084"}
          fontSize="11" fontWeight="700" fontFamily="Space Mono, monospace">
          {ppsDisplay}
        </text>
      </g>

      {/* ── SENSOR CONNECTION LINE ── */}
      <line x1="400" y1="110" x2="620" y2="130"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "3 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />
      <text x="510" y="118" textAnchor="middle" fill={observing ? "#30B894" : "#1B2B26"}
        fontSize="7" fontFamily="Space Mono, monospace">PASSIVE MIRROR</text>

      {/* ── ORION-Z SENSOR (right) ── */}
      <OrionSensorNode x={680} y={130} active={observing} alert={decided && hasAlert} />

      {/* ── PIPELINE BAR ── */}
      <g transform="translate(480,228)">
        {[
          { label: "1.FLOW INGEST", done: observing },
          { label: "2.FEATURE EXTRACT", done: ["extract","evaluate","enrich","decision","complete"].includes(step) },
          { label: "3.RULE EVAL", done: ["evaluate","enrich","decision","complete"].includes(step) },
          { label: "4.ML ENRICH", done: ["enrich","decision","complete"].includes(step) },
          { label: "5.DECISION", done: decided },
        ].map((s, i, arr) => {
          const W = 130; const GAP = 16;
          const total = arr.length;
          const totalW = total * W + (total - 1) * GAP;
          const startX = -totalW / 2;
          return (
            <g key={i} transform={`translate(${startX + i * (W + GAP)},0)`}>
              <rect x="0" y="-10" width={W} height="20" rx="4"
                fill={s.done ? "#0A251E" : "#0A120F"}
                stroke={s.done ? "#00D084" : "#1B2B26"} strokeWidth="1" />
              <text x={W / 2} y="4" textAnchor="middle" fill={s.done ? "#F4F7F5" : "#4A6055"}
                fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">
                {s.done ? `${s.label} ✓` : s.label}
              </text>
              {i < arr.length - 1 && (
                <text x={W + GAP / 2} y="4" textAnchor="middle" fill={s.done ? "#30B894" : "#1B2B26"}
                  fontSize="10" fontFamily="Space Mono, monospace">→</text>
              )}
            </g>
          );
        })}
      </g>

      {/* ── THREAT CONFIRMED OVERLAY ── */}
      {decided && hasAlert && (
        <g>
          <rect x="320" y="185" width="200" height="32" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="420" y="204" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ THREAT CONFIRMED</text>
        </g>
      )}

      {/* ── READY state label ── */}
      {step === "ready" && (
        <text x="480" y="130" textAnchor="middle" fill="#4A6055" fontSize="13" fontWeight="700" fontFamily="Space Mono, monospace">
          DORMANT · AWAITING REPLAY
        </text>
      )}
    </svg>
  );
}
