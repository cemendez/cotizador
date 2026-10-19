import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, PASSWORD, resetDatabase } from './helpers.js';

describe('Registro cerrado (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    const http = () => request(app.getHttpServer());
    const register = (email: string) =>
        http().post('/api/auth/register').send({ email, name: 'Usuario', password: PASSWORD });

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
    });
    afterAll(() => app.close());

    beforeEach(async () => {
        process.env.ALLOW_REGISTRATION = 'false';
        await resetDatabase(prisma);
    });
    afterEach(() => {
        process.env.ALLOW_REGISTRATION = 'true';
    });

    it('el primer usuario se registra y después el registro se cierra', async () => {
        expect((await http().get('/api/auth/registration').expect(200)).body).toEqual({ open: true });

        await register('dueno@test.com').expect(201);

        expect((await http().get('/api/auth/registration').expect(200)).body).toEqual({ open: false });
        const res = await register('otro@test.com').expect(403);
        expect(res.body.message).toBe('El registro está cerrado');
    });

    it('el login sigue funcionando con el registro cerrado', async () => {
        await register('dueno@test.com').expect(201);
        await http().post('/api/auth/login').send({ email: 'dueno@test.com', password: PASSWORD }).expect(200);
    });

    it('ALLOW_REGISTRATION=true lo reabre aunque ya existan usuarios', async () => {
        await register('dueno@test.com').expect(201);
        process.env.ALLOW_REGISTRATION = 'true';
        await register('otro@test.com').expect(201);
    });
});