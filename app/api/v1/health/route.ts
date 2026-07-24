import { json } from "@/lib/api/http"

export async function GET() {
  return json({
    data: {
      ok: true,
      service: "wallet-ward",
      version: "0.0.1",
      phase: 1,
    },
  })
}
