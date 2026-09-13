/**
 * ExfiltrationVisualization.tsx
 * Visual: Data Exfiltration — internal database draining to external sink.
 * Progressive data transfer showing growing stream & volume metrics.
 */
import { SharedDefs, OrionSensorNode, DatabaseNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
  outboundBytes: number;
  outboundRatio: number;
}

export function ExfiltrationVisualization({ step, hasAlert, outboundBytes, outboundRatio }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const extracting = ["extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  // Pipe thickness grows with attack stage
  const pipeThickness = step === "attack" ? 4
    : step === "observe" ? 8
    : step === "extract" ? 14
    : step === "evaluate" ? 18
    : active ? 24 : 2;

  // Drain level reduces over time
  const drainLevel = step === "attack" ? 0.85
    : step === "observe" ? 0.65
    : step === "extract" ? 0.45
    : step === "evaluate" ? 0.28
    : active ? 0.12 : 1.0;

  // Display values
  const bytesDisplay = outboundBytes > 0
    ? `${(outboundBytes / 1024).toFixed(1)} KB`
    : step === "attack" ? "12.4 KB"
    : step === "observe" ? "148 KB"
    : step === "extract" ? "1.2 MB"
    : step === "evaluate" ? "8.4 MB"
    : active ? "42.7 MB" : "0 B";

  const ratioDisplay = outboundRatio > 0 ? outboundRatio.toFixed(2)
    : step === "attack" ? "2.1"
    : step === "observe" ? "6.8"
    : step === "extract" ? "18.4"
    : active ? "47.2" : "1.0";

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── INTERNAL DATABASE (left) ── */}
      <DatabaseNode x={140} y={110} active={active} draining={active} label="INTERNAL DB" />
      <text x="140" y="166" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">10.0.0.50</text>

      {/* ── DATA FLOW PIPE (grows thicker) ── */}
      {active && (
        <>
          {/* Base ghost pipe */}
          <line x1="165" y1="110" x2="550" y2="110"
            stroke="#060C18" strokeWidth={pipeThickness + 4} strokeLinecap="round" />
          {/* Animated data flow */}
          <line x1="165" y1="110" x2="550" y2="110"
            stroke="url(#grad-data)" strokeWidth={pipeThickness} strokeLinecap="round"
            strokeDasharray="12 6" className="svg-flow-path-animated" />
          {/* Pipe label */}
          <text x="358" y="94" textAnchor="middle" fill="#60A5FA" fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
            {`DATA PIPE — ${bytesDisplay}`}
          </text>
        </>
      )}

      {/* Data packet cards along pipe */}
      {active && [230, 310, 400, 480].slice(0, Math.min(Math.floor(pipeThickness / 5) + 1, 4)).map((xPos, i) => (
        <g key={xPos} transform={`translate(${xPos},${110 - pipeThickness / 2 - 16})`}>
          <rect x="-22" y="-9" width="44" height="18" rx="3" fill="#060C18" stroke="#3B82F6" strokeWidth="0.8" />
          <text x="0" y="-1" textAnchor="middle" fill="#3B82F6" fontSize="5.5" fontWeight="700" fontFamily="Space Mono, monospace">DATA BLOCK</text>
          <text x="0" y="7" textAnchor="middle" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">
            {`${(i + 1) * 4096} B`}
          </text>
        </g>
      ))}

      {/* ── EXTERNAL SINK (right) ── */}
      <g transform="translate(590,110)">
        <rect x="-26" y="-32" width="52" height="64" rx="4"
          fill="#060C18"
          stroke={decided && hasAlert ? "#EF4444" : active ? "#3B82F6" : "#1B2B26"} strokeWidth="1.5" />
        {/* Fill level — grows as data arrives */}
        <rect x="-22" y={-28 + 56 * (1 - drainLevel)} width="44" height={56 * drainLevel} rx="2"
          fill={decided && hasAlert ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"} />
        {/* Strip lines */}
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1="-22" y1={-12 + i * 12} x2="22" y2={-12 + i * 12}
            stroke={active ? "rgba(59,130,246,0.3)" : "#0D1828"} strokeWidth="0.8" />
        ))}
        <circle cx="16" cy="-22" r="2" fill={active ? (decided && hasAlert ? "#EF4444" : "#3B82F6") : "#1B2B26"} />
        <text y="46" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">EXT. SINK</text>
        <text y="58" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">203.0.113.88</text>
        {active && (
          <text y="70" textAnchor="middle" fill="#3B82F6" fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
            {`+${bytesDisplay}`}
          </text>
        )}
      </g>

      {/* ── VOLUME METRICS PANEL ── */}
      {extracting && (
        <g transform="translate(740,80)">
          <rect x="-60" y="-40" width="120" height="80" rx="5" fill="#060F0B" stroke="#3B82F6" strokeWidth="1" />
          <text x="0" y="-28" textAnchor="middle" fill="#60A5FA" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">VOLUME ANALYSIS</text>
          {[
            { label: "OUTBOUND", val: bytesDisplay, hi: true },
            { label: "OUT/IN RATIO", val: `×${ratioDisplay}`, hi: Number(ratioDisplay) >= 10 },
          ].map((f, i) => (
            <g key={i} transform={`translate(0,${-10 + i * 24})`}>
              <rect x="-54" y="-9" width="108" height="18" rx="2"
                fill={f.hi ? "rgba(239,68,68,0.08)" : "#0A120F"}
                stroke={f.hi ? "#EF4444" : "#1B2B26"} strokeWidth="0.7" />
              <text x="-48" y="3" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">{f.label}</text>
              <text x="16" y="3" fill={f.hi ? "#EF4444" : "#3B82F6"} fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">{f.val}</text>
            </g>
          ))}
        </g>
      )}

      {/* Sensor line */}
      <line x1="618" y1="110" x2="760" y2="150"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />

      {/* Sensor */}
      <OrionSensorNode x={810} y={165} active={observing} alert={decided && hasAlert} />

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="350" y="192" width="250" height="30" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="475" y="211" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ EXFILTRATION DETECTED</text>
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
