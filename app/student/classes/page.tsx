import { StudentLayout } from "@/components/layout/student-layout"
import { MyCourses } from "@/components/student/my-courses"

export default function StudentClassesPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-2">
            View your enrolled courses, track progress, and access course materials.
          </p>
        </div>
        <MyCourses />
      </div>
    </StudentLayout>
  )
}
