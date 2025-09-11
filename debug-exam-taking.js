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

async function debugExamTaking() {
  console.log('🔍 DEBUGGING EXAM TAKING PROCESS');
  console.log('================================');

  try {
    // Login as student
    const studentLogin = await makeRequest('POST', '/api/auth', {
      email: 'noafrederic91@gmail.com',
      password: 'Hello@94fbr'
    });

    if (studentLogin.status !== 200) {
      console.log('❌ Student login failed');
      return;
    }

    const studentToken = studentLogin.data.token;
    console.log('✅ Student logged in');

    // Get available exams
    const exams = await makeRequest('GET', '/api/exams/student', null, studentToken);
    console.log(`\n📚 Available exams: ${exams.data.length}`);
    
    // Find an available exam
    const availableExam = exams.data.find(exam => exam.submissions.length === 0);
    
    if (!availableExam) {
      console.log('❌ No available exams found');
      return;
    }

    console.log(`\n🎯 Taking exam: ${availableExam.title}`);
    console.log(`   Duration: ${availableExam.duration} minutes`);
    console.log(`   Total Marks: ${availableExam.totalMarks}`);
    console.log(`   Questions: ${availableExam.questions.length}`);

    // Start the exam
    console.log('\n1️⃣ STARTING EXAM');
    const startResult = await makeRequest('POST', `/api/exam-submissions/start/${availableExam.id}`, null, studentToken);
    
    console.log(`Start exam result: ${startResult.status}`);
    if (startResult.status !== 201) {
      console.log('❌ Failed to start exam:', startResult.data);
      return;
    }

    const submission = startResult.data;
    console.log('✅ Exam started successfully');
    console.log(`   Submission ID: ${submission.id}`);
    console.log(`   Started at: ${submission.startedAt}`);

    // Answer each question
    console.log('\n2️⃣ ANSWERING QUESTIONS');
    for (let i = 0; i < submission.exam.questions.length; i++) {
      const question = submission.exam.questions[i];
      console.log(`\nQuestion ${i + 1}: ${question.questionText.substring(0, 50)}...`);
      console.log(`   Type: ${question.questionType}`);
      console.log(`   Marks: ${question.marks}`);

      let answerData = {
        submissionId: submission.id,
        questionId: question.id
      };

      if (question.questionType === 'MCQ') {
        answerData.mcqAnswer = question.correctAnswer;
        console.log(`   Answering with: ${question.correctAnswer}`);
      } else {
        answerData.textAnswer = `This is a comprehensive answer for question ${question.order}. The student demonstrates understanding of the topic with detailed explanations and examples.`;
        console.log(`   Providing structural answer`);
      }

      const answerResult = await makeRequest('POST', '/api/exam-submissions/answer', answerData, studentToken);
      console.log(`   Answer submission result: ${answerResult.status}`);
      
      if (answerResult.status === 200) {
        console.log(`   ✅ Answer saved successfully`);
        if (question.questionType === 'MCQ') {
          console.log(`   Auto-graded: ${answerResult.data.isCorrect ? 'Correct' : 'Incorrect'}`);
          console.log(`   Marks awarded: ${answerResult.data.marksAwarded}`);
        }
      } else {
        console.log(`   ❌ Failed to save answer:`, answerResult.data);
      }
    }

    // Submit the exam
    console.log('\n3️⃣ SUBMITTING EXAM');
    const submitResult = await makeRequest('POST', `/api/exam-submissions/submit/${submission.id}`, null, studentToken);
    
    console.log(`Submit exam result: ${submitResult.status}`);
    if (submitResult.status === 200) {
      console.log('✅ Exam submitted successfully');
      console.log(`   Total Score: ${submitResult.data.totalScore}/${availableExam.totalMarks}`);
      console.log(`   MCQ Score: ${submitResult.data.mcqScore}`);
      console.log(`   Structural Score: ${submitResult.data.structuralScore}`);
      console.log(`   Is Graded: ${submitResult.data.isGraded}`);
      console.log(`   Submitted At: ${submitResult.data.submittedAt}`);
    } else {
      console.log('❌ Failed to submit exam:', submitResult.data);
    }

    // Verify the submission was saved
    console.log('\n4️⃣ VERIFYING SUBMISSION');
    const finalExams = await makeRequest('GET', '/api/exams/student', null, studentToken);
    const submittedExam = finalExams.data.find(e => e.id === availableExam.id);
    
    if (submittedExam && submittedExam.submissions.length > 0) {
      const finalSubmission = submittedExam.submissions[0];
      console.log('✅ Submission verified in database');
      console.log(`   Score: ${finalSubmission.totalScore}/${submittedExam.totalMarks}`);
      console.log(`   Status: ${finalSubmission.isGraded ? 'GRADED' : 'PENDING GRADING'}`);
    } else {
      console.log('❌ Submission not found in database');
    }

    console.log('\n🎉 EXAM TAKING DEBUG COMPLETE');

  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  }
}

debugExamTaking();
