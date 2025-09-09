import { StudentLayout } from "@/components/layout/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, User } from "lucide-react"

export default function StudentSchedulePage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground mt-2">View your class schedule and upcoming events.</p>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Classes
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
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Mr. Johnson
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
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Dr. Smith
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
                  <h3 className="font-medium">World History</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      2:00 PM - 3:00 PM
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Room 105
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Ms. Davis
                    </span>
                  </div>
                </div>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <div key={day} className="space-y-2">
                  <h4 className="font-medium text-sm text-center">{day}</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded text-xs">
                      <div className="font-medium">Math 101</div>
                      <div className="text-muted-foreground">9:00 AM</div>
                      <div className="text-muted-foreground">Room 204</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded text-xs">
                      <div className="font-medium">Physics 201</div>
                      <div className="text-muted-foreground">11:00 AM</div>
                      <div className="text-muted-foreground">Lab 301</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded text-xs">
                      <div className="font-medium">World History</div>
                      <div className="text-muted-foreground">2:00 PM</div>
                      <div className="text-muted-foreground">Room 105</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Math Quiz - Chapter 5</h4>
                  <p className="text-xs text-muted-foreground">Tomorrow, 9:00 AM • Mathematics 101</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Physics Lab Report Due</h4>
                  <p className="text-xs text-muted-foreground">Dec 18, 2024 • Physics 201</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">History Presentation</h4>
                  <p className="text-xs text-muted-foreground">Dec 20, 2024 • World History</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  )
}
