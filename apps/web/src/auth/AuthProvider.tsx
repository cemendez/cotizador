import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, refreshSession, setSessionExpiredHandler, tokenStore } from '../lib/api';
import type { AuthResponse, User } from '../types/api';
import { AuthContext, type AuthStatus, type SignupData } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');

    const startSession = useCallback((session: AuthResponse) => {
        tokenStore.set(session.accessToken);
        setUser(session.user);
        setStatus('authenticated');
    }, []);

    const endSession = useCallback(() => {
        tokenStore.set(null);
        setUser(null);
        setStatus('anonymous');
        queryClient.clear(); // no dejar datos del usuario anterior en caché
    }, [queryClient]);

    // Al cargar la app: si hay cookie válida, recuperar la sesión sin pedir login
    useEffect(() => {
        setSessionExpiredHandler(endSession);
        refreshSession().then((session) => (session ? startSession(session) : endSession()));
    }, [startSession, endSession]);

    const login = useCallback(
        async (email: string, password: string) => {
            startSession(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }));
        },
        [startSession],
    );

    const signup = useCallback(
        async (data: SignupData) => {
            startSession(await api<AuthResponse>('/auth/register', { method: 'POST', body: data }));
        },
        [startSession],
    );

    const logout = useCallback(async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
        endSession();
    }, [endSession]);

    const value = useMemo(
        () => ({ user, status, login, signup, logout }),
        [user, status, login, signup, logout],
    );

    return <AuthContext value={value}>{children}</AuthContext>;
}