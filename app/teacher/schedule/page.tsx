import { TeacherLayout } from "@/components/layout/teacher-layout"
import { TeacherSchedule } from "@/components/teacher/teacher-schedule"

export default function TeacherSchedulePage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground mt-2">View your teaching schedule and upcoming classes.</p>
        </div>
        <TeacherSchedule />
      </div>
    </TeacherLayout>
  )
}
