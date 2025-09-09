import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Sign In - EduManage School Management System",
  description: "Sign in to your EduManage account to access your school management dashboard.",
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <LoginForm />
    </Suspense>
  )
}
