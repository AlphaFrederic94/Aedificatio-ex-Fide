import { TeacherLayout } from "@/components/layout/teacher-layout"
import { StudentGradesView } from "@/components/teacher/student-grades-view"

export default function TeacherGradesPage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Grades & Performance</h1>
          <p className="text-muted-foreground mt-2">View student exam results, grades, and performance analytics.</p>
        </div>
        <StudentGradesView />
      </div>
    </TeacherLayout>
  )
}
