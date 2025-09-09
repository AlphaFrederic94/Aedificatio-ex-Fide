export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "student"
  studentId?: string // For students
  teacherId?: string // For teachers
  grade?: string // For students
  department?: string // For teachers
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
