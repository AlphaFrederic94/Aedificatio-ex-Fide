#!/usr/bin/env node

const { PrismaClient } = require('./server/node_modules/@prisma/client');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const prisma = new PrismaClient();

async function investigateSchoolMismatch() {
  console.log('🔍 INVESTIGATING SCHOOL ENROLLMENT ISSUE');
  console.log('========================================');
  
  try {
    // Get student details
    const student = await prisma.student.findFirst({
      where: { email: 'noafrederic91@gmail.com' },
      include: { user: true, school: true }
    });
    
    if (!student) {
      console.log('❌ Student not found');
      return;
    }
    
    console.log('👨‍🎓 STUDENT DETAILS:');
    console.log(`   Name: ${student.firstName} ${student.lastName}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   School ID: ${student.schoolId}`);
    console.log(`   School Name: ${student.school?.name || 'Unknown'}`);
    
    // Get teacher details
    const teacher = await prisma.teacher.findFirst({
      where: { email: 'ukuqala@gmail.com' },
      include: { user: true, school: true }
    });
    
    if (!teacher) {
      console.log('❌ Teacher not found');
      return;
    }
    
    console.log('\n👨‍🏫 TEACHER DETAILS:');
    console.log(`   Name: ${teacher.firstName} ${teacher.lastName}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   School ID: ${teacher.schoolId}`);
    console.log(`   School Name: ${teacher.school?.name || 'Unknown'}`);
    
    // Check if they're in the same school
    const sameSchool = student.schoolId === teacher.schoolId;
    console.log(`\n🏫 SCHOOL MATCH: ${sameSchool ? '✅ Same School' : '❌ Different Schools'}`);
    
    // Get teacher's classes
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId: teacher.id, deletedAt: null },
      include: { school: true }
    });
    
    console.log(`\n📚 TEACHER'S CLASSES: ${teacherClasses.length}`);
    teacherClasses.forEach(c => {
      console.log(`   - ${c.name} (School: ${c.school?.name || 'Unknown'}, Status: ${c.status})`);
    });
    
    // Get all classes in student's school
    const studentSchoolClasses = await prisma.class.findMany({
      where: { schoolId: student.schoolId, deletedAt: null },
      include: { teacher: true }
    });
    
    console.log(`\n🏫 CLASSES IN STUDENT'S SCHOOL: ${studentSchoolClasses.length}`);
    studentSchoolClasses.forEach(c => {
      console.log(`   - ${c.name} (Teacher: ${c.teacher?.firstName || 'Unknown'}, Status: ${c.status})`);
    });
    
    // Check if schools need to be aligned
    if (!sameSchool) {
      console.log('\n🔧 FIXING SCHOOL ALIGNMENT...');
      
      // Move teacher to student's school
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { schoolId: student.schoolId }
      });
      
      // Update teacher's classes to student's school
      await prisma.class.updateMany({
        where: { teacherId: teacher.id },
        data: { schoolId: student.schoolId }
      });
      
      console.log('✅ Teacher and classes moved to student\'s school');
      
      // Verify the fix
      const updatedTeacher = await prisma.teacher.findUnique({
        where: { id: teacher.id },
        include: { school: true }
      });
      
      console.log(`✅ Verification: Teacher now in school ${updatedTeacher.school?.name}`);
    }
    
    // Create a test class that's definitely in the student's school
    const testClass = await prisma.class.upsert({
      where: { 
        name_teacherId: {
          name: 'Chemistry Basics',
          teacherId: teacher.id
        }
      },
      update: {
        schoolId: student.schoolId,
        status: 'approved'
      },
      create: {
        name: 'Chemistry Basics',
        subject: 'Chemistry',
        grade: '12',
        room: 'Lab 201',
        schedule: 'Tuesday 14:00-15:30',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        description: 'Introduction to basic chemistry concepts and laboratory techniques',
        capacity: 25,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        schoolId: student.schoolId,
        status: 'approved'
      }
    });
    
    console.log(`\n✅ Test class created/updated: ${testClass.name} (ID: ${testClass.id})`);
    console.log(`   School ID: ${testClass.schoolId}`);
    console.log(`   Status: ${testClass.status}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateSchoolMismatch();
