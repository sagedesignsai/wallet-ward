"use client"

export type SSEHandler = (event: string, data: string, id?: string) => void

export type SSEHandle = {
  close(): void
  lastEventId: string | undefined
}

export function openSSE(
  options: {
    url: string
    credentials?: boolean
    headers?: Record<string, string>
    onOpen?: () => void
    onError?: (err: unknown) => void
    initialReconnectMs?: number
    maxReconnectMs?: number
  },
  handler: SSEHandler,
): SSEHandle {
  const {
    url,
    credentials = true,
    headers = {},
    onOpen,
    onError,
    initialReconnectMs = 1000,
    maxReconnectMs = 30000,
  } = options

  const controller = new AbortController()
  let lastEventId: string | undefined
  let reconnectMs = initialReconnectMs
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closed = false

  async function connect() {
    if (closed) return

    const fetchHeaders: Record<string, string> = {
      Accept: "text/event-stream",
      ...headers,
    }
    if (lastEventId) {
      fetchHeaders["Last-Event-ID"] = lastEventId
    }

    try {
      const res = await fetch(url, {
        headers: fetchHeaders,
        credentials: credentials ? "include" : "omit",
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`SSE connection failed: ${res.status}`)
      }

      reconnectMs = initialReconnectMs
      onOpen?.()

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""
      let eventType = "message"
      let dataLines: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (line === "") {
            // Blank line: dispatch event
            if (dataLines.length > 0) {
              const data = dataLines.join("\n")
              handler(eventType, data, lastEventId)
            }
            eventType = "message"
            dataLines = []
            continue
          }

          if (line.startsWith(":")) continue // comment

          const colonIdx = line.indexOf(":")
          const field = colonIdx === -1 ? line : line.slice(0, colonIdx)
          const value = colonIdx === -1 ? "" : line.slice(colonIdx + 1).replace(/^\s/, "")

          switch (field) {
            case "event":
              eventType = value || "message"
              break
            case "data":
              dataLines.push(value)
              break
            case "id":
              lastEventId = value
              break
            case "retry": {
              const ms = parseInt(value, 10)
              if (!isNaN(ms) && ms > 0) {
                reconnectMs = Math.min(ms, maxReconnectMs)
              }
              break
            }
          }
        }
      }

      // Stream closed by server — attempt reconnect
      if (!closed) scheduleReconnect()
    } catch (err) {
      if (closed || (err instanceof DOMException && err.name === "AbortError")) return
      onError?.(err)
      if (!closed) scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (closed) return
    const jitter = Math.random() * 200 - 100 // ±100ms
    reconnectTimer = setTimeout(() => {
      connect()
    }, reconnectMs + jitter)
  }

  connect()

  return {
    close() {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      controller.abort()
    },
    get lastEventId() {
      return lastEventId
    },
  }
}
