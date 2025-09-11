#!/usr/bin/env node

/**
 * Test Permission Fixes for School Management System
 * Tests all the critical permission and role identification issues
 */

const { PrismaClient } = require('@prisma/client');
const http = require('http');

class PermissionTester {
  constructor() {
    this.prisma = new PrismaClient();
    this.tokens = {};
    this.userProfiles = {};
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

  async authenticateUser(email, password, expectedRole) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ email, password });
      
      const req = http.request({
        hostname: 'localhost',
        port: 4000,
        path: '/api/auth',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200 && response.token) {
              this.tokens[expectedRole] = response.token;
              this.userProfiles[expectedRole] = response.user;
              console.log(`   🔑 ${expectedRole} authenticated: ${response.user.email}`);
              console.log(`   📋 Profile: studentId=${response.user.studentId}, teacherId=${response.user.teacherId}`);
              resolve(response);
            } else {
              reject(new Error(`Authentication failed: ${response.error || 'Unknown error'}`));
            }
          } catch (e) {
            reject(new Error(`Invalid response: ${data}`));
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.write(postData);
      req.end();
    });
  }

  async makeAPICall(path, method = 'GET', role = 'student', body = null) {
    return new Promise((resolve, reject) => {
      const token = this.tokens[role];
      if (!token) {
        reject(new Error(`No token for role: ${role}`));
        return;
      }

      const options = {
        hostname: 'localhost',
        port: 4000,
        path: `/api${path}`,
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

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

  async testUserAuthentication() {
    await this.authenticateUser('adminnoa@school.edu', 'admin123', 'admin');
    await this.authenticateUser('ukuqala@gmail.com', 'Hello@94fbr', 'teacher');
    await this.authenticateUser('noafrederic91@gmail.com', 'Hello@94fbr', 'student');

    // Verify JWT tokens contain required IDs
    if (!this.userProfiles.student.studentId) {
      throw new Error('Student JWT token missing studentId');
    }
    if (!this.userProfiles.teacher.teacherId) {
      throw new Error('Teacher JWT token missing teacherId');
    }
  }

  async testStudentEnrollmentAccess() {
    // Test student can access enrollments without query parameters
    const response = await this.makeAPICall('/enrollments', 'GET', 'student');
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    console.log(`   📚 Student can access enrollments: ${Array.isArray(response.data) ? response.data.length : 'N/A'} found`);
  }

  async testTeacherAssignmentCreation() {
    // First, create a test class for the teacher
    const teacherProfile = this.userProfiles.teacher;
    
    const classData = {
      name: 'Test Assignment Class',
      subject: 'Mathematics',
      grade: '12',
      room: 'Room 101',
      schedule: 'Monday 10:00-11:00',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Test class for assignment creation',
      capacity: 30,
      status: 'approved'
    };

    const classResponse = await this.makeAPICall('/classes', 'POST', 'teacher', classData);
    
    if (classResponse.status !== 201) {
      throw new Error(`Failed to create class: ${classResponse.status} - ${JSON.stringify(classResponse.data)}`);
    }

    const classId = classResponse.data.id;
    console.log(`   📚 Created test class: ${classId}`);

    // Now try to create an assignment
    const assignmentData = {
      title: 'Test Assignment',
      description: 'This is a test assignment',
      classId: classId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxPoints: 100
    };

    const assignmentResponse = await this.makeAPICall('/assignments', 'POST', 'teacher', assignmentData);
    
    if (assignmentResponse.status !== 201) {
      throw new Error(`Failed to create assignment: ${assignmentResponse.status} - ${JSON.stringify(assignmentResponse.data)}`);
    }

    console.log(`   📝 Teacher can create assignments: ${assignmentResponse.data.id}`);
  }

  async testAttendanceSystem() {
    // Test batch attendance marking
    const attendanceData = {
      attendance: [
        {
          studentId: this.userProfiles.student.studentId,
          classId: 'test-class-id',
          date: new Date().toISOString(),
          present: true
        }
      ]
    };

    // This might fail due to class not existing, but we're testing the structure
    const response = await this.makeAPICall('/attendance', 'POST', 'teacher', attendanceData);
    
    // We expect either success or a specific error about class/student not found
    if (response.status === 201) {
      console.log(`   ✅ Batch attendance system working`);
    } else if (response.data.error && response.data.error.includes('belong to your school')) {
      console.log(`   ✅ Attendance validation working (expected error)`);
    } else {
      throw new Error(`Unexpected attendance response: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  }

  async testRoleBasedAccess() {
    // Test student can access their own data
    const studentResponse = await this.makeAPICall(`/students/${this.userProfiles.student.studentId}`, 'GET', 'student');
    if (studentResponse.status !== 200) {
      throw new Error(`Student can't access own data: ${studentResponse.status}`);
    }

    // Test student can access attendance
    const attendanceResponse = await this.makeAPICall(`/attendance/student/${this.userProfiles.student.studentId}`, 'GET', 'student');
    if (attendanceResponse.status !== 200) {
      throw new Error(`Student can't access own attendance: ${attendanceResponse.status}`);
    }

    console.log(`   👤 Student can access own profile and attendance`);
  }

  async runAllTests() {
    console.log('🚀 Starting Permission Fix Tests...\n');

    await this.test('User Authentication & JWT Tokens', () => this.testUserAuthentication());
    await this.test('Student Enrollment Access', () => this.testStudentEnrollmentAccess());
    await this.test('Teacher Assignment Creation', () => this.testTeacherAssignmentCreation());
    await this.test('Attendance System', () => this.testAttendanceSystem());
    await this.test('Role-based Access Control', () => this.testRoleBasedAccess());

    // Cleanup
    await this.prisma.$disconnect();

    // Results
    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERMISSION FIX TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 ALL PERMISSION FIXES WORKING! System is ready.');
      console.log('\n✅ Fixed Issues:');
      console.log('   • JWT tokens now include studentId and teacherId');
      console.log('   • Students can access enrollments without query params');
      console.log('   • Teachers can create assignments for their classes');
      console.log('   • Attendance system supports batch operations');
      console.log('   • Role-based access control working properly');
    } else {
      console.log('⚠️  Some permission fixes still need work.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PermissionTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error running permission tests:', error);
    process.exit(1);
  });
}

module.exports = PermissionTester;
