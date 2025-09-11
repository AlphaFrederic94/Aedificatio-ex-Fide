const { PrismaClient } = require('./server/node_modules/@prisma/client');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const prisma = new PrismaClient();

async function createChemistryClass() {
  console.log('🧪 Creating Chemistry Class...');
  
  try {
    const teacher = await prisma.teacher.findFirst({
      where: { email: 'ukuqala@gmail.com' }
    });
    
    const student = await prisma.student.findFirst({
      where: { email: 'noafrederic91@gmail.com' }
    });
    
    if (!teacher || !student) {
      console.log('❌ Teacher or student not found');
      return;
    }
    
    // Check if class already exists
    const existing = await prisma.class.findFirst({
      where: { name: 'Chemistry Basics', teacherId: teacher.id }
    });
    
    if (existing) {
      console.log('✅ Chemistry class already exists:', existing.name);
      return;
    }
    
    // Create Chemistry class
    const chemClass = await prisma.class.create({
      data: {
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
    
    console.log(`✅ Chemistry class created: ${chemClass.name} (ID: ${chemClass.id})`);
    console.log(`   School: ${chemClass.schoolId}`);
    console.log(`   Status: ${chemClass.status}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createChemistryClass();
