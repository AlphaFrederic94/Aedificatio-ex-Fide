"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, GraduationCap, BookOpen, FileText, Settings, BarChart3, Calendar, Download } from "lucide-react"

export function AdminQuickActions() {
  const quickActions = [
    {
      title: "Add New Student",
      description: "Register a new student",
      icon: UserPlus,
      href: "/admin/students?action=add",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Add New Teacher",
      description: "Hire a new teacher",
      icon: GraduationCap,
      href: "/admin/teachers?action=add",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Create New Class",
      description: "Set up a new class",
      icon: BookOpen,
      href: "/admin/classes?action=add",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Generate Reports",
      description: "View analytics & reports",
      icon: BarChart3,
      href: "/admin/reports",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Manage Schedule",
      description: "Update class schedules",
      icon: Calendar,
      href: "/admin/schedule",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "System Settings",
      description: "Configure system settings",
      icon: Settings,
      href: "/admin/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Export Data",
      description: "Download system data",
      icon: Download,
      href: "/admin/export",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "System Logs",
      description: "View system activity",
      icon: FileText,
      href: "/admin/logs",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-accent/50 transition-colors"
              >
                <div className={`p-3 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
