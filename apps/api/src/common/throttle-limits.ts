const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Límite general de toda la API, por IP */
export const GENERAL_LIMIT = { ttl: MINUTE, limit: 100 };

/** Límites estrictos para las rutas sensibles (por IP) */
export const STRICT_LIMITS = {
    login: { default: { limit: 10, ttl: 15 * MINUTE } },
    register: { default: { limit: 5, ttl: HOUR } },
    changePassword: { default: { limit: 5, ttl: 15 * MINUTE } },
};