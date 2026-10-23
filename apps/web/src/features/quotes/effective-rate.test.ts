import { describe, expect, it } from 'vitest';
import { calculateEffectiveRate } from './effective-rate';

describe('calculateEffectiveRate', () => {
    it('con el precio de tu tarifa cubre el 100%', () => {
        const result = calculateEffectiveRate([{ amount: 7000, estimatedHours: 20 }], 350);
        expect(result).toMatchObject({ rate: 350, coverage: 1, minimumPrice: 7000 });
    });

    it('cobrar $3,500 por 20 horas es la mitad de tu tarifa', () => {
        const result = calculateEffectiveRate([{ amount: 3500, estimatedHours: 20 }], 350);
        expect(result).toMatchObject({ rate: 175, coverage: 0.5, minimumPrice: 7000 });
    });

    it('ignora los conceptos sin horas y los cuenta aparte', () => {
        const result = calculateEffectiveRate(
            [
                { amount: 7000, estimatedHours: 20 },
                { amount: 500, estimatedHours: null },
            ],
            350,
        );
        expect(result).toMatchObject({ hours: 20, revenue: 7000, itemsWithoutHours: 1 });
    });

    it('sin horas o sin tarifa configurada no inventa números', () => {
        expect(calculateEffectiveRate([{ amount: 500, estimatedHours: null }], 350).rate).toBeNull();
        expect(calculateEffectiveRate([{ amount: 7000, estimatedHours: 20 }], null)).toMatchObject({
            rate: 350,
            coverage: null,
            minimumPrice: null,
        });
    });
});