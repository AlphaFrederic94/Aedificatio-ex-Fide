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

async function debugApiResponse() {
  console.log('🔍 DEBUGGING API RESPONSE');
  console.log('=========================');

  try {
    // Login as student
    const studentLogin = await makeRequest('POST', '/api/auth', {
      email: 'noafrederic91@gmail.com',
      password: 'Hello@94fbr'
    });

    const studentToken = studentLogin.data.token;
    console.log('✅ Student logged in');

    // Get available exams and check the response structure
    const exams = await makeRequest('GET', '/api/exams/student', null, studentToken);
    console.log(`\n📚 API Response Status: ${exams.status}`);
    
    if (exams.data.length > 0) {
      const exam = exams.data.find(e => e.title === 'Complete Test Exam - Working');
      
      if (exam) {
        console.log(`\n🎯 Exam: ${exam.title}`);
        console.log('Full exam object:');
        console.log(JSON.stringify(exam, null, 2));
        
        if (exam.questions && exam.questions.length > 0) {
          console.log('\n📝 Questions details:');
          exam.questions.forEach((q, index) => {
            console.log(`\nQuestion ${index + 1}:`);
            console.log(`  ID: ${q.id}`);
            console.log(`  Text: ${q.questionText}`);
            console.log(`  Type: ${q.questionType}`);
            console.log(`  Marks: ${q.marks}`);
            
            if (q.questionType === 'MCQ') {
              console.log(`  Option A: ${q.optionA}`);
              console.log(`  Option B: ${q.optionB}`);
              console.log(`  Option C: ${q.optionC}`);
              console.log(`  Option D: ${q.optionD}`);
              console.log(`  Correct Answer: ${q.correctAnswer}`);
              console.log(`  Correct Answer Type: ${typeof q.correctAnswer}`);
            }
          });
        }

        // Start the exam to see the full response
        console.log('\n🚀 Starting exam to see full response...');
        const startResult = await makeRequest('POST', `/api/exam-submissions/start/${exam.id}`, null, studentToken);
        
        if (startResult.status === 201) {
          console.log('\n✅ Exam started, checking submission response:');
          console.log('Full submission object:');
          console.log(JSON.stringify(startResult.data, null, 2));
          
          if (startResult.data.exam && startResult.data.exam.questions) {
            console.log('\n📝 Questions in submission response:');
            startResult.data.exam.questions.forEach((q, index) => {
              console.log(`\nQuestion ${index + 1} in submission:`);
              console.log(`  ID: ${q.id}`);
              console.log(`  Type: ${q.questionType}`);
              console.log(`  Correct Answer: ${q.correctAnswer}`);
              console.log(`  Correct Answer Type: ${typeof q.correctAnswer}`);
            });
          }
        } else {
          console.log('❌ Failed to start exam:', startResult.data);
        }
      } else {
        console.log('❌ Test exam not found');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugApiResponse();
