/**
 * NetworkPrimitives.tsx
 * Reusable coded SVG primitives for ORION-Z threat visualizations.
 * All graphics are programmatic SVG — no images, no external assets.
 */

/** ─── SHARED TYPES ──────────────────────────────────────────── */
export interface NodeProps {
  x: number;
  y: number;
  active?: boolean;
  alert?: boolean;
  label?: string;
  sublabel?: string;
}

/** ─── DEFS (call once at the top of each SVG) ───────────────── */
export function SharedDefs() {
  return (
    <defs>
      <linearGradient id="grad-attack" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#F97316" stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id="grad-observe" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00D084" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#30B894" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="grad-threat" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
        <stop offset="100%" stopColor="#DC2626" stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id="grad-data" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="grad-dns" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.7" />
      </linearGradient>
      <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1 0 0 0 0.9  0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 1 0" result="redBlur" />
        <feComposite in="SourceGraphic" in2="redBlur" operator="over" />
      </filter>
      <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0.2  0 0 0 0 0.5  0 0 0 0 1.0  0 0 0 1 0" result="blueBlur" />
        <feComposite in="SourceGraphic" in2="blueBlur" operator="over" />
      </filter>
      <pattern id="grid-bg" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0D1F18" strokeWidth="0.6" />
      </pattern>
      <clipPath id="clip-panel">
        <rect width="960" height="260" rx="6" />
      </clipPath>
    </defs>
  );
}

/** ─── ATTACKER NODE ─────────────────────────────────────────── */
export function AttackerNode({ x, y, active = false, alert = false, label = "ATTACKER", sublabel }: NodeProps) {
  const stroke = alert ? "#EF4444" : active ? "#F97316" : "#4B3520";
  const glow = alert ? "url(#glow-red)" : "none";
  return (
    <g transform={`translate(${x},${y})`} filter={glow}>
      {/* Outer chassis */}
      <rect x="-28" y="-22" width="56" height="44" rx="4" fill="#120A04" stroke={stroke} strokeWidth="1.5" />
      {/* Screen */}
      <rect x="-22" y="-16" width="44" height="28" rx="2" fill="#1A0E06" stroke="#2A1A0A" strokeWidth="1" />
      {/* Terminal lines */}
      {active && (
        <>
          <line x1="-16" y1="-8" x2="8" y2="-8" stroke="#F97316" strokeWidth="1" opacity="0.8" />
          <line x1="-16" y1="-2" x2="14" y2="-2" stroke="#F97316" strokeWidth="1" opacity="0.6" />
          <line x1="-16" y1="4" x2="4" y2="4" stroke="#F97316" strokeWidth="1" opacity="0.9" />
          <text x="-16" y="12" fill="#F97316" fontSize="7" fontFamily="Space Mono, monospace" opacity="0.9">
            &gt;_attack.sh
          </text>
        </>
      )}
      {/* Status LEDs */}
      <circle cx="14" cy="-8" r="2" fill={active ? "#EF4444" : "#3A2010"} />
      <circle cx="18" cy="-8" r="2" fill={active ? "#F97316" : "#3A2010"} />
      {/* Pulse ring */}
      {active && (
        <circle r="36" fill="none" stroke="#F97316" strokeWidth="0.8" opacity="0.5" className="svg-pulse-ring" />
      )}
      <text y="34" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">
        {label}
      </text>
      {sublabel && (
        <text y="46" textAnchor="middle" fill="#9C6A3E" fontSize="8" fontFamily="Space Mono, monospace">
          {sublabel}
        </text>
      )}
    </g>
  );
}

