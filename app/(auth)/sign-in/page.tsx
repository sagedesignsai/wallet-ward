import { Metadata } from "next"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Nimbus account",
}

export default function SignInPage() {
  return <SignInForm />
}
