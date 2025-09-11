import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { appRouter } from '../src/routes';
const app = express();
app.use(express.json());
app.use('/api', appRouter);
async function signup(position, schoolName = 'Val High') {
    const email = `${position}.${Math.random().toString(36).slice(2)}@school.edu`;
    const res = await request(app)
        .post('/api/signup')
        .send({ firstName: 'F', lastName: 'L', email, password: 'p4ssw0rd!', schoolName, position });
    return { token: res.body.token, user: res.body.user };
}
describe('validations', () => {
    it('rejects assignment with non-positive maxPoints', async () => {
        const { token: adminToken } = await signup('admin');
        const { user: teacher } = await signup('teacher');
        const classRes = await request(app)
            .post('/api/classes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Geometry', subject: 'Math', grade: '10', teacherId: teacher.teacherId,
            room: 'A2', schedule: 'MW 9:00-10:00', startDate: '2025-09-01', endDate: '2026-06-01', description: 'Geometry', capacity: 30,
        });
        expect(classRes.status).toBe(201);
        const bad = await request(app)
            .post('/api/assignments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ classId: classRes.body.id, title: 'HW0', description: 'Zero points', dueDate: '2025-09-15', maxPoints: 0 });
        expect(bad.status).toBe(400);
        expect(bad.body.error).toMatch(/maxPoints/i);
    });
    it('rejects attendance with invalid status', async () => {
        const { token: adminToken } = await signup('admin', 'School A');
        const { user: teacher } = await signup('teacher', 'School A');
        const { user: student } = await signup('student', 'School A');
        const classRes = await request(app)
            .post('/api/classes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Biology', subject: 'Sci', grade: '10', teacherId: teacher.teacherId,
            room: 'B1', schedule: 'TTh 9:00-10:00', startDate: '2025-09-01', endDate: '2026-06-01', description: 'Bio', capacity: 30,
        });
        expect(classRes.status).toBe(201);
        const bad = await request(app)
            .post('/api/attendance')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ classId: classRes.body.id, studentId: student.studentId, date: '2025-09-20', status: 'unknown' });
        expect(bad.status).toBe(400);
        expect(bad.body.error).toMatch(/invalid status/i);
    });
});
