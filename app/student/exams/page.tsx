'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExamInterface from '@/components/student/exam-interface'
import ActivitiesFeed from '@/components/student/activities-feed'
import { FileText, Bell } from 'lucide-react'

export default function StudentExamsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Exams & Activities</h1>
        <p className="text-muted-foreground">Take exams and view your recent activities</p>
      </div>

      <Tabs defaultValue="exams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Available Exams
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams">
          <ExamInterface />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesFeed />
        </TabsContent>
      </Tabs>
    </div>
  )
}
