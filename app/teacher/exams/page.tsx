'use client'

import { useState } from 'react'
import { TeacherLayout } from '@/components/layout/teacher-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExamCreator from '@/components/teacher/exam-creator'
import ExamGrading from '@/components/teacher/exam-grading'
import PastExams from '@/components/teacher/past-exams'
import { FileText, Plus, Trophy, History } from 'lucide-react'

export default function TeacherExamsPage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground">Create, manage, and grade exams for your classes</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Exam
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              My Exams
            </TabsTrigger>
            <TabsTrigger value="grade" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Grade Exams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <ExamCreator />
          </TabsContent>

          <TabsContent value="past">
            <PastExams />
          </TabsContent>

          <TabsContent value="grade">
            <ExamGrading />
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  )
}
