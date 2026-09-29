import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { type Response } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export const PASSWORD = 'Password123';

export async function createTestApp() {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    return { app, prisma: app.get(PrismaService) };
}

/** Vacía todas las tablas. Se llama antes de cada test para que sean independientes entre sí */
export async function resetDatabase(prisma: PrismaService) {
    await prisma.$executeRawUnsafe(
        'TRUNCATE TABLE "QuoteItem", "Quote", "Client", "RefreshToken", "User" RESTART IDENTITY CASCADE',
    );
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Extrae "refresh_token=valor" del header Set-Cookie */
export function getRefreshCookie(res: Response) {
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    const cookie = cookies?.find((c) => c.startsWith('refresh_token='));
    if (!cookie) throw new Error('La respuesta no incluyó la cookie refresh_token');
    return cookie.split(';')[0];
}

let userCounter = 0;

export async function registerUser(app: INestApplication, name = 'Usuario de prueba') {
    userCounter += 1;
    const email = `usuario${userCounter}@test.com`;
    const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, name, password: PASSWORD })
        .expect(201);

    return {
        email,
        user: res.body.user,
        token: res.body.accessToken as string,
        cookie: getRefreshCookie(res),
    };
}

export async function createClient(app: INestApplication, token: string, name = 'Cliente de prueba') {
    const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set(auth(token))
        .send({ name })
        .expect(201);
    return res.body;
}

export async function createQuote(
    app: INestApplication,
    token: string,
    clientId: string,
    overrides: Record<string, unknown> = {},
) {
    const res = await request(app.getHttpServer())
        .post('/api/quotes')
        .set(auth(token))
        .send({
            clientId,
            title: 'Rediseño de sitio web',
            items: [
                { description: 'Diseño de identidad', quantity: 1, unitPrice: 15000 },
                { description: 'Horas de desarrollo', unit: 'hora', quantity: 12.5, unitPrice: 450 },
            ],
            ...overrides,
        })
        .expect(201);
    return res.body;
}

export async function setStatus(app: INestApplication, token: string, quoteId: string, status: string) {
    return request(app.getHttpServer()).patch(`/api/quotes/${quoteId}/status`).set(auth(token)).send({ status });
}