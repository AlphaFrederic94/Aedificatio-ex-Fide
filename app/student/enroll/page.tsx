import { StudentLayout } from "@/components/layout/student-layout"
import { CourseEnrollment } from "@/components/student/course-enrollment"

export default function StudentEnrollPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Course Enrollment</h1>
          <p className="text-muted-foreground mt-2">
            Browse available courses and enroll in the ones that interest you.
          </p>
        </div>
        <CourseEnrollment />
      </div>
    </StudentLayout>
  )
}
