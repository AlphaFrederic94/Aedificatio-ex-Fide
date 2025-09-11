import { AdminLayout } from "@/components/layout/admin-layout"
import { ClassApproval } from "@/components/admin/class-approval"

export default function ClassApprovalsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Class Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve class requests from teachers.
          </p>
        </div>
        <ClassApproval />
      </div>
    </AdminLayout>
  )
}
