export interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  subject: string
  hireDate: string
  status: "active" | "inactive" | "on-leave"
  qualification: string
  experience: number
  address: string
  emergencyContact: string
  emergencyPhone: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateTeacherData {
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  subject: string
  hireDate: string
  qualification: string
  experience: number
  address: string
  emergencyContact: string
  emergencyPhone: string
}

export interface UpdateTeacherData extends Partial<CreateTeacherData> {
  status?: "active" | "inactive" | "on-leave"
}
