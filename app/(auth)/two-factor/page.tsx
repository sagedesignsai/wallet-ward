import { Metadata } from "next"
import { TwoFactorVerifyCard } from "@/components/auth/two-factor-verify-card"

export const metadata: Metadata = {
  title: "Two-Factor Verification",
  description: "Verify your two-factor authentication code",
}

export default function TwoFactorPage() {
  return <TwoFactorVerifyCard />
}
