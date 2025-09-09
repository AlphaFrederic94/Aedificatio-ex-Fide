"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { StudentSidebar } from "./student-sidebar"
import { LoginForm } from "@/components/login-form"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface StudentLayoutProps {
  children: React.ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && user.role !== "student") {
      // Redirect non-student users to their appropriate portal
      if (user.role === "admin") {
        router.push("/admin")
      } else if (user.role === "teacher") {
        router.push("/teacher")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoginForm />
      </div>
    )
  }

  if (user.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access the student portal.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="p-6 pt-16 md:pt-6">{children}</div>
      </main>
    </div>
  )
}
