#!/usr/bin/env node

/**
 * Integration Tests for School Management System
 * Tests the complete workflow from database to frontend
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Test configuration
const BACKEND_URL = 'http://localhost:4000/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test credentials
const TEST_USERS = {
  admin: { email: 'adminnoa@school.edu', password: 'admin123' },
  teacher: { email: 'ukuqala@gmail.com', password: 'Hello@94fbr' },
  student: { email: 'noafrederic91@gmail.com', password: 'Hello@94fbr' }
};

class IntegrationTester {
  constructor() {
    this.prisma = new PrismaClient();
    this.tokens = {};
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    console.log(`🧪 Running: ${name}...`);
    
    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ ${name} - PASSED`);
      this.results.details.push({ name, status: 'PASSED' });
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${name} - FAILED: ${error.message}`);
      this.results.details.push({ name, status: 'FAILED', error: error.message });
    }
    console.log('');
  }

  async testDatabaseConnection() {
    await this.prisma.$connect();
    const result = await this.prisma.$queryRaw`SELECT 1 as test`;
    if (!result || result[0].test !== 1) {
      throw new Error('Database query failed');
    }
  }

  async testDatabaseData() {
    const userCount = await this.prisma.user.count();
    const schoolCount = await this.prisma.school.count();
    
    if (userCount === 0) throw new Error('No users found in database');
    if (schoolCount === 0) throw new Error('No schools found in database');
    
    console.log(`   📊 Found ${userCount} users and ${schoolCount} schools`);
  }

  async testBackendHealth() {
    // Simple HTTP request without fetch
    const http = require('http');
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:4000/health', (res) => {
        if (res.statusCode === 200) {
          console.log('   🏥 Backend health check passed');
          resolve();
        } else {
          reject(new Error(\`Backend health check failed: \${res.statusCode}\`));
        }
      });
      req.on('error', (error) => {
        reject(new Error(\`Backend health check error: \${error.message}\`));
      });
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Backend health check timeout'));
      });
    });
  }

  async testAuthentication(role) {
    const credentials = TEST_USERS[role];
    const response = await fetch(`${BACKEND_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed for ${role}: ${response.status}`);
    }

    const data = await response.json();
    if (!data.token || !data.user) {
      throw new Error(`Invalid authentication response for ${role}`);
    }

    if (data.user.role !== role) {
      throw new Error(`Wrong role returned for ${role}: got ${data.user.role}`);
    }

    this.tokens[role] = data.token;
    console.log(`   🔑 ${role} authenticated successfully`);
  }

  async testAPIEndpoint(endpoint, role, method = 'GET', body = null) {
    const token = this.tokens[role];
    if (!token) {
      throw new Error(`No token available for ${role}`);
    }

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${method} ${endpoint} - ${response.status}`);
    }

    return await response.json();
  }

  async testStudentEndpoints() {
    // Test student can access their own data
    const students = await this.testAPIEndpoint('/students', 'student');
    console.log(`   👥 Student can access students endpoint`);

    // Test student can access classes
    const classes = await this.testAPIEndpoint('/classes', 'student');
    console.log(`   📚 Student can access classes: ${Array.isArray(classes) ? classes.length : 'N/A'} found`);

    // Test student can access enrollments
    const enrollments = await this.testAPIEndpoint('/enrollments', 'student');
    console.log(`   📝 Student can access enrollments`);
  }

  async testTeacherEndpoints() {
    // Test teacher can access classes
    const classes = await this.testAPIEndpoint('/classes', 'teacher');
    console.log(`   📚 Teacher can access classes: ${Array.isArray(classes) ? classes.length : 'N/A'} found`);

    // Test teacher can access students
    const students = await this.testAPIEndpoint('/students', 'teacher');
    console.log(`   👥 Teacher can access students`);

    // Test teacher can access assignments
    const assignments = await this.testAPIEndpoint('/assignments', 'teacher');
    console.log(`   📋 Teacher can access assignments`);
  }

  async testAdminEndpoints() {
    // Test admin can access all endpoints
    const students = await this.testAPIEndpoint('/students', 'admin');
    const teachers = await this.testAPIEndpoint('/teachers', 'admin');
    const classes = await this.testAPIEndpoint('/classes', 'admin');
    
    console.log(`   👥 Admin can access students`);
    console.log(`   👨‍🏫 Admin can access teachers`);
    console.log(`   📚 Admin can access classes`);
  }

  async testFrontendHealth() {
    const response = await fetch(FRONTEND_URL);
    if (!response.ok) {
      throw new Error(`Frontend not accessible: ${response.status}`);
    }
    console.log(`   🌐 Frontend accessible at ${FRONTEND_URL}`);
  }

  async testCreateClass() {
    const classData = {
      name: 'Test Integration Class',
      subject: 'Mathematics',
      grade: '12',
      room: 'Room 999',
      schedule: 'Monday 9:00-10:00',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Test class for integration testing',
      capacity: 30,
      status: 'pending'
    };

    const result = await this.testAPIEndpoint('/classes', 'teacher', 'POST', classData);
    console.log(`   📚 Teacher can create classes`);
    return result;
  }

  async runAllTests() {
    console.log('🚀 Starting Integration Tests...\n');
    console.log('📋 Test Configuration:');
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log(`   Frontend URL: ${FRONTEND_URL}`);
    console.log(`   Database: Render PostgreSQL\n`);

    // Database Tests
    await this.runTest('Database Connection', () => this.testDatabaseConnection());
    await this.runTest('Database Data Validation', () => this.testDatabaseData());

    // Backend Tests
    await this.runTest('Backend Health Check', () => this.testBackendHealth());

    // Authentication Tests
    await this.runTest('Admin Authentication', () => this.testAuthentication('admin'));
    await this.runTest('Teacher Authentication', () => this.testAuthentication('teacher'));
    await this.runTest('Student Authentication', () => this.testAuthentication('student'));

    // API Endpoint Tests
    await this.runTest('Student API Endpoints', () => this.testStudentEndpoints());
    await this.runTest('Teacher API Endpoints', () => this.testTeacherEndpoints());
    await this.runTest('Admin API Endpoints', () => this.testAdminEndpoints());

    // Frontend Tests
    await this.runTest('Frontend Accessibility', () => this.testFrontendHealth());

    // Workflow Tests
    await this.runTest('Create Class Workflow', () => this.testCreateClass());

    // Cleanup
    await this.prisma.$disconnect();

    // Results Summary
    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 All integration tests passed! System is production ready.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix the issues.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error running integration tests:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTester;
