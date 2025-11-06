import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../auth/middleware';
import { appendBlock } from '../audit/blockchain';

const router = Router();
const prisma = new PrismaClient();

// Start an exam (create submission)
router.post('/start/:examId', requireAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const user = (req as any).user;
    
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can start exams' });
    }

    // Check if exam exists and is active
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (!exam.isActive) {
      return res.status(400).json({ error: 'Exam is not active' });
    }

    const now = new Date();
    if (now < exam.startDate || now > exam.endDate) {
      return res.status(400).json({ error: 'Exam is not available at this time' });
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

    // Check if student has already started this exam
    const existingSubmission = await prisma.examSubmission.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: user.studentId
        }
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already started this exam' });
    }

    // Create new submission
    const submission = await prisma.examSubmission.create({
      data: {
        examId,
        studentId: user.studentId
      },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: {
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
              }
            }
          }
        }
      }
    });

    // Log to blockchain
    await appendBlock({
      action: 'exam.start',
      actorId: user.id,
      entity: 'exam_submission',
      entityId: submission.id,
      payload: { examId, studentId: user.studentId }
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

// Submit answers for a question
router.post('/answer', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { submissionId, questionId, mcqAnswer, textAnswer } = req.body;
    
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit answers' });
    }

    // Verify submission belongs to student
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!submission || submission.studentId !== user.studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (submission.isSubmitted) {
      return res.status(400).json({ error: 'Exam has already been submitted' });
    }

    // Check if exam time has expired
    const now = new Date();
    const examStartTime = submission.startedAt;
    const examDuration = submission.exam.duration * 60 * 1000; // Convert minutes to milliseconds
    const examEndTime = new Date(examStartTime.getTime() + examDuration);

    if (now > examEndTime) {
      return res.status(400).json({ error: 'Exam time has expired' });
    }

    // Find the question
    const question = submission.exam.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Create or update answer
    const answerData: any = {
      questionId,
      submissionId,
      ...(question.questionType === 'MCQ' ? { mcqAnswer } : { textAnswer })
    };

    // For MCQ, auto-grade the answer
    if (question.questionType === 'MCQ' && mcqAnswer) {
      answerData.isCorrect = mcqAnswer === question.correctAnswer;
      answerData.marksAwarded = answerData.isCorrect ? question.marks : 0;
    }

    const answer = await prisma.studentAnswer.upsert({
      where: {
        questionId_submissionId: {
          questionId,
          submissionId
        }
      },
      update: answerData,
      create: answerData
    });

    res.json(answer);
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Submit entire exam
router.post('/submit/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const user = (req as any).user;
    
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit exams' });
    }

    // Verify submission belongs to student
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        answers: {
          include: { question: true }
        },
        exam: {
          include: { questions: true }
        }
      }
    });

    if (!submission || submission.studentId !== user.studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (submission.isSubmitted) {
      return res.status(400).json({ error: 'Exam has already been submitted' });
    }

    // Calculate scores
    let mcqScore = 0;
    let structuralScore = 0;

    submission.answers.forEach(answer => {
      if (answer.question.questionType === 'MCQ') {
        mcqScore += answer.marksAwarded;
      } else {
        structuralScore += answer.marksAwarded;
      }
    });

    const totalScore = mcqScore + structuralScore;

    // Update submission
    const updatedSubmission = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        isSubmitted: true,
        submittedAt: new Date(),
        totalScore,
        mcqScore,
        structuralScore,
        isGraded: submission.exam.questions.every(q => q.questionType === 'MCQ') // Auto-graded if all MCQ
      },
      include: {
        exam: true,
        answers: {
          include: { question: true }
        }
      }
    });

    // Log to blockchain
    await appendBlock({
      action: 'exam.submit',
      actorId: user.id,
      entity: 'exam_submission',
      entityId: submissionId,
      payload: { examId: submission.examId, totalScore, mcqScore, structuralScore }
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

// Get submission details
router.get('/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const user = (req as any).user;

    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        exam: {
          include: {
            class: true,
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        },
        student: true,
        answers: {
          include: { question: true },
          orderBy: { question: { order: 'asc' } }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check permissions
    if (user.role === 'student' && submission.studentId !== user.studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (user.role === 'teacher' && submission.exam.teacherId !== user.teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Grade structural questions (teacher only)
router.post('/grade/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grades } = req.body; // Array of { questionId, marksAwarded, feedback }
    const user = (req as any).user;
    
    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can grade exams' });
    }

    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        exam: true,
        answers: {
          include: { question: true }
        }
      }
    });

    if (!submission || submission.exam.teacherId !== user.teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update grades for structural questions
    for (const grade of grades) {
      await prisma.studentAnswer.update({
        where: {
          questionId_submissionId: {
            questionId: grade.questionId,
            submissionId
          }
        },
        data: {
          marksAwarded: grade.marksAwarded,
          feedback: grade.feedback
        }
      });
    }

    // Recalculate total score
    const updatedAnswers = await prisma.studentAnswer.findMany({
      where: { submissionId },
      include: { question: true }
    });

    let mcqScore = 0;
    let structuralScore = 0;

    updatedAnswers.forEach(answer => {
      if (answer.question.questionType === 'MCQ') {
        mcqScore += answer.marksAwarded;
      } else {
        structuralScore += answer.marksAwarded;
      }
    });

    const totalScore = mcqScore + structuralScore;

    // Update submission with final scores
    const updatedSubmission = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        totalScore,
        mcqScore,
        structuralScore,
        isGraded: true
      },
      include: {
        exam: true,
        student: true,
        answers: {
          include: { question: true },
          orderBy: { question: { order: 'asc' } }
        }
      }
    });

    // Log to blockchain
    await appendBlock({
      action: 'exam.grade',
      actorId: user.id,
      entity: 'exam_submission',
      entityId: submissionId,
      payload: {
        examId: submission.exam.id,
        studentId: submission.studentId,
        totalScore,
        gradedQuestions: grades.length
      }
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error grading exam:', error);
    res.status(500).json({ error: 'Failed to grade exam' });
  }
});

export default router;
