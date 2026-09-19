import React from "react";

interface OrionZHeaderMarkProps {
  className?: string;
  size?: number;
}

/**
 * OrionZHeaderMark
 * 
 * Interlocking "O + Z" Geometric Emblem for ORION-Z.
 * Seamlessly integrates:
 * - "O": Outer 360° Radar Perimeter & Traffic Observation Ring
 * - "Z": Interlocking Diagonal Vector Beam & Threat Interception Path
 * - Central High-Precision Detection Target Core
 */
export const OrionZHeaderMark: React.FC<OrionZHeaderMarkProps> = ({
  className = "v2-orion-header-mark",
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ORION-Z (O+Z) Emblem"
    >
      <defs>
        {/* Background Gradient for Badge Shield */}
        <linearGradient id="ozBadgeBgHeader" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#063b32" />
          <stop offset="100%" stopColor="#006a4e" />
        </linearGradient>

        {/* Emerald Accent Gradient for Z and O */}
        <linearGradient id="ozEmeraldGradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d084" />
          <stop offset="60%" stopColor="#30b894" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Drop Shadow */}
        <filter id="ozMarkShadowHeader" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#ozMarkShadowHeader)">
        {/* 1. Outer Tech Defense Badge Shield */}
        <path
          d="M 32 3 L 57 14 C 58.5 14.7 59.5 16.2 59.5 17.8 V 44.2 C 59.5 45.8 58.5 47.3 57 48 L 32 59 L 7 48 C 5.5 47.3 4.5 45.8 4.5 44.2 V 17.8 C 4.5 16.2 5.5 14.7 7 14 Z"
          fill="url(#ozBadgeBgHeader)"
          stroke="#00d084"
          strokeWidth="2"
        />

        {/* 2. The Outer "O" Radar Perimeter Ring */}
        <circle
          cx="32"
          cy="32"
          r="19"
          stroke="url(#ozEmeraldGradHeader)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Inner Reticle Dash Ring */}
        <circle
          cx="32"
          cy="32"
          r="12"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* 3. Interlocking Geometric "Z" Vector Beam */}
        <path
          d="M 18 18 H 46 L 18 46 H 46"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Accent Highlight Line inside the Z */}
        <path
          d="M 21 18 H 43 L 21 46 H 43"
          stroke="#00d084"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4. Radar Sweep Radial Vector Beam */}
        <line x1="32" y1="32" x2="48" y2="18" stroke="#00d084" strokeWidth="1.8" strokeLinecap="round" />

        {/* 5. Network Traffic Telemetry Nodes */}
        <circle cx="32" cy="13" r="2.2" fill="#00d084" />
        <circle cx="48" cy="18" r="2" fill="#ffffff" />
        <circle cx="16" cy="46" r="2" fill="#30b894" />

        {/* 6. Central Detection Focal Core */}
        <circle cx="32" cy="32" r="3.2" fill="#00d084" />
        <circle cx="32" cy="32" r="1.2" fill="#ffffff" />
      </g>
    </svg>
  );
};
