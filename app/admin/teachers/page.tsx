import { AdminLayout } from "@/components/layout/admin-layout"
import { TeacherList } from "@/components/teachers/teacher-list"

export default function AdminTeachersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage teacher profiles, assignments, and departmental information.
          </p>
        </div>
        <TeacherList />
      </div>
    </AdminLayout>
  )
}
