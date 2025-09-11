import { StudentLayout } from "@/components/layout/student-layout"
import { AssignmentViewer } from "@/components/student/assignment-viewer"

export default function StudentAssignmentsPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground mt-2">
            View, submit, and track your assignments across all courses.
          </p>
        </div>
        <AssignmentViewer />
      </div>
    </StudentLayout>
  )
}
