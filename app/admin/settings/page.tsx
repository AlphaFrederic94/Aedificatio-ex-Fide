"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { School, Users, Bell, Shield, Database, Calendar } from "lucide-react"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    schoolName: "Greenwood High School",
    schoolAddress: "123 Education Street, Learning City, LC 12345",
    schoolPhone: "(555) 123-4567",
    schoolEmail: "admin@greenwood.edu",
    academicYear: "2024-2025",
    timezone: "America/New_York",
    enableNotifications: true,
    enableParentPortal: true,
    enableStudentPortal: true,
    enableAttendanceTracking: true,
    enableGradeBook: true,
    maxStudentsPerClass: 30,
    gradeScale: "percentage",
    attendanceThreshold: 90,
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure school management system settings</p>
          </div>
          <Button>Save Changes</Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  School Information
                </CardTitle>
                <CardDescription>Basic school details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={settings.schoolName}
                      onChange={(e) => handleSettingChange("schoolName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select
                      value={settings.academicYear}
                      onValueChange={(value) => handleSettingChange("academicYear", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">School Address</Label>
                  <Textarea
                    id="schoolAddress"
                    value={settings.schoolAddress}
                    onChange={(e) => handleSettingChange("schoolAddress", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolPhone">Phone Number</Label>
                    <Input
                      id="schoolPhone"
                      value={settings.schoolPhone}
                      onChange={(e) => handleSettingChange("schoolPhone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolEmail">Email Address</Label>
                    <Input
                      id="schoolEmail"
                      type="email"
                      value={settings.schoolEmail}
                      onChange={(e) => handleSettingChange("schoolEmail", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Academic Settings
                </CardTitle>
                <CardDescription>Configure academic year and grading settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">Max Students Per Class</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      value={settings.maxStudentsPerClass}
                      onChange={(e) => handleSettingChange("maxStudentsPerClass", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradeScale">Grade Scale</Label>
                    <Select
                      value={settings.gradeScale}
                      onValueChange={(value) => handleSettingChange("gradeScale", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (0-100)</SelectItem>
                        <SelectItem value="letter">Letter Grades (A-F)</SelectItem>
                        <SelectItem value="gpa">GPA Scale (0-4.0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceThreshold">Attendance Threshold (%)</Label>
                  <Input
                    id="attendanceThreshold"
                    type="number"
                    value={settings.attendanceThreshold}
                    onChange={(e) => handleSettingChange("attendanceThreshold", Number.parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Minimum attendance required for course completion</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Access Settings
                </CardTitle>
                <CardDescription>Configure user portal access and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Student Portal</Label>
                    <p className="text-sm text-muted-foreground">Allow students to access their portal</p>
                  </div>
                  <Switch
                    checked={settings.enableStudentPortal}
                    onCheckedChange={(checked) => handleSettingChange("enableStudentPortal", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Parent Portal</Label>
                    <p className="text-sm text-muted-foreground">Allow parents to view student information</p>
                  </div>
                  <Switch
                    checked={settings.enableParentPortal}
                    onCheckedChange={(checked) => handleSettingChange("enableParentPortal", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Attendance Tracking</Label>
                    <p className="text-sm text-muted-foreground">Enable attendance tracking features</p>
                  </div>
                  <Switch
                    checked={settings.enableAttendanceTracking}
                    onCheckedChange={(checked) => handleSettingChange("enableAttendanceTracking", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Grade Book</Label>
                    <p className="text-sm text-muted-foreground">Enable grade book functionality</p>
                  </div>
                  <Switch
                    checked={settings.enableGradeBook}
                    onCheckedChange={(checked) => handleSettingChange("enableGradeBook", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable system-wide notifications</p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => handleSettingChange("enableNotifications", checked)}
                  />
                </div>
                <div className="space-y-4">
                  <Label>Email Notifications</Label>
                  <div className="space-y-3">
                    {[
                      { id: "attendance", label: "Attendance Alerts", description: "Low attendance warnings" },
                      { id: "grades", label: "Grade Updates", description: "New grade notifications" },
                      { id: "announcements", label: "School Announcements", description: "Important school updates" },
                      { id: "events", label: "Event Reminders", description: "Upcoming school events" },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{item.label}</Label>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Password Requirements</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Minimum 8 characters</Badge>
                        <Badge variant="outline">Uppercase required</Badge>
                        <Badge variant="outline">Numbers required</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>System maintenance and configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Backup Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>System Maintenance</Label>
                  <div className="flex gap-2">
                    <Button variant="outline">Backup Database</Button>
                    <Button variant="outline">Clear Cache</Button>
                    <Button variant="outline">Export Data</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
