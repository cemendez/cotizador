import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { auth, createClient, createQuote, createTestApp, registerUser, resetDatabase } from './helpers.js';

describe('Campos obligatorios no aceptan null (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let token: string;
    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
    });
    afterAll(() => app.close());

    beforeEach(async () => {
        await resetDatabase(prisma);
        token = (await registerUser(app)).token;
    });

    it('rechaza IVA o moneda null al crear una cotización', async () => {
        const clientId = (await createClient(app, token)).id;
        const base = { clientId, title: 'Prueba', items: [{ description: 'x', quantity: 1, unitPrice: 1 }] };

        await http().post('/api/quotes').set(auth(token)).send({ ...base, taxRate: null }).expect(400);
        await http().post('/api/quotes').set(auth(token)).send({ ...base, currency: null }).expect(400);
    })

    it.each([{ title: '' }, { title: null }, { taxRate: null }, { items: null }, { clientId: null }])(
        'rechaza $j al editar una cotización',
        async (body) => {
            const clientId = (await createClient(app, token)).id;
            const { id } = await createQuote(app, token, clientId);
            await http().patch(`/api/quotes/${id}`).set(auth(token)).send(body).expect(400);
        },
    );

    it('rechaza nombre null en el perfil', async () => {
        await http().patch('/api/users/me').set(auth(token)).send({ name: null }).expect(400);
    });
});