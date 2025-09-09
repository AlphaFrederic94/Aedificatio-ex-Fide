import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  // Create a school and scope users to it
  const school = await prisma.school.upsert({
    where: { slug: 'default-school' },
    update: {},
    create: { name: 'Default School', slug: 'default-school' },
  })

  const adminPass = await argon2.hash('admin123')
  const teacherPass = await argon2.hash('teacher123')
  const studentPass = await argon2.hash('student123')

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: { schoolId: school.id },
    create: { email: 'admin@school.edu', password: adminPass, name: 'School Administrator', role: 'admin', schoolId: school.id },
  })

  // Teacher 1
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.edu' },
    update: { schoolId: school.id },
    create: { email: 'teacher@school.edu', password: teacherPass, name: 'John Smith', role: 'teacher', schoolId: school.id },
  })
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: { schoolId: school.id },
    create: {
      userId: teacherUser.id,
      schoolId: school.id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'teacher@school.edu',
      phone: '1234567890',
      department: 'Mathematics',
      subject: 'Algebra',
      hireDate: new Date('2020-01-01'),
      qualification: 'MSc Mathematics',
      experience: 5,
      address: '123 Main St',
      emergencyContact: 'Jane Smith',
      emergencyPhone: '0987654321',
      status: 'active',
    },
  })

  // Teacher 2
  const teacher2User = await prisma.user.upsert({
    where: { email: 'teacher2@school.edu' },
    update: { schoolId: school.id },
    create: { email: 'teacher2@school.edu', password: teacherPass, name: 'Alice Johnson', role: 'teacher', schoolId: school.id },
  })
  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacher2User.id },
    update: { schoolId: school.id },
    create: {
      userId: teacher2User.id,
      schoolId: school.id,
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'teacher2@school.edu',
      phone: '2223334444',
      department: 'Science',
      subject: 'Chemistry',
      hireDate: new Date('2021-08-15'),
      qualification: 'MSc Chemistry',
      experience: 3,
      address: '789 Oak St',
      emergencyContact: 'Bob Johnson',
      emergencyPhone: '3334445555',
      status: 'active',
    },
  })

  // Student 1
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: { schoolId: school.id },
    create: { email: 'student@school.edu', password: studentPass, name: 'Jane Doe', role: 'student', schoolId: school.id },
  })
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: { schoolId: school.id },
    create: {
      userId: studentUser.id,
      schoolId: school.id,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'student@school.edu',
      grade: '10',
      dateOfBirth: new Date('2008-05-05'),
      enrollmentDate: new Date('2023-09-01'),
      parentName: 'Mary Doe',
      parentEmail: 'mary@example.com',
      parentPhone: '1112223333',
      address: '456 Elm St',
      status: 'active',
    },
  })

  // Additional students (4 total new including student above => add 3 more)
  const moreStudents = [
    { email: 'student2@school.edu', firstName: 'Liam', lastName: 'Ng', grade: '10' },
    { email: 'student3@school.edu', firstName: 'Olivia', lastName: 'Park', grade: '11' },
    { email: 'student4@school.edu', firstName: 'Noah', lastName: 'Lee', grade: '9' },
    { email: 'student5@school.edu', firstName: 'Ava', lastName: 'Kim', grade: '12' },
  ]

  for (const s of moreStudents) {
    const su = await prisma.user.upsert({
      where: { email: s.email },
      update: { schoolId: school.id },
      create: { email: s.email, password: studentPass, name: `${s.firstName} ${s.lastName}`, role: 'student', schoolId: school.id },
    })
    await prisma.student.upsert({
      where: { userId: su.id },
      update: { schoolId: school.id },
      create: {
        userId: su.id,
        schoolId: school.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        grade: s.grade,
        dateOfBirth: new Date('2008-01-01'),
        enrollmentDate: new Date('2023-09-01'),
        parentName: `${s.firstName} Parent`,
        parentEmail: `${s.firstName.toLowerCase()}@example.com`,
        parentPhone: '1002003000',
        address: '123 Any St',
        status: 'active',
      },
    })
  }

  // Classes
  const class1 = await prisma.class.upsert({
    where: { id: 'seed-class-1' },
    update: {},
    create: {
      id: 'seed-class-1',
      schoolId: school.id,
      name: 'Math 101',
      subject: 'Mathematics',
      grade: '10',
      teacherId: teacher.id,
      teacherName: 'John Smith',
      room: 'A1',
      schedule: 'Mon/Wed 10:00-11:00',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-01'),
      description: 'Introductory algebra',
      capacity: 30,
      status: 'active',
    },
  })

  const class2 = await prisma.class.upsert({
    where: { id: 'seed-class-2' },
    update: {},
    create: {
      id: 'seed-class-2',
      schoolId: school.id,
      name: 'Chemistry Basics',
      subject: 'Science',
      grade: '11',
      teacherId: teacher2.id,
      teacherName: 'Alice Johnson',
      room: 'B2',
      schedule: 'Tue/Thu 11:00-12:00',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-01'),
      description: 'Intro to Chemistry',
      capacity: 28,
      status: 'active',
    },
  })

  // Enroll some students
  const allStudents = await prisma.student.findMany({ where: { schoolId: school.id } })
  for (const s of allStudents.slice(0, 3)) {
    const existing = await prisma.enrollment.findFirst({ where: { studentId: s.id, classId: class1.id } })
    if (!existing) {
      await prisma.enrollment.create({ data: { studentId: s.id, classId: class1.id } })
    }
  }
  for (const s of allStudents.slice(2, 5)) {
    const existing = await prisma.enrollment.findFirst({ where: { studentId: s.id, classId: class2.id } })
    if (!existing) {
      await prisma.enrollment.create({ data: { studentId: s.id, classId: class2.id } })
    }
  }
}

main().finally(async () => {
  await prisma.$disconnect()
})

