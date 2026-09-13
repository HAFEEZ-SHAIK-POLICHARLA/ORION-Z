/**
 * UdpAmplificationVisualization.tsx
 * Visual: Reflected UDP Amplification — small spoofed request → reflectors → massive response to victim.
 * Key mechanic: amplification factor visualization.
 */
import { SharedDefs, OrionSensorNode, ReflectorNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const REFLECTORS = [
  { x: 390, y: 45, label: "DNS x64", proto: "DNS :53" },
  { x: 390, y: 95, label: "NTP x556", proto: "NTP :123" },
  { x: 390, y: 145, label: "SSDP x76", proto: "SSDP :1900" },
  { x: 390, y: 195, label: "Memcached×51k", proto: "MC :11211" },
];

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
  packetsPerSec: number;
}

export function UdpAmplificationVisualization({ step, hasAlert, packetsPerSec }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const extracting = ["extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  const visibleReflectors = step === "attack" ? 1
    : step === "observe" ? 2
    : step === "extract" ? 3
    : active ? 4 : 0;

  const ppsDisplay = packetsPerSec > 0 ? `${packetsPerSec.toLocaleString()} pkt/s`
    : active ? "14,820 pkt/s" : "0 pkt/s";

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── SPOOFED ATTACKER (top-left) ── */}
      <g transform="translate(100,120)">
        <rect x="-28" y="-26" width="56" height="52" rx="4" fill="#0A060E" stroke={active ? "#F97316" : "#2A1020"} strokeWidth="1.5" />
        <text x="0" y="-36" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">SPOOFED</text>
        <text x="0" y="-26" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">ATTACKER</text>
        {active && (
          <>
            <text x="-22" y="-14" fill="#F97316" fontSize="5.5" fontFamily="Space Mono, monospace">SRC SPOOFED</text>
            <text x="-22" y="-4" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">→ 10.0.0.2</text>
            <text x="-22" y="6" fill="#F97316" fontSize="5" fontFamily="Space Mono, monospace">SML REQ ×4</text>
            <circle r="38" fill="none" stroke="#F97316" strokeWidth="0.6" opacity="0.3" className="svg-pulse-ring" />
          </>
        )}
        <text y="40" textAnchor="middle" fill="#F97316" fontSize="8" fontFamily="Space Mono, monospace">spoofed src</text>
      </g>

      {/* ── SMALL REQUEST LINES to reflectors ── */}
      {active && REFLECTORS.slice(0, visibleReflectors).map((r, i) => (
        <g key={i}>
          <line x1="130" y1="120" x2={r.x - 20} y2={r.y}
            stroke="#F97316" strokeWidth="1.5" strokeDasharray="4 3"
            className="svg-flow-path-animated" />
          {/* Tiny request packet */}
          <g transform={`translate(${230},${(120 + r.y) / 2 - 10})`}>
            <rect x="-18" y="-7" width="36" height="14" rx="2" fill="#060A06" stroke="#F97316" strokeWidth="0.7" />
            <text x="0" y="-0.5" textAnchor="middle" fill="#F97316" fontSize="5.5" fontWeight="700" fontFamily="Space Mono, monospace">SMALL REQ</text>
            <text x="0" y="6.5" textAnchor="middle" fill="#7C8785" fontSize="4.5" fontFamily="Space Mono, monospace">72B</text>
          </g>
        </g>
      ))}

      {/* ── REFLECTOR NODES ── */}
      {REFLECTORS.map((r, i) => {
        const visible = i < visibleReflectors;
        return (
          <g key={i}>
            <ReflectorNode x={r.x} y={r.y} active={visible} label={r.label} />
            {/* Amplified response lines (THICK) */}
            {visible && (
              <>
                <line x1={r.x + 20} y1={r.y} x2={600} y2={120}
                  stroke="#EF4444" strokeWidth={4 + i * 2} strokeDasharray="6 3"
                  className="svg-flow-path-animated" opacity="0.8" />
                {/* Big response packet */}
                <g transform={`translate(${510},${r.y - 16})`}>
                  <rect x="-26" y="-9" width="52" height="18" rx="2" fill="#060810" stroke="#EF4444" strokeWidth="0.8" />
                  <text x="0" y="-1" textAnchor="middle" fill="#EF4444" fontSize="6" fontWeight="700" fontFamily="Space Mono, monospace">AMP RSP</text>
                  <text x="0" y="7" textAnchor="middle" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">{r.proto}</text>
                </g>
              </>
            )}
          </g>
        );
      })}

      {/* ── VICTIM HOST (center-right) ── */}
      <g transform="translate(640,120)">
        <rect x="-28" y="-36" width="56" height="72" rx="4"
          fill="#060F0B"
          stroke={decided && hasAlert ? "#EF4444" : observing ? "#30B894" : "#1B2B26"} strokeWidth="1.5"
          filter={decided && hasAlert ? "url(#glow-red)" : "none"} />
        {/* Server rack */}
        {[0, 1, 2, 3].map(i => (
          <rect key={i} x="-22" y={-30 + i * 14} width="44" height="10" rx="2"
            fill={observing ? "rgba(239,68,68,0.1)" : "#0A1E19"} stroke="#143028" strokeWidth="0.8" />
        ))}
        {/* LEDs — flashing red when victim */}
        {[0, 1, 2, 3].map(i => (
          <circle key={i} cx="16" cy={-26 + i * 14} r="2"
            fill={observing ? "#EF4444" : "#1B2B26"} />
        ))}
        <text y="-46" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">VICTIM</text>
        <text y="-36" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">10.0.0.2</text>
        {observing && (
          <text y="50" textAnchor="middle" fill="#EF4444" fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
            ⚠ FLOOD
          </text>
        )}
      </g>

      {/* ── AMPLIFICATION FACTOR BADGE ── */}
      {active && (
        <g transform="translate(640,60)">
          <rect x="-50" y="-16" width="100" height="30" rx="5" fill="#0A0612" stroke="#EF4444" strokeWidth="1.5" />
          <text x="0" y="-4" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">AMP FACTOR</text>
          <text x="0" y="10" textAnchor="middle" fill="#EF4444" fontSize="13" fontWeight="800" fontFamily="Space Mono, monospace">
            {`×${Math.min(visibleReflectors * 50 + 14, 556)}`}
          </text>
        </g>
      )}

      {/* ── PPS METER ── */}
      {observing && (
        <g transform="translate(640,200)">
          <rect x="-50" y="-12" width="100" height="22" rx="3" fill="#0A0612" stroke="#EF4444" strokeWidth="1" />
          <text x="0" y="-2" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">INBOUND RATE</text>
          <text x="0" y="8" textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">
            {ppsDisplay}
          </text>
        </g>
      )}

      {/* Sensor path */}
      <line x1="670" y1="120" x2="780" y2="135"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />

      {/* Sensor */}
      <OrionSensorNode x={830} y={140} active={observing} alert={decided && hasAlert} />

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="630" y="188" width="235" height="30" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="747" y="207" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ UDP AMP DETECTED</text>
        </g>
      )}

      {/* Pipeline */}
      <g transform="translate(480,238)">
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
