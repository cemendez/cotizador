import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, PASSWORD, resetDatabase } from './helpers.js';

describe('Límite de peticiones (e2e)', () => {
    let app: INestApplication;
    const http = () => request(app.getHttpServer());
    const login = (email: string, password: string) => http().post('/api/auth/login').send({ email, password });

    // Una app nueva por test: el contador vive en memoria y así cada test parte de cero
    beforeEach(async () => {
        process.env.THROTTLE_DISABLED = 'false';
        const created = await createTestApp();
        app = created.app;
        await resetDatabase(created.prisma);
    });

    afterEach(async () => {
        await app.close();
        process.env.THROTTLE_DISABLED = 'true';
    });

    it('bloquea el login tras 10 intentos, incluso con la contraseña correcta', async () => {
        const email = 'ana@test.com';
        await http().post('/api/auth/register').send({ email, name: 'Ana', password: PASSWORD }).expect(201);

        for (let i = 0; i < 10; i++) {
            await login(email, 'incorrecta').expect(401);
        }

        const blocked = await login(email, PASSWORD).expect(429);
        expect(blocked.body.message).toMatch(/Demasiados intentos/);
    });

    it('no se puede evadir el límite falsificando X-Forwarded-For', async () => {
        for (let i = 0; i < 10; i++) {
            await login('x@test.com', 'incorrecta').set('X-Forwarded-For', `10.0.0.${i}`).expect(401);
        }
        await login('x@test.com', 'incorrecta').set('X-Forwarded-For', '10.0.0.99').expect(429);
    });

    it('limita los registros por IP', async () => {
        for (let i = 1; i <= 5; i++) {
            await http().post('/api/auth/register').send({ email: `u${i}@test.com`, name: 'Usuario', password: PASSWORD }).expect(201);
        }
        await http().post('/api/auth/register').send({ email: 'u6@test.com', name: 'Usuario', password: PASSWORD }).expect(429);
    });

    it('aplica el límite general incluso a peticiones sin token válido', async () => {
        for (let i = 0; i < 100; i++) {
            await http().get('/api/auth/me').expect(401);
        }
        await http().get('/api/auth/me').expect(429);
    });
});