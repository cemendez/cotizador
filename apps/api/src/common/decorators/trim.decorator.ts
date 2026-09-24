import { Transform } from 'class-transformer';

/** Recorta espacios y convierte "" en null (útil para campos opcionales de formularios). */
export const Trim = () =>
    Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
    });