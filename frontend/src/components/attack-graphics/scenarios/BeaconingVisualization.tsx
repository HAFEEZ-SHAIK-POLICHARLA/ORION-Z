/**
 * BeaconingVisualization.tsx
 * Visual: Botnet C2 Beaconing — deliberate, clock-like periodic heartbeat.
 * Shows timeline bars, beacon pulses, periodicity analysis.
 * Intentionally calm / precise — NOT a flood.
 */
import { SharedDefs, OrionSensorNode, C2ServerNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const BEACON_TIMES = [0, 5, 10, 15, 20, 25]; // seconds

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
}

export function BeaconingVisualization({ step, hasAlert }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const extracting = ["extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  // Progressively show beacon events
  const visibleBeacons = step === "attack" ? 2
    : step === "observe" ? 3
    : step === "extract" ? 4
    : active ? 6 : 0;

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── INFECTED HOST (left) ── */}
      <g transform="translate(120,110)">
        <rect x="-32" y="-40" width="64" height="80" rx="4" fill="#0A060E" stroke={active ? "#EF4444" : "#2A1020"} strokeWidth="1.5" />
        <rect x="-26" y="-34" width="52" height="52" rx="2" fill="#0D1020" stroke="#1E1530" strokeWidth="0.8" />
        {active && (
          <>
            <text x="-20" y="-22" fill="#EF4444" fontSize="6" fontFamily="Space Mono, monospace">BEACON PROC</text>
            <text x="-20" y="-12" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">PID: 4832</text>
            <rect x="-20" y="-5" width="36" height="5" rx="1" fill="#400020" />
            <rect x="-20" y="-5" width={`${12 + visibleBeacons * 2}`} height="5" rx="1" fill="#EF4444" />
            <text x="-20" y="8" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">NEXT BEACON</text>
            <text x="-20" y="18" fill="#F59E0B" fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">
              {`T+${(5 - (visibleBeacons % 5))}s`}
            </text>
          </>
        )}
        <circle cx="20" cy="-28" r="2" fill={active ? "#EF4444" : "#2A1020"} />
        <text y="52" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">INFECTED HOST</text>
        <text y="64" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">10.0.0.31</text>
      </g>

      {/* ── BEACON PULSES (bi-directional periodic) ── */}
      {active && Array.from({ length: visibleBeacons }).map((_, i) => {
        const xPos = 200 + i * 50;
        const isReturn = i % 2 === 1;
        return (
          <g key={i}>
            {/* Bidirectional dotted line */}
            <line x1="155" y1={110 - (isReturn ? 10 : 0)} x2="440" y2={110 - (isReturn ? 10 : 0)}
              stroke={isReturn ? "#30B894" : "#EF4444"} strokeWidth="1.2"
              strokeDasharray="4 4" className={i === visibleBeacons - 1 ? "svg-flow-path-animated" : ""} opacity="0.7" />
            {/* Beacon check-in label at midpoint */}
            <g transform={`translate(${xPos}, ${110 - (isReturn ? 22 : -18)})`}>
              <rect x="-22" y="-9" width="44" height="18" rx="3" fill="#050E12" stroke={isReturn ? "#30B894" : "#EF4444"} strokeWidth="0.8" />
              <text x="0" y="-1" textAnchor="middle" fill={isReturn ? "#30B894" : "#EF4444"} fontSize="5.5" fontWeight="700" fontFamily="Space Mono, monospace">
                {isReturn ? "C2 RSP" : "CHECK-IN"}
              </text>
              <text x="0" y="7" textAnchor="middle" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">
                {`T+${BEACON_TIMES[Math.min(i, BEACON_TIMES.length - 1)]}s`}
              </text>
            </g>
          </g>
        );
      })}

      {/* ── C2 SERVER (center-right) ── */}
      <C2ServerNode x={500} y={110} active={active} label="C2 SERVER" />
      <text x="500" y="152" textAnchor="middle" fill="#9C4040" fontSize="7" fontFamily="Space Mono, monospace">198.51.100.44</text>

      {/* ── TIMELINE / ECG BAR ── */}
      <g transform="translate(280,175)">
        <rect x="-130" y="-14" width="260" height="28" rx="4" fill="#070D0A" stroke="#1B2B26" strokeWidth="1" />
        <text x="-122" y="-4" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">BEACON TIMELINE</text>
        {/* Timeline tick marks */}
        {BEACON_TIMES.map((t, i) => {
          const xOff = -120 + i * 40;
          const hit = i < visibleBeacons;
          return (
            <g key={t} transform={`translate(${xOff}, 0)`}>
              <line x1="0" y1="-2" x2="0" y2="10" stroke={hit ? "#EF4444" : "#1B2B26"} strokeWidth={hit ? "2" : "1"} />
              <text x="0" y="18" textAnchor="middle" fill={hit ? "#EF4444" : "#1B2B26"} fontSize="6" fontFamily="Space Mono, monospace">
                {`${t}s`}
              </text>
              {hit && <circle cy="-4" r="3" fill="#EF4444" />}
            </g>
          );
        })}
      </g>

      {/* ── PERIODICITY ANALYSIS PANEL ── */}
      {extracting && (
        <g transform="translate(600,120)">
          <rect x="-60" y="-40" width="120" height="80" rx="5" fill="#060F0B" stroke="#00D084" strokeWidth="1" />
          <text x="0" y="-28" textAnchor="middle" fill="#00D084" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">PERIODICITY</text>
          {[
            { label: "INTERVAL (AVG)", val: "5.01s", hi: false },
            { label: "PERIOD SCORE", val: "0.912", hi: true },
            { label: "BEACON EVENTS", val: `${visibleBeacons}`, hi: visibleBeacons >= 5 },
          ].map((f, i) => (
            <g key={i} transform={`translate(0,${-12 + i * 22})`}>
              <rect x="-54" y="-8" width="108" height="16" rx="2"
                fill={f.hi ? "rgba(239,68,68,0.08)" : "#0A120F"}
                stroke={f.hi ? "#EF4444" : "#1B2B26"} strokeWidth="0.7" />
              <text x="-48" y="3" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">{f.label}</text>
              <text x="24" y="3" fill={f.hi ? "#EF4444" : "#00D084"} fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">{f.val}</text>
            </g>
          ))}
        </g>
      )}

      {/* Sensor line */}
      <line x1="525" y1="110" x2="700" y2="130"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />

      {/* ── ORION SENSOR ── */}
      <OrionSensorNode x={760} y={130} active={observing} alert={decided && hasAlert} />

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="615" y="186" width="220" height="30" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="725" y="205" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ C2 BEACON DETECTED</text>
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
