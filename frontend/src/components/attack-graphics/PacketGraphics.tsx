/**
 * PacketGraphics.tsx
 * Coded packet card primitives for ORION-Z threat visualizations.
 * Packets appear as compact protocol-specific card graphics.
 */

interface PacketCardProps {
  x: number;
  y: number;
  proto: string;
  flag?: string;
  src?: string;
  dst?: string;
  info?: string;
  color?: string;
  opacity?: number;
}

/** Generic compact packet card */
function PacketCard({ x, y, proto, flag, src, dst, info, color = "#00D084", opacity = 1 }: PacketCardProps) {
  const W = 68;
  const H = flag || src ? 42 : 26;
  return (
    <g transform={`translate(${x - W / 2},${y - H / 2})`} opacity={opacity}>
      <rect width={W} height={H} rx="3" fill="#050E0C" stroke={color} strokeWidth="1" />
      <rect width={W} height="10" rx="3" fill={`${color}22`} />
      <text x="4" y="8" fill={color} fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">
        {proto}
      </text>
      {flag && (
        <text x="4" y="18" fill="#F4F7F5" fontSize="7" fontFamily="Space Mono, monospace">
          {flag}
        </text>
      )}
      {src && (
        <text x="4" y="27" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">
          {src}
        </text>
      )}
      {dst && (
        <text x="4" y="35" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">
          {dst}
        </text>
      )}
      {info && !src && (
        <text x="4" y="20" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">
          {info}
        </text>
      )}
    </g>
  );
}

/** SYN packet */
export function SynPacket({ x, y, src, dst, opacity = 1 }: { x: number; y: number; src?: string; dst?: string; opacity?: number }) {
  return <PacketCard x={x} y={y} proto="TCP" flag="SYN" src={src} dst={dst} color="#EF4444" opacity={opacity} />;
}

/** SYN-ACK packet */
export function SynAckPacket({ x, y, opacity = 1 }: { x: number; y: number; opacity?: number }) {
  return <PacketCard x={x} y={y} proto="TCP" flag="SYN-ACK" color="#F97316" opacity={opacity} />;
}

/** DNS Query packet */
export function DnsQueryPacket({ x, y, queryLabel, queryLen, opacity = 1 }: { x: number; y: number; queryLabel?: string; queryLen?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x - 38},${y - 26})`} opacity={opacity}>
      <rect width="76" height="52" rx="3" fill="#050E0C" stroke="#A78BFA" strokeWidth="1" />
      <rect width="76" height="10" rx="3" fill="#1A1040" />
      <text x="4" y="8" fill="#A78BFA" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">DNS QUERY</text>
      <text x="4" y="18" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">TYPE: TXT</text>
      {queryLabel && (
        <text x="4" y="27" fill="#C9D4CF" fontSize="6" fontFamily="Space Mono, monospace">
          {queryLabel.length > 10 ? queryLabel.substring(0, 10) + "…" : queryLabel}
        </text>
      )}
      {queryLen !== undefined && (
        <text x="4" y="36" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">
          {`LEN: ${queryLen}`}
        </text>
      )}
      <text x="4" y="46" fill="#7C3AED" fontSize="5" fontFamily="Space Mono, monospace">
        {`ID: ${Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4,"0")}`}
      </text>
    </g>
  );
}

/** UDP Packet */
export function UdpPacket({ x, y, size, isResponse = false, opacity = 1 }: { x: number; y: number; size?: number; isResponse?: boolean; opacity?: number }) {
  const color = isResponse ? "#EF4444" : "#60A5FA";
  return (
    <g transform={`translate(${x - 34},${y - 20})`} opacity={opacity}>
      <rect width="68" height="40" rx="3" fill="#050E0C" stroke={color} strokeWidth="1" />
      <rect width="68" height="10" rx="3" fill={`${color}22`} />
      <text x="4" y="8" fill={color} fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">UDP</text>
      <text x="4" y="18" fill="#C9D4CF" fontSize="6" fontFamily="Space Mono, monospace">
        {isResponse ? "AMPLIFIED RSP" : "SMALL REQ"}
      </text>
      {size !== undefined && (
        <text x="4" y="28" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">
          {`SIZE: ${size}B`}
        </text>
      )}
    </g>
  );
}

/** TLS packet */
export function TlsPacket({ x, y, stage, opacity = 1 }: { x: number; y: number; stage?: string; opacity?: number }) {
  return (
    <g transform={`translate(${x - 36},${y - 22})`} opacity={opacity}>
      <rect width="72" height="44" rx="3" fill="#050E0C" stroke="#00D084" strokeWidth="1" />
      <rect width="72" height="10" rx="3" fill="#001A10" />
      <text x="4" y="8" fill="#00D084" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">TLS</text>
      {stage && (
        <text x="4" y="20" fill="#C9D4CF" fontSize="6" fontFamily="Space Mono, monospace">{stage}</text>
      )}
      <text x="4" y="32" fill="#306A58" fontSize="6" fontFamily="Space Mono, monospace">████ ENCRYPTED ████</text>
    </g>
  );
}

/** Data Packet (exfiltration) */
export function DataPacket({ x, y, bytes, opacity = 1 }: { x: number; y: number; bytes?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x - 34},${y - 18})`} opacity={opacity}>
      <rect width="68" height="36" rx="3" fill="#050E0C" stroke="#3B82F6" strokeWidth="1" />
      <rect width="68" height="10" rx="3" fill="#060C18" />
      <text x="4" y="8" fill="#3B82F6" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">DATA</text>
      <text x="4" y="20" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">OUTBOUND</text>
      {bytes !== undefined && (
        <text x="4" y="30" fill="#60A5FA" fontSize="6" fontFamily="Space Mono, monospace">
          {`${bytes.toLocaleString()}B`}
        </text>
      )}
    </g>
  );
}

/** HTTP partial header (Slowloris) */
export function SlowPacket({ x, y, connId, elapsed, opacity = 1 }: { x: number; y: number; connId?: string; elapsed?: string; opacity?: number }) {
  return (
    <g transform={`translate(${x - 36},${y - 22})`} opacity={opacity}>
      <rect width="72" height="44" rx="3" fill="#050E0C" stroke="#F59E0B" strokeWidth="1" />
      <rect width="72" height="10" rx="3" fill="#1A1000" />
      <text x="4" y="8" fill="#F59E0B" fontSize="7" fontWeight="800" fontFamily="Space Mono, monospace">HTTP</text>
      <text x="4" y="18" fill="#C9D4CF" fontSize="6" fontFamily="Space Mono, monospace">PARTIAL HEADER</text>
      {connId && <text x="4" y="27" fill="#7C8785" fontSize="6" fontFamily="Space Mono, monospace">{connId}</text>}
      {elapsed && <text x="4" y="36" fill="#F59E0B" fontSize="6" fontFamily="Space Mono, monospace">{elapsed}</text>}
    </g>
  );
}

/** Moving packet along a line — simple animated dot with label */
export function MovingPacketDot({ x, y, color = "#00D084", label = "" }: { x: number; y: number; color?: string; label?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r="5" fill={color} opacity="0.9" />
      <circle r="9" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      {label && (
        <text x="12" y="4" fill={color} fontSize="7" fontFamily="Space Mono, monospace">{label}</text>
      )}
    </g>
  );
}
