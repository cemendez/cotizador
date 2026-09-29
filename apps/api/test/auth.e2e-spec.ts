import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { auth, createTestApp, getRefreshCookie, PASSWORD, registerUser, resetDatabase } from './helpers.js';

describe('Autenticación (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
    });
    beforeEach(() => resetDatabase(prisma));
    afterAll(() => app.close());

    it('registra al usuario con cookie httpOnly y sin exponer el hash de la contraseña', async () => {
        const res = await http()
            .post('/api/auth/register')
            .send({ email: '  Ana@Test.com ', name: 'Ana', password: PASSWORD })
            .expect(201);

        expect(res.body.accessToken).toEqual(expect.any(String));
        expect(res.body.user).toMatchObject({ email: 'ana@test.com', name: 'Ana' });
        expect(res.body.user).not.toHaveProperty('passwordHash');

        const setCookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
        expect(setCookie).toMatch(/HttpOnly/i);
        expect(setCookie).toMatch(/Path=\/api\/auth/);
    });

    it('rechaza correos duplicados y datos inválidos', async () => {
        const { email } = await registerUser(app);
        await http().post('/api/auth/register').send({ email, name: 'Otro', password: PASSWORD }).expect(409);

        const res = await http().post('/api/auth/register').send({ email: 'no-es-correo', name: 'X', password: '123' }).expect(400);
        expect(res.body.message).toEqual(expect.arrayContaining([expect.stringContaining('Correo')]));
    });

    it('responde igual a un correo inexistente que a una contraseña incorrecta', async () => {
        const { email } = await registerUser(app);
        const wrongPassword = await http().post('/api/auth/login').send({ email, password: 'incorrecta' }).expect(401);
        const unknownEmail = await http().post('/api/auth/login').send({ email: 'nadie@test.com', password: PASSWORD }).expect(401);
        expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it('protege las rutas privadas y acepta un token válido', async () => {
        await http().get('/api/auth/me').expect(401);
        await http().get('/api/auth/me').set(auth('token-falso')).expect(401);

        const { token, email } = await registerUser(app);
        const res = await http().get('/api/auth/me').set(auth(token)).expect(200);
        expect(res.body.email).toBe(email);
    });

    it('deja pasar las rutas públicas sin token', async () => {
        await http().get('/api/health').expect(200);
    });

    it('rota el refresh token y cierra todas las sesiones si detecta reuso', async () => {
        const { cookie: first } = await registerUser(app);

        const refreshed = await http().post('/api/auth/refresh').set('Cookie', first).expect(200);
        const second = getRefreshCookie(refreshed);
        expect(second).not.toBe(first);

        // Reusar el token ya rotado = posible robo
        await http().post('/api/auth/refresh').set('Cookie', first).expect(401);
        // Como defensa, también se revocó la sesión legítima
        await http().post('/api/auth/refresh').set('Cookie', second).expect(401);
    });

    it('logout revoca la sesión', async () => {
        const { cookie } = await registerUser(app);
        await http().post('/api/auth/logout').set('Cookie', cookie).expect(204);
        await http().post('/api/auth/refresh').set('Cookie', cookie).expect(401);
    });

    it('cambiar la contraseña cierra todas las sesiones y exige la contraseña nueva', async () => {
        const { token, cookie, email } = await registerUser(app);

        await http()
            .patch('/api/users/me/password')
            .set(auth(token))
            .send({ currentPassword: 'incorrecta', newPassword: 'NuevaClave456' })
            .expect(400); // 400 y no 401, para no activar el refresh del frontend

        await http()
            .patch('/api/users/me/password')
            .set(auth(token))
            .send({ currentPassword: PASSWORD, newPassword: 'NuevaClave456' })
            .expect(204);

        await http().post('/api/auth/refresh').set('Cookie', cookie).expect(401);
        await http().post('/api/auth/login').send({ email, password: PASSWORD }).expect(401);
        await http().post('/api/auth/login').send({ email, password: 'NuevaClave456' }).expect(200);
    });
});