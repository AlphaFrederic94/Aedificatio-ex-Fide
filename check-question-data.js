const { PrismaClient } = require('./server/node_modules/@prisma/client');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const prisma = new PrismaClient();

async function checkQuestionData() {
  console.log('🔍 CHECKING QUESTION DATA');
  console.log('=========================');

  try {
    // Get all exams with questions
    const exams = await prisma.exam.findMany({
      include: {
        questions: true,
        class: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Found ${exams.length} recent exams:`);

    for (const exam of exams) {
      console.log(`\n📝 Exam: ${exam.title}`);
      console.log(`   Class: ${exam.class.name}`);
      console.log(`   Questions: ${exam.questions.length}`);
      
      exam.questions.forEach((q, index) => {
        console.log(`\n   Question ${index + 1}:`);
        console.log(`     Text: ${q.questionText.substring(0, 50)}...`);
        console.log(`     Type: ${q.questionType}`);
        console.log(`     Marks: ${q.marks}`);
        
        if (q.questionType === 'MCQ') {
          console.log(`     Option A: ${q.optionA || 'NULL'}`);
          console.log(`     Option B: ${q.optionB || 'NULL'}`);
          console.log(`     Option C: ${q.optionC || 'NULL'}`);
          console.log(`     Option D: ${q.optionD || 'NULL'}`);
          console.log(`     Correct Answer: ${q.correctAnswer || 'NULL'}`);
        }
      });
    }

    // Fix the Debug Test Exam questions
    console.log('\n🔧 FIXING DEBUG TEST EXAM QUESTIONS');
    const debugExam = exams.find(e => e.title === 'Debug Test Exam');
    
    if (debugExam) {
      console.log('Found Debug Test Exam, updating questions...');
      
      // Update first question
      if (debugExam.questions[0]) {
        await prisma.question.update({
          where: { id: debugExam.questions[0].id },
          data: {
            correctAnswer: 'B'
          }
        });
        console.log('✅ Updated question 1 correct answer to B');
      }

      // Update second question
      if (debugExam.questions[1]) {
        await prisma.question.update({
          where: { id: debugExam.questions[1].id },
          data: {
            correctAnswer: 'C'
          }
        });
        console.log('✅ Updated question 2 correct answer to C');
      }
    }

    // Create a proper test exam with correct data
    console.log('\n🆕 CREATING PROPER TEST EXAM');
    
    // Get teacher and class
    const teacher = await prisma.teacher.findFirst({
      where: { email: 'ukuqala@gmail.com' }
    });

    const teacherClass = await prisma.class.findFirst({
      where: { teacherId: teacher.id }
    });

    if (teacher && teacherClass) {
      // Delete existing test exam if it exists
      const existingTestExam = await prisma.exam.findFirst({
        where: { title: 'Complete Test Exam - Working' }
      });

      if (existingTestExam) {
        await prisma.studentAnswer.deleteMany({
          where: { 
            question: { examId: existingTestExam.id }
          }
        });
        await prisma.examSubmission.deleteMany({
          where: { examId: existingTestExam.id }
        });
        await prisma.question.deleteMany({
          where: { examId: existingTestExam.id }
        });
        await prisma.exam.delete({
          where: { id: existingTestExam.id }
        });
        console.log('🗑️ Deleted existing test exam');
      }

      const testExam = await prisma.exam.create({
        data: {
          title: 'Complete Test Exam - Working',
          description: 'A properly configured test exam with correct answers',
          classId: teacherClass.id,
          teacherId: teacher.id,
          examType: 'MIXED',
          duration: 45,
          totalMarks: 100,
          passingMarks: 60,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true,
          questions: {
            create: [
              {
                questionText: 'What is the result of 5 + 3?',
                questionType: 'MCQ',
                marks: 20,
                order: 1,
                optionA: '6',
                optionB: '8',
                optionC: '7',
                optionD: '9',
                correctAnswer: 'B'
              },
              {
                questionText: 'Which planet is known as the Red Planet?',
                questionType: 'MCQ',
                marks: 20,
                order: 2,
                optionA: 'Venus',
                optionB: 'Jupiter',
                optionC: 'Mars',
                optionD: 'Saturn',
                correctAnswer: 'C'
              },
              {
                questionText: 'Explain the water cycle and its importance to life on Earth. Include the main processes involved.',
                questionType: 'STRUCTURAL',
                marks: 30,
                order: 3,
                maxWords: 300
              },
              {
                questionText: 'Solve the equation: 2x + 5 = 15. Show your working steps.',
                questionType: 'STRUCTURAL',
                marks: 30,
                order: 4,
                maxWords: 200
              }
            ]
          }
        },
        include: {
          questions: true
        }
      });

      console.log('✅ Created proper test exam with correct data');
      console.log(`   Exam ID: ${testExam.id}`);
      console.log(`   Questions: ${testExam.questions.length}`);
      
      testExam.questions.forEach((q, index) => {
        console.log(`   Q${index + 1}: ${q.questionType} - ${q.correctAnswer || 'N/A'}`);
      });
    }

    console.log('\n🎉 Question data check and fix complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestionData();
