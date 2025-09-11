import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { appRouter } from '../src/routes';
const app = express();
app.use(express.json());
app.use('/api', appRouter);
async function signup(position, schoolName = 'Enroll School') {
    const email = `${position}.${Math.random().toString(36).slice(2)}@school.edu`;
    const res = await request(app).post('/api/signup').send({
        firstName: 'First', lastName: 'Last', email, password: 'p4ssw0rd!', schoolName, position,
    });
    return { token: res.body.token, user: res.body.user };
}
describe('enrollments', () => {
    it('allows admin to enroll a student into a class in same school', async () => {
        const { token } = await signup('admin');
        const teacher = await signup('teacher');
        // create a class
        const classRes = await request(app)
            .post('/api/classes')
            .set('Authorization', `Bearer ${token}`)
            .send({
            name: 'Algebra I', subject: 'Math', grade: '9', teacherId: teacher.user.teacherId, room: '101',
            schedule: 'MWF 9:00-10:00', startDate: '2025-09-01', endDate: '2026-06-01', description: 'Intro Algebra', capacity: 30,
        });
        expect(classRes.status).toBe(201);
        // create a student
        const studentRes = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${token}`)
            .send({ firstName: 'Stu', lastName: 'Dent', email: `s${Math.random().toString(36).slice(2)}@school.edu`, grade: '9',
            dateOfBirth: '2010-01-01', enrollmentDate: '2025-09-01', parentName: 'P Dent', parentEmail: 'p@x.com', parentPhone: '123', address: '123 St' });
        expect(studentRes.status).toBe(201);
        // enroll
        const enrollRes = await request(app)
            .post('/api/enrollments')
            .set('Authorization', `Bearer ${token}`)
            .send({ studentId: studentRes.body.id, classId: classRes.body.id });
        expect(enrollRes.status).toBe(201);
        // list enrollments
        const listRes = await request(app)
            .get('/api/enrollments')
            .set('Authorization', `Bearer ${token}`);
        expect(listRes.status).toBe(200);
        expect(listRes.body.length).toBeGreaterThan(0);
    });
});
