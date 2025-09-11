const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function fixUsers() {
  console.log('=== FIXING USER SCHOOL ASSIGNMENTS ===');
  
  // Get or create default school
  const school = await prisma.school.upsert({
    where: { slug: 'default-school' },
    update: {},
    create: { name: 'Default School', slug: 'default-school' },
  });
  
  console.log(`School: ${school.name} (ID: ${school.id})`);
  
  // Create the specific users mentioned
  const users = [
    {
      email: 'noafrederic91@gmail.com',
      password: 'Hello@94fbr',
      name: 'Noa Frederic',
      role: 'student',
      firstName: 'Noa',
      lastName: 'Frederic'
    },
    {
      email: 'ukuqala@gmail.com', 
      password: 'Hello@94fbr',
      name: 'Ukuqala Teacher',
      role: 'teacher',
      firstName: 'Ukuqala',
      lastName: 'Teacher'
    },
    {
      email: 'adminnoa@school.edu',
      password: 'admin123',
      name: 'Admin Noa',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Noa'
    }
  ];
  
  for (const userData of users) {
    const passwordHash = await argon2.hash(userData.password);
    
    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { 
        schoolId: school.id,
        password: passwordHash,
        name: userData.name,
        role: userData.role
      },
      create: { 
        email: userData.email, 
        password: passwordHash, 
        name: userData.name, 
        role: userData.role, 
        schoolId: school.id 
      },
    });
    
    console.log(`User: ${user.email} | Role: ${user.role} | School: ${school.name}`);
    
    // Create role-specific profiles
    if (userData.role === 'student') {
      await prisma.student.upsert({
        where: { userId: user.id },
        update: { schoolId: school.id },
        create: {
          userId: user.id,
          schoolId: school.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          grade: '10',
          dateOfBirth: new Date('2000-01-01'),
          enrollmentDate: new Date(),
          parentName: 'Parent Name',
          parentEmail: 'parent@example.com',
          parentPhone: '1234567890',
          address: '123 Main St',
          status: 'active',
        },
      });
    }
    
    if (userData.role === 'teacher') {
      await prisma.teacher.upsert({
        where: { userId: user.id },
        update: { schoolId: school.id },
        create: {
          userId: user.id,
          schoolId: school.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: '1234567890',
          department: 'General',
          subject: 'Mathematics',
          hireDate: new Date(),
          qualification: 'Bachelor Degree',
          experience: 5,
          address: '123 Teacher St',
          emergencyContact: 'Emergency Contact',
          emergencyPhone: '0987654321',
          status: 'active',
        },
      });
    }
  }
  
  console.log('=== USER FIXES COMPLETE ===');
}

fixUsers().catch(console.error).finally(() => prisma.$disconnect());
