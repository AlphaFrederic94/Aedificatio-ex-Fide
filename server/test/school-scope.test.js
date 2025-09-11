import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { appRouter } from '../src/routes';
const app = express();
app.use(express.json());
app.use('/api', appRouter);
async function signupTeacher(schoolName) {
    const email = `t${Math.random().toString(36).slice(2)}@school.edu`;
    const res = await request(app).post('/api/signup').send({
        firstName: 'T', lastName: 'User', email, password: 'p4ssw0rd!', schoolName, position: 'teacher'
    });
    return { token: res.body.token, email };
}
describe('school scoping', () => {
    it('sees only classes in their school (empty initially)', async () => {
        const a = await signupTeacher('School A');
        const b = await signupTeacher('School B');
        const resA = await request(app).get('/api/classes').set('Authorization', `Bearer ${a.token}`);
        const resB = await request(app).get('/api/classes').set('Authorization', `Bearer ${b.token}`);
        expect(resA.status).toBe(200);
        expect(resB.status).toBe(200);
        expect(Array.isArray(resA.body)).toBe(true);
        expect(Array.isArray(resB.body)).toBe(true);
    });
});
