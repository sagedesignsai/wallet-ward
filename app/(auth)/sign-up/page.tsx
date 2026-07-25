import { Metadata } from "next"
import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new Nimbus account",
}

export default function SignUpPage() {
  return <SignUpForm />
}
