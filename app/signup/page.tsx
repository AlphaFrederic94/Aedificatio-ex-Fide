import type { Metadata } from "next"
import Link from "next/link"
import { SignupForm } from "@/components/signup-form"
import { GraduationCap } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign Up - EduManage School Management System",
  description:
    "Create your EduManage account and start transforming your school management today. Join thousands of schools worldwide.",
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-center">
        <div className="max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <GraduationCap className="h-10 w-10" />
            <span className="text-3xl font-bold">EduManage</span>
          </Link>
          <h1 className="text-4xl font-bold mb-6 leading-tight">Transform Your School Management</h1>
          <p className="text-xl opacity-90 leading-relaxed mb-8">
            Join thousands of schools worldwide using EduManage to streamline operations, enhance teaching, and improve
            student outcomes.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
              <span>Complete student information system</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
              <span>Advanced grade and attendance tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
              <span>Comprehensive reporting and analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">EduManage</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Create Your Account</h2>
            <p className="text-muted-foreground">Start your free trial today. No credit card required.</p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
