import { Transform } from 'class-transformer';

/** Recorta espacios y pasa a minúsculas antes de validar (el correo no distingue mayúsculas) */
export const NormalizeEmail = () =>
    Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));