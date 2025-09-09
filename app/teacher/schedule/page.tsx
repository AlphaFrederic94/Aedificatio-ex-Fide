import { TeacherLayout } from "@/components/layout/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

export default function TeacherSchedulePage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground mt-2">View your teaching schedule and upcoming classes.</p>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Mathematics 101</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      9:00 AM - 10:00 AM
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Room 204
                    </span>
                  </div>
                </div>
                <Badge className="bg-blue-600">Current</Badge>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Physics 201</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      11:00 AM - 12:00 PM
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Lab 301
                    </span>
                  </div>
                </div>
                <Badge variant="outline">Next</Badge>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Chemistry 101</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      2:00 PM - 3:00 PM
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Room 105
                    </span>
                  </div>
                </div>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <div key={day} className="space-y-2">
                  <h4 className="font-medium text-sm">{day}</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded text-xs">
                      <div className="font-medium">Math 101</div>
                      <div className="text-muted-foreground">9:00 AM</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded text-xs">
                      <div className="font-medium">Physics 201</div>
                      <div className="text-muted-foreground">11:00 AM</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded text-xs">
                      <div className="font-medium">Chemistry 101</div>
                      <div className="text-muted-foreground">2:00 PM</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
