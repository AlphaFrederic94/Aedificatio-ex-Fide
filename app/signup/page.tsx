import type { Metadata } from "next"
import { SignupForm } from "@/components/signup-form"

export const metadata: Metadata = {
  title: "Sign Up - EduManage School Management System",
  description:
    "Create your EduManage account and start transforming your school management today. Join thousands of schools worldwide.",
}

export default function SignupPage() {
  return <SignupForm />
}
