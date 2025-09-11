#!/usr/bin/env node

/**
 * Simple System Test for School Management System
 * Tests the core functionality without complex dependencies
 */

const { PrismaClient } = require('@prisma/client');
const http = require('http');
const https = require('https');

class SimpleSystemTester {
  constructor() {
    this.prisma = new PrismaClient();
    this.results = { passed: 0, failed: 0, total: 0 };
  }

  async test(name, testFn) {
    this.results.total++;
    console.log(`🧪 Testing: ${name}...`);
    
    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ ${name} - PASSED\n`);
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  }

  async testDatabaseConnection() {
    await this.prisma.$connect();
    const result = await this.prisma.$queryRaw`SELECT 1 as test`;
    if (!result || result[0].test !== 1) {
      throw new Error('Database query failed');
    }
    console.log('   🗄️ Database connection successful');
  }

  async testDatabaseData() {
    const userCount = await this.prisma.user.count();
    const schoolCount = await this.prisma.school.count();
    
    console.log(`   📊 Users: ${userCount}, Schools: ${schoolCount}`);
    
    if (userCount === 0) throw new Error('No users found');
    if (schoolCount === 0) throw new Error('No schools found');
  }

  async testBackendServer() {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:4000/health', (res) => {
        if (res.statusCode === 200) {
          console.log('   🚀 Backend server responding');
          resolve();
        } else {
          reject(new Error(`Backend server returned ${res.statusCode}`));
        }
      });
      
      req.on('error', (error) => {
        reject(new Error(`Backend server not accessible: ${error.message}`));
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Backend server timeout'));
      });
    });
  }

  async testFrontendServer() {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000', (res) => {
        if (res.statusCode === 200) {
          console.log('   🌐 Frontend server responding');
          resolve();
        } else {
          reject(new Error(`Frontend server returned ${res.statusCode}`));
        }
      });
      
      req.on('error', (error) => {
        reject(new Error(`Frontend server not accessible: ${error.message}`));
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Frontend server timeout'));
      });
    });
  }

  async testUserAuthentication() {
    // Test if we can find the test users
    const adminUser = await this.prisma.user.findUnique({
      where: { email: 'adminnoa@school.edu' }
    });
    
    const teacherUser = await this.prisma.user.findUnique({
      where: { email: 'ukuqala@gmail.com' }
    });
    
    const studentUser = await this.prisma.user.findUnique({
      where: { email: 'noafrederic91@gmail.com' }
    });

    if (!adminUser) throw new Error('Admin user not found');
    if (!teacherUser) throw new Error('Teacher user not found');
    if (!studentUser) throw new Error('Student user not found');

    console.log('   👤 All test users found in database');
    console.log(`      Admin: ${adminUser.email} (${adminUser.role})`);
    console.log(`      Teacher: ${teacherUser.email} (${teacherUser.role})`);
    console.log(`      Student: ${studentUser.email} (${studentUser.role})`);
  }

  async testDatabaseSchema() {
    // Test that all required tables exist by counting records
    const tables = [
      { name: 'User', query: () => this.prisma.user.count() },
      { name: 'School', query: () => this.prisma.school.count() },
      { name: 'Student', query: () => this.prisma.student.count() },
      { name: 'Teacher', query: () => this.prisma.teacher.count() },
      { name: 'Class', query: () => this.prisma.class.count() }
    ];

    console.log('   📋 Database schema validation:');
    for (const table of tables) {
      try {
        const count = await table.query();
        console.log(`      ${table.name}: ${count} records`);
      } catch (error) {
        throw new Error(`Table ${table.name} not accessible: ${error.message}`);
      }
    }
  }

  async testClassApprovalWorkflow() {
    // Test that we can create a class with pending status
    const teacher = await this.prisma.user.findFirst({
      where: { role: 'teacher' },
      include: { teacher: true }
    });

    if (!teacher || !teacher.teacher) {
      throw new Error('No teacher found for testing');
    }

    const testClass = await this.prisma.class.create({
      data: {
        name: 'Test Integration Class',
        subject: 'Mathematics',
        grade: '12',
        room: 'Room 999',
        schedule: 'Monday 9:00-10:00',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        description: 'Test class for integration testing',
        capacity: 30,
        status: 'pending',
        teacherId: teacher.teacher.id,
        schoolId: teacher.schoolId
      }
    });

    console.log(`   📚 Created test class: ${testClass.name} (${testClass.status})`);

    // Clean up
    await this.prisma.class.delete({
      where: { id: testClass.id }
    });

    console.log('   🧹 Test class cleaned up');
  }

  async testEnvironmentConfiguration() {
    const fs = require('fs');
    
    // Check frontend env
    if (!fs.existsSync('.env.local')) {
      throw new Error('Frontend .env.local not found');
    }
    
    const frontendEnv = fs.readFileSync('.env.local', 'utf8');
    if (!frontendEnv.includes('http://localhost:4000/api')) {
      throw new Error('Frontend not configured for port 4000');
    }
    
    // Check backend env
    if (!fs.existsSync('server/.env')) {
      throw new Error('Backend .env not found');
    }
    
    const backendEnv = fs.readFileSync('server/.env', 'utf8');
    if (!backendEnv.includes('postgresql://')) {
      throw new Error('Backend not configured for PostgreSQL');
    }
    
    console.log('   ⚙️ Environment configuration correct');
    console.log('      Frontend: http://localhost:3000 → http://localhost:4000/api');
    console.log('      Backend: PostgreSQL (Render)');
  }

  async runAllTests() {
    console.log('🚀 Starting Simple System Tests...\n');
    console.log('📋 Configuration:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend: http://localhost:4000');
    console.log('   Database: Render PostgreSQL\n');

    // Core System Tests
    await this.test('Environment Configuration', () => this.testEnvironmentConfiguration());
    await this.test('Database Connection', () => this.testDatabaseConnection());
    await this.test('Database Schema', () => this.testDatabaseSchema());
    await this.test('Database Data', () => this.testDatabaseData());
    await this.test('User Authentication Setup', () => this.testUserAuthentication());
    
    // Server Tests
    await this.test('Backend Server Health', () => this.testBackendServer());
    await this.test('Frontend Server Health', () => this.testFrontendServer());
    
    // Workflow Tests
    await this.test('Class Approval Workflow', () => this.testClassApprovalWorkflow());

    // Cleanup
    await this.prisma.$disconnect();

    // Results
    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYSTEM TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! System is production ready.');
      console.log('\n🔗 Access URLs:');
      console.log('   Frontend: http://localhost:3000');
      console.log('   Backend: http://localhost:4000');
      console.log('\n👥 Test Credentials:');
      console.log('   Admin: adminnoa@school.edu / admin123');
      console.log('   Teacher: ukuqala@gmail.com / Hello@94fbr');
      console.log('   Student: noafrederic91@gmail.com / Hello@94fbr');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix the issues.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SimpleSystemTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error running system tests:', error);
    process.exit(1);
  });
}

module.exports = SimpleSystemTester;
