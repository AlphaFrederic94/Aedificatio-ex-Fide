import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { appRouter } from '../src/routes';
const app = express();
app.use(express.json());
app.use('/api', appRouter);
async function signup(position, schoolName = 'Assignments High') {
    const email = `${position}.${Math.random().toString(36).slice(2)}@school.edu`;
    const res = await request(app)
        .post('/api/signup')
        .send({ firstName: 'F', lastName: 'L', email, password: 'p4ssw0rd!', schoolName, position });
    return { token: res.body.token, user: res.body.user };
}
describe('assignments and grades', () => {
    it('creates assignments, lists them, and upserts grades', async () => {
        const { token: adminToken } = await signup('admin', 'Grading U');
        const { user: teacher } = await signup('teacher', 'Grading U');
        const { user: student } = await signup('student', 'Grading U');
        const classRes = await request(app)
            .post('/api/classes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Chemistry', subject: 'Science', grade: '11', teacherId: teacher.teacherId,
            room: 'Lab1', schedule: 'TTh 12:00-13:30', startDate: '2025-09-01', endDate: '2026-06-01', description: 'Chem basics', capacity: 32,
        });
        expect(classRes.status).toBe(201);
        const classId = classRes.body.id;
        // create assignment
        const createA = await request(app)
            .post('/api/assignments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ classId, title: 'HW1', description: 'Stoichiometry', dueDate: '2025-10-15', maxPoints: 100 });
        expect(createA.status).toBe(201);
        // list assignments
        const listA = await request(app)
            .get(`/api/assignments/class/${classId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(listA.status).toBe(200);
        expect(Array.isArray(listA.body)).toBe(true);
        expect(listA.body.length).toBeGreaterThan(0);
        const assignmentId = listA.body[0].id;
        // upsert grade
        const g1 = await request(app)
            .post(`/api/assignments/${assignmentId}/grades`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ studentId: student.studentId, score: 85, feedback: 'Good' });
        expect(g1.status).toBe(201);
        expect(g1.body.score).toBe(85);
        const g2 = await request(app)
            .post(`/api/assignments/${assignmentId}/grades`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ studentId: student.studentId, score: 92 });
        expect(g2.status).toBe(201);
        expect(g2.body.score).toBe(92);
        const grades = await request(app)
            .get(`/api/assignments/${assignmentId}/grades`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(grades.status).toBe(200);
        expect(Array.isArray(grades.body)).toBe(true);
        expect(grades.body[0].score).toBe(92);
    });
    it('prevents grading student from another school', async () => {
        const { token: adminA } = await signup('admin', 'School X');
        const { user: teacherA } = await signup('teacher', 'School X');
        const { user: studentB } = await signup('student', 'School Y');
        const classRes = await request(app)
            .post('/api/classes')
            .set('Authorization', `Bearer ${adminA}`)
            .send({
            name: 'Physics', subject: 'Science', grade: '12', teacherId: teacherA.teacherId,
            room: 'P1', schedule: 'MWF 10:00-11:00', startDate: '2025-09-01', endDate: '2026-06-01', description: 'Mechanics', capacity: 28,
        });
        expect(classRes.status).toBe(201);
        const a = await request(app)
            .post('/api/assignments')
            .set('Authorization', `Bearer ${adminA}`)
            .send({ classId: classRes.body.id, title: 'HW', description: 'Vectors', dueDate: '2025-11-01', maxPoints: 50 });
        expect(a.status).toBe(201);
        const bad = await request(app)
            .post(`/api/assignments/${a.body.id}/grades`)
            .set('Authorization', `Bearer ${adminA}`)
            .send({ studentId: studentB.studentId, score: 10 });
        expect(bad.status).toBe(400);
    });
});
