#!/usr/bin/env node

/**
 * Local Database Setup Script
 * Sets up a local PostgreSQL database with test data
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗄️  Setting up local database for development...\n');

// Check if PostgreSQL is installed
function checkPostgreSQL() {
  return new Promise((resolve) => {
    const process = spawn('psql', ['--version'], { stdio: 'pipe' });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PostgreSQL is installed');
        resolve(true);
      } else {
        console.log('❌ PostgreSQL is not installed or not in PATH');
        console.log('   Please install PostgreSQL: https://www.postgresql.org/download/');
        resolve(false);
      }
    });
    
    process.on('error', () => {
      console.log('❌ PostgreSQL is not installed or not in PATH');
      console.log('   Please install PostgreSQL: https://www.postgresql.org/download/');
      resolve(false);
    });
  });
}

// Create database if it doesn't exist
function createDatabase() {
  return new Promise((resolve) => {
    console.log('🔧 Creating database "school_management"...');
    
    const process = spawn('createdb', ['school_management'], { stdio: 'pipe' });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database "school_management" created successfully');
        resolve(true);
      } else {
        console.log('⚠️  Database might already exist or creation failed');
        console.log('   This is usually fine if the database already exists');
        resolve(true); // Continue anyway
      }
    });
    
    process.on('error', (error) => {
      console.log('❌ Error creating database:', error.message);
      resolve(false);
    });
  });
}

// Run Prisma commands
function runPrismaCommand(command, args = []) {
  return new Promise((resolve) => {
    console.log(`🔧 Running: npx prisma ${command} ${args.join(' ')}...`);
    
    const process = spawn('npx', ['prisma', command, ...args], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'inherit'
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Prisma ${command} completed successfully`);
        resolve(true);
      } else {
        console.log(`❌ Prisma ${command} failed with exit code: ${code}`);
        resolve(false);
      }
    });
    
    process.on('error', (error) => {
      console.log(`❌ Error running Prisma ${command}:`, error.message);
      resolve(false);
    });
  });
}

// Create test users
function createTestUsers() {
  return new Promise((resolve) => {
    console.log('👥 Creating test users...');
    
    const script = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('argon2');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    // Create or get school
    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Test High School',
          slug: 'test-high-school',
        }
      });
      console.log('✅ Created test school');
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123');
    const admin = await prisma.user.upsert({
      where: { email: 'adminnoa@school.edu' },
      update: {},
      create: {
        email: 'adminnoa@school.edu',
        password: adminPassword,
        name: 'Admin Noa',
        role: 'admin',
        schoolId: school.id
      }
    });
    console.log('✅ Created admin user: adminnoa@school.edu / admin123');

    // Create teacher user
    const teacherPassword = await bcrypt.hash('Hello@94fbr');
    const teacher = await prisma.user.upsert({
      where: { email: 'ukuqala@gmail.com' },
      update: {},
      create: {
        email: 'ukuqala@gmail.com',
        password: teacherPassword,
        name: 'Ukuqala Teacher',
        role: 'teacher',
        schoolId: school.id
      }
    });

    // Create teacher profile
    const teacherProfile = await prisma.teacher.upsert({
      where: { userId: teacher.id },
      update: {},
      create: {
        userId: teacher.id,
        firstName: 'Ukuqala',
        lastName: 'Teacher',
        email: 'ukuqala@gmail.com',
        phone: '555-0125',
        department: 'Mathematics',
        hireDate: new Date(),
        status: 'active',
        schoolId: school.id
      }
    });

    // Update teacher user with teacherId
    await prisma.user.update({
      where: { id: teacher.id },
      data: { teacherId: teacherProfile.id }
    });
    console.log('✅ Created teacher user: ukuqala@gmail.com / Hello@94fbr');

    // Create student user
    const studentPassword = await bcrypt.hash('Hello@94fbr');
    const student = await prisma.user.upsert({
      where: { email: 'noafrederic91@gmail.com' },
      update: {},
      create: {
        email: 'noafrederic91@gmail.com',
        password: studentPassword,
        name: 'Noa Frederic',
        role: 'student',
        schoolId: school.id
      }
    });

    // Create student profile
    const studentProfile = await prisma.student.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        firstName: 'Noa',
        lastName: 'Frederic',
        email: 'noafrederic91@gmail.com',
        grade: '12',
        dateOfBirth: new Date('2005-01-01'),
        enrollmentDate: new Date(),
        status: 'active',
        parentName: 'Parent Frederic',
        parentEmail: 'parent@example.com',
        parentPhone: '555-0124',
        address: '123 Student St',
        schoolId: school.id
      }
    });

    // Update student user with studentId
    await prisma.user.update({
      where: { id: student.id },
      data: { studentId: studentProfile.id }
    });
    console.log('✅ Created student user: noafrederic91@gmail.com / Hello@94fbr');

    // Create a sample class
    const sampleClass = await prisma.class.create({
      data: {
        name: 'Advanced Mathematics',
        subject: 'Mathematics',
        grade: '12',
        teacherId: teacherProfile.id,
        teacherName: 'Ukuqala Teacher',
        room: 'Room 101',
        schedule: 'Monday 9:00-10:00',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        description: 'Advanced mathematics course for grade 12 students',
        capacity: 30,
        status: 'approved',
        schoolId: school.id
      }
    });
    console.log('✅ Created sample class: Advanced Mathematics');

    console.log('\\n🎉 Test users created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Admin: adminnoa@school.edu / admin123');
    console.log('   Teacher: ukuqala@gmail.com / Hello@94fbr');
    console.log('   Student: noafrederic91@gmail.com / Hello@94fbr');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
    `;

    fs.writeFileSync(path.join(__dirname, 'server', 'create-test-users.js'), script);
    
    const process = spawn('node', ['create-test-users.js'], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'inherit'
    });
    
    process.on('close', (code) => {
      // Clean up the temporary script
      try {
        fs.unlinkSync(path.join(__dirname, 'server', 'create-test-users.js'));
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (code === 0) {
        console.log('✅ Test users created successfully');
        resolve(true);
      } else {
        console.log('❌ Failed to create test users');
        resolve(false);
      }
    });
    
    process.on('error', (error) => {
      console.log('❌ Error creating test users:', error.message);
      resolve(false);
    });
  });
}

// Main setup function
async function setupLocalDatabase() {
  console.log('🚀 Starting local database setup...\n');

  // Check PostgreSQL installation
  const hasPostgreSQL = await checkPostgreSQL();
  if (!hasPostgreSQL) {
    console.log('\n❌ Setup failed: PostgreSQL is required');
    return false;
  }

  // Create database
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    console.log('\n❌ Setup failed: Could not create database');
    return false;
  }

  // Run Prisma migrations
  console.log('\n📋 Setting up database schema...');
  const schemaPushed = await runPrismaCommand('db', ['push']);
  if (!schemaPushed) {
    console.log('\n❌ Setup failed: Could not push database schema');
    return false;
  }

  // Generate Prisma client
  const clientGenerated = await runPrismaCommand('generate');
  if (!clientGenerated) {
    console.log('\n❌ Setup failed: Could not generate Prisma client');
    return false;
  }

  // Create test users
  const usersCreated = await createTestUsers();
  if (!usersCreated) {
    console.log('\n⚠️  Warning: Could not create test users');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 LOCAL DATABASE SETUP COMPLETE!');
  console.log('='.repeat(60));
  console.log('✅ PostgreSQL database "school_management" is ready');
  console.log('✅ Database schema has been applied');
  console.log('✅ Prisma client has been generated');
  if (usersCreated) {
    console.log('✅ Test users have been created');
  }
  console.log('\n📋 Next steps:');
  console.log('1. Start the backend server: cd server && npm run dev');
  console.log('2. Start the frontend: npm run dev');
  console.log('3. Open http://localhost:3000 in your browser');
  console.log('4. Login with the test credentials shown above');
  console.log('='.repeat(60));

  return true;
}

// Run the setup
setupLocalDatabase().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error during setup:', error);
  process.exit(1);
});
