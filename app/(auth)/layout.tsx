import type { Metadata } from "next"
import { Logo } from "@/components/brand/logo"

export const metadata: Metadata = {
  title: {
    template: "%s | Flowspace",
    default: "Authentication | Flowspace",
  },
  description:
    "Deploy autonomous AI agents secured by an enterprise-grade credential vault. Augment your existing tools without replacing your workflow.",
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
          <div className="mb-8 animate-[fadeSlideUp_0.8s_ease-out_0.1s_both]">
            <Logo size="lg" showWordmark animated={false} />
          </div>

          {/* SVG Illustration — autonomous agents hub */}
          <div className="relative mb-10 aspect-square w-full max-w-sm animate-[fadeSlideUp_0.8s_ease-out_0.25s_both]">
            <AgentHubVisual />
          </div>

          {/* Value proposition */}
          <div className="animate-[fadeSlideUp_0.8s_ease-out_0.4s_both] space-y-3 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Your Autonomous <span className="text-primary">AI Workforce</span>
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Deploy coding, content, ops, and research agents that execute
              multi-step tasks independently — secured by a zero-leak credential
              vault.
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex animate-[fadeSlideUp_0.8s_ease-out_0.55s_both] flex-wrap justify-center gap-2">
            {["Autonomous Agents", "Zero-Leak Vault", "One-Click Tools"].map(
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
        @keyframes corePulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        @keyframes nodeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes ringGlow {
          0%, 100% { filter: drop-shadow(0 0 8px oklch(0.5 0.13 245 / 0.15)); }
          50% { filter: drop-shadow(0 0 16px oklch(0.5 0.13 245 / 0.3)); }
        }
      `}</style>
    </div>
  )
}

/**
 * Autonomous Agents Hub illustration.
 * A central processing hexagon with orbiting agent nodes,
 * communication rings, and data flow streams.
 * Pure SVG — uses the project's OKLCH primary palette.
 */
function AgentHubVisual() {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hub-glow" cx="50%" cy="50%" r="40%">
          <stop
            offset="0%"
            stopColor="oklch(0.5 0.13 245)"
            stopOpacity="0.15"
          />
          <stop offset="100%" stopColor="oklch(0.5 0.13 245)" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="core-fill"
          x1="200"
          y1="90"
          x2="200"
          y2="310"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="oklch(0.25 0.04 245)" />
          <stop offset="100%" stopColor="oklch(0.18 0.025 250)" />
        </linearGradient>
        <linearGradient
          id="core-stroke"
          x1="200"
          y1="90"
          x2="200"
          y2="310"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="oklch(0.65 0.18 245)" />
          <stop offset="100%" stopColor="oklch(0.45 0.12 250)" />
        </linearGradient>
        <filter id="node-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>
      </defs>

      {/* Ambient background glow */}
      <circle cx="200" cy="190" r="140" fill="url(#hub-glow)">
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
        rx="155"
        ry="148"
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
          dur="80s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Middle communication ring */}
      <ellipse
        cx="200"
        cy="185"
        rx="120"
        ry="114"
        fill="none"
        stroke="oklch(0.55 0.13 245)"
        strokeWidth="0.5"
        opacity="0.15"
        strokeDasharray="3 8"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 200 185"
          to="-360 200 185"
          dur="55s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Agent connection lines (radial spokes) */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x2 = 200 + Math.cos(rad) * 100
        const y2 = 190 + Math.sin(rad) * 95
        return (
          <line
            key={angle}
            x1="200"
            y1="190"
            x2={x2}
            y2={y2}
            stroke="oklch(0.5 0.1 245)"
            strokeWidth="0.4"
            opacity="0.1"
          />
        )
      })}

      {/* Central processing hexagon */}
      <path
        d="M200 75 L310 125 L310 260 L200 310 L90 260 L90 125 Z"
        fill="url(#core-fill)"
        stroke="url(#core-stroke)"
        strokeWidth="2"
        style={{ animation: "ringGlow 4s ease-in-out infinite" }}
      />

      {/* Hexagon inner border */}
      <path
        d="M200 95 L295 138 L295 247 L200 290 L105 247 L105 138 Z"
        fill="none"
        stroke="oklch(0.5 0.12 245)"
        strokeWidth="0.75"
        opacity="0.25"
      />

      {/* AI core — inner circle */}
      <circle
        cx="200"
        cy="192"
        r="28"
        fill="none"
        stroke="oklch(0.6 0.16 245)"
        strokeWidth="1.2"
        opacity="0.4"
      >
        <animate
          attributeName="r"
          values="28;30;28"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.4;0.6;0.4"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Core center dot */}
      <circle cx="200" cy="192" r="5" fill="oklch(0.65 0.18 245)" opacity="0.7">
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Data flow lines — incoming to hub */}
      <g opacity="0.2">
        {[
          { d: "M30 150 L88 160", dur: "2s" },
          { d: "M30 230 L88 220", dur: "2.5s" },
          { d: "M35 190 L88 190", dur: "1.8s" },
        ].map((line, i) => (
          <path
            key={`in-${i}`}
            d={line.d}
            stroke="oklch(0.65 0.18 245)"
            strokeWidth="1"
            strokeDasharray="2.5 3"
          >
            <animate
              attributeName="strokeDashoffset"
              values="0;-11"
              dur={line.dur}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </g>

      {/* Data flow lines — outgoing from hub */}
      <g opacity="0.2">
        {[
          { d: "M312 160 L370 150", dur: "2s" },
          { d: "M312 220 L370 230", dur: "2.5s" },
          { d: "M312 190 L365 190", dur: "1.8s" },
        ].map((line, i) => (
          <path
            key={`out-${i}`}
            d={line.d}
            stroke="oklch(0.65 0.18 245)"
            strokeWidth="1"
            strokeDasharray="2.5 3"
          >
            <animate
              attributeName="strokeDashoffset"
              values="0;-11"
              dur={line.dur}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </g>

      {/* Orbiting agent nodes on outer ring */}
      {[
        { angle: 30, size: 7, dur: "4s", delay: "0s" },
        { angle: 130, size: 5, dur: "5s", delay: "0.5s" },
        { angle: 230, size: 6, dur: "4.5s", delay: "1s" },
        { angle: 310, size: 4, dur: "6s", delay: "1.5s" },
      ].map((node, i) => {
        const rad = (node.angle * Math.PI) / 180
        const cx = 200 + Math.cos(rad) * 155
        const cy = 190 + Math.sin(rad) * 148
        return (
          <g key={i}>
            {/* Glow behind node */}
            <circle
              cx={cx}
              cy={cy}
              r={node.size + 5}
              fill="oklch(0.55 0.13 245)"
              opacity="0.1"
              filter="url(#node-glow)"
            >
              <animate
                attributeName="opacity"
                values="0.08;0.18;0.08"
                dur={node.dur}
                begin={node.delay}
                repeatCount="indefinite"
              />
            </circle>
            {/* Node body */}
            <circle
              cx={cx}
              cy={cy}
              r={node.size}
              fill="oklch(0.5 0.13 245)"
              opacity="0.5"
              style={{ animation: "nodeFloat 3s ease-in-out infinite" }}
            >
              <animate
                attributeName="opacity"
                values="0.4;0.7;0.4"
                dur={node.dur}
                begin={node.delay}
                repeatCount="indefinite"
              />
            </circle>
            {/* Node inner dot */}
            <circle
              cx={cx}
              cy={cy}
              r={node.size * 0.35}
              fill="oklch(0.75 0.2 245)"
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0.4;0.8;0.4"
                dur={node.dur}
                begin={node.delay}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )
      })}

      {/* Inner ring agent nodes */}
      {[
        { angle: 75, size: 4, dur: "3.5s", delay: "0.2s" },
        { angle: 195, size: 3.5, dur: "4s", delay: "0.8s" },
        { angle: 285, size: 5, dur: "3s", delay: "1.2s" },
      ].map((node, i) => {
        const rad = (node.angle * Math.PI) / 180
        const cx = 200 + Math.cos(rad) * 120
        const cy = 185 + Math.sin(rad) * 114
        return (
          <g key={`inner-${i}`}>
            <circle
              cx={cx}
              cy={cy}
              r={node.size + 3}
              fill="oklch(0.6 0.15 245)"
              opacity="0.08"
              filter="url(#node-glow)"
            >
              <animate
                attributeName="opacity"
                values="0.06;0.15;0.06"
                dur={node.dur}
                begin={node.delay}
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={cx}
              cy={cy}
              r={node.size}
              fill="oklch(0.55 0.15 245)"
              opacity="0.45"
            >
              <animate
                attributeName="opacity"
                values="0.35;0.65;0.35"
                dur={node.dur}
                begin={node.delay}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )
      })}

      {/* Corner accent dots */}
      {[
        { cx: 40, cy: 45, r: 2, dur: "4s", delay: "0s" },
        { cx: 360, cy: 50, r: 1.5, dur: "5s", delay: "1s" },
        { cx: 45, cy: 345, r: 2, dur: "4.5s", delay: "2s" },
        { cx: 355, cy: 340, r: 1.5, dur: "3.5s", delay: "0.5s" },
      ].map((dot, i) => (
        <circle
          key={`dot-${i}`}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill="oklch(0.6 0.15 245)"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;0.35;0"
            dur={dot.dur}
            begin={dot.delay}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  )
}
