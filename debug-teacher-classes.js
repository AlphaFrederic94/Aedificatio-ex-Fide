const http = require('http');

async function makeRequest(method, path, data = null, token = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function debugTeacherClasses() {
  console.log('🔍 DEBUGGING TEACHER CLASSES');
  console.log('============================');

  try {
    // Login as teacher
    const teacherLogin = await makeRequest('POST', '/api/auth', {
      email: 'ukuqala@gmail.com',
      password: 'Hello@94fbr'
    });

    if (teacherLogin.status !== 200) {
      console.log('❌ Teacher login failed:', teacherLogin.data);
      return;
    }

    const teacherToken = teacherLogin.data.token;
    const teacherId = teacherLogin.data.user.teacherId;
    console.log(`✅ Teacher logged in: ${teacherId}`);

    // Get all classes
    const allClasses = await makeRequest('GET', '/api/classes', null, teacherToken);
    console.log(`\n📚 All classes response (${allClasses.status}):`);
    
    if (allClasses.status === 200) {
      console.log(`Found ${allClasses.data.length} classes:`);
      allClasses.data.forEach((c, index) => {
        console.log(`   ${index + 1}. ${c.name} (${c.subject})`);
        console.log(`      ID: ${c.id}`);
        console.log(`      Teacher ID: ${c.teacherId}`);
        console.log(`      School ID: ${c.schoolId}`);
        console.log(`      Status: ${c.status}`);
        console.log(`      Owned by current teacher: ${c.teacherId === teacherId ? '✅' : '❌'}`);
        console.log('');
      });

      // Filter classes owned by teacher
      const teacherClasses = allClasses.data.filter(c => c.teacherId === teacherId);
      console.log(`\n👨‍🏫 Classes owned by teacher: ${teacherClasses.length}`);
      
      if (teacherClasses.length > 0) {
        const testClass = teacherClasses[0];
        console.log(`\n🧪 Testing exam creation with class: ${testClass.name} (${testClass.id})`);

        // Try to create a test exam
        const testExam = {
          title: 'Debug Test Exam',
          description: 'Testing exam creation',
          classId: testClass.id,
          examType: 'MCQ',
          duration: 30,
          totalMarks: 20,
          passingMarks: 12,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          questions: [
            {
              questionText: 'What is 2 + 2?',
              questionType: 'MCQ',
              marks: 10,
              order: 1,
              optionA: '3',
              optionB: '4',
              optionC: '5',
              optionD: '6',
              correctAnswer: 'B'
            },
            {
              questionText: 'What is the capital of France?',
              questionType: 'MCQ',
              marks: 10,
              order: 2,
              optionA: 'London',
              optionB: 'Berlin',
              optionC: 'Paris',
              optionD: 'Madrid',
              correctAnswer: 'C'
            }
          ]
        };

        const examResult = await makeRequest('POST', '/api/exams', testExam, teacherToken);
        console.log(`\n📝 Exam creation result: ${examResult.status}`);
        
        if (examResult.status === 201) {
          console.log('✅ Exam created successfully!');
          console.log(`   Exam ID: ${examResult.data.id}`);
          console.log(`   Questions: ${examResult.data.questions.length}`);
        } else {
          console.log('❌ Exam creation failed:', examResult.data);
        }

        // Check existing exams
        const existingExams = await makeRequest('GET', '/api/exams', null, teacherToken);
        console.log(`\n📋 Existing exams: ${existingExams.status}`);
        if (existingExams.status === 200) {
          console.log(`Found ${existingExams.data.length} existing exams:`);
          existingExams.data.forEach((exam, index) => {
            console.log(`   ${index + 1}. ${exam.title} - Class: ${exam.class?.name || 'Unknown'}`);
          });
        }

      } else {
        console.log('❌ No classes owned by teacher');
      }

    } else {
      console.log('❌ Failed to fetch classes:', allClasses.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTeacherClasses();
