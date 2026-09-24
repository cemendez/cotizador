import { describe, expect, it } from 'vitest';
import { calculateQuote, formatFolio } from './quote-calculator.js';

describe('calculateQuote', () => {
    it('calcula importes, subtotal, IVA y total', () => {
        const { items, totals } = calculateQuote(
            [
                { description: 'Diseño de identidad', quantity: 1, unitPrice: 15000 },
                { description: 'Horas de desarrollo', quantity: 12.5, unitPrice: 450 },
            ],
            16,
        );

        expect(items[1].amount.toString()).toBe('5625');
        expect(totals.subtotal.toString()).toBe('20625');
        expect(totals.taxAmount.toString()).toBe('3300');
        expect(totals.total.toString()).toBe('23925');
    });

    it('no arrastra errores de punto flotante', () => {
        const { items } = calculateQuote([{ description: 'x', quantity: 3, unitPrice: 0.1 }], 0);
        expect(items[0].amount.toString()).toBe('0.3'); // en JS puro sería 0.30000000000000004
    });

    it('redondea el IVA a 2 decimales', () => {
        const { totals } = calculateQuote([{ description: 'x', quantity: 1, unitPrice: 10.05 }], 16);
        expect(totals.taxAmount.toString()).toBe('1.61'); // 1.608 → 1.61
    });

    it('soporta tasa 0 (exento de IVA)', () => {
        const { totals } = calculateQuote([{ description: 'x', quantity: 2, unitPrice: 500 }], 0);
        expect(totals.taxAmount.toString()).toBe('0');
        expect(totals.total.toString()).toBe('1000');
    });

    it('asigna la posición según el orden recibido', () => {
        const { items } = calculateQuote(
            [
                { description: 'a', quantity: 1, unitPrice: 1 },
                { description: 'b', quantity: 1, unitPrice: 1 },
            ],
            16,
        );
        expect(items.map((i) => i.position)).toEqual([0, 1]);
    });
});

describe('formatFolio', () => {
    it('rellena con ceros e incluye el año', () => {
        expect(formatFolio(7, new Date('2026-09-24'))).toBe('COT-2026-0007');
    });
});