import { StudentLayout } from "@/components/layout/student-layout"
import { StudentSchedule } from "@/components/student/student-schedule"

export default function StudentSchedulePage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground mt-2">View your class schedule and upcoming sessions.</p>
        </div>
        <StudentSchedule />
      </div>
    </StudentLayout>
  )
}
