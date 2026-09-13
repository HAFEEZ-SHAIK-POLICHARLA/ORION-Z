/**
 * SlowlorisVisualization.tsx
 * Visual: Slow & persistent HTTP connection exhaustion.
 * Opposite of SYN Flood: connections arrive slowly, stay open, trickle tiny data.
 * Shows web server connection pool draining, timer per connection.
 */
import { SharedDefs, AttackerNode, WebServerNode, OrionSensorNode } from "../NetworkPrimitives";
import type { ExplainerStep } from "../../AttackExplainer";

const MAX_CONNECTIONS = 10;

interface Props {
  step: ExplainerStep;
  hasAlert: boolean;
}

export function SlowlorisVisualization({ step, hasAlert }: Props) {
  const active = step !== "ready";
  const observing = ["observe","extract","evaluate","enrich","decision","complete"].includes(step);
  const extracting = ["extract","evaluate","enrich","decision","complete"].includes(step);
  const decided = ["decision","complete"].includes(step);

  // Slowly accumulate connections
  const heldConns = step === "attack" ? 2
    : step === "observe" ? 4
    : step === "extract" ? 6
    : step === "evaluate" ? 8
    : active ? MAX_CONNECTIONS : 0;

  // Each connection has a slow drip timer
  const connTimers = ["00:24", "00:31", "00:18", "00:42", "00:09", "00:27", "00:14", "00:36", "00:21", "00:08"];

  // Bytes trickle — tiny amounts
  const bytesPerConn = step === "attack" ? 128 : step === "observe" ? 256 : step === "extract" ? 512 : 1024;

  return (
    <svg className="tactical-svg-canvas" viewBox="0 0 960 260" preserveAspectRatio="xMidYMid meet">
      <SharedDefs />
      <rect width="960" height="260" fill="url(#grid-bg)" rx="6" />

      {/* ── ATTACK HOST (left) ── */}
      <AttackerNode x={100} y={130} active={active} alert={decided && hasAlert} label="ATTACK HOST" sublabel="192.168.1.19" />

      {/* ── SLOW PERSISTENT CONNECTIONS ── */}
      {active && Array.from({ length: heldConns }).map((_, i) => {
        const yTarget = 50 + (i * 22);
        return (
          <g key={i}>
            {/* Thin persistent connection line */}
            <line x1="130" y1="130" x2="390" y2={yTarget}
              stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 4"
              className={i === heldConns - 1 ? "svg-flow-path-animated" : ""} opacity="0.7" />
            {/* Tiny HTTP partial header packet */}
            <g transform={`translate(${240},${yTarget})`}>
              <rect x="-22" y="-9" width="44" height="18" rx="2" fill="#050A0A" stroke="#F59E0B" strokeWidth="0.7" />
              <text x="0" y="-2" textAnchor="middle" fill="#F59E0B" fontSize="5.5" fontWeight="700" fontFamily="Space Mono, monospace">HTTP</text>
              <text x="0" y="6" textAnchor="middle" fill="#7C8785" fontSize="4.5" fontFamily="Space Mono, monospace">PARTIAL HDR</text>
            </g>
          </g>
        );
      })}

      {/* ── WEB SERVER (center) ── */}
      <WebServerNode x={440} y={130} active={active} alert={decided && hasAlert} label="WEB SERVER" />
      <text x="440" y="170" textAnchor="middle" fill="#7C8785" fontSize="7" fontFamily="Space Mono, monospace">10.0.0.1 :80</text>

      {/* ── CONNECTION POOL TABLE ── */}
      <g transform="translate(590,120)">
        <rect x="-80" y="-15" width="160" height="18" rx="3" fill="#0A1210" stroke="#1B3028" strokeWidth="1" />
        <text x="0" y="-3" textAnchor="middle" fill="#7C8785" fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
          CONNECTION POOL
        </text>
        {/* Pool slots grid */}
        {Array.from({ length: MAX_CONNECTIONS }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const held = i < heldConns;
          return (
            <g key={i} transform={`translate(${-72 + col * 30}, ${10 + row * 28})`}>
              {/* Connection slot */}
              <rect width="26" height="24" rx="3"
                fill={held ? "rgba(245,158,11,0.15)" : "#0A120F"}
                stroke={held ? "#F59E0B" : "#1B2B26"} strokeWidth="0.8" />
              {held && (
                <>
                  <text x="13" y="9" textAnchor="middle" fill="#F59E0B" fontSize="5.5" fontWeight="700" fontFamily="Space Mono, monospace">
                    {`C${String(i + 1).padStart(2, "0")}`}
                  </text>
                  <text x="13" y="18" textAnchor="middle" fill="#F59E0B" fontSize="5" fontFamily="Space Mono, monospace">
                    {connTimers[i]}
                  </text>
                </>
              )}
              {!held && (
                <text x="13" y="14" textAnchor="middle" fill="#1B2B26" fontSize="6" fontFamily="Space Mono, monospace">
                  FREE
                </text>
              )}
            </g>
          );
        })}

        {/* Pool capacity indicator */}
        {active && (
          <>
            <text x="0" y="70" textAnchor="middle" fill={heldConns >= 8 ? "#EF4444" : "#F59E0B"}
              fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
              {`${heldConns}/${MAX_CONNECTIONS} HELD — ${Math.round((heldConns / MAX_CONNECTIONS) * 100)}% FULL`}
            </text>
          </>
        )}
      </g>

      {/* ── METRICS PANEL ── */}
      {extracting && (
        <g transform="translate(740,155)">
          <rect x="-60" y="-48" width="120" height="96" rx="5" fill="#060F0B" stroke={decided && hasAlert ? "#EF4444" : "#00D084"} strokeWidth="1" />
          <text x="0" y="-36" textAnchor="middle" fill="#00D084" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">SLOWLORIS METRICS</text>
          {[
            { label: "HELD CONNS", val: `${heldConns}`, hi: heldConns >= 8 },
            { label: "BYTES/CONN", val: `${bytesPerConn}B`, hi: false },
            { label: "CONN RATE", val: "0.4 c/s", hi: false },
            { label: "HOLD TIME", val: "> 30s", hi: heldConns >= 6 },
          ].map((f, i) => (
            <g key={i} transform={`translate(0,${-18 + i * 20})`}>
              <rect x="-54" y="-7" width="108" height="14" rx="2"
                fill={f.hi ? "rgba(239,68,68,0.08)" : "#0A120F"}
                stroke={f.hi ? "#EF4444" : "#1B2B26"} strokeWidth="0.7" />
              <text x="-48" y="2" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">{f.label}</text>
              <text x="24" y="2" fill={f.hi ? "#EF4444" : "#F59E0B"} fontSize="7" fontWeight="700" fontFamily="Space Mono, monospace">{f.val}</text>
            </g>
          ))}
        </g>
      )}

      {/* Sensor line */}
      <line x1="470" y1="130" x2="750" y2="105"
        stroke={observing ? "#00D084" : "#0D1F18"} strokeWidth="1.5"
        strokeDasharray={observing ? "5 4" : "2 6"}
        className={observing ? "svg-sensor-path-animated" : ""} />

      {/* Sensor */}
      <OrionSensorNode x={800} y={95} active={observing} alert={decided && hasAlert} />

      {/* Server stress annotation */}
      {heldConns >= 8 && (
        <g transform="translate(440,195)">
          <rect x="-60" y="-10" width="120" height="20" rx="3"
            fill="rgba(239,68,68,0.12)" stroke="#EF4444" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#EF4444" fontSize="9" fontWeight="700" fontFamily="Space Mono, monospace">
            ⚠ CAPACITY EXHAUSTED
          </text>
        </g>
      )}

      {/* Threat overlay */}
      {decided && hasAlert && (
        <g>
          <rect x="310" y="216" width="240" height="30" rx="4"
            fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
          <text x="430" y="235" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800"
            fontFamily="Space Mono, monospace">⚠ SLOWLORIS DETECTED</text>
        </g>
      )}

      {/* Pipeline */}
      <g transform="translate(480,248)">
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
