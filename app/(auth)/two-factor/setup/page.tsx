import { Metadata } from "next"
import { TwoFactorSetupCard } from "@/components/auth/two-factor-setup-card"

export const metadata: Metadata = {
  title: "Setup Two-Factor Authentication",
  description: "Enable two-factor authentication for your Wallet Ward account",
}

export default function TwoFactorSetupPage() {
  return <TwoFactorSetupCard />
}
