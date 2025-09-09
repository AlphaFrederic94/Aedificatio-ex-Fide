import { AdminLayout } from "@/components/layout/admin-layout"
import { MessagingSystem } from "@/components/messaging-system"

export default function AdminMessagesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-2">Communicate with teachers, students, and staff.</p>
        </div>
        <MessagingSystem />
      </div>
    </AdminLayout>
  )
}
