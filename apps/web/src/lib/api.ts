import type { AuthResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

export const tokenStore = {
    set: (token: string | null) => {
        accessToken = token;
    },
};

export function setSessionExpiredHandler(handler: () => void) {
    onSessionExpired = handler;
}

/**
 * Pide un access token nuevo usando la cookie httpOnly.
 * Si ya hay un refresh en curso, devuelve la misma promesa (una sola petición a la vez).
 */
export function refreshSession(): Promise<AuthResponse | null> {
    refreshPromise ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
        .then(async (res) => {
            if (!res.ok) return null;
            const session = (await res.json()) as AuthResponse;
            accessToken = session.accessToken;
            return session;
        })
        .catch(() => null)
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

async function toApiError(res: Response): Promise<ApiError> {
    try {
        const body = await res.json();
        // NestJS devuelve message como string o como arreglo (errores de validación)
        const message = Array.isArray(body.message) ? body.message.join('. ') : body.message;
        return new ApiError(res.status, message ?? res.statusText);
    } catch {
        return new ApiError(res.status, res.statusText);
    }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    retryOnUnauthorized?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, retryOnUnauthorized = true, ...init } = options;

    const headers = new Headers(init.headers);
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Token vencido: intentar refresh una vez y repetir la petición original
    if (res.status === 401 && retryOnUnauthorized && !path.startsWith('/auth/')) {
        const session = await refreshSession();
        if (session) return api<T>(path, { ...options, retryOnUnauthorized: false });
        onSessionExpired?.();
    }

    if (!res.ok) throw await toApiError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}