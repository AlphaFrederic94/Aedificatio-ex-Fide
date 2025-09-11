#!/usr/bin/env node

const { PrismaClient } = require('./server/node_modules/@prisma/client');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🔧 Creating Test Data for Assignment Testing...');
  
  try {
    // Get teacher
    const teacher = await prisma.teacher.findFirst({
      where: { email: 'ukuqala@gmail.com' }
    });
    
    if (!teacher) {
      console.log('❌ Teacher not found');
      return;
    }
    
    console.log(`👨‍🏫 Teacher found: ${teacher.firstName} ${teacher.lastName}`);
    
    // Check if test class already exists
    const existingClass = await prisma.class.findFirst({
      where: { 
        teacherId: teacher.id,
        name: 'Test Mathematics Class'
      }
    });
    
    if (existingClass) {
      console.log('✅ Test class already exists:', existingClass.name);
      return existingClass;
    }
    
    // Create a test class for the teacher
    const testClass = await prisma.class.create({
      data: {
        name: 'Test Mathematics Class',
        subject: 'Mathematics',
        grade: '12',
        room: 'Room 101',
        schedule: 'Monday 10:00-11:00',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        description: 'Test class for assignment creation testing',
        capacity: 30,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        schoolId: teacher.schoolId,
        status: 'approved'
      }
    });
    
    console.log(`✅ Test class created: ${testClass.name} (ID: ${testClass.id})`);
    
    // Verify the class was created
    const verification = await prisma.class.findUnique({
      where: { id: testClass.id },
      include: { teacher: true }
    });
    
    console.log(`✅ Verification: Class assigned to teacher ${verification.teacher?.firstName} ${verification.teacher?.lastName}`);
    
    return testClass;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
