export interface RateItem {
    amount: number;
    estimatedHours: number | null;
}

/** Tarifa efectiva = importe de los conceptos con horas ÷ sus horas (antes de IVA) */
export function calculateEffectiveRate(items: RateItem[], hourlyRate: number | null) {
    const withHours = items.filter((item) => typeof item.estimatedHours === 'number' && item.estimatedHours > 0);
    const hours = withHours.reduce((sum, item) => sum + (item.estimatedHours ?? 0), 0);
    const revenue = withHours.reduce((sum, item) => sum + item.amount, 0);

    const rate = hours > 0 ? Math.round((revenue / hours) * 100) / 100 : null;
    const coverage = rate !== null && hourlyRate !== null && hourlyRate > 0 ? rate / hourlyRate : null;
    const minimumPrice = hourlyRate !== null && hours > 0 ? Math.round(hourlyRate * hours * 100) / 100 : null;

    return { hours, revenue, rate, coverage, minimumPrice, itemsWithoutHours: items.length - withHours.length };
}