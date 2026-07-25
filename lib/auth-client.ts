import { createAuthClient } from "better-auth/react"
import { organizationClient, twoFactorClient } from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    organizationClient(),
    apiKeyClient(),
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
  ],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  twoFactor,
} = authClient
