import { TeacherLayout } from "@/components/layout/teacher-layout"
import { TeacherAttendance } from "@/components/teacher/teacher-attendance"

export default function TeacherAttendancePage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage student attendance for your classes.</p>
        </div>
        <TeacherAttendance />
      </div>
    </TeacherLayout>
  )
}
