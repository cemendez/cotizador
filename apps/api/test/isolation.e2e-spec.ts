import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { auth, createClient, createQuote, createTestApp, registerUser, resetDatabase } from './helpers.js';

describe('Aislamiento entre usuarios (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    const http = () => request(app.getHttpServer());

    let ownerToken: string;
    let intruderToken: string;
    let clientId: string;
    let quoteId: string;

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
    });
    afterAll(() => app.close());

    beforeEach(async () => {
        await resetDatabase(prisma);
        ownerToken = (await registerUser(app, 'Dueño')).token;
        intruderToken = (await registerUser(app, 'Intruso')).token;
        clientId = (await createClient(app, ownerToken)).id;
        quoteId = (await createQuote(app, ownerToken, clientId)).id;
    });

    it('las listas del intruso están vacías', async () => {
        const clients = await http().get('/api/clients').set(auth(intruderToken)).expect(200);
        const quotes = await http().get('/api/quotes').set(auth(intruderToken)).expect(200);
        expect(clients.body.meta.total).toBe(0);
        expect(quotes.body.meta.total).toBe(0);
    });

    it('responde 404 en todas las rutas de clientes ajenos', async () => {
        await http().get(`/api/clients/${clientId}`).set(auth(intruderToken)).expect(404);
        await http().patch(`/api/clients/${clientId}`).set(auth(intruderToken)).send({ name: 'Hackeado' }).expect(404);
        await http().delete(`/api/clients/${clientId}`).set(auth(intruderToken)).expect(404);
    });

    it('responde 404 en todas las rutas de cotizaciones ajenas', async () => {
        const base = `/api/quotes/${quoteId}`;
        await http().get(base).set(auth(intruderToken)).expect(404);
        await http().patch(base).set(auth(intruderToken)).send({ title: 'Hackeado' }).expect(404);
        await http().patch(`${base}/status`).set(auth(intruderToken)).send({ status: 'SENT' }).expect(404);
        await http().delete(base).set(auth(intruderToken)).expect(404);
        await http().get(`${base}/pdf`).set(auth(intruderToken)).expect(404);
        await http().get(`${base}/contract`).set(auth(intruderToken)).expect(404);
    });

    it('no permite crear una cotización con el cliente de otro usuario', async () => {
        await http()
            .post('/api/quotes')
            .set(auth(intruderToken))
            .send({ clientId, title: 'Intento', items: [{ description: 'x', quantity: 1, unitPrice: 1 }] })
            .expect(404);
    });

    it('ignora cualquier intento de asignar el propietario desde el body', async () => {
        await http().post('/api/clients').set(auth(intruderToken)).send({ name: 'X', userId: 'otro-id' }).expect(400);
    });

    it('los datos del dueño siguen intactos después de los intentos', async () => {
        await http().patch(`/api/clients/${clientId}`).set(auth(intruderToken)).send({ name: 'Hackeado' });
        const res = await http().get(`/api/clients/${clientId}`).set(auth(ownerToken)).expect(200);
        expect(res.body.name).toBe('Cliente de prueba');
    });
});