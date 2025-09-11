const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function createExamTestData() {
  console.log('🧪 CREATING COMPREHENSIVE EXAM SYSTEM TEST DATA');
  console.log('=================================================');

  try {
    // Get teacher and student
    const teacher = await prisma.teacher.findFirst({
      where: { email: 'ukuqala@gmail.com' },
      include: { school: true }
    });

    const student = await prisma.student.findFirst({
      where: { email: 'noafrederic91@gmail.com' },
      include: { school: true }
    });

    if (!teacher || !student) {
      console.log('❌ Teacher or student not found');
      return;
    }

    console.log(`✅ Found teacher: ${teacher.firstName} ${teacher.lastName}`);
    console.log(`✅ Found student: ${student.firstName} ${student.lastName}`);

    // Get a class that both teacher and student have access to
    const teacherClass = await prisma.class.findFirst({
      where: {
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        status: 'approved'
      }
    });

    if (!teacherClass) {
      console.log('❌ No approved class found for teacher');
      return;
    }

    console.log(`✅ Found class: ${teacherClass.name} - ${teacherClass.subject}`);

    // Ensure student is enrolled in this class
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        classId: teacherClass.id
      }
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: teacherClass.id
        }
      });
    }

    console.log(`✅ Student enrolled in class`);

    // Create a comprehensive exam with mixed questions
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 1); // Started 1 hour ago
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Ends in 7 days

    const exam = await prisma.exam.create({
      data: {
        title: 'Mid-Term Chemistry Examination',
        description: 'Comprehensive mid-term exam covering organic chemistry, periodic table, and chemical reactions. This exam includes both multiple choice and essay questions.',
        classId: teacherClass.id,
        teacherId: teacher.id,
        examType: 'MIXED',
        duration: 90, // 90 minutes
        totalMarks: 100,
        passingMarks: 60,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
        questions: {
          create: [
            // MCQ Questions
            {
              questionText: 'What is the chemical symbol for Gold?',
              questionType: 'MCQ',
              marks: 5,
              order: 1,
              optionA: 'Go',
              optionB: 'Au',
              optionC: 'Ag',
              optionD: 'Gd',
              correctAnswer: 'B'
            },
            {
              questionText: 'Which of the following is NOT a noble gas?',
              questionType: 'MCQ',
              marks: 5,
              order: 2,
              optionA: 'Helium',
              optionB: 'Neon',
              optionC: 'Nitrogen',
              optionD: 'Argon',
              correctAnswer: 'C'
            },
            {
              questionText: 'What is the pH of pure water at 25°C?',
              questionType: 'MCQ',
              marks: 5,
              order: 3,
              optionA: '6',
              optionB: '7',
              optionC: '8',
              optionD: '9',
              correctAnswer: 'B'
            },
            {
              questionText: 'Which element has the highest electronegativity?',
              questionType: 'MCQ',
              marks: 5,
              order: 4,
              optionA: 'Oxygen',
              optionB: 'Nitrogen',
              optionC: 'Fluorine',
              optionD: 'Chlorine',
              correctAnswer: 'C'
            },
            // Structural Questions
            {
              questionText: 'Explain the concept of chemical bonding. Discuss the differences between ionic, covalent, and metallic bonds. Provide examples of compounds that exhibit each type of bonding.',
              questionType: 'STRUCTURAL',
              marks: 20,
              order: 5,
              maxWords: 300
            },
            {
              questionText: 'Describe the periodic trends in atomic radius, ionization energy, and electronegativity. Explain the underlying reasons for these trends.',
              questionType: 'STRUCTURAL',
              marks: 25,
              order: 6,
              maxWords: 400
            },
            {
              questionText: 'Balance the following chemical equation and explain the type of reaction: Al + CuSO₄ → Al₂(SO₄)₃ + Cu. Calculate the number of moles of copper produced when 2.7g of aluminum reacts completely.',
              questionType: 'STRUCTURAL',
              marks: 20,
              order: 7,
              maxWords: 250
            },
            {
              questionText: 'Discuss the applications of organic chemistry in everyday life. Mention at least 5 different areas where organic compounds play a crucial role and provide specific examples.',
              questionType: 'STRUCTURAL',
              marks: 15,
              order: 8,
              maxWords: 200
            }
          ]
        }
      },
      include: {
        questions: true,
        class: true
      }
    });

    console.log(`✅ Created exam: ${exam.title}`);
    console.log(`   - Duration: ${exam.duration} minutes`);
    console.log(`   - Total marks: ${exam.totalMarks}`);
    console.log(`   - Questions: ${exam.questions.length}`);
    console.log(`   - MCQ questions: ${exam.questions.filter(q => q.questionType === 'MCQ').length}`);
    console.log(`   - Structural questions: ${exam.questions.filter(q => q.questionType === 'STRUCTURAL').length}`);

    // Create another exam (MCQ only)
    const mcqExam = await prisma.exam.create({
      data: {
        title: 'Quick Chemistry Quiz',
        description: 'A quick multiple choice quiz on basic chemistry concepts.',
        classId: teacherClass.id,
        teacherId: teacher.id,
        examType: 'MCQ',
        duration: 30, // 30 minutes
        totalMarks: 50,
        passingMarks: 30,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
        questions: {
          create: [
            {
              questionText: 'What is the atomic number of Carbon?',
              questionType: 'MCQ',
              marks: 10,
              order: 1,
              optionA: '4',
              optionB: '6',
              optionC: '8',
              optionD: '12',
              correctAnswer: 'B'
            },
            {
              questionText: 'Which gas is most abundant in Earth\'s atmosphere?',
              questionType: 'MCQ',
              marks: 10,
              order: 2,
              optionA: 'Oxygen',
              optionB: 'Carbon Dioxide',
              optionC: 'Nitrogen',
              optionD: 'Argon',
              correctAnswer: 'C'
            },
            {
              questionText: 'What is the chemical formula for table salt?',
              questionType: 'MCQ',
              marks: 10,
              order: 3,
              optionA: 'NaCl',
              optionB: 'KCl',
              optionC: 'CaCl₂',
              optionD: 'MgCl₂',
              correctAnswer: 'A'
            },
            {
              questionText: 'Which of the following is an acid?',
              questionType: 'MCQ',
              marks: 10,
              order: 4,
              optionA: 'NaOH',
              optionB: 'HCl',
              optionC: 'NH₃',
              optionD: 'Ca(OH)₂',
              correctAnswer: 'B'
            },
            {
              questionText: 'What type of bond exists in a water molecule?',
              questionType: 'MCQ',
              marks: 10,
              order: 5,
              optionA: 'Ionic',
              optionB: 'Metallic',
              optionC: 'Covalent',
              optionD: 'Hydrogen',
              correctAnswer: 'C'
            }
          ]
        }
      },
      include: {
        questions: true
      }
    });

    console.log(`✅ Created MCQ exam: ${mcqExam.title}`);

    // Create a structural-only exam
    const structuralExam = await prisma.exam.create({
      data: {
        title: 'Chemistry Essay Examination',
        description: 'In-depth essay questions on advanced chemistry topics.',
        classId: teacherClass.id,
        teacherId: teacher.id,
        examType: 'STRUCTURAL',
        duration: 120, // 2 hours
        totalMarks: 80,
        passingMarks: 48,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
        questions: {
          create: [
            {
              questionText: 'Analyze the role of catalysts in industrial chemical processes. Discuss how catalysts work at the molecular level and provide three specific examples of industrial processes that rely on catalysts.',
              questionType: 'STRUCTURAL',
              marks: 25,
              order: 1,
              maxWords: 400
            },
            {
              questionText: 'Compare and contrast the properties of acids and bases. Explain the Brønsted-Lowry theory and provide examples of acid-base reactions in biological systems.',
              questionType: 'STRUCTURAL',
              marks: 30,
              order: 2,
              maxWords: 500
            },
            {
              questionText: 'Discuss the environmental impact of chemical industries. What are some green chemistry principles that can be applied to reduce environmental harm?',
              questionType: 'STRUCTURAL',
              marks: 25,
              order: 3,
              maxWords: 350
            }
          ]
        }
      },
      include: {
        questions: true
      }
    });

    console.log(`✅ Created structural exam: ${structuralExam.title}`);

    console.log('\n🎉 EXAM SYSTEM TEST DATA CREATED SUCCESSFULLY!');
    console.log('\n📋 SUMMARY:');
    console.log(`   - Teacher: ${teacher.email}`);
    console.log(`   - Student: ${student.email}`);
    console.log(`   - Class: ${teacherClass.name} - ${teacherClass.subject}`);
    console.log(`   - Mixed Exam: ${exam.title} (${exam.questions.length} questions, ${exam.totalMarks} marks)`);
    console.log(`   - MCQ Exam: ${mcqExam.title} (${mcqExam.questions.length} questions, ${mcqExam.totalMarks} marks)`);
    console.log(`   - Essay Exam: ${structuralExam.title} (${structuralExam.questions.length} questions, ${structuralExam.totalMarks} marks)`);
    
    console.log('\n🚀 READY FOR TESTING:');
    console.log('   1. Teacher can create exams at: http://localhost:3001/teacher/exams');
    console.log('   2. Student can take exams at: http://localhost:3001/student/exams');
    console.log('   3. Teacher can grade exams at: http://localhost:3001/teacher/exams (Grade Exams tab)');

  } catch (error) {
    console.error('❌ Error creating exam test data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createExamTestData();
