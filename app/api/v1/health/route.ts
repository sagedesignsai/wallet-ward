import { json } from "@/lib/api/http"

export async function GET() {
  return json({
    data: {
      ok: true,
      service: "nimbus",
      version: "0.0.1",
      phase: 1,
    },
  })
}
