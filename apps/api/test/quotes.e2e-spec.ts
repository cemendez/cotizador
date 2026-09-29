import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { auth, createClient, createQuote, createTestApp, registerUser, resetDatabase, setStatus } from './helpers.js';

describe('Cotizaciones (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let token: string;
    let clientId: string;
    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
    });
    afterAll(() => app.close());

    beforeEach(async () => {
        await resetDatabase(prisma);
        token = (await registerUser(app)).token;
        clientId = (await createClient(app, token)).id;
    });

    describe('creación y cálculo', () => {
        it('calcula importes, IVA y total con decimales exactos', async () => {
            const quote = await createQuote(app, token, clientId);

            expect(quote).toMatchObject({ subtotal: '20625', taxAmount: '3300', total: '23925', status: 'DRAFT' });
            expect(quote.items.map((i: { amount: string }) => i.amount)).toEqual(['15000', '5625']);
            expect(quote.folio).toMatch(/^COT-\d{4}-0001$/);
        });

        it('asigna folios consecutivos y únicos aunque se creen en paralelo', async () => {
            const quotes = await Promise.all(Array.from({ length: 5 }, () => createQuote(app, token, clientId)));
            const numbers = quotes.map((q) => q.number).sort((a, b) => a - b);
            expect(numbers).toEqual([1, 2, 3, 4, 5]);
        });

        it('rechaza cotizaciones sin conceptos o con más de 2 decimales', async () => {
            await http().post('/api/quotes').set(auth(token)).send({ clientId, title: 'Vacía', items: [] }).expect(400);
            await http()
                .post('/api/quotes')
                .set(auth(token))
                .send({ clientId, title: 'Decimales', items: [{ description: 'x', quantity: 1.234, unitPrice: 10 }] })
                .expect(400);
        });

        it('recalcula al cambiar conceptos o la tasa de IVA', async () => {
            const { id } = await createQuote(app, token, clientId);

            const exempt = await http().patch(`/api/quotes/${id}`).set(auth(token)).send({ taxRate: 0 }).expect(200);
            expect(exempt.body).toMatchObject({ taxAmount: '0', total: '20625' });
            expect(exempt.body.items).toHaveLength(2); // los conceptos no se tocaron

            const replaced = await http()
                .patch(`/api/quotes/${id}`)
                .set(auth(token))
                .send({ items: [{ description: 'Único', quantity: 3, unitPrice: 0.1 }] })
                .expect(200);
            expect(replaced.body.items).toHaveLength(1);
            expect(replaced.body.total).toBe('0.3'); // sin errores de punto flotante
        });
    });

    describe('máquina de estados', () => {
        it('solo permite las transiciones definidas', async () => {
            const { id } = await createQuote(app, token, clientId);

            await setStatus(app, token, id, 'ACCEPTED').then((res) => expect(res.status).toBe(409));

            const sent = await setStatus(app, token, id, 'SENT');
            expect(sent.status).toBe(200);
            expect(sent.body.sentAt).not.toBeNull();

            const accepted = await setStatus(app, token, id, 'ACCEPTED');
            expect(accepted.status).toBe(200);
            expect(accepted.body.acceptedAt).not.toBeNull();

            // ACCEPTED es un estado final
            await setStatus(app, token, id, 'DRAFT').then((res) => expect(res.status).toBe(409));
        });

        it('bloquea la edición y el borrado fuera de borrador', async () => {
            const { id } = await createQuote(app, token, clientId);
            await setStatus(app, token, id, 'SENT');

            await http().patch(`/api/quotes/${id}`).set(auth(token)).send({ title: 'Cambio' }).expect(409);
            await http().delete(`/api/quotes/${id}`).set(auth(token)).expect(409);

            // Regresar a borrador vuelve a habilitar la edición
            await setStatus(app, token, id, 'DRAFT');
            await http().patch(`/api/quotes/${id}`).set(auth(token)).send({ title: 'Cambio' }).expect(200);
        });

        it('no permite borrar un cliente con cotizaciones', async () => {
            await createQuote(app, token, clientId);
            await http().delete(`/api/clients/${clientId}`).set(auth(token)).expect(409);
        });
    });

    describe('PDFs', () => {
        it('genera la cotización en cualquier estado', async () => {
            const { id } = await createQuote(app, token, clientId);
            const res = await http().get(`/api/quotes/${id}/pdf`).set(auth(token)).responseType('blob').expect(200);

            expect(res.headers['content-type']).toContain('application/pdf');
            expect(res.body.subarray(0, 5).toString()).toBe('%PDF-'); // firma de todo archivo PDF
        });

        it('solo genera el contrato de cotizaciones aceptadas', async () => {
            const { id } = await createQuote(app, token, clientId);
            await http().get(`/api/quotes/${id}/contract`).set(auth(token)).expect(409);

            await setStatus(app, token, id, 'SENT');
            await setStatus(app, token, id, 'ACCEPTED');

            const res = await http().get(`/api/quotes/${id}/contract`).set(auth(token)).responseType('blob').expect(200);
            expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
        });
    });
});