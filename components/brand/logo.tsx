"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | number
  showWordmark?: boolean
  animated?: boolean
}

const SIZE_MAP = { sm: 24, md: 32, lg: 48 }

function resolveSize(size: LogoProps["size"]): number {
  if (typeof size === "number") return size
  return SIZE_MAP[size ?? "md"]
}

/**
 * Logomark — symbol only (no wordmark).
 * An abstract mark representing flow + space: a central AI processing hub
 * with orbiting autonomous agents and data streams.
 */
export function Logomark({
  className,
  size = "md",
  animated = true,
}: {
  className?: string
  size?: LogoProps["size"]
  animated?: boolean
}) {
  const px = resolveSize(size)
  const scale = px / 32 // viewBox is 32x32

  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      style={{ width: px, height: px }}
      role="img"
      aria-label="Flowspace"
      whileHover={animated ? { scale: 1.05 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {/* Outer orbital ring */}
      <motion.circle
        cx="16"
        cy="16"
        r="13.5"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.25"
        strokeDasharray="2 3"
        initial={false}
        animate={animated ? { rotate: 360 } : undefined}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "linear",
        }}
        style={{ originX: "16px", originY: "16px" }}
      />

      {/* Middle orbital ring */}
      <motion.ellipse
        cx="16"
        cy="16"
        rx="10"
        ry="10"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.15"
        strokeDasharray="1.5 4"
        initial={false}
        animate={animated ? { rotate: -360 } : undefined}
        transition={{
          repeat: Infinity,
          duration: 30,
          ease: "linear",
        }}
        style={{ originX: "16px", originY: "16px" }}
      />

      {/* Orbiting agent nodes */}
      {[0, 120, 240].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const cx = Math.round((16 + Math.cos(rad) * 13.5) * 10) / 10
        const cy = Math.round((16 + Math.sin(rad) * 13.5) * 10) / 10
        return (
          <g key={i}>
            {/* Glow behind node */}
            <motion.circle
              cx={cx}
              cy={cy}
              r="1.5"
              fill="currentColor"
              opacity="0.08"
              initial={false}
              animate={
                animated
                  ? {
                      opacity: [0.08, 0.2, 0.08],
                      scale: [1, 1.3, 1],
                    }
                  : undefined
              }
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.7,
              }}
            />
            {/* Node */}
            <motion.circle
              cx={cx}
              cy={cy}
              r="1"
              fill="currentColor"
              opacity="0.5"
              initial={false}
              animate={animated ? { opacity: [0.5, 0.9, 0.5] } : undefined}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.7,
              }}
            />
          </g>
        )
      })}

      {/* Central core — hexagon */}
      <motion.path
        d="M16 5 L24 9.5 L24 22.5 L16 27 L8 22.5 L8 9.5 Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
        fill="none"
      />

      {/* Central core — filled center */}
      <motion.circle
        cx="16"
        cy="16"
        r="4"
        fill="currentColor"
        opacity="0.12"
        initial={false}
        animate={
          animated
            ? {
                opacity: [0.12, 0.2, 0.12],
                scale: [1, 1.08, 1],
              }
            : undefined
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ originX: "16px", originY: "16px" }}
      />

      {/* Central core — inner dot */}
      <motion.circle
        cx="16"
        cy="16"
        r="1.5"
        fill="currentColor"
        opacity="0.6"
        initial={false}
        animate={
          animated
            ? {
                opacity: [0.6, 1, 0.6],
              }
            : undefined
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Data flow lines — left */}
      <g opacity="0.2">
        <motion.path
          d="M2 12 L7 14"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="1.5 2"
          initial={false}
          animate={animated ? { strokeDashoffset: [0, -7] } : undefined}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.path
          d="M2 20 L7 18"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="1.5 2"
          initial={false}
          animate={animated ? { strokeDashoffset: [0, -7] } : undefined}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </g>

      {/* Data flow lines — right */}
      <g opacity="0.2">
        <motion.path
          d="M30 12 L25 14"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="1.5 2"
          initial={false}
          animate={animated ? { strokeDashoffset: [0, -7] } : undefined}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "linear",
            delay: 0.6,
          }}
        />
        <motion.path
          d="M30 20 L25 18"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="1.5 2"
          initial={false}
          animate={animated ? { strokeDashoffset: [0, -7] } : undefined}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
            delay: 0.6,
          }}
        />
      </g>
    </motion.svg>
  )
}

/**
 * Full Logo — symbol + wordmark.
 */
export function Logo({
  className,
  size = "md",
  showWordmark = true,
  animated = true,
}: LogoProps) {
  const px = resolveSize(size)
  const gap = Math.round(px * 0.375)
  const fontSize = Math.round(px * 1.1)

  return (
    <motion.div
      className={cn("flex items-center", className)}
      whileHover={animated ? { scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
    >
      <Logomark size={size} animated={animated} />
      {showWordmark && (
        <span
          className="font-bold tracking-tight text-foreground"
          style={{ marginLeft: gap, fontSize }}
        >
          Flowspace
        </span>
      )}
    </motion.div>
  )
}
