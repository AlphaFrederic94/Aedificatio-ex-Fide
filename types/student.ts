export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  grade: string
  dateOfBirth: string
  enrollmentDate: string
  status: "active" | "inactive" | "graduated"
  parentName: string
  parentEmail: string
  parentPhone: string
  address: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateStudentData {
  firstName: string
  lastName: string
  email: string
  grade: string
  dateOfBirth: string
  enrollmentDate: string
  parentName: string
  parentEmail: string
  parentPhone: string
  address: string
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  status?: "active" | "inactive" | "graduated"
}