/** ─── SERVER NODE ───────────────────────────────────────────── */
export function ServerNode({ x, y, active = false, alert = false, label = "TARGET SERVER", sublabel }: NodeProps) {
  const stroke = alert ? "#EF4444" : active ? "#00D084" : "#1B2B26";
  return (
    <g transform={`translate(${x},${y})`} filter={alert ? "url(#glow-red)" : "url(#glow-green)"}>
      {/* Rack frame */}
      <rect x="-28" y="-30" width="56" height="60" rx="4" fill="#061310" stroke={stroke} strokeWidth="1.5" />
      {/* Rack units */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="-22" y={-24 + i * 12} width="44" height="9" rx="2"
          fill={active && i < 3 ? "rgba(0,208,132,0.12)" : "#0A1E19"} stroke="#143028" strokeWidth="0.8" />
      ))}
      {/* Activity LEDs */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx="16" cy={-20 + i * 12} r="2"
          fill={active ? (alert && i === 0 ? "#EF4444" : "#00D084") : "#1B2B26"} />
      ))}
      {/* Network ports */}
      {[-8, -4, 0, 4, 8].map((dx, i) => (
        <rect key={i} x={-10 + dx} y="16" width="3" height="5" rx="0.5"
          fill={active ? "#30B894" : "#1B2B26"} />
      ))}
      <text y="42" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">
        {label}
      </text>
      {sublabel && (
        <text y="54" textAnchor="middle" fill="#7C8785" fontSize="8" fontFamily="Space Mono, monospace">
          {sublabel}
        </text>
      )}
    </g>
  );
}

/** ─── ORION-Z SENSOR NODE ───────────────────────────────────── */
export function OrionSensorNode({ x, y, active = false, alert = false }: NodeProps) {
  const stroke = alert ? "#EF4444" : active ? "#00D084" : "#1B2B26";
  return (
    <g transform={`translate(${x},${y})`} filter={alert ? "url(#glow-red)" : active ? "url(#glow-green)" : "none"}>
      {/* Sensor housing */}
      <rect x="-36" y="-28" width="72" height="56" rx="6" fill="#060F0B" stroke={stroke} strokeWidth="2" />
      <rect x="-30" y="-22" width="60" height="44" rx="4" fill="#091713" stroke="#142820" strokeWidth="1" />
      {/* Spinning analysis ring */}
      <circle r="14" fill="none" stroke={active ? "#00D084" : "#1B2B26"} strokeWidth="1.5"
        strokeDasharray="4 3" className={active ? "svg-spin-slow" : ""} />
      <circle r="8" fill="none" stroke={active ? "#30B894" : "#122018"} strokeWidth="1"
        strokeDasharray="2 2" className={active ? "svg-spin-slow-rev" : ""} />
      {/* Core */}
      <circle r="4" fill={alert ? "#EF4444" : active ? "#00D084" : "#1B2B26"} />
      {/* Corner capture indicators */}
      {[[-22, -18], [22, -18], [-22, 18], [22, 18]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill={active ? "#30B894" : "#0D1E19"} />
      ))}
      {/* Flow counter lines */}
      {active && (
        <>
          <line x1="-24" y1="6" x2="24" y2="6" stroke="#122820" strokeWidth="0.8" />
          <text x="-23" y="4" fill="#00D084" fontSize="6" fontFamily="Space Mono, monospace">
            {`FLOWS:`}
          </text>
        </>
      )}
      <text y="40" textAnchor="middle" fill="#F4F7F5" fontSize="10" fontWeight="700" fontFamily="Space Mono, monospace">
        ORION-Z
      </text>
      <text y="52" textAnchor="middle" fill={active ? "#00D084" : "#7C8785"} fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
        {alert ? "THREAT DETECTED" : active ? "PASSIVE MONITOR" : "DORMANT"}
      </text>
    </g>
  );
}

/** ─── DNS RESOLVER NODE ─────────────────────────────────────── */
export function DnsResolverNode({ x, y, active = false, label = "DNS RESOLVER" }: NodeProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-26" y="-24" width="52" height="48" rx="4" fill="#0D0818" stroke={active ? "#A78BFA" : "#1E1530"} strokeWidth="1.5" />
      {/* DNS icon — stacked layers */}
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx="0" cy={-10 + i * 8} rx="16" ry="4"
          fill="none" stroke={active ? "#A78BFA" : "#2A1F50"} strokeWidth="1" />
      ))}
      <text y="36" textAnchor="middle" fill="#F4F7F5" fontSize="9" fontWeight="700" fontFamily="Space Mono, monospace">
        {label}
      </text>
    </g>
  );
}

