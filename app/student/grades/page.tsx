import { StudentLayout } from "@/components/layout/student-layout"
import { GradeOverview } from "@/components/student/grade-overview"

export default function StudentGradesPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Grades</h1>
          <p className="text-muted-foreground mt-2">Track your academic performance and progress across all courses.</p>
        </div>
        <GradeOverview />
      </div>
    </StudentLayout>
  )
}
