import { StudentLayout } from "@/components/layout/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Edit } from "lucide-react"
import { StudentProfile } from "@/components/student/student-profile"

export default function StudentProfilePage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your personal information and academic details.
          </p>
        </div>
        <StudentProfile />
      </div>
    </StudentLayout>
  )
}
