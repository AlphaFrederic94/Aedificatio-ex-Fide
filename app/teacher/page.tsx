import { TeacherLayout } from "@/components/layout/teacher-layout"
import { TeacherStats } from "@/components/teacher/teacher-stats"
import { MyClasses } from "@/components/teacher/my-classes"
import { RecentActivities } from "@/components/teacher/recent-activities"
import { UserActivityWidget } from "@/components/blockchain/user-activity-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MessageSquare } from "lucide-react"

export default function TeacherDashboard() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-white shadow-strong">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-white/90 text-lg">
              Welcome to your classroom management portal. Monitor your classes and student progress.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <TeacherStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Classes */}
          <div className="lg:col-span-2">
            <MyClasses />
          </div>

          {/* Recent Activities */}
          <RecentActivities />

          {/* Quick Info */}
          <div className="space-y-6">
            {/* Blockchain Activity Widget */}
            <UserActivityWidget />
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Schedule feature coming soon</p>
                  <p className="text-sm text-muted-foreground">Check your classes in the Classes section</p>
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-2 border rounded">
                    <div className="font-medium text-sm">Parent Conference Request</div>
                    <div className="text-xs text-muted-foreground">From: Mrs. Johnson</div>
                  </div>
                  <div className="p-2 border rounded">
                    <div className="font-medium text-sm">Grade Inquiry</div>
                    <div className="text-xs text-muted-foreground">From: Mr. Smith</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}
