import { AdminLayout } from "@/components/layout/admin-layout"
import { ClassList } from "@/components/classes/class-list"

export default function AdminClassesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage classes, schedules, and student enrollments.</p>
        </div>
        <ClassList />
      </div>
    </AdminLayout>
  )
}
