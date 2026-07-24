import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { ApiError } from "@/lib/api/errors"

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Invalid request",
          details: error.flatten(),
        },
      },
      { status: 400 }
    )
  }

  console.error(error)
  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Internal server error",
      },
    },
    { status: 500 }
  )
}
