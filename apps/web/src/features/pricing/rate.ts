export interface RateInputs {
    monthlyNetIncome: number;
    monthlyCosts: number;
    marginPercent: number;
    taxReservePercent: number;
    billableHoursPerMonth: number;
}

const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * tarifa = (ingreso neto + costos) × (1 + margen) ÷ (1 − reserva de impuestos) ÷ horas facturables
 */
export function calculateHourlyRate(input: RateInputs) {
    const monthlyNetIncome = safe(input.monthlyNetIncome);
    const monthlyCosts = safe(input.monthlyCosts);
    const margin = Math.max(0, safe(input.marginPercent));
    const taxReserve = Math.min(Math.max(0, safe(input.taxReservePercent)), 90);
    const hours = safe(input.billableHoursPerMonth);

    const base = monthlyNetIncome + monthlyCosts;
    const marginAmount = base * (margin / 100);
    const beforeTaxes = base + marginAmount;
    const grossIncome = beforeTaxes / (1 - taxReserve / 100);
    const taxAmount = grossIncome - beforeTaxes;
    const exactRate = hours > 0 ? round2(grossIncome / hours) : 0;
    const suggestedRate = Math.ceil(exactRate / 10) * 10;

    return { monthlyNetIncome, monthlyCosts, base, marginAmount, beforeTaxes, taxAmount, grossIncome, exactRate, suggestedRate };
}