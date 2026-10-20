import { describe, expect, it } from 'vitest';
import { calculateTotals } from './totals';

describe('calculateTotals', () => {
    it('coincide con los números del backend', () => {
        const result = calculateTotals(
            [
                { quantity: 1, unitPrice: 15000 },
                { quantity: 12.5, unitPrice: 450 },
            ],
            16,
        );
        expect(result).toMatchObject({ subtotal: 20625, taxAmount: 3300, total: 23925 });
    });

    it('no arrastra errores de punto flotante', () => {
        expect(calculateTotals([{ quantity: 3, unitPrice: 0.1 }], 0).total).toBe(0.3);
    });
});