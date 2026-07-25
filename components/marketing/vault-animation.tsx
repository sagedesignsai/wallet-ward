"use client"

import React from "react"

export function VaultAnimation() {
  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full max-w-[420px] max-h-[420px]"
        aria-hidden="true"
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.6 0.18 242)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.5 0.2 210)" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="lock-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.9 0.05 220)" />
            <stop offset="100%" stopColor="oklch(0.7 0.12 240)" />
          </linearGradient>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.6 0.18 242)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.6 0.18 242)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.85 0.15 240)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.85 0.15 240)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="fragment-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.8 0.12 240)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.6 0.18 242)" stopOpacity="0.4" />
          </radialGradient>

          {/* Clip path for shield */}
          <clipPath id="shield-clip">
            <path d="M200 50 L320 100 L320 210 Q320 300 200 360 Q80 300 80 210 L80 100 Z" />
          </clipPath>
        </defs>

        {/* ── Background core glow ── */}
        <circle cx="200" cy="200" r="140" fill="url(#core-glow)">
          <animate attributeName="r" values="130;155;130" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* ── Pulse rings ── */}
        {[70, 100, 130].map((r, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke="oklch(0.6 0.18 242)"
            strokeWidth="1"
            strokeOpacity="0"
          >
            <animate
              attributeName="r"
              values={`${r};${r + 50};${r + 50}`}
              dur="3.5s"
              begin={`${i * 1.1}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0 0 1 1"
            />
            <animate
              attributeName="stroke-opacity"
              values="0;0.35;0"
              dur="3.5s"
              begin={`${i * 1.1}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* ── Shield body ── */}
        <path
          d="M200 58 L312 104 L312 208 Q312 295 200 352 Q88 295 88 208 L88 104 Z"
          fill="url(#shield-grad)"
          fillOpacity="0.12"
          stroke="url(#shield-grad)"
          strokeWidth="1.5"
          filter="url(#glow-blue)"
        />

        {/* Shield inner highlight */}
        <path
          d="M200 75 L298 114 L298 212 Q298 288 200 338 Q102 288 102 212 L102 114 Z"
          fill="none"
          stroke="oklch(0.75 0.1 230)"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />

        {/* Shield top edge glow */}
        <line
          x1="200" y1="58" x2="312" y2="104"
          stroke="oklch(0.8 0.15 240)"
          strokeWidth="2"
          strokeOpacity="0.8"
          filter="url(#glow-blue)"
        />
        <line
          x1="200" y1="58" x2="88" y2="104"
          stroke="oklch(0.8 0.15 240)"
          strokeWidth="2"
          strokeOpacity="0.8"
          filter="url(#glow-blue)"
        />

        {/* ── Lock icon (center) ── */}
        {/* Lock body */}
        <rect
          x="176" y="205" width="48" height="38"
          rx="6"
          fill="url(#lock-grad)"
          fillOpacity="0.95"
          filter="url(#glow-blue)"
        >
          <animate attributeName="fill-opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
        </rect>
        {/* Lock shackle */}
        <path
          d="M188 205 L188 192 Q188 175 200 175 Q212 175 212 192 L212 205"
          fill="none"
          stroke="url(#lock-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#glow-blue)"
        />
        {/* Lock keyhole */}
        <circle cx="200" cy="220" r="6" fill="oklch(0.2 0.05 240)" />
        <rect x="197" y="220" width="6" height="10" rx="1" fill="oklch(0.2 0.05 240)" />

        {/* ── Beam / scan line ── */}
        <rect
          x="112"
          y="198"
          width="176"
          height="2"
          rx="1"
          fill="url(#beam-grad)"
          transform="rotate(0, 200, 200)"
          clipPath="url(#shield-clip)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 200"
            to="360 200 200"
            dur="5s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.5s" repeatCount="indefinite" />
        </rect>

        {/* ── Orbiting data fragments ── */}
        {[
          { orbitR: 145, startAngle: 0, dur: "8s", size: 14, label: "KEY" },
          { orbitR: 145, startAngle: 120, dur: "8s", size: 12, label: "🔐" },
          { orbitR: 145, startAngle: 240, dur: "8s", size: 14, label: "API" },
        ].map(({ orbitR, startAngle, dur, size, label }, i) => {
          const rad = (startAngle * Math.PI) / 180
          const cx = Math.round((200 + orbitR * Math.cos(rad)) * 100) / 100
          const cy = Math.round((200 + orbitR * Math.sin(rad)) * 100) / 100
          return (
            <g key={i}>
              {/* Orbit path (faint) */}
              {i === 0 && (
                <circle
                  cx="200"
                  cy="200"
                  r={orbitR}
                  fill="none"
                  stroke="oklch(0.6 0.18 242)"
                  strokeWidth="0.5"
                  strokeOpacity="0.15"
                  strokeDasharray="4 6"
                />
              )}

              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${startAngle} 200 200`}
                  to={`${startAngle + 360} 200 200`}
                  dur={dur}
                  repeatCount="indefinite"
                />
                {/* Fragment pill */}
                <rect
                  x={cx - 18}
                  y={cy - 10}
                  width="36"
                  height="20"
                  rx="5"
                  fill="oklch(0.22 0.06 240)"
                  stroke="oklch(0.6 0.18 242)"
                  strokeWidth="1"
                  strokeOpacity="0.7"
                  filter="url(#glow-blue)"
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={size * 0.65}
                  fill="oklch(0.8 0.12 240)"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {label}
                </text>
              </g>
            </g>
          )
        })}

        {/* ── Corner hex decorations ── */}
        {[
          { x: 50, y: 60 },
          { x: 340, y: 60 },
          { x: 50, y: 330 },
          { x: 340, y: 330 },
        ].map(({ x, y }, i) => (
          <g key={`hex-${i}`} opacity="0.3">
            <polygon
              points={`${x},${y - 10} ${x + 9},${y - 5} ${x + 9},${y + 5} ${x},${y + 10} ${x - 9},${y + 5} ${x - 9},${y - 5}`}
              fill="none"
              stroke="oklch(0.6 0.18 242)"
              strokeWidth="1"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.6;0.2"
                dur={`${2.5 + i * 0.7}s`}
                repeatCount="indefinite"
              />
            </polygon>
          </g>
        ))}

        {/* ── Encrypted text fragments (subtle) ── */}
        {["3nkR+/Xa", "AES-256", "•••••"].map((text, i) => (
          <text
            key={`enc-${i}`}
            x={[120, 210, 265][i]}
            y={[290, 310, 275][i]}
            fontSize="7"
            fill="oklch(0.6 0.18 242)"
            fontFamily="monospace"
            opacity="0"
            clipPath="url(#shield-clip)"
          >
            <animate
              attributeName="opacity"
              values="0;0.4;0"
              dur={`${3 + i}s`}
              begin={`${i * 1.2}s`}
              repeatCount="indefinite"
            />
            {text}
          </text>
        ))}
      </svg>
    </div>
  )
}
