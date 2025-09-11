import { TeacherLayout } from "@/components/layout/teacher-layout"
import { TeacherStudents } from "@/components/teacher/teacher-students"

export default function TeacherStudentsPage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-muted-foreground mt-2">View and manage students enrolled in your classes.</p>
        </div>
        <TeacherStudents />
      </div>
    </TeacherLayout>
  )
}
