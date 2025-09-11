#!/usr/bin/env node

const http = require('http');

async function makeRequest(path, method = 'GET', body = null, token = null) {
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

async function testEnrollmentSystem() {
  console.log('🧪 Testing Student Enrollment System...');
  console.log('=====================================');
  
  try {
    // 1. Authenticate as student
    console.log('\n1️⃣ Authenticating as student...');
    const authResponse = await makeRequest('/auth', 'POST', {
      email: 'noafrederic91@gmail.com',
      password: 'Hello@94fbr'
    });
    
    if (authResponse.status !== 200) {
      throw new Error(`Student authentication failed: ${authResponse.status}`);
    }
    
    const token = authResponse.data.token;
    const studentData = authResponse.data.user;
    console.log(`✅ Student authenticated: ${studentData.email}`);
    console.log(`   Student ID: ${studentData.studentId}`);
    console.log(`   School ID: ${studentData.schoolId}`);
    
    // 2. Get available classes
    console.log('\n2️⃣ Fetching available classes...');
    const classesResponse = await makeRequest('/classes', 'GET', null, token);
    
    if (classesResponse.status !== 200) {
      throw new Error(`Failed to fetch classes: ${classesResponse.status}`);
    }
    
    const allClasses = classesResponse.data;
    const availableClasses = allClasses.filter(c => 
      (c.status === 'approved' || c.status === 'active') && 
      c.schoolId === studentData.schoolId
    );
    
    console.log(`✅ Total classes: ${allClasses.length}`);
    console.log(`✅ Available classes for student's school: ${availableClasses.length}`);
    
    availableClasses.forEach(c => {
      console.log(`   - ${c.name} (${c.subject}) - Status: ${c.status}`);
    });
    
    // 3. Check current enrollments
    console.log('\n3️⃣ Checking current enrollments...');
    const enrollmentsResponse = await makeRequest('/enrollments', 'GET', null, token);
    
    if (enrollmentsResponse.status !== 200) {
      throw new Error(`Failed to fetch enrollments: ${enrollmentsResponse.status}`);
    }
    
    const currentEnrollments = enrollmentsResponse.data;
    console.log(`✅ Current enrollments: ${currentEnrollments.length}`);
    
    currentEnrollments.forEach(e => {
      console.log(`   - ${e.class?.name || 'Unknown Class'}`);
    });
    
    // 4. Test enrollment in Chemistry class
    const chemistryClass = availableClasses.find(c => c.name === 'Chemistry Basics');
    
    if (!chemistryClass) {
      console.log('⚠️  Chemistry Basics class not found, skipping enrollment test');
      return;
    }
    
    // Check if already enrolled
    const alreadyEnrolled = currentEnrollments.some(e => e.classId === chemistryClass.id);
    
    if (alreadyEnrolled) {
      console.log('✅ Student is already enrolled in Chemistry Basics');
      return;
    }
    
    console.log('\n4️⃣ Testing enrollment in Chemistry Basics...');
    console.log(`   Class ID: ${chemistryClass.id}`);
    console.log(`   Class School ID: ${chemistryClass.schoolId}`);
    console.log(`   Student School ID: ${studentData.schoolId}`);
    console.log(`   School Match: ${chemistryClass.schoolId === studentData.schoolId ? '✅' : '❌'}`);
    
    const enrollmentResponse = await makeRequest('/enrollments', 'POST', {
      studentId: studentData.studentId,
      classId: chemistryClass.id
    }, token);
    
    console.log(`   Enrollment Response: ${enrollmentResponse.status}`);
    
    if (enrollmentResponse.status === 201) {
      console.log('✅ Successfully enrolled in Chemistry Basics!');
      console.log('🎉 Enrollment system working correctly!');
    } else {
      console.log(`❌ Enrollment failed: ${enrollmentResponse.status}`);
      console.log('Response:', JSON.stringify(enrollmentResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnrollmentSystem();