/** ─── C2 SERVER NODE ────────────────────────────────────────── */
export function C2ServerNode({ x, y, active = false, label = "C2 SERVER" }: NodeProps) {
  return (
    <g transform={`translate(${x},${y})`} filter={active ? "url(#glow-red)" : "none"}>
      <rect x="-26" y="-24" width="52" height="48" rx="4" fill="#12060A" stroke={active ? "#EF4444" : "#2A1020"} strokeWidth="1.5" />
      {/* Skull-cross / C2 icon as coded SVG */}
      <circle cx="0" cy="-6" r="9" fill="none" stroke={active ? "#EF4444" : "#4A1830"} strokeWidth="1.2" />
      <line x1="-6" y1="8" x2="6" y2="8" stroke={active ? "#EF4444" : "#4A1830"} strokeWidth="1.5" />
      <line x1="0" y1="3" x2="0" y2="14" stroke={active ? "#EF4444" : "#4A1830"} strokeWidth="1.5" />
      {active && (
        <circle r="30" fill="none" stroke="#EF4444" strokeWidth="0.6" opacity="0.4" className="svg-pulse-ring" />
      )}
      <text y="36" textAnchor="middle" fill="#EF4444" fontSize="9" fontWeight="700" fontFamily="Space Mono, monospace">
        {label}
      </text>
    </g>
  );
}

/** ─── WEB SERVER NODE ───────────────────────────────────────── */
export function WebServerNode({ x, y, active = false, alert = false, label = "WEB SERVER" }: NodeProps) {
  const barStroke = alert ? "#EF4444" : active ? "#00D084" : "#1B2B26";
  return (
    <g transform={`translate(${x},${y})`} filter={alert ? "url(#glow-red)" : "none"}>
      <rect x="-28" y="-26" width="56" height="52" rx="4" fill="#060F0B" stroke={barStroke} strokeWidth="1.5" />
      {/* Browser chrome bars */}
      <rect x="-22" y="-20" width="44" height="8" rx="2" fill="#0D1E19" stroke="#142820" strokeWidth="0.8" />
      {/* Traffic LED dots */}
      {[-8, -3, 2].map((dx, i) => (
        <circle key={i} cx={-14 + dx * 2 + i} cy="-16" r="2"
          fill={active ? (alert ? "#EF4444" : "#00D084") : "#1B2B26"} />
      ))}
      {/* Content lines */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x="-20" y={-8 + i * 7} width={active ? 35 - i * 6 : 20} height="4" rx="2"
          fill={active ? (alert ? "rgba(239,68,68,0.3)" : "rgba(0,208,132,0.2)") : "#0D1E19"} />
      ))}
      <text y="38" textAnchor="middle" fill="#F4F7F5" fontSize="9" fontWeight="700" fontFamily="Space Mono, monospace">
        {label}
      </text>
    </g>
  );
}

/** ─── DATABASE NODE ─────────────────────────────────────────── */
export function DatabaseNode({ x, y, active = false, draining = false, label = "DATA STORE" }: NodeProps & { draining?: boolean }) {
  const stroke = draining ? "#EF4444" : active ? "#3B82F6" : "#1B2B26";
  return (
    <g transform={`translate(${x},${y})`} filter={draining ? "url(#glow-red)" : active ? "url(#glow-blue)" : "none"}>
      {/* Cylinder top */}
      <ellipse cx="0" cy="-22" rx="22" ry="7" fill="#091018" stroke={stroke} strokeWidth="1.5" />
      {/* Cylinder body */}
      <rect x="-22" y="-22" width="44" height="38" fill="#061018" stroke={stroke} strokeWidth="1.5" />
      {/* Cylinder bottom */}
      <ellipse cx="0" cy="16" rx="22" ry="7" fill="#091018" stroke={stroke} strokeWidth="1.5" />
      {/* Data fill level */}
      <clipPath id="clip-db">
        <rect x="-22" y="-22" width="44" height="38" />
      </clipPath>
      <rect x="-22" y={draining ? -22 + 38 * 0.4 : -22 + 38 * 0.2} width="44"
        height={draining ? 38 * 0.6 : 38 * 0.8} fill={draining ? "rgba(59,130,246,0.25)" : "rgba(59,130,246,0.4)"} clipPath="url(#clip-db)" />
      {/* Strip lines */}
      {[-12, -4, 4, 12].map((dy, i) => (
        <line key={i} x1="-18" y1={dy} x2="18" y2={dy} stroke={active ? "rgba(59,130,246,0.3)" : "#0D1828"} strokeWidth="0.8" />
      ))}
      <text y="36" textAnchor="middle" fill="#F4F7F5" fontSize="9" fontWeight="700" fontFamily="Space Mono, monospace">
        {label}
      </text>
      {draining && (
        <text y="48" textAnchor="middle" fill="#EF4444" fontSize="8" fontFamily="Space Mono, monospace">
          DRAINING
        </text>
      )}
    </g>
  );
}

