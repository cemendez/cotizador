import { describe, expect, it } from 'vitest';
import { calculateHourlyRate, type RateInputs } from './rate';

const EXAMPLE: RateInputs = {
    monthlyNetIncome: 28000,
    monthlyCosts: 4000,
    marginPercent: 10,
    taxReservePercent: 15,
    billableHoursPerMonth: 120,
};

describe('calculateHourlyRate', () => {
    it('aplica costos, margen, reserva de impuestos y horas facturables', () => {
        const result = calculateHourlyRate(EXAMPLE);
        expect(result.beforeTaxes).toBeCloseTo(35200, 2);
        expect(result.grossIncome).toBeCloseTo(41411.76, 1);
        expect(result.exactRate).toBe(345.1);
        expect(result.suggestedRate).toBe(350);
    });

    it('con menos horas facturables la tarifa sube', () => {
        expect(calculateHourlyRate({ ...EXAMPLE, billableHoursPerMonth: 100 }).suggestedRate).toBe(420);
    });

    it('sin costos, margen ni impuestos es solo ingreso ÷ horas', () => {
        const result = calculateHourlyRate({
            ...EXAMPLE,
            monthlyCosts: 0,
            marginPercent: 0,
            taxReservePercent: 0,
            billableHoursPerMonth: 100,
        });
        expect(result.suggestedRate).toBe(280);
    });

    it('un múltiplo exacto de $10 no se redondea hacia arriba', () => {
        const result = calculateHourlyRate({
            monthlyNetIncome: 35000,
            monthlyCosts: 0,
            marginPercent: 0,
            taxReservePercent: 0,
            billableHoursPerMonth: 100,
        });
        expect(result.suggestedRate).toBe(350);
    });

    it('no se rompe con horas en cero, campos vacíos o impuestos fuera de rango', () => {
        expect(calculateHourlyRate({ ...EXAMPLE, billableHoursPerMonth: 0 }).suggestedRate).toBe(0);
        expect(calculateHourlyRate({ ...EXAMPLE, monthlyNetIncome: NaN }).exactRate).toBeGreaterThan(0);
        expect(Number.isFinite(calculateHourlyRate({ ...EXAMPLE, taxReservePercent: 100 }).grossIncome)).toBe(true);
    });
});