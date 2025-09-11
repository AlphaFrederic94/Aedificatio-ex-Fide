#!/usr/bin/env node

const { PrismaClient } = require('./server/node_modules/@prisma/client');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const prisma = new PrismaClient();

async function checkTeacherClasses() {
  console.log('🔍 Checking Teacher Classes Assignment...');
  
  try {
    // Find the teacher
    const teacher = await prisma.teacher.findFirst({
      where: { email: 'ukuqala@gmail.com' },
      include: { user: true }
    });
    
    if (!teacher) {
      console.log('❌ Teacher not found');
      return;
    }
    
    console.log(`👨‍🏫 Teacher found: ${teacher.firstName} ${teacher.lastName}`);
    console.log(`📧 Email: ${teacher.email}`);
    console.log(`🆔 Teacher ID: ${teacher.id}`);
    console.log(`🏫 School ID: ${teacher.schoolId}`);
    
    // Check classes assigned to this teacher
    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id, deletedAt: null }
    });
    
    console.log(`\n📚 Classes assigned to teacher: ${classes.length}`);
    classes.forEach(c => {
      console.log(`   - ${c.name} (${c.id})`);
    });
    
    // Check all classes in the school
    const allClasses = await prisma.class.findMany({
      where: { schoolId: teacher.schoolId, deletedAt: null },
      include: { teacher: true }
    });
    
    console.log(`\n🏫 All classes in school: ${allClasses.length}`);
    allClasses.forEach(c => {
      console.log(`   - ${c.name} (Teacher: ${c.teacher?.firstName || 'None'} ${c.teacher?.lastName || ''})`);
    });
    
    // If no classes assigned, assign one for testing
    if (classes.length === 0 && allClasses.length > 0) {
      console.log('\n🔧 Assigning first class to teacher for testing...');
      const classToAssign = allClasses[0];
      
      await prisma.class.update({
        where: { id: classToAssign.id },
        data: { teacherId: teacher.id }
      });
      
      console.log(`✅ Assigned class '${classToAssign.name}' to teacher`);
      
      // Verify assignment
      const updatedClass = await prisma.class.findUnique({
        where: { id: classToAssign.id },
        include: { teacher: true }
      });
      
      console.log(`✅ Verification: Class now assigned to ${updatedClass.teacher?.firstName} ${updatedClass.teacher?.lastName}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherClasses();
