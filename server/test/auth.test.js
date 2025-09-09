import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { appRouter } from '../src/routes';
const app = express();
app.use(express.json());
app.use('/api', appRouter);
const cred = { email: 'admin@school.edu', password: 'admin123' };
describe('auth', () => {
    it('logs in and verifies token', async () => {
        const res = await request(app).post('/api/auth').send(cred);
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        const res2 = await request(app).get('/api/auth/verify').set('Authorization', `Bearer ${res.body.token}`);
        expect(res2.status).toBe(200);
        expect(res2.body.user.email).toBe(cred.email);
    });
});
