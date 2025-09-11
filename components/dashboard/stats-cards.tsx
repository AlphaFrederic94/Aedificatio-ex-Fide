"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, BookOpen, TrendingUp } from "lucide-react"

interface Stats {
  totalStudents: number
  activeStudents: number
  totalTeachers: number
  activeTeachers: number
  totalClasses: number
  activeClasses: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    totalClasses: 0,
    activeClasses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined

      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        fetch("/api/students", headers ? { headers } : {}),
        fetch("/api/teachers", headers ? { headers } : {}),
        fetch("/api/classes", headers ? { headers } : {}),
      ])

      const students = studentsRes.ok ? await studentsRes.json() : []
      const teachers = teachersRes.ok ? await teachersRes.json() : []
      const classes = classesRes.ok ? await classesRes.json() : []

      const studentsArray = Array.isArray(students) ? students : []
      const teachersArray = Array.isArray(teachers) ? teachers : []
      const classesArray = Array.isArray(classes) ? classes : []

      const activeStudents = studentsArray.filter((s: any) => !s.deletedAt && s.status === "active")
      const activeTeachers = teachersArray.filter((t: any) => !t.deletedAt && t.status === "active")
      const activeClasses = classesArray.filter((c: any) => !c.deletedAt && c.status === "active")

      setStats({
        totalStudents: studentsArray.filter((s: any) => !s.deletedAt).length,
        activeStudents: activeStudents.length,
        totalTeachers: teachersArray.filter((t: any) => !t.deletedAt).length,
        activeTeachers: activeTeachers.length,
        totalClasses: classesArray.filter((c: any) => !c.deletedAt).length,
        activeClasses: activeClasses.length,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      subtitle: `${stats.activeTeachers} active`,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Classes",
      value: stats.totalClasses,
      subtitle: `${stats.activeClasses} active`,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Enrollment Rate",
      value: stats.activeClasses > 0 ? Math.round((stats.activeStudents / (stats.activeClasses * 25)) * 100) : 0,
      subtitle: "Average class fill",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      suffix: "%",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.value}
              {card.suffix}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
