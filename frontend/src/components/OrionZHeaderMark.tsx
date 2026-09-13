import React from "react";

interface OrionZHeaderMarkProps {
  className?: string;
  size?: number;
}

/**
 * OrionZHeaderMark
 * 
 * Dedicated White + Emerald ORION-Z logo mark for the application header.
 * Replaces dark-background image with a clean, high-precision SVG radar emblem
 * designed specifically for the emerald header background.
 */
export const OrionZHeaderMark: React.FC<OrionZHeaderMarkProps> = ({
  className = "v2-orion-header-mark",
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ORION-Z Emblem"
    >
      <defs>
        {/* Radar Sweep Gradient */}
        <radialGradient
          id="orionRadarSweep"
          cx="20"
          cy="20"
          r="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#047857" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
        </radialGradient>

        {/* Subtle Emblem Shadow */}
        <filter id="emblemShadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* 1. White Base Emblem Badge */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="9"
        fill="#FFFFFF"
        stroke="#e2e8f0"
        strokeWidth="1"
      />

      {/* 2. Radar Sweep Sector Arc (Top-Right quadrant) */}
      <path
        d="M 20 20 L 20 4 A 16 16 0 0 1 36 20 Z"
        fill="url(#orionRadarSweep)"
      />

      {/* 3. Radar Sweep Leading Beam Line */}
      <line
        x1="20"
        y1="20"
        x2="36"
        y2="20"
        stroke="#047857"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* 4. Concentric Radar Rings */}
      {/* Outer Ring */}
      <circle
        cx="20"
        cy="20"
        r="15"
        stroke="#047857"
        strokeWidth="1.4"
        strokeOpacity="0.85"
      />

      {/* Mid Ring (Dashed) */}
      <circle
        cx="20"
        cy="20"
        r="10.5"
        stroke="#059669"
        strokeWidth="1.2"
        strokeDasharray="2.5 2"
        strokeOpacity="0.75"
      />

      {/* Inner Target Ring */}
      <circle
        cx="20"
        cy="20"
        r="6"
        stroke="#047857"
        strokeWidth="1.2"
        strokeOpacity="0.9"
      />

      {/* 5. Crosshair Axes (Radar Reticle) */}
      <line x1="20" y1="5" x2="20" y2="10" stroke="#047857" strokeWidth="1.2" strokeOpacity="0.7" />
      <line x1="20" y1="30" x2="20" y2="35" stroke="#047857" strokeWidth="1.2" strokeOpacity="0.7" />
      <line x1="5" y1="20" x2="10" y2="20" stroke="#047857" strokeWidth="1.2" strokeOpacity="0.7" />
      <line x1="30" y1="20" x2="35" y2="20" stroke="#047857" strokeWidth="1.2" strokeOpacity="0.7" />

      {/* 6. Unidirectional Network Traffic Nodes (Orbital Sensors) */}
      <circle cx="20" cy="9.5" r="1.5" fill="#047857" />
      <circle cx="30.5" cy="20" r="1.5" fill="#047857" />
      <circle cx="12.5" cy="27.5" r="1.3" fill="#059669" />

      {/* 7. Central Target Core (ORION-Z Sensor Core) */}
      <circle cx="20" cy="20" r="2.8" fill="#047857" />
      <circle cx="20" cy="20" r="1" fill="#FFFFFF" />
    </svg>
  );
};
