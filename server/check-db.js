const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  console.log('=== CHECKING EXISTING USERS ===');
  const users = await prisma.user.findMany({
    include: {
      school: true,
      student: true,
      teacher: true
    }
  });
  
  users.forEach(user => {
    console.log(`User: ${user.email} | Role: ${user.role} | School: ${user.school?.name || 'NO SCHOOL'} | StudentId: ${user.student?.id || 'N/A'} | TeacherId: ${user.teacher?.id || 'N/A'}`);
  });
  
  console.log('\n=== CHECKING SCHOOLS ===');
  const schools = await prisma.school.findMany();
  schools.forEach(school => {
    console.log(`School: ${school.name} | Slug: ${school.slug} | ID: ${school.id}`);
  });
}

checkUsers().catch(console.error).finally(() => prisma.$disconnect());
