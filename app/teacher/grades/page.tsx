import { TeacherLayout } from "@/components/layout/teacher-layout"
import { GradesManagement } from "@/components/teacher/grades-management"

export default function TeacherGradesPage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Grade Management</h1>
          <p className="text-muted-foreground mt-2">Manage grades and assessments for your classes.</p>
        </div>
        <GradesManagement />
      </div>
    </TeacherLayout>
  )
}
