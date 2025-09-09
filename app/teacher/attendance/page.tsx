import { TeacherLayout } from "@/components/layout/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar } from "lucide-react"

export default function TeacherAttendancePage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage student attendance for your classes.</p>
        </div>

        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">Mathematics 101</h3>
                    <p className="text-sm text-muted-foreground">9:00 AM - 10:00 AM • Room 204</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Users className="h-3 w-3 mr-1" />
                    28/30 Present
                  </Badge>
                </div>
                <Button size="sm">Take Attendance</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">Physics 201</h3>
                    <p className="text-sm text-muted-foreground">11:00 AM - 12:00 PM • Lab 301</p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Users className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                <Button size="sm" variant="outline">
                  Take Attendance
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">Chemistry 101</h3>
                    <p className="text-sm text-muted-foreground">2:00 PM - 3:00 PM • Room 105</p>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Users className="h-3 w-3 mr-1" />
                    Upcoming
                  </Badge>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Take Attendance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">94%</div>
              <p className="text-xs text-muted-foreground">+2% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">91%</div>
              <p className="text-xs text-muted-foreground">-1% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">89%</div>
              <p className="text-xs text-muted-foreground">+3% from last month</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherLayout>
  )
}
