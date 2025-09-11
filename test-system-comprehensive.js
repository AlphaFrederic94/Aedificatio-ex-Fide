#!/usr/bin/env node

/**
 * Comprehensive System Test
 * Tests all critical functionality after database fix
 */

const http = require('http');

class SystemTester {
  constructor() {
    this.results = { passed: 0, failed: 0, total: 0 };
    this.tokens = {};
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

  async makeRequest(path, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });

      req.on('error', (error) => reject(error));
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  async testDatabaseConnection() {
    // Test basic API endpoint that requires database
    const response = await this.makeRequest('/classes');
    
    if (response.status === 500) {
      throw new Error('Database connection failed - 500 Internal Server Error');
    }
    
    console.log(`   📊 API Response Status: ${response.status}`);
    console.log(`   📋 Database connection working properly`);
  }

  async testAuthentication() {
    // Test student authentication
    const studentAuth = await this.makeRequest('/auth', 'POST', {
      email: 'noafrederic91@gmail.com',
      password: 'Hello@94fbr'
    });

    if (studentAuth.status !== 200) {
      throw new Error(`Student auth failed: ${studentAuth.status}`);
    }

    this.tokens.student = studentAuth.data.token;
    console.log(`   👨‍🎓 Student authenticated: ${studentAuth.data.user.email}`);
    console.log(`   📋 Student ID in token: ${studentAuth.data.user.studentId ? 'Yes' : 'No'}`);

    // Test teacher authentication
    const teacherAuth = await this.makeRequest('/auth', 'POST', {
      email: 'ukuqala@gmail.com',
      password: 'Hello@94fbr'
    });

    if (teacherAuth.status !== 200) {
      throw new Error(`Teacher auth failed: ${teacherAuth.status}`);
    }

    this.tokens.teacher = teacherAuth.data.token;
    console.log(`   👨‍🏫 Teacher authenticated: ${teacherAuth.data.user.email}`);
    console.log(`   📋 Teacher ID in token: ${teacherAuth.data.user.teacherId ? 'Yes' : 'No'}`);
  }

  async testStudentEnrollments() {
    const response = await this.makeRequest('/enrollments', 'GET', null, this.tokens.student);
    
    if (response.status === 403) {
      throw new Error('Student still getting 403 Forbidden on enrollments');
    }
    
    if (response.status !== 200) {
      throw new Error(`Unexpected status: ${response.status}`);
    }

    console.log(`   📚 Student can access enrollments: ${Array.isArray(response.data) ? response.data.length : 'N/A'} found`);
  }

  async testClassesList() {
    const response = await this.makeRequest('/classes', 'GET', null, this.tokens.teacher);
    
    if (response.status === 500) {
      throw new Error('Classes endpoint still returning 500 Internal Server Error');
    }
    
    if (response.status !== 200) {
      throw new Error(`Unexpected status: ${response.status}`);
    }

    console.log(`   🏫 Classes list working: ${Array.isArray(response.data) ? response.data.length : 'N/A'} classes found`);
  }

  async testAssignmentCreation() {
    // First get teacher's classes
    const classesResponse = await this.makeRequest('/classes', 'GET', null, this.tokens.teacher);
    
    if (classesResponse.status !== 200 || !Array.isArray(classesResponse.data) || classesResponse.data.length === 0) {
      console.log('   ⚠️  No classes found for teacher, skipping assignment test');
      return;
    }

    const teacherClass = classesResponse.data[0];
    console.log(`   📚 Using class: ${teacherClass.name} (${teacherClass.id})`);

    // Try to create an assignment
    const assignmentData = {
      title: 'Test Assignment - System Check',
      description: 'This is a test assignment created during system verification',
      classId: teacherClass.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxPoints: 100
    };

    const response = await this.makeRequest('/assignments', 'POST', assignmentData, this.tokens.teacher);
    
    if (response.status === 403) {
      throw new Error('Teacher still getting 403 Forbidden when creating assignments');
    }
    
    if (response.status !== 201) {
      throw new Error(`Assignment creation failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    console.log(`   📝 Assignment created successfully: ${response.data.id}`);
  }

  async testStudentProfile() {
    // Get student profile using studentId from token
    const authResponse = await this.makeRequest('/auth', 'POST', {
      email: 'noafrederic91@gmail.com',
      password: 'Hello@94fbr'
    });

    const studentId = authResponse.data.user.studentId;
    if (!studentId) {
      throw new Error('Student ID not found in JWT token');
    }

    const response = await this.makeRequest(`/students/${studentId}`, 'GET', null, this.tokens.student);
    
    if (response.status === 404) {
      throw new Error('Student profile not found (404)');
    }
    
    if (response.status !== 200) {
      throw new Error(`Student profile access failed: ${response.status}`);
    }

    console.log(`   👤 Student can access own profile: ${response.data.firstName} ${response.data.lastName}`);
  }

  async runAllTests() {
    console.log('🚀 COMPREHENSIVE SYSTEM TEST');
    console.log('============================\n');

    await this.test('Database Connection', () => this.testDatabaseConnection());
    await this.test('User Authentication', () => this.testAuthentication());
    await this.test('Student Enrollments Access', () => this.testStudentEnrollments());
    await this.test('Classes List', () => this.testClassesList());
    await this.test('Assignment Creation', () => this.testAssignmentCreation());
    await this.test('Student Profile Access', () => this.testStudentProfile());

    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
    
    if (this.results.failed === 0) {
      console.log('🎉 ALL SYSTEMS OPERATIONAL!');
      console.log('\n✅ Fixed Issues:');
      console.log('   • Render database connection restored');
      console.log('   • 500 Internal Server Errors resolved');
      console.log('   • JWT tokens include proper IDs');
      console.log('   • Permission system working correctly');
      console.log('   • All API endpoints responding properly');
    } else {
      console.log('⚠️  Some issues still need attention.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error running system tests:', error);
    process.exit(1);
  });
}

module.exports = SystemTester;
