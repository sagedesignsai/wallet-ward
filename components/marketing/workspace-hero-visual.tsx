"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface WorkspaceHeroVisualProps {
  className?: string
}

/**
 * Stylized dashboard/workspace layout with connected tool icons
 * flowing into a unified interface. Abstract, modern, not literal.
 */
export function WorkspaceHeroVisual({ className }: WorkspaceHeroVisualProps) {
  return (
    <div className={cn("relative w-full h-full", className)} aria-hidden="true">
      <svg
        viewBox="0 0 520 460"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filters */}
          <filter id="ws-glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>
          <filter id="ws-glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>

          {/* Gradient for dashboard frame */}
          <linearGradient id="ws-frame-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.22 0.015 250)" />
            <stop offset="100%" stopColor="oklch(0.18 0.012 260)" />
          </linearGradient>

          {/* Tool icon gradient */}
          <linearGradient id="ws-accent-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.65 0.18 245)" />
            <stop offset="100%" stopColor="oklch(0.6 0.15 210)" />
          </linearGradient>
        </defs>

        {/* ===== AMBIENT GLOW LAYER ===== */}
        <ellipse cx="260" cy="230" rx="180" ry="160" fill="oklch(0.55 0.15 245)" opacity="0.04" filter="url(#ws-glow-purple)">
          <animate attributeName="rx" values="180;195;180" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.04;0.07;0.04" dur="6s" repeatCount="indefinite" />
        </ellipse>

        {/* ===== MAIN DASHBOARD FRAME ===== */}
        <rect x="80" y="60" width="360" height="310" rx="16" fill="url(#ws-frame-grad)" stroke="oklch(0.35 0.04 250)" strokeWidth="1.5" />

        {/* Window chrome — title bar */}
        <rect x="80" y="60" width="360" height="36" rx="16" fill="oklch(0.16 0.01 250)" />
        <rect x="80" y="84" width="360" height="12" fill="oklch(0.16 0.01 250)" />

        {/* Traffic lights */}
        <circle cx="100" cy="78" r="5" fill="#ff5f57" opacity="0.8" />
        <circle cx="118" cy="78" r="5" fill="#febc2e" opacity="0.8" />
        <circle cx="136" cy="78" r="5" fill="#28c840" opacity="0.8" />

        {/* Title bar label */}
        <rect x="220" y="72" width="80" height="12" rx="6" fill="oklch(0.3 0.03 250)" opacity="0.6" />

        {/* ===== SIDEBAR ===== */}
        <rect x="80" y="96" width="72" height="274" fill="oklch(0.14 0.008 250)" />
        {/* Sidebar right border */}
        <line x1="152" y1="96" x2="152" y2="370" stroke="oklch(0.25 0.02 250)" strokeWidth="1" />

        {/* Sidebar nav items */}
        {[0, 1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <rect
              x="88"
              y={112 + i * 44}
              width="56"
              height="32"
              rx="6"
              fill={i === 0 ? "oklch(0.55 0.15 245)" : "transparent"}
              opacity={i === 0 ? 0.2 : 0}
            >
              {i === 0 && (
                <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite" />
              )}
            </rect>
            {/* Icon placeholder circles */}
            <circle cx="116" cy={128 + i * 44} r="6" fill={i === 0 ? "oklch(0.7 0.16 245)" : "oklch(0.3 0.03 250)"} opacity={i === 0 ? 0.9 : 0.5} />
          </React.Fragment>
        ))}

        {/* ===== MAIN CONTENT AREA ===== */}
        {/* Top stat cards row */}
        {[0, 1, 2].map((i) => (
          <React.Fragment key={`stat-${i}`}>
            <rect
              x={164 + i * 90}
              y="104"
              width="80"
              height="52"
              rx="10"
              fill="oklch(0.19 0.012 250)"
              stroke="oklch(0.28 0.025 250)"
              strokeWidth="1"
            />
            {/* Stat value */}
            <rect x={172 + i * 90} y="114" width="40" height="10" rx="5" fill="oklch(0.4 0.08 250)" opacity="0.6">
              <animate attributeName="opacity" values="0.5;0.7;0.5" dur={`${3 + i}s`} repeatCount="indefinite" />
            </rect>
            {/* Stat label */}
            <rect x={172 + i * 90} y="130" width="56" height="7" rx="3.5" fill="oklch(0.3 0.02 250)" opacity="0.5" />
            {/* Stat bar */}
            <rect x={172 + i * 90} y="142" width={30 + i * 12} height="4" rx="2" fill={i === 0 ? "oklch(0.65 0.18 245)" : i === 1 ? "oklch(0.6 0.14 160)" : "oklch(0.55 0.15 300)"} opacity="0.5" />
          </React.Fragment>
        ))}

        {/* Activity feed / list area */}
        <rect x="164" y="168" width="268" height="192" rx="10" fill="oklch(0.17 0.01 250)" stroke="oklch(0.25 0.02 250)" strokeWidth="1" />

        {/* Feed items */}
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={`feed-${i}`}>
            {/* Avatar dot */}
            <circle cx="182" cy={190 + i * 42} r="8" fill={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"][i]} opacity="0.7" />
            {/* Text lines */}
            <rect x="198" y={184 + i * 42} width={120 + (i % 2) * 40} height="8" rx="4" fill="oklch(0.35 0.03 250)" opacity="0.6" />
            <rect x="198" y={196 + i * 42} width={80 + (i % 3) * 20} height="6" rx="3" fill="oklch(0.28 0.02 250)" opacity="0.4" />
            {/* Separator */}
            {i < 3 && (
              <line x1="178" y1={218 + i * 42} x2="418" y2={218 + i * 42} stroke="oklch(0.22 0.015 250)" strokeWidth="0.5" />
            )}
          </React.Fragment>
        ))}

        {/* ===== FLOATING TOOL ICONS flowing into dashboard ===== */}
        {/* GitHub */}
        <g className="animate-[float1_5s_ease-in-out_infinite]" style={{ animationDelay: "0s" }}>
          <rect x="16" y="100" width="52" height="52" rx="14" fill="oklch(0.18 0.005 250)" stroke="oklch(0.3 0.02 250)" strokeWidth="1.2" />
          {/* GitHub octocat simplified */}
          <circle cx="42" cy="122" r="14" fill="none" stroke="oklch(0.7 0.01 0)" strokeWidth="1.5" />
          <circle cx="42" cy="118" r="7" fill="none" stroke="oklch(0.7 0.01 0)" strokeWidth="1.2" />
          <path d="M38 130 Q42 126 46 130" stroke="oklch(0.7 0.01 0)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="37" cy="116" r="1.5" fill="oklch(0.7 0.01 0)" />
          <circle cx="47" cy="116" r="1.5" fill="oklch(0.7 0.01 0)" />
        </g>

        {/* Connection line: GitHub → dashboard */}
        <path d="M68 126 C80 126, 80 130, 80 130" stroke="oklch(0.7 0.01 0)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4">
          <animate attributeName="strokeDashoffset" values="0;-12" dur="1.5s" repeatCount="indefinite" />
        </path>

        {/* Linear */}
        <g className="animate-[float2_6s_ease-in-out_infinite]" style={{ animationDelay: "1s" }}>
          <rect x="16" y="180" width="52" height="52" rx="14" fill="oklch(0.18 0.005 250)" stroke="oklch(0.3 0.02 250)" strokeWidth="1.2" />
          {/* Linear icon — angled line */}
          <path d="M30 140 L54 164" stroke="oklch(0.75 0.18 300)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 150 L44 164" stroke="oklch(0.75 0.18 300)" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Connection line: Linear → dashboard */}
        <path d="M68 206 C80 206, 80 190, 80 190" stroke="oklch(0.75 0.18 300)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4">
          <animate attributeName="strokeDashoffset" values="0;-12" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
        </path>

        {/* Vercel */}
        <g className="animate-[float3_5.5s_ease-in-out_infinite]" style={{ animationDelay: "2s" }}>
          <rect x="452" y="140" width="52" height="52" rx="14" fill="oklch(0.18 0.005 250)" stroke="oklch(0.3 0.02 250)" strokeWidth="1.2" />
          {/* Vercel triangle */}
          <path d="M478 158 L498 188 L458 188 Z" fill="oklch(0.95 0.01 0)" opacity="0.8" />
        </g>

        {/* Connection line: dashboard → Vercel */}
        <path d="M440 180 L452 166" stroke="oklch(0.95 0.01 0)" strokeWidth="1" strokeDasharray="3 3" opacity="0.3">
          <animate attributeName="strokeDashoffset" values="0;-12" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
        </path>

        {/* Slack */}
        <g className="animate-[float1_6.5s_ease-in-out_infinite]" style={{ animationDelay: "0.5s" }}>
          <rect x="452" y="220" width="52" height="52" rx="14" fill="oklch(0.18 0.005 250)" stroke="oklch(0.3 0.02 250)" strokeWidth="1.2" />
          {/* Slack hash simplified */}
          <circle cx="472" cy="246" r="3" fill="none" stroke="#e01e5a" strokeWidth="2" />
          <circle cx="484" cy="246" r="3" fill="none" stroke="#36c5f0" strokeWidth="2" />
          <circle cx="478" cy="238" r="3" fill="none" stroke="#2eb67d" strokeWidth="2" />
          <circle cx="478" cy="254" r="3" fill="none" stroke="#ecb22e" strokeWidth="2" />
        </g>

        {/* Connection line: dashboard → Slack */}
        <path d="M440 220 L452 238" stroke="#36c5f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3">
          <animate attributeName="strokeDashoffset" values="0;-12" dur="1.5s" repeatCount="indefinite" begin="0.9s" />
        </path>

        {/* ===== BOTTOM STATUS BAR ===== */}
        <rect x="80" y="348" width="360" height="22" rx="0" fill="oklch(0.13 0.008 250)" />
        <rect x="80" y="346" width="360" height="2" rx="1" fill="oklch(0.25 0.02 250)" />
        {/* Status dots */}
        <circle cx="100" cy="359" r="3" fill="oklch(0.7 0.15 150)" opacity="0.8">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <rect x="110" y="356" width="40" height="6" rx="3" fill="oklch(0.3 0.02 250)" opacity="0.4" />
        <rect x="160" y="356" width="24" height="6" rx="3" fill="oklch(0.3 0.02 250)" opacity="0.3" />

        {/* Right side status */}
        <rect x="370" y="356" width="32" height="6" rx="3" fill="oklch(0.3 0.02 250)" opacity="0.3" />
        <rect x="410" y="356" width="20" height="6" rx="3" fill="oklch(0.3 0.02 250)" opacity="0.2" />

        {/* ===== FLOATING PARTICLES ===== */}
        {[
          { cx: 50, cy: 40, r: 2, delay: "0s", dur: "4s" },
          { cx: 480, cy: 80, r: 1.5, delay: "1s", dur: "5s" },
          { cx: 30, cy: 320, r: 2, delay: "2s", dur: "4.5s" },
          { cx: 500, cy: 310, r: 1.5, delay: "0.5s", dur: "5.5s" },
          { cx: 260, cy: 30, r: 1, delay: "1.5s", dur: "3.5s" },
        ].map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="oklch(0.65 0.15 245)"
            opacity="0"
          >
            <animate attributeName="opacity" values="0;0.4;0" dur={p.dur} begin={p.delay} repeatCount="indefinite" />
            <animate attributeName="cy" values={`${p.cy};${p.cy - 12};${p.cy}`} dur={p.dur} begin={p.delay} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Inline keyframe animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-5px) translateX(3px); }
        }
      `}</style>
    </div>
  )
}
