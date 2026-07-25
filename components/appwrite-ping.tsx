"use client"

import { useEffect } from "react"
import { client } from "@/lib/appwrite"

export function AppwritePing() {
  useEffect(() => {
    client.ping().then((response) => {
      console.log("Appwrite ping:", response)
    }).catch((error) => {
      console.error("Appwrite ping failed:", error)
    })
  }, [])

  return null
}
