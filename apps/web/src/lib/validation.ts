/** ¿Tiene como máximo 2 decimales? (con tolerancia a errores de punto flotante) */
export const twoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

/** Para campos numéricos opcionales: vacío → null */
export const toNullableNumber = (value: unknown) => (value === '' || value == null ? null : Number(value));