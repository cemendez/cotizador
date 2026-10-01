import type { AuthResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
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

function fallbackMessage(status: number) {
    if (status >= 500) {
        return 'El servidor no está disponible. Si estuvo inactivo, puede tardar hasta un minuto en despertar; intenta de nuevo en un momento.';
    }
    if (status === 404) return 'No se encontró el servicio solicitado.';
    return `No se pudo completar la solicitud (error ${status}).`;
}

async function toApiError(res: Response): Promise<ApiError> {
    let message: string | undefined;
    try {
        const body = await res.json();
        // NestJS devuelve message como string o como arreglo (errores de validación)
        message = Array.isArray(body.message) ? body.message.join('. ') : body.message;
    } catch {
        // La respuesta no era JSON (por ejemplo, un error del proxy): se usa el mensaje genérico
    }
    return new ApiError(res.status, message || fallbackMessage(res.status));
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    retryOnUnauthorized?: boolean;
    responseType?: 'json' | 'blob';
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, retryOnUnauthorized = true, responseType = 'json', ...init } = options;

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
    return (responseType === 'blob' ? await res.blob() : await res.json()) as T;
}