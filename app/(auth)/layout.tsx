import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | Flowspace",
    default: "Authentication | Flowspace",
  },
  description:
    "Secure secrets management platform with end-to-end multi-factor encryption",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background select-none lg:flex-row">
      {/* ── Left column: brand / visual ── */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden border-r border-border/40 bg-primary/[0.04] select-none lg:min-h-dvh lg:w-[48%]">
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Radial glow behind the illustration */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[100px]" />

        {/* Content wrapper */}
        <div className="relative z-10 flex max-w-md animate-[fadeSlideUp_0.8s_ease-out_both] flex-col items-center px-8 py-12 lg:py-0">
          {/* Logo mark */}
          <div className="mb-8 flex animate-[fadeSlideUp_0.8s_ease-out_0.1s_both] items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/25">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Flowspace
            </span>
          </div>

          {/* SVG Illustration — vault / shield visual */}
          <div className="relative mb-10 aspect-square w-full max-w-sm animate-[fadeSlideUp_0.8s_ease-out_0.25s_both]">
            <SecurityVisual />
          </div>

          {/* Value proposition */}
          <div className="animate-[fadeSlideUp_0.8s_ease-out_0.4s_both] space-y-3 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Zero-Trust Secret <span className="text-primary">Management</span>
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              End-to-end encrypted credentials, API keys, and secrets — managed
              by AI agents with human-approved governance.
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex animate-[fadeSlideUp_0.8s_ease-out_0.55s_both] flex-wrap justify-center gap-2">
            {["E2E Encrypted", "SOC 2 Compliant", "Team Governance"].map(
              (label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary/80"
                >
                  {label}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Right column: auth form ── */}
      <div className="flex flex-1 animate-[fadeIn_0.6s_ease-out_0.3s_both] items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">{children}</div>
      </div>

      {/* Keyframe definitions */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vaultPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        @keyframes orbitSlow {
          from { transform: rotate(0deg) translateX(var(--orbit-r)) rotate(0deg); }
          to { transform: rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg); }
        }
        @keyframes shieldGlow {
          0%, 100% { filter: drop-shadow(0 0 8px oklch(0.55 0.15 245 / 0.2)); }
          50% { filter: drop-shadow(0 0 16px oklch(0.55 0.15 245 / 0.35)); }
        }
      `}</style>
    </div>
  )
}

/**
 * Abstract vault / shield security illustration.
 * Pure SVG — no external images, uses the project's OKLCH primary palette.
 */
function SecurityVisual() {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="shield-grad"
          x1="200"
          y1="60"
          x2="200"
          y2="340"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="oklch(0.65 0.18 245)" />
          <stop offset="100%" stopColor="oklch(0.45 0.12 250)" />
        </linearGradient>
        <linearGradient
          id="shield-fill"
          x1="200"
          y1="80"
          x2="200"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="oklch(0.25 0.04 245)" />
          <stop offset="100%" stopColor="oklch(0.18 0.025 250)" />
        </linearGradient>
        <radialGradient id="center-glow" cx="50%" cy="45%" r="35%">
          <stop
            offset="0%"
            stopColor="oklch(0.55 0.15 245)"
            stopOpacity="0.15"
          />
          <stop
            offset="100%"
            stopColor="oklch(0.55 0.15 245)"
            stopOpacity="0"
          />
        </radialGradient>
        <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>

      {/* Ambient background glow */}
      <circle cx="200" cy="180" r="140" fill="url(#center-glow)">
        <animate
          attributeName="r"
          values="140;155;140"
          dur="6s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Outer orbital ring */}
      <ellipse
        cx="200"
        cy="190"
        rx="150"
        ry="145"
        fill="none"
        stroke="oklch(0.5 0.1 245)"
        strokeWidth="0.5"
        opacity="0.2"
        strokeDasharray="4 6"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 200 190"
          to="360 200 190"
          dur="90s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Inner orbital ring */}
      <ellipse
        cx="200"
        cy="185"
        rx="110"
        ry="105"
        fill="none"
        stroke="oklch(0.6 0.15 245)"
        strokeWidth="0.5"
        opacity="0.15"
        strokeDasharray="3 8"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 200 185"
          to="-360 200 185"
          dur="60s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Shield body */}
      <path
        d="M200 70 L310 120 L310 200 C310 270 260 320 200 345 C140 320 90 270 90 200 L90 120 Z"
        fill="url(#shield-fill)"
        stroke="url(#shield-grad)"
        strokeWidth="2"
        style={{ animation: "shieldGlow 4s ease-in-out infinite" }}
      />

      {/* Shield inner border */}
      <path
        d="M200 90 L295 132 L295 200 C295 262 250 306 200 328 C150 306 105 262 105 200 L105 132 Z"
        fill="none"
        stroke="oklch(0.5 0.12 245)"
        strokeWidth="0.75"
        opacity="0.3"
      />

      {/* Keyhole / lock center */}
      <circle
        cx="200"
        cy="185"
        r="22"
        fill="none"
        stroke="oklch(0.6 0.16 245)"
        strokeWidth="1.5"
        opacity="0.5"
      >
        <animate
          attributeName="r"
          values="22;24;22"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0.7;0.5"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Keyhole inner dot */}
      <circle cx="200" cy="182" r="4" fill="oklch(0.65 0.18 245)" opacity="0.7">
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Keyhole bottom notch */}
      <rect
        x="197"
        y="190"
        width="6"
        height="18"
        rx="3"
        fill="oklch(0.6 0.16 245)"
        opacity="0.5"
      />

      {/* Data flow lines — left */}
      <g opacity="0.25">
        <path
          d="M55 160 L90 175"
          stroke="oklch(0.65 0.18 245)"
          strokeWidth="1"
          strokeDasharray="2 3"
        >
          <animate
            attributeName="strokeDashoffset"
            values="0;-10"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M60 200 L90 200"
          stroke="oklch(0.65 0.18 245)"
          strokeWidth="1"
          strokeDasharray="2 3"
        >
          <animate
            attributeName="strokeDashoffset"
            values="0;-10"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M55 240 L90 225"
          stroke="oklch(0.65 0.18 245)"
          strokeWidth="1"
          strokeDasharray="2 3"
        >
          <animate
            attributeName="strokeDashoffset"
            values="0;-10"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Data flow lines — right */}
      <g opacity="0.25">
        <path
          d="M345 160 L310 175"
          stroke="oklch(0.65 0.18 245)"
          strokeWidth="1"
          strokeDasharray="2 3"
        >
          <animate
            attributeName="strokeDashoffset"
            values="0;-10"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M340 200 L310 200"
          stroke="oklch(0.65 0.18 245)"
          strokeWidth="1"
          strokeDasharray="2 3"
        >
          <animate
            attributeName="strokeDashoffset"
            values="0;-10"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M345 240 L310 225"
          stroke="oklch(0.65 0.18 245)"
          strokeWidth="1"
          strokeDasharray="2 3"
        >
          <animate
            attributeName="strokeDashoffset"
            values="0;-10"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Orbiting data nodes */}
      {[
        { angle: 0, size: 6, dur: "12s", orbitR: 148 },
        { angle: 120, size: 5, dur: "15s", orbitR: 148 },
        { angle: 240, size: 4, dur: "18s", orbitR: 148 },
      ].map((node, i) => {
        const rad = (node.angle * Math.PI) / 180
        const cx = 200 + Math.cos(rad) * node.orbitR
        const cy = 190 + Math.sin(rad) * (node.orbitR - 5)
        return (
          <g key={i}>
            {/* Glow behind node */}
            <circle
              cx={cx}
              cy={cy}
              r={node.size + 4}
              fill="oklch(0.6 0.15 245)"
              opacity="0.1"
              filter="url(#soft-glow)"
            >
              <animate
                attributeName="opacity"
                values="0.08;0.18;0.08"
                dur={node.dur}
                repeatCount="indefinite"
              />
            </circle>
            {/* Node */}
            <circle
              cx={cx}
              cy={cy}
              r={node.size}
              fill="oklch(0.55 0.15 245)"
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0.4;0.7;0.4"
                dur={node.dur}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )
      })}

      {/* Corner accent dots — top-left */}
      <circle cx="40" cy="50" r="2" fill="oklch(0.6 0.15 245)" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0.4;0"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Top-right */}
      <circle cx="360" cy="55" r="1.5" fill="oklch(0.6 0.15 245)" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0.35;0"
          dur="5s"
          begin="1s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Bottom-left */}
      <circle cx="50" cy="350" r="2" fill="oklch(0.6 0.15 245)" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0.3;0"
          dur="4.5s"
          begin="2s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Bottom-right */}
      <circle cx="355" cy="345" r="1.5" fill="oklch(0.6 0.15 245)" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0.35;0"
          dur="3.5s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}
