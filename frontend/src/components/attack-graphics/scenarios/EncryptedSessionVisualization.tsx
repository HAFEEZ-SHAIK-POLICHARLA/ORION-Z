/**
 * EncryptedSessionVisualization.tsx
 * Visual: TLS Anomaly — shows TLS handshake stages then encrypted channel.
 * ORION-Z peels off visible metadata WITHOUT decrypting payload.
 */
import { SharedDefs, OrionSensorNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const TLS_STAGES = [
  { label: "ClientHello", who: "client" },
  { label: "ServerHello", who: "server" },
  { label: "Certificate", who: "server" },
  { label: "Key Exchange", who: "both" },
  { label: "ENCRYPTED ████", who: "both" },
];

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
}

export function EncryptedSessionVisualization({ step, hasAlert }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const extracting = ["extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  const visibleStages = step === "attack" ? 1
    : step === "observe" ? 2
    : step === "extract" ? 3
    : step === "evaluate" ? 4
    : active ? 5 : 0;

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── CLIENT ENDPOINT ── */}
      <g transform="translate(100,125)">
        <rect x="-30" y="-36" width="60" height="72" rx="4" fill="#060F0B" stroke={active ? "#00D084" : "#1B2B26"} strokeWidth="1.5" />
        <rect x="-24" y="-30" width="48" height="44" rx="2" fill="#091713" stroke="#142820" strokeWidth="0.8" />
        {/* Certificate icon */}
        {active && (
          <>
            <rect x="-18" y="-24" width="36" height="16" rx="2" fill="#0D2518" stroke="#00D084" strokeWidth="0.8" />
            <text x="-14" y="-14" fill="#00D084" fontSize="5.5" fontFamily="Space Mono, monospace">CERT STORED</text>
            <text x="-14" y="-4" fill="#7C8785" fontSize="4.5" fontFamily="Space Mono, monospace">TLS v1.3</text>
            <rect x="-18" y="-2" width="36" height="10" rx="1" fill="#081810" stroke="#306A58" strokeWidth="0.6" />
            <text x="-14" y="6" fill="#30B894" fontSize="5" fontFamily="Space Mono, monospace">JA3: d2f…3a9</text>
          </>
        )}
        <circle cx="20" cy="-22" r="2" fill={active ? "#00D084" : "#1B2B26"} />
        <text y="48" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">CLIENT</text>
        <text y="60" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">10.0.0.18</text>
      </g>

      {/* ── TLS HANDSHAKE SEQUENCE (vertical) ── */}
      <g transform="translate(310,60)">
        {TLS_STAGES.slice(0, visibleStages).map((stage, i) => {
          const y = i * 36;
          const isEncrypted = stage.label.includes("ENCRYPTED");
          const dir = stage.who === "server" ? 1 : -1;
          return (
            <g key={i} transform={`translate(0,${y})`}>
              {/* Arrow line */}
              <line x1={dir === -1 ? -60 : 60} y1="0" x2={dir === -1 ? 60 : -60} y2="0"
                stroke={isEncrypted ? "#306A58" : "#00D084"} strokeWidth={isEncrypted ? "3" : "1.5"}
                strokeDasharray={isEncrypted ? "none" : "5 3"} className={!isEncrypted ? "svg-flow-path-animated" : ""} />
              {/* Arrow tip */}
              <polygon points={`${dir * 60},0 ${dir * 52},-4 ${dir * 52},4`}
                fill={isEncrypted ? "#306A58" : "#00D084"} />
              {/* Handshake card label */}
              <g transform={`translate(${dir === -1 ? 70 : -70},0)`}>
                <rect x="-38" y="-10" width="76" height="20" rx="3"
                  fill={isEncrypted ? "#060F0B" : "#050E0C"}
                  stroke={isEncrypted ? "#30B894" : "#00D084"} strokeWidth="0.8" />
                <text x="0" y="4" textAnchor="middle" fill={isEncrypted ? "#30B894" : "#F4F7F5"}
                  fontSize={isEncrypted ? "7.5" : "7"} fontWeight={isEncrypted ? "700" : "400"}
                  fontFamily="Space Mono, monospace">
                  {stage.label}
                </text>
              </g>
            </g>
          );
        })}
      </g>

      {/* ── EXTERNAL SUSPICIOUS SERVER ── */}
      <g transform="translate(510,125)">
        <rect x="-28" y="-36" width="56" height="72" rx="4" fill="#0A0C06" stroke={active ? "#F59E0B" : "#1B2B26"} strokeWidth="1.5" />
        <rect x="-22" y="-30" width="44" height="44" rx="2" fill="#0D1008" stroke="#1A1E0A" strokeWidth="0.8" />
        {active && (
          <>
            <text x="-18" y="-18" fill="#F59E0B" fontSize="5.5" fontFamily="Space Mono, monospace">ANOMALOUS TLS</text>
            <text x="-18" y="-8" fill="#7C8785" fontSize="5" fontFamily="Space Mono, monospace">CIPHER: 0x1303</text>
            <text x="-18" y="2" fill="#7C8785" fontSize="4.5" fontFamily="Space Mono, monospace">SNI: *.suspicious</text>
          </>
        )}
        <circle cx="18" cy="-22" r="2" fill={active ? "#F59E0B" : "#1B2B26"} />
        <text y="48" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">EXT. HOST</text>
        <text y="60" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">203.0.113.19</text>
      </g>

      {/* ── METADATA EXTRACTION (peeling off TLS) ── */}
      {extracting && (
        <>
          {/* Dotted line showing metadata peeling up from the TLS channel */}
          <line x1="310" y1="125" x2="620" y2="85"
            stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <g transform="translate(620,75)">
            <rect x="-60" y="-42" width="120" height="84" rx="5" fill="#0A0C06" stroke="#F59E0B" strokeWidth="1" />
            <text x="0" y="-30" textAnchor="middle" fill="#F59E0B" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">TLS METADATA</text>
            <text x="-52" y="-18" fill="#7C8785" fontSize="5.5" fontFamily="Space Mono, monospace">TLS VERSION</text>
            <text x="8" y="-18" fill="#F59E0B" fontSize="6" fontFamily="Space Mono, monospace">TLSv1.3</text>
            <text x="-52" y="-5" fill="#7C8785" fontSize="5.5" fontFamily="Space Mono, monospace">FINGERPRINT</text>
            <text x="8" y="-5" fill="#F59E0B" fontSize="6" fontFamily="Space Mono, monospace">d2f89…a3b</text>
            <text x="-52" y="8" fill="#7C8785" fontSize="5.5" fontFamily="Space Mono, monospace">PKT SIZE</text>
            <text x="8" y="8" fill={decided && hasAlert ? "#EF4444" : "#F59E0B"} fontSize="6" fontFamily="Space Mono, monospace">ANOMALOUS</text>
            <text x="-52" y="21" fill="#7C8785" fontSize="5.5" fontFamily="Space Mono, monospace">META SCORE</text>
            <text x="8" y="21" fill={decided && hasAlert ? "#EF4444" : "#F59E0B"} fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">0.82</text>
            <text x="-50" y="35" fill="#306A58" fontSize="5" fontFamily="Space Mono, monospace">PAYLOAD: NOT DECRYPTED</text>
          </g>
        </>
      )}

      {/* Sensor line */}
      <line x1="540" y1="125" x2="740" y2="140"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />

      {/* Sensor */}
      <OrionSensorNode x={790} y={140} active={observing} alert={decided && hasAlert} />

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="620" y="190" width="230" height="30" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="735" y="209" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ TLS ANOMALY DETECTED</text>
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
