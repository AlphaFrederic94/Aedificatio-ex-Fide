import { StudentLayout } from "@/components/layout/student-layout"
import { UpcomingAssignments } from "@/components/student/upcoming-assignments"

export default function StudentAssignmentsPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground mt-2">
            View upcoming assignments, track deadlines, and submit your work.
          </p>
        </div>
        <UpcomingAssignments />
      </div>
    </StudentLayout>
  )
}
