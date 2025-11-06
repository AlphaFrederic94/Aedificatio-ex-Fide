import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../auth/middleware';

const router = Router();
const prisma = new PrismaClient();

// Get all exams for a teacher
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view exams' });
    }

    const exams = await prisma.exam.findMany({
      where: {
        teacherId: user.teacherId
      },
      include: {
        class: true,
        questions: true,
        submissions: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get exams for a specific class
router.get('/class/:classId', requireAuth, async (req, res) => {
  try {
    const { classId } = req.params;
    const user = (req as any).user;

    const exams = await prisma.exam.findMany({
      where: {
        classId,
        ...(user.role === 'teacher' ? { teacherId: user.teacherId } : {})
      },
      include: {
        class: true,
        questions: {
          orderBy: { order: 'asc' }
        },
        submissions: user.role === 'student' ? {
          where: { studentId: user.studentId }
        } : {
          include: { student: true }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    res.json(exams);
  } catch (error) {
    console.error('Error fetching class exams:', error);
    res.status(500).json({ error: 'Failed to fetch class exams' });
  }
});

// Get available exams for a student
router.get('/student', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view available exams' });
    }

    // Get student's enrolled classes
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.studentId },
      include: { class: true }
    });

    const classIds = enrollments.map(e => e.classId);

    // Get exams for enrolled classes
    const exams = await prisma.exam.findMany({
      where: {
        classId: { in: classIds },
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        class: true,
        questions: {
          select: {
            id: true,
            questionType: true,
            marks: true,
            order: true
          },
          orderBy: { order: 'asc' }
        },
        submissions: {
          where: { studentId: user.studentId }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    res.json(exams);
  } catch (error) {
    console.error('Error fetching student exams:', error);
    res.status(500).json({ error: 'Failed to fetch student exams' });
  }
});

// Create a new exam
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create exams' });
    }

    const {
      title,
      description,
      classId,
      examType,
      duration,
      totalMarks,
      passingMarks,
      startDate,
      endDate,
      questions
    } = req.body;

    // Verify teacher owns the class
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: user.teacherId
      }
    });

    if (!classExists) {
      return res.status(403).json({ error: 'You can only create exams for your classes' });
    }

    // Create exam with questions
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        classId,
        teacherId: user.teacherId,
        examType,
        duration,
        totalMarks,
        passingMarks,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        questions: {
          create: questions.map((q: any, index: number) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            marks: q.marks,
            order: index + 1,
            ...(q.questionType === 'MCQ' ? {
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer
            } : {
              maxWords: q.maxWords
            })
          }))
        }
      },
      include: {
        class: true,
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.status(201).json(exam);
  } catch (error: any) {
    console.error('Error creating exam:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to create exam',
      details: error.message,
      code: error.code
    });
  }
});

// Get specific exam details
router.get('/:examId', requireAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const user = (req as any).user;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: true,
        questions: {
          orderBy: { order: 'asc' },
          select: user.role === 'student' ? {
            id: true,
            questionText: true,
            questionType: true,
            marks: true,
            order: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            maxWords: true
          } : undefined
        },
        submissions: user.role === 'student' ? {
          where: { studentId: user.studentId },
          include: {
            answers: {
              include: { question: true }
            }
          }
        } : {
          include: {
            student: true,
            answers: {
              include: { question: true }
            }
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check permissions
    if (user.role === 'teacher' && exam.teacherId !== user.teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (user.role === 'student') {
      // Check if student is enrolled in the class
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: user.studentId,
          classId: exam.classId
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'You are not enrolled in this class' });
      }
    }

    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// Update exam
router.put('/:examId', requireAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const user = (req as any).user;
    
    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update exams' });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });

    if (!exam || exam.teacherId !== user.teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: req.body,
      include: {
        class: true,
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json(updatedExam);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// Delete exam
router.delete('/:examId', requireAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const user = (req as any).user;
    
    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete exams' });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });

    if (!exam || exam.teacherId !== user.teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.exam.delete({
      where: { id: examId }
    });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Submit exam (student takes exam)
router.post('/:examId/submit', requireAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const user = (req as any).user;
    const { answers } = req.body;

    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit exams' });
    }

    // Get exam with questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.studentId,
        classId: exam.classId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this class' });
    }

    // Check if already submitted
    const existingSubmission = await prisma.examSubmission.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: user.studentId
        }
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already submitted this exam' });
    }

    // Create submission with answers
    let mcqScore = 0;
    let structuralScore = 0;
    let isFullyGraded = true;

    // Pre-calculate scores and prepare answer data
    const answerData = answers.map((answer: any) => {
      const question = exam.questions.find(q => q.id === answer.questionId);
      if (!question) return null;

      let isCorrect = null;
      let marksAwarded = 0;

      // Auto-grade MCQ
      if (question.questionType === 'MCQ' && answer.mcqAnswer) {
        isCorrect = answer.mcqAnswer === question.correctAnswer;
        marksAwarded = isCorrect ? question.marks : 0;
        mcqScore += marksAwarded;
      } else if (question.questionType === 'STRUCTURAL') {
        // Structural questions need manual grading
        isFullyGraded = false;
      }

      return {
        questionId: answer.questionId,
        mcqAnswer: answer.mcqAnswer || null,
        textAnswer: answer.textAnswer || null,
        isCorrect,
        marksAwarded
      };
    }).filter(Boolean);

    const submission = await prisma.examSubmission.create({
      data: {
        examId,
        studentId: user.studentId,
        isSubmitted: true,
        submittedAt: new Date(),
        answers: {
          create: answerData
        },
        mcqScore,
        structuralScore,
        totalScore: mcqScore + structuralScore,
        isGraded: isFullyGraded
      },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    res.status(201).json(submission);
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ error: 'Failed to submit exam', details: error.message });
  }
});

// Grade structural question (teacher)
router.post('/:examId/grade/:submissionId', requireAuth, async (req, res) => {
  try {
    const { examId, submissionId } = req.params;
    const user = (req as any).user;
    const { grades } = req.body; // Array of { questionId, marksAwarded, feedback }

    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can grade exams' });
    }

    // Verify teacher owns the exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });

    if (!exam || exam.teacherId !== user.teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get submission
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update grades for structural questions
    let structuralScore = 0;
    for (const grade of grades) {
      await prisma.studentAnswer.updateMany({
        where: {
          submissionId,
          questionId: grade.questionId
        },
        data: {
          marksAwarded: grade.marksAwarded,
          feedback: grade.feedback || null
        }
      });

      const question = submission.answers.find(a => a.questionId === grade.questionId)?.question;
      if (question?.questionType === 'STRUCTURAL') {
        structuralScore += grade.marksAwarded;
      }
    }

    // Update submission total score
    const updatedSubmission = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        structuralScore,
        totalScore: submission.mcqScore + structuralScore,
        isGraded: true
      },
      include: {
        answers: {
          include: {
            question: true
          }
        },
        student: true
      }
    });

    res.json(updatedSubmission);
  } catch (error: any) {
    console.error('Error grading exam:', error);
    res.status(500).json({ error: 'Failed to grade exam', details: error.message });
  }
});

export default router;
