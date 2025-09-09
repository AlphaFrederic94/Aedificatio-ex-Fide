"use client"

import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TeacherList } from "@/components/teachers/teacher-list"

export default function TeachersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <DashboardLayout>
        <TeacherList />
      </DashboardLayout>
    </Suspense>
  )
}
