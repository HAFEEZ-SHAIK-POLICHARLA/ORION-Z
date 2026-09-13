/**
 * AnomalyDetectionVisualization.tsx
 * Visual: ORION-Z Behavioral Anomaly Detection & Isolation Forest Model Interface.
 * Displays baseline statistical distributions, feature vectors, deviation scores, and non-signature anomaly result.
 */
import { SharedDefs, OrionSensorNode, DatabaseNode } from "./NetworkPrimitives";

interface Props {
  step:
    | "ready"
    | "scan_1"
    | "scan_2"
    | "scan_3"
    | "scan_4"
    | "scan_5"
    | "anomaly_scan_1"
    | "anomaly_scan_2"
    | "anomaly_scan_3"
    | "anomaly_scan_4"
    | "anomaly_scan_5"
    | "anomaly_complete";
  anomalyScore?: number;
}

export function AnomalyDetectionVisualization({ step, anomalyScore = -0.418 }: Props) {
  const isScanning =
    step === "scan_1" ||
    step === "scan_2" ||
    step === "scan_3" ||
    step === "scan_4" ||
    step === "scan_5" ||
    step === "anomaly_scan_1" ||
    step === "anomaly_scan_2" ||
    step === "anomaly_scan_3" ||
    step === "anomaly_scan_4" ||
    step === "anomaly_scan_5";
  const isComplete = step === "anomaly_complete";
  const isActive = isScanning || isComplete;

  // Status header text
  const labelText =
    step === "ready"
      ? "ORION-Z ANOMALY SENSOR · BEHAVIORAL BASELINE · SYSTEM READY"
      : step === "scan_1" || step === "anomaly_scan_1"
      ? "0–1s · NORMAL BEHAVIORAL BASELINE MONITORING"
      : step === "scan_2" || step === "anomaly_scan_2"
      ? "1–2s · BEHAVIORAL DEVIATION DETECTED IN FEATURE VECTOR"
      : step === "scan_3" || step === "anomaly_scan_3"
      ? "2–3s · UNUSUAL PATTERN SCORING (ISOLATION FOREST)"
      : step === "scan_4" || step === "anomaly_scan_4"
      ? "3–4s · NO KNOWN THREAT SIGNATURE MATCHED"
      : step === "scan_5" || step === "anomaly_scan_5"
      ? "4–5s · ANOMALY CONFIDENCE & FINAL ANALYSIS"
      : "SEQUENCE COMPLETE · UNKNOWN ANOMALY ISOLATED (NOVEL THREAT)";

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── LEFT PANEL: BEHAVIORAL GAUSSIAN / BASELINE DISTRIBUTION GRAPH ── */}
      <g transform="translate(130, 125)">
        <rect x="-85" y="-75" width="170" height="150" rx="6" fill="#060F0B" stroke={isComplete ? "#F59E0B" : isActive ? "#00D084" : "#1B2B26"} strokeWidth="1.5" />
        <text x="0" y="-62" textAnchor="middle" fill="#00D084" fontSize="8" fontWeight="800" fontFamily="Space Mono, monospace">
          BEHAVIORAL DISTRIBUTION
        </text>
        <text x="0" y="-52" textAnchor="middle" fill="#7C8785" fontSize="6.5" fontFamily="Space Mono, monospace">
          15-DIM FEATURE SPACE
        </text>

        {/* Gaussian curve path */}
        <path
          d="M -70 45 C -40 45, -20 -30, 0 -30 C 20 -30, 40 45, 70 45"
          fill="none"
          stroke="#1B3B31"
          strokeWidth="2"
        />
        {/* Shaded benign baseline region */}
        <path
          d="M -40 45 C -25 45, -15 -25, 0 -25 C 15 -25, 25 45, 40 45 Z"
          fill="rgba(0, 208, 132, 0.12)"
        />

        {/* ANOMALOUS DEVIATION POINT */}
        {isActive && (
          <g transform={`translate(${step === "scan_1" || step === "anomaly_scan_1" ? 10 : 55}, ${step === "scan_1" || step === "anomaly_scan_1" ? -20 : 25})`}>
            <circle r="6" fill={isComplete || step === "scan_4" || step === "scan_5" || step === "anomaly_scan_4" || step === "anomaly_scan_5" ? "#F59E0B" : "#00D084"} className="svg-pulse-ring" />
            <circle r="3" fill={isComplete || step === "scan_4" || step === "scan_5" || step === "anomaly_scan_4" || step === "anomaly_scan_5" ? "#F59E0B" : "#00D084"} />
            <line x1="0" y1="0" x2="-25" y2="-20" stroke={isComplete ? "#F59E0B" : "#00D084"} strokeWidth="0.8" />
            <rect x="-65" y="-32" width="55" height="14" rx="2" fill="#071511" stroke={isComplete ? "#F59E0B" : "#00D084"} strokeWidth="0.7" />
            <text x="-37" y="-23" textAnchor="middle" fill={isComplete ? "#F59E0B" : "#00D084"} fontSize="5.5" fontWeight="700" fontFamily="Space Mono, monospace">
              {isComplete ? "DEVIATION !" : "SAMPLE"}
            </text>
          </g>
        )}

        <text x="0" y="62" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">
          BENIGN BASELINE REGION
        </text>
      </g>

      {/* ── CENTER PANEL: ISOLATION FOREST ANOMALY SCORER ── */}
      <g transform="translate(480, 125)">
        <rect x="-140" y="-75" width="280" height="150" rx="6" fill="#060E0B" stroke={isComplete ? "#F59E0B" : "#142820"} strokeWidth="1.5" />
        <text x="0" y="-60" textAnchor="middle" fill="#F4F7F5" fontSize="9" fontWeight="800" fontFamily="Space Mono, monospace">
          ISOLATION FOREST ENGINE
        </text>
        <text x="0" y="-48" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">
          MODEL: isolation_detector.joblib (40 TREES)
        </text>

        {/* Feature vector preview rows */}
        {[
          { name: "packet_size_dispersion", val: isComplete ? "148.2" : "12.4", alert: isComplete },
          { name: "syn_incomplete_ratio", val: isComplete ? "0.640" : "0.020", alert: isComplete },
          { name: "periodicity_variance", val: isComplete ? "0.412" : "0.010", alert: isComplete },
          { name: "payload_asymmetry", val: isComplete ? "8.42" : "1.02", alert: isComplete },
        ].map((f, i) => (
          <g key={f.name} transform={`translate(0, ${-30 + i * 22})`}>
            <rect x="-125" y="-8" width="250" height="17" rx="3" fill={f.alert && isActive ? "rgba(245, 158, 11, 0.1)" : "#0A1813"} stroke={f.alert && isActive ? "#F59E0B" : "#12261E"} strokeWidth="0.8" />
            <text x="-115" y="4" fill="#7C8785" fontSize="6.5" fontFamily="Space Mono, monospace">
              {f.name}
            </text>
            <text x="115" y="4" textAnchor="end" fill={f.alert && isActive ? "#F59E0B" : "#00D084"} fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">
              {isActive ? f.val : "NOMINAL"}
            </text>
          </g>
        ))}

        {/* Isolation Forest Decision Score Gauge */}
        <g transform="translate(0, 60)">
          <rect x="-125" y="-10" width="250" height="20" rx="4" fill="#081410" stroke="#1B362C" strokeWidth="1" />
          <text x="-115" y="4" fill="#7C8785" fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">
            ANOMALY SCORE:
          </text>
          <text x="115" y="4" textAnchor="end" fill={isComplete ? "#F59E0B" : "#00D084"} fontSize="9" fontWeight="800" fontFamily="Space Mono, monospace">
            {isComplete ? `${anomalyScore.toFixed(3)} (DEVIANT)` : isActive ? "-0.105 (CHECKING)" : "0.000 (BASELINE)"}
          </text>
        </g>
      </g>

      {/* ── RIGHT PANEL: ENCLAVE TOPOLOGY SENSOR ── */}
      <g transform="translate(790, 125)">
        <DatabaseNode x={0} y={-35} active={isActive} label="BASELINE DB" />
        <OrionSensorNode x={0} y={45} active={isActive} alert={isComplete} />
      </g>

      {/* Sensor connection line */}
      <line x1="620" y1="125" x2="750" y2="125" stroke={isActive ? "#F59E0B" : "#1B2B26"} strokeWidth="1.5" strokeDasharray={isActive ? "6 4" : "2 6"} className={isActive ? "svg-flow-path-animated" : ""} />

      {/* ── TOP STATUS HUD ── */}
      <g transform="translate(480, 24)">
        <rect x="-260" y="-12" width="520" height="24" rx="12" fill="#071511" stroke={isComplete ? "#F59E0B" : isScanning ? "#00D084" : "#1B2B26"} strokeWidth="1" />
        <circle cx="-240" cy="0" r="4" fill={isComplete ? "#F59E0B" : isScanning ? "#00D084" : "#7C8785"} className={isActive ? "svg-pulse-ring" : ""} />
        <text x="0" y="3" textAnchor="middle" fill={isComplete ? "#F59E0B" : isScanning ? "#00D084" : "#7C8785"} fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
          {labelText}
        </text>
      </g>

      {/* ── FINAL ANOMALY DETECTED HERO OVERLAY ── */}
      {isComplete && (
        <g transform="translate(480, 222)">
          <rect x="-240" y="-14" width="480" height="28" rx="6" fill="rgba(245, 158, 11, 0.18)" stroke="#F59E0B" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="800" fontFamily="Space Mono, monospace">
            ⚠ UNKNOWN ANOMALY DETECTED · ANOMALY DETECTION DEMONSTRATION
          </text>
        </g>
      )}

      {/* ── BOTTOM STAGE PIPELINE (5 STAGES) ── */}
      {!isComplete && (
        <g transform="translate(480, 240)">
          {[
            { label: "1. BASELINE INIT", done: isActive },
            { label: "2. DEVIATION DETECT", done: ["scan_2", "scan_3", "scan_4", "scan_5", "anomaly_scan_2", "anomaly_scan_3", "anomaly_scan_4", "anomaly_scan_5"].includes(step) },
            { label: "3. ISOLATION FOREST", done: ["scan_3", "scan_4", "scan_5", "anomaly_scan_3", "anomaly_scan_4", "anomaly_scan_5"].includes(step) },
            { label: "4. NO SIGNATURE MATCH", done: ["scan_4", "scan_5", "anomaly_scan_4", "anomaly_scan_5"].includes(step) },
            { label: "5. ANOMALY CONFIRMED", done: step === "scan_5" || step === "anomaly_scan_5" },
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
