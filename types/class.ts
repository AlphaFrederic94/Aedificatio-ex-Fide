export interface Class {
  id: string
  name: string
  subject: string
  grade: string
  teacherId: string
  teacherName: string
  room: string
  schedule: string
  capacity: number
  enrolledStudents: string[]
  description: string
  startDate: string
  endDate: string
  status: "active" | "inactive" | "completed"
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateClassData {
  name: string
  subject: string
  grade: string
  teacherId: string
  room: string
  schedule: string
  capacity: number
  description: string
  startDate: string
  endDate: string
}

export interface UpdateClassData extends Partial<CreateClassData> {
  status?: "active" | "inactive" | "completed"
  enrolledStudents?: string[]
}
