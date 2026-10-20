import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { auth, createTestApp, registerUser, resetDatabase } from './helpers.js';

const VALID = {
    monthlyNetIncome: 28000,
    costEquipment: 1000,
    costTools: 500,
    costOffice: 0,
    costTransport: 500,
    costServices: 1000,
    costAdvertising: 1000,
    marginPercent: 10,
    taxReservePercent: 15,
    billableHoursPerMonth: 120,
    hourlyRate: 350,
};

describe('Tarifa por hora (e2e)', () => {
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

    it('devuelve valores de ejemplo mientras no hay nada guardado', async () => {
        const res = await http().get('/api/pricing').set(auth(token)).expect(200);
        expect(res.body.hourlyRate).toBeNull();
        expect(res.body.monthlyNetIncome).toBe('28000');
    });

    it('guarda, vuelve a leer y actualiza sin duplicar', async () => {
        const saved = await http().put('/api/pricing').set(auth(token)).send(VALID).expect(200);
        expect(saved.body).toMatchObject({ hourlyRate: '350', taxReservePercent: '15' });

        await http().put('/api/pricing').set(auth(token)).send({ ...VALID, hourlyRate: 400 }).expect(200);
        const res = await http().get('/api/pricing').set(auth(token)).expect(200);
        expect(res.body.hourlyRate).toBe('400');
        expect(await prisma.pricingSettings.count()).toBe(1);
    });

    it.each([
        { hourlyRate: 0 },
        { taxReservePercent: 100 },
        { billableHoursPerMonth: 0 },
        { costOffice: -1 },
        { monthlyNetIncome: 10.123 },
        { marginPercent: null },
    ])('rechaza %j', async (change) => {
        await http().put('/api/pricing').set(auth(token)).send({ ...VALID, ...change }).expect(400);
    });

    it('rechaza cuerpos incompletos o con campos desconocidos', async () => {
        await http().put('/api/pricing').set(auth(token)).send({}).expect(400);
        await http().put('/api/pricing').set(auth(token)).send({ ...VALID, userId: 'otro' }).expect(400);
    });

    it('cada usuario ve solo lo suyo y se exige autenticación', async () => {
        await http().put('/api/pricing').set(auth(token)).send(VALID).expect(200);

        const other = await registerUser(app, 'Otro');
        const res = await http().get('/api/pricing').set(auth(other.token)).expect(200);
        expect(res.body.hourlyRate).toBeNull();

        await http().get('/api/pricing').expect(401);
    });
});