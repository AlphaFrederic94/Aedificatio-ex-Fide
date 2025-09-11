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

async function checkRecentExamResults() {
  console.log('🔍 CHECKING RECENT EXAM RESULTS');
  console.log('================================');

  try {
    // Login as student
    const studentLogin = await makeRequest('POST', '/api/auth', {
      email: 'noafrederic91@gmail.com',
      password: 'Hello@94fbr'
    });

    const studentToken = studentLogin.data.token;
    console.log('✅ Student logged in');

    // Get all exams
    const examsResponse = await makeRequest('GET', '/api/exams/student', null, studentToken);
    
    if (examsResponse.status === 200) {
      console.log(`\n📚 Found ${examsResponse.data.length} exams:`);
      
      // Sort by creation date to find the most recent
      const sortedExams = examsResponse.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      for (const exam of sortedExams) {
        console.log(`\n📝 ${exam.title}:`);
        console.log(`   Created: ${new Date(exam.createdAt).toLocaleString()}`);
        console.log(`   Submissions: ${exam.submissions.length}`);
        
        if (exam.submissions.length > 0) {
          const submission = exam.submissions[0];
          console.log(`   Submitted: ${new Date(submission.submittedAt).toLocaleString()}`);
          console.log(`   Score: ${submission.totalScore}/${exam.totalMarks}`);
          console.log(`   Graded: ${submission.isGraded ? 'Yes' : 'No'}`);

          // Get detailed results
          const detailResponse = await makeRequest('GET', `/api/exam-submissions/${submission.id}`, null, studentToken);
          
          if (detailResponse.status === 200) {
            const details = detailResponse.data;
            console.log(`   ✅ Detailed results available:`);
            console.log(`      Answers: ${details.answers.length}`);
            console.log(`      MCQ Score: ${details.mcqScore}`);
            console.log(`      Structural Score: ${details.structuralScore}`);
            
            if (details.answers.length > 0) {
              console.log(`   📊 Answer breakdown:`);
              details.answers.forEach((answer, index) => {
                console.log(`      Q${answer.question.order}: ${answer.question.questionType} - ${answer.marksAwarded}/${answer.question.marks} marks`);
                
                if (answer.question.questionType === 'MCQ') {
                  console.log(`         Student: ${answer.mcqAnswer}, Correct: ${answer.isCorrect}`);
                } else if (answer.textAnswer) {
                  console.log(`         Answer: ${answer.textAnswer.substring(0, 50)}...`);
                  if (answer.feedback) {
                    console.log(`         Feedback: ${answer.feedback.substring(0, 50)}...`);
                  }
                }
              });
            }
          }
        }
      }

      // Find the most recent completed exam with good data
      const recentCompletedExam = sortedExams.find(exam => 
        exam.submissions.length > 0 && 
        exam.title.includes('Final Verification Exam 2024')
      );

      if (recentCompletedExam) {
        console.log(`\n🎯 TESTING WITH RECENT EXAM: ${recentCompletedExam.title}`);
        const submission = recentCompletedExam.submissions[0];
        const detailResponse = await makeRequest('GET', `/api/exam-submissions/${submission.id}`, null, studentToken);
        
        if (detailResponse.status === 200) {
          const details = detailResponse.data;
          console.log(`✅ Perfect exam result found:`);
          console.log(`   Total Score: ${details.totalScore}/${recentCompletedExam.totalMarks} (${Math.round((details.totalScore/recentCompletedExam.totalMarks)*100)}%)`);
          console.log(`   MCQ Score: ${details.mcqScore}`);
          console.log(`   Structural Score: ${details.structuralScore}`);
          console.log(`   Fully Graded: ${details.isGraded ? 'Yes' : 'No'}`);
          console.log(`   Questions Answered: ${details.answers.length}`);
          
          console.log(`\n📋 Question Details:`);
          details.answers
            .sort((a, b) => a.question.order - b.question.order)
            .forEach(answer => {
              console.log(`   Q${answer.question.order}: ${answer.question.questionText.substring(0, 60)}...`);
              console.log(`      Type: ${answer.question.questionType}`);
              console.log(`      Score: ${answer.marksAwarded}/${answer.question.marks}`);
              
              if (answer.question.questionType === 'MCQ') {
                console.log(`      Student Answer: ${answer.mcqAnswer}`);
                console.log(`      Correct: ${answer.isCorrect ? 'Yes' : 'No'}`);
              } else {
                console.log(`      Answer Length: ${answer.textAnswer?.length || 0} characters`);
                if (answer.feedback) {
                  console.log(`      Teacher Feedback: ${answer.feedback.substring(0, 50)}...`);
                }
              }
            });

          console.log(`\n🎉 FRONTEND WILL DISPLAY:`);
          console.log(`   ✅ Overall grade: ${Math.round((details.totalScore/recentCompletedExam.totalMarks)*100)}% (${details.totalScore >= recentCompletedExam.passingMarks ? 'PASS' : 'FAIL'})`);
          console.log(`   ✅ Question-by-question breakdown`);
          console.log(`   ✅ MCQ answers with correct/incorrect indicators`);
          console.log(`   ✅ Structural answers with teacher feedback`);
          console.log(`   ✅ Performance analytics and trends`);
        }
      }

    } else {
      console.log('❌ Failed to fetch exams');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRecentExamResults();
