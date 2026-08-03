"use client"

import type { AppProps } from "@/types/desktop/app"

export interface ImageViewerContent {
  url: string
  alt?: string
}

export function ImageViewerApp({ content }: AppProps) {
  const imageContent = (content ?? {}) as ImageViewerContent

  return (
    <div className="flex items-center justify-center h-full bg-checkerboard p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageContent.url}
        alt={imageContent.alt ?? "Image"}
        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
      />
    </div>
  )
}
