import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { auth, createTestApp, registerUser, resetDatabase } from './helpers.js';

describe('Catálogo de servicios (e2e)', () => {
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

    it('carga los servicios iniciales una sola vez, ordenados por horas', async () => {
        const res = await http().post('/api/services/defaults').set(auth(token)).expect(201);
        expect(res.body.map((s: { estimatedHours: string }) => s.estimatedHours)).toEqual(['20', '35', '50', '70']);
        await http().post('/api/services/defaults').set(auth(token)).expect(409);
    });

    it('crea, edita y borra un servicio', async () => {
        const created = await http()
            .post('/api/services')
            .set(auth(token))
            .send({ name: 'Landing page', estimatedHours: 8, fixedPrice: 2500, description: '   ' })
            .expect(201);
        expect(created.body).toMatchObject({ fixedPrice: '2500', description: null });

        const id = created.body.id;
        const noFixed = await http().patch(`/api/services/${id}`).set(auth(token)).send({ fixedPrice: null }).expect(200);
        expect(noFixed.body.fixedPrice).toBeNull();

        await http().patch(`/api/services/${id}`).set(auth(token)).send({ estimatedHours: 10 }).expect(200);
        await http().delete(`/api/services/${id}`).set(auth(token)).expect(204);
        expect((await http().get('/api/services').set(auth(token)).expect(200)).body).toEqual([]);
    });

    it.each([{ estimatedHours: 0 }, { estimatedHours: null }, { name: null }, { name: ' ' }, { fixedPrice: -1 }])(
        'rechaza %j al editar',
        async (change) => {
            const { body } = await http()
                .post('/api/services')
                .set(auth(token))
                .send({ name: 'Servicio', estimatedHours: 5 })
                .expect(201);
            await http().patch(`/api/services/${body.id}`).set(auth(token)).send(change).expect(400);
        },
    );

    it('cada usuario ve solo su catálogo', async () => {
        const { body } = await http()
            .post('/api/services')
            .set(auth(token))
            .send({ name: 'Mío', estimatedHours: 5 })
            .expect(201);

        const other = (await registerUser(app, 'Otro')).token;
        expect((await http().get('/api/services').set(auth(other)).expect(200)).body).toEqual([]);
        await http().patch(`/api/services/${body.id}`).set(auth(other)).send({ name: 'X' }).expect(404);
        await http().delete(`/api/services/${body.id}`).set(auth(other)).expect(404);
    });
});