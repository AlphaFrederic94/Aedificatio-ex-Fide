import { TeacherLayout } from "@/components/layout/teacher-layout"
import { MessagingSystem } from "@/components/messaging-system"

export default function TeacherMessagesPage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-2">Communicate with students, parents, and colleagues.</p>
        </div>
        <MessagingSystem />
      </div>
    </TeacherLayout>
  )
}
