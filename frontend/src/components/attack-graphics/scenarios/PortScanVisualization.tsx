/**
 * PortScanVisualization.tsx
 * Visual: Systematic reconnaissance — sequential port probe fan-out.
 * Scanner emits probes to labeled ports on target; ORION-Z builds a port map.
 */
import { SharedDefs, AttackerNode, OrionSensorNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const PORTS = [
  { port: 22, name: "SSH", y: 40 },
  { port: 53, name: "DNS", y: 70 },
  { port: 80, name: "HTTP", y: 100 },
  { port: 443, name: "HTTPS", y: 130 },
  { port: 3389, name: "RDP", y: 160 },
  { port: 8080, name: "HTTP-ALT", y: 190 },
];

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
  uniquePorts: number;
}

export function PortScanVisualization({ step, hasAlert, uniquePorts }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  // Progressively reveal scanned ports
  const scannedCount = step === "attack" ? 2
    : step === "observe" ? 3
    : step === "extract" ? 4
    : step === "evaluate" ? 5
    : active ? 6 : 0;

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* SCANNER */}
      <AttackerNode x={100} y={115} active={active} alert={decided && hasAlert} label="SCANNER" sublabel="192.168.1.88" />

      {/* Fan-out probe lines + probe packets */}
      {PORTS.map((p, i) => {
        const scanned = i < scannedCount;
        return (
          <g key={p.port}>
            {/* Fan line */}
            <line x1="130" y1="115" x2="330" y2={p.y}
              stroke={scanned ? "#EF4444" : "#0D1F18"} strokeWidth={scanned ? "1.5" : "1"}
              strokeDasharray={scanned ? "5 4" : "2 6"}
              className={scanned && active ? "svg-flow-path-animated" : ""} />
            {/* Probe packet mid-line */}
            {scanned && (
              <g transform={`translate(${230},${p.y - 5})`} opacity="0.9">
                <rect x="-26" y="-8" width="52" height="16" rx="3" fill="#060806" stroke="#EF4444" strokeWidth="0.8" />
                <text x="-20" y="-1" fill="#EF4444" fontSize="6" fontWeight="800" fontFamily="Space Mono, monospace">TCP SYN</text>
                <text x="-20" y="7" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">{`→ :${p.port}`}</text>
              </g>
            )}
          </g>
        );
      })}

      {/* TARGET with port panel */}
      <g transform="translate(340,115)">
        {/* Server body */}
        <rect x="-24" y="-80" width="48" height="160" rx="4"
          fill="#061310" stroke={decided && hasAlert ? "#EF4444" : observing ? "#30B894" : "#1B2B26"} strokeWidth="1.5" />
        <text y="-92" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">TARGET</text>
        <text y="-82" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">(10.0.0.0/24)</text>

        {/* Port slots */}
        {PORTS.map((p, i) => {
          const scanned = i < scannedCount;
          return (
            <g key={p.port} transform={`translate(0,${p.y - 115})`}>
              <rect x="-20" y="-7" width="40" height="14" rx="3"
                fill={scanned ? "rgba(239,68,68,0.12)" : "#0A1610"}
                stroke={scanned ? "#EF4444" : "#1B2B26"} strokeWidth="0.8" />
              <text x="0" y="4" textAnchor="middle" fill={scanned ? "#EF4444" : "#4A6055"}
                fontSize="6.5" fontWeight="700" fontFamily="Space Mono, monospace">
                {`:${p.port} ${p.name}`}
              </text>
            </g>
          );
        })}
      </g>

      {/* ORION port map display */}
      <g transform="translate(550,115)">
        <rect x="-70" y="-90" width="140" height="180" rx="6" fill="#060F0B" stroke={observing ? "#00D084" : "#1B2B26"} strokeWidth="1.5" />
        <text x="0" y="-78" textAnchor="middle" fill="#00D084" fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">ORION-Z PORT MAP</text>
        {PORTS.map((p, i) => {
          const seen = i < scannedCount;
          return (
            <g key={p.port} transform={`translate(0,${-65 + i * 24})`}>
              <rect x="-58" y="-9" width="116" height="18" rx="2"
                fill={seen ? "rgba(239,68,68,0.08)" : "#0A120F"}
                stroke={seen ? "#EF4444" : "#12201A"} strokeWidth="0.7" />
              <text x="-50" y="4" fill={seen ? "#EF4444" : "#1B2B26"}
                fontSize="7" fontFamily="Space Mono, monospace">
                {`:${p.port} ${p.name}`}
              </text>
              {seen && <text x="44" y="4" fill="#30B894" fontSize="7" fontFamily="Space Mono, monospace">PROBE</text>}
            </g>
          );
        })}
      </g>

      {/* Sensor path */}
      <line x1="360" y1="115" x2="700" y2="130" stroke={observing ? "#00D084" : "#0D1F18"}
        strokeWidth="1.5" strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />
      <text x="530" y="121" textAnchor="middle" fill={observing ? "#30B894" : "#1B2B26"}
        fontSize="7" fontFamily="Space Mono, monospace">PASSIVE TAP</text>

      {/* Unique port count bubble */}
      {observing && (
        <g transform="translate(700,75)">
          <rect x="-50" y="-14" width="100" height="26" rx="4" fill="#0A1610" stroke="#1B3028" strokeWidth="1" />
          <text x="0" y="-3" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">UNIQUE PORTS</text>
          <text x="0" y="9" textAnchor="middle" fill={scannedCount >= 4 ? "#EF4444" : "#00D084"}
            fontSize="12" fontWeight="800" fontFamily="Space Mono, monospace">
            {uniquePorts > 0 ? uniquePorts : scannedCount}
          </text>
        </g>
      )}

      {/* Orion sensor */}
      <OrionSensorNode x={790} y={130} active={observing} alert={decided && hasAlert} />

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="640" y="185" width="200" height="32" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="740" y="204" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ RECON DETECTED</text>
        </g>
      )}

      {/* Pipeline */}
      <g transform="translate(480,240)">
        {[
          { label: "1.FLOW INGEST", done: observing },
          { label: "2.FEATURE EXTRACT", done: ["extract","evaluate","enrich","decision","complete"].includes(step) },
          { label: "3.RULE EVAL", done: ["evaluate","enrich","decision","complete"].includes(step) },
          { label: "4.ML ENRICH", done: ["enrich","decision","complete"].includes(step) },
          { label: "5.DECISION", done: decided },
        ].map((s, i, arr) => {
          const W = 128; const GAP = 14;
          const total = arr.length;
          const totalW = total * W + (total - 1) * GAP;
          const startX = -totalW / 2;
          return (
            <g key={i} transform={`translate(${startX + i * (W + GAP)},0)`}>
              <rect x="0" y="-9" width={W} height="18" rx="4"
                fill={s.done ? "#0A251E" : "#0A120F"}
                stroke={s.done ? "#00D084" : "#1B2B26"} strokeWidth="1" />
              <text x={W / 2} y="3" textAnchor="middle" fill={s.done ? "#F4F7F5" : "#4A6055"}
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

      {step === "ready" && (
        <text x="480" y="130" textAnchor="middle" fill="#4A6055" fontSize="13" fontWeight="700" fontFamily="Space Mono, monospace">
          DORMANT · SELECT SCENARIO &amp; PRESS START REPLAY
        </text>
      )}
    </svg>
  );
}
