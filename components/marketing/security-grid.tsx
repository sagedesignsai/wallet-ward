"use client"

import React, { useEffect, useRef } from "react"

export function SecurityGrid() {
  const svgRef = useRef<SVGSVGElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="grid-fade" cx="50%" cy="50%" r="60%">
          <stop
            offset="0%"
            stopColor="oklch(0.6 0.18 242)"
            stopOpacity="0.15"
          />
          <stop
            offset="70%"
            stopColor="oklch(0.6 0.18 242)"
            stopOpacity="0.03"
          />
          <stop offset="100%" stopColor="oklch(0.6 0.18 242)" stopOpacity="0" />
        </radialGradient>

        <pattern
          id="dots"
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="1"
            cy="1"
            r="1"
            fill="oklch(0.5 0.1 240)"
            fillOpacity="0.35"
          />
        </pattern>
      </defs>

      {/* Dot grid */}
      <rect width="100%" height="100%" fill="url(#dots)" />

      {/* Gradient overlay to fade edges */}
      <rect width="100%" height="100%" fill="url(#grid-fade)" opacity="0.6" />

      {/* Animated horizontal scan lines */}
      {[0.2, 0.5, 0.75].map((pos, i) => (
        <line
          key={i}
          x1="0"
          y1={`${pos * 100}%`}
          x2="100%"
          y2={`${pos * 100}%`}
          stroke="oklch(0.6 0.18 242)"
          strokeWidth="0.5"
          strokeOpacity="0"
        >
          <animate
            attributeName="stroke-opacity"
            values="0;0.15;0"
            dur={`${6 + i * 2}s`}
            begin={`${i * 2.5}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="y1"
            values={`${pos * 100}%;${(pos + 0.15) * 100}%;${pos * 100}%`}
            dur={`${6 + i * 2}s`}
            begin={`${i * 2.5}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="y2"
            values={`${pos * 100}%;${(pos + 0.15) * 100}%;${pos * 100}%`}
            dur={`${6 + i * 2}s`}
            begin={`${i * 2.5}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}
    </svg>
  )
}
