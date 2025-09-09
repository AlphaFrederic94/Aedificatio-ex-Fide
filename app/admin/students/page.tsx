import { AdminLayout } from "@/components/layout/admin-layout"
import { StudentList } from "@/components/students/student-list"

export default function AdminStudentsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all student records, enrollments, and academic information.
          </p>
        </div>
        <StudentList />
      </div>
    </AdminLayout>
  )
}
