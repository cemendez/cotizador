/** Precio fijo si lo tiene; si no, horas × tarifa. null si no hay forma de calcularlo. */
export function servicePrice(service: { estimatedHours: string; fixedPrice: string | null }, hourlyRate: number | null) {
    if (service.fixedPrice !== null) return Number(service.fixedPrice);
    if (hourlyRate === null) return null;
    return Math.round(Number(service.estimatedHours) * hourlyRate * 100) / 100;
}