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

async function testAssignmentCreation() {
  console.log('🧪 Testing Assignment Creation Fix...');
  
  // First authenticate as teacher
  const authResponse = await makeRequest('/auth', 'POST', {
    email: 'ukuqala@gmail.com',
    password: 'Hello@94fbr'
  });
  
  if (authResponse.status !== 200) {
    throw new Error(`Auth failed: ${authResponse.status}`);
  }
  
  const token = authResponse.data.token;
  const teacherId = authResponse.data.user.teacherId;
  console.log(`✅ Teacher authenticated, teacherId: ${teacherId}`);
  
  // Get teacher's classes
  const classesResponse = await makeRequest('/classes', 'GET', null, token);
  
  if (classesResponse.status !== 200) {
    throw new Error(`Classes fetch failed: ${classesResponse.status}`);
  }
  
  const teacherClasses = classesResponse.data.filter(c => c.teacherId === teacherId);
  console.log(`📚 Teacher has ${teacherClasses.length} classes`);
  
  if (teacherClasses.length === 0) {
    console.log('⚠️  No classes owned by teacher, cannot test assignment creation');
    return;
  }
  
  const testClass = teacherClasses[0];
  console.log(`📖 Using class: ${testClass.name} (ID: ${testClass.id})`);
  
  // Try to create assignment
  const assignmentData = {
    title: 'Test Assignment - Fix Verification',
    description: 'Testing assignment creation after teacherId fix',
    classId: testClass.id,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxPoints: 100
  };
  
  const assignmentResponse = await makeRequest('/assignments', 'POST', assignmentData, token);
  
  console.log(`📝 Assignment creation result: ${assignmentResponse.status}`);
  
  if (assignmentResponse.status === 201) {
    console.log(`✅ Assignment created successfully: ${assignmentResponse.data.id}`);
    console.log('🎉 ASSIGNMENT CREATION FIX WORKING!');
  } else {
    console.log(`❌ Assignment creation failed: ${assignmentResponse.status}`);
    console.log('Response:', JSON.stringify(assignmentResponse.data, null, 2));
  }
}

testAssignmentCreation().catch(console.error);
