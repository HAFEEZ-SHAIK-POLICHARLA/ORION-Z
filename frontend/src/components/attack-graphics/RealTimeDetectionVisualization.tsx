/**
 * RealTimeDetectionVisualization.tsx
 * Visual: ORION-Z Real-Time Radar Sensor & Telemetry Survey Interface.
 * Coded SVG radar sweep, concentric scan rings, network nodes, and 3-second reconnaissance phase.
 */
import { SharedDefs, OrionSensorNode, ServerNode, AttackerNode } from "./NetworkPrimitives";

interface Props {
  step: "ready" | "scan_1" | "scan_2" | "scan_3" | "scan_4" | "scan_5" | "transitioning";
  phaseText?: string;
  identifiedThreat?: string;
}

export function RealTimeDetectionVisualization({ step, phaseText, identifiedThreat }: Props) {
  const isScanning =
    step === "scan_1" ||
    step === "scan_2" ||
    step === "scan_3" ||
    step === "scan_4" ||
    step === "scan_5" ||
    step === "transitioning";

  // Scan status label
  const labelText =
    phaseText ||
    (step === "ready"
      ? "ORION-Z LIVE SENSOR · SYSTEM READY · WAITING FOR TRAFFIC"
      : step === "scan_1"
      ? "0–1s · NETWORK SCAN & FLOW OBSERVATION ACTIVE"
      : step === "scan_2"
      ? "1–2s · BEHAVIORAL ANALYSIS IN PROGRESS"
      : step === "scan_3"
      ? "2–3s · MULTIPLE FLOW WINDOWS CHECKED"
      : step === "scan_4"
      ? "3–4s · SIGNATURE & BEHAVIOR ANALYSIS IN PROGRESS"
      : step === "scan_5"
      ? "4–5s · THREAT CLASSIFICATION IN PROGRESS"
      : `THREAT CLASS IDENTIFIED: ${identifiedThreat?.toUpperCase() || "ANALYZING"}`);

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      {/* Background grid */}
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* RADAR SWEEP GRADIENT DEFINITION */}
      <defs>
        <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D084" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#30B894" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00D084" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── LEFT PANEL: NETWORK TOPOLOGY NODES ── */}
      <g transform="translate(130, 130)">
        <ServerNode x={-50} y={-45} active={isScanning} label="GATEWAY" sublabel="10.0.0.1" />
        <ServerNode x={-50} y={45} active={isScanning} label="ENDPOINT" sublabel="10.0.0.14" />
        <AttackerNode x={45} y={0} active={isScanning} label="EXT PEER" sublabel="198.51.100.2" />
        {/* Connecting ray lines to central radar */}
        <line x1="-50" y1="-45" x2="140" y2="0" stroke={isScanning ? "#00D084" : "#1B2B26"} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="-50" y1="45" x2="140" y2="0" stroke={isScanning ? "#00D084" : "#1B2B26"} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="45" y1="0" x2="140" y2="0" stroke={isScanning ? "#00D084" : "#1B2B26"} strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* ── CENTER: CONCENTRIC RADAR HUD ── */}
      <g transform="translate(480, 125)">
        {/* Outer compass ring */}
        <circle r="105" fill="none" stroke="#142C24" strokeWidth="1.5" />
        <circle r="75" fill="none" stroke="#1B3B31" strokeWidth="1" strokeDasharray="4 4" />
        <circle r="45" fill="none" stroke="#224E41" strokeWidth="1" />
        <circle r="18" fill="none" stroke="#00D084" strokeWidth="1.5" />

        {/* Crosshair axes */}
        <line x1="-115" y1="0" x2="115" y2="0" stroke="#1B3B31" strokeWidth="0.8" strokeDasharray="2 4" />
        <line x1="0" y1="-115" x2="0" y2="115" stroke="#1B3B31" strokeWidth="0.8" strokeDasharray="2 4" />

        {/* Degree markers */}
        {["0° N", "90° E", "180° S", "270° W"].map((deg, i) => {
          const angles = [0, 90, 180, 270];
          const rad = (angles[i] * Math.PI) / 180;
          const x = 118 * Math.sin(rad);
          const y = -118 * Math.cos(rad);
          return (
            <text key={deg} x={x} y={y + 3} textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">
              {deg}
            </text>
          );
        })}

        {/* ROTATING RADAR SWEEP WEDGE */}
        <g className={isScanning ? "svg-spin-slow" : ""}>
          <path d="M 0 0 L 0 -105 A 105 105 0 0 1 105 0 Z" fill="url(#radarSweepGrad)" />
          <line x1="0" y1="0" x2="0" y2="-105" stroke="#00D084" strokeWidth="2" opacity="0.9" />
        </g>

        {/* Radar blips / detected targets */}
        {isScanning && (
          <>
            <g transform="translate(32, -50)">
              <circle r="4" fill="#EF4444" className="svg-pulse-ring" />
              <circle r="2" fill="#EF4444" />
              <text x="8" y="3" fill="#EF4444" fontSize="6.5" fontWeight="700" fontFamily="Space Mono, monospace">
                TARGET-A
              </text>
            </g>
            <g transform="translate(-48, 30)">
              <circle r="3" fill="#30B894" />
              <text x="-32" y="3" fill="#30B894" fontSize="6" fontFamily="Space Mono, monospace">
                FLOW-842
              </text>
            </g>
          </>
        )}

        {/* Central Core Dot */}
        <circle r="5" fill="#00D084" />
      </g>

      {/* ── RIGHT PANEL: ORION-Z RADAR SENSOR ── */}
      <OrionSensorNode x={810} y={125} active={isScanning} alert={step === "transitioning"} />

      {/* Connecting tap line */}
      <line
        x1="585"
        y1="125"
        x2="774"
        y2="125"
        stroke={isScanning ? "#00D084" : "#1B2B26"}
        strokeWidth="1.5"
        strokeDasharray={isScanning ? "6 4" : "2 6"}
        className={isScanning ? "svg-sensor-path-animated" : ""}
      />

      {/* ── TOP HUD HEADER STATUS ── */}
      <g transform="translate(480, 24)">
        <rect x="-240" y="-12" width="480" height="24" rx="12" fill="#071511" stroke={isScanning ? "#00D084" : "#1B2B26"} strokeWidth="1" />
        <circle cx="-220" cy="0" r="4" fill={isScanning ? "#00D084" : "#7C8785"} className={isScanning ? "svg-pulse-ring" : ""} />
        <text x="0" y="3" textAnchor="middle" fill={isScanning ? "#00D084" : "#7C8785"} fontSize="8.5" fontWeight="700" fontFamily="Space Mono, monospace">
          {labelText}
        </text>
      </g>

      {/* ── TRANSITION OVERLAY ── */}
      {step === "transitioning" && (
        <g transform="translate(480, 220)">
          <rect x="-200" y="-14" width="400" height="28" rx="6" fill="rgba(0, 208, 132, 0.15)" stroke="#00D084" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#00D084" fontSize="10" fontWeight="800" fontFamily="Space Mono, monospace">
            THREAT CLASS ISOLATED ▸ LOADING {identifiedThreat?.toUpperCase()} VISUALIZATION
          </text>
        </g>
      )}

      {/* ── BOTTOM STAGE PIPELINE (5 STAGES) ── */}
      {step !== "transitioning" && (
        <g transform="translate(480, 240)">
          {[
            { label: "1. FLOW SCAN", done: isScanning },
            { label: "2. BEHAVIOR ANALYSIS", done: ["scan_2", "scan_3", "scan_4", "scan_5"].includes(step) },
            { label: "3. WINDOWS CHECKED", done: ["scan_3", "scan_4", "scan_5"].includes(step) },
            { label: "4. SIGNATURE MATCH", done: ["scan_4", "scan_5"].includes(step) },
            { label: "5. THREAT CLASSIFIED", done: step === "scan_5" },
          ].map((s, i, arr) => {
            const W = 115;
            const GAP = 8;
            const total = arr.length;
            const totalW = total * W + (total - 1) * GAP;
            const startX = -totalW / 2;
            return (
              <g key={i} transform={`translate(${startX + i * (W + GAP)},0)`}>
                <rect x="0" y="-9" width={W} height="18" rx="4" fill={s.done ? "#0A251E" : "#0A120F"} stroke={s.done ? "#00D084" : "#1B2B26"} strokeWidth="1" />
                <text x={W / 2} y="3" textAnchor="middle" fill={s.done ? "#F4F7F5" : "#4A6055"} fontSize="6.5" fontWeight="700" fontFamily="Space Mono, monospace">
                  {s.done ? `${s.label} ✓` : s.label}
                </text>
                {i < arr.length - 1 && (
                  <text x={W + GAP / 2} y="4" textAnchor="middle" fill={s.done ? "#30B894" : "#1B2B26"} fontSize="9" fontFamily="Space Mono, monospace">
                    →
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