/** ─── REFLECTOR NODE (UDP Amplification) ────────────────────── */
export function ReflectorNode({ x, y, active = false, label = "REFLECTOR" }: NodeProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Hexagon shape via polygon */}
      <polygon
        points="0,-18 16,-9 16,9 0,18 -16,9 -16,-9"
        fill="#070D12" stroke={active ? "#60A5FA" : "#1A2A38"} strokeWidth="1.5"
      />
      {/* Inner hexagon */}
      <polygon
        points="0,-10 9,-5 9,5 0,10 -9,5 -9,-5"
        fill="none" stroke={active ? "#3B82F6" : "#12222E"} strokeWidth="1"
      />
      <circle r="3" fill={active ? "#60A5FA" : "#1A2A38"} />
      <text y="30" textAnchor="middle" fill="#B0C4D8" fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
        {label}
      </text>
    </g>
  );
}

/** ─── FLOW EDGE ─────────────────────────────────────────────── */
export interface EdgeProps {
  x1: number; y1: number;
  x2: number; y2: number;
  active?: boolean;
  color?: string;
  width?: number;
  dash?: string;
  animated?: boolean;
  animClass?: string;
}

export function FlowEdge({ x1, y1, x2, y2, active = false, color = "#00D084", width = 2, dash, animated = false, animClass = "svg-flow-path-animated" }: EdgeProps) {
  return (
    <>
      {/* Ghost base */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0D1F18" strokeWidth={width + 1} strokeDasharray={dash} />
      {active && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width}
          strokeDasharray={dash || "8 5"} className={animated ? animClass : ""} />
      )}
    </>
  );
}

/** ─── CURVED FLOW EDGE ───────────────────────────────────────── */
export function CurvedEdge({ x1, y1, x2, y2, active = false, color = "#00D084", width = 2, bend = 30, animated = false, animClass = "svg-flow-path-animated" }: EdgeProps & { bend?: number }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - bend;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  return (
    <>
      <path d={d} fill="none" stroke="#0D1F18" strokeWidth={width + 1} />
      {active && (
        <path d={d} fill="none" stroke={color} strokeWidth={width}
          strokeDasharray="7 5" className={animated ? animClass : ""} />
      )}
    </>
  );
}

/** ─── PIPELINE STAGE INDICATOR ──────────────────────────────── */
interface PipelineProps {
  stages: { label: string; done: boolean; active: boolean }[];
  x: number;
  y: number;
}
export function PipelineBar({ stages, x, y }: PipelineProps) {
  const W = 100;
  const GAP = 24;
  const total = stages.length;
  const totalW = total * W + (total - 1) * GAP;
  const startX = x - totalW / 2;
  return (
    <g transform={`translate(${startX},${y})`}>
      {stages.map((s, i) => (
        <g key={i} transform={`translate(${i * (W + GAP)},0)`}>
          <rect x="0" y="-11" width={W} height="22" rx="4"
            fill={s.done ? "#0A251E" : s.active ? "#081A14" : "#0A120F"}
            stroke={s.done || s.active ? "#00D084" : "#1B2B26"} strokeWidth="1" />
          <text x={W / 2} y="4" textAnchor="middle" fill={s.done ? "#F4F7F5" : s.active ? "#30B894" : "#4A6055"}
            fontSize="8" fontWeight="700" fontFamily="Space Mono, monospace">
            {s.done ? `${s.label} ✓` : s.label}
          </text>
          {i < stages.length - 1 && (
            <text x={W + GAP / 2} y="4" textAnchor="middle" fill={s.done ? "#30B894" : "#1B2B26"}
              fontSize="11" fontFamily="Space Mono, monospace">→</text>
          )}
        </g>
      ))}
    </g>
  );
}
