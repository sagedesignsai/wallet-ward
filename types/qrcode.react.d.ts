declare module "qrcode.react" {
  import * as React from "react"

  export interface QRCodeProps {
    value: string
    size?: number
    level?: "L" | "M" | "Q" | "H"
    bgColor?: string
    fgColor?: string
    style?: React.CSSProperties
    includeMargin?: boolean
    imageSettings?: {
      src: string
      x?: number
      y?: number
      height?: number
      width?: number
      excavate?: boolean
    }
  }

  export const QRCodeSVG: React.FC<QRCodeProps>
  export const QRCodeCanvas: React.FC<QRCodeProps>
}
