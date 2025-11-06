import { StudentLayout } from "@/components/layout/student-layout"
import { StudentStats } from "@/components/student/student-stats"
import { MyCourses } from "@/components/student/my-courses"
import { UpcomingAssignments } from "@/components/student/upcoming-assignments"
import { GradeOverview } from "@/components/student/grade-overview"
import { UserActivityWidget } from "@/components/blockchain/user-activity-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Bell } from "lucide-react"

export default function StudentDashboard() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-white shadow-strong">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Student Dashboard</h1>
            <p className="text-white/90 text-lg">
              Welcome to your learning portal. Track your progress and stay organized with your studies.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <StudentStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <MyCourses />
          </div>

          {/* Upcoming Assignments */}
          <UpcomingAssignments />

          {/* Grade Overview */}
          <GradeOverview />
        </div>

        {/* Blockchain Activity Widget */}
        <UserActivityWidget />

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover-lift">
                  <div>
                    <div className="font-medium">Mathematics 101</div>
                    <div className="text-sm text-muted-foreground">Room 204 • Mr. Johnson</div>
                  </div>
                  <div className="text-sm font-medium text-primary">9:00 AM</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20 hover-lift">
                  <div>
                    <div className="font-medium">Physics 201</div>
                    <div className="text-sm text-muted-foreground">Lab 301 • Dr. Smith</div>
                  </div>
                  <div className="text-sm font-medium text-secondary">11:00 AM</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 hover-lift">
                  <div>
                    <div className="font-medium">World History</div>
                    <div className="text-sm text-muted-foreground">Room 105 • Ms. Davis</div>
                  </div>
                  <div className="text-sm font-medium text-accent">2:00 PM</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">Math Quiz Next Week</div>
                  <div className="text-xs text-muted-foreground mt-1">Prepare for Chapter 5 quiz on Friday</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">Library Hours Extended</div>
                  <div className="text-xs text-muted-foreground mt-1">Open until 9 PM during exam week</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">Science Fair Registration</div>
                  <div className="text-xs text-muted-foreground mt-1">Sign up by next Friday</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  )
}
