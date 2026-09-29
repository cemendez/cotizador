import { describe, expect, it } from 'vitest';
import { currentMonthRangeMx, todayMxAsDateOnly } from './mx-dates.js';

describe('currentMonthRangeMx', () => {
    it('30 de septiembre 21:00 en México sigue siendo septiembre (aunque en UTC ya es octubre)', () => {
        const { start, end } = currentMonthRangeMx(new Date('2026-10-01T03:00:00Z'));
        expect(start.toISOString()).toBe('2026-09-01T06:00:00.000Z');
        expect(end.toISOString()).toBe('2026-10-01T06:00:00.000Z');
    });

    it('maneja el cambio de año', () => {
        const { start, end } = currentMonthRangeMx(new Date('2026-12-15T12:00:00Z'));
        expect(start.toISOString()).toBe('2026-12-01T06:00:00.000Z');
        expect(end.toISOString()).toBe('2027-01-01T06:00:00.000Z');
    });
});

describe('todayMxAsDateOnly', () => {
    it('usa la fecha de México, no la de UTC', () => {
        expect(todayMxAsDateOnly(new Date('2026-10-01T03:00:00Z')).toISOString()).toBe('2026-09-30T00:00:00.000Z');
    });
});