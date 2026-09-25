import { createContext, use } from 'react';
import type { User } from '../types/api';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface SignupData {
    name: string;
    email: string;
    password: string;
}

export interface AuthContextValue {
    user: User | null;
    status: AuthStatus;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
    const ctx = use(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
}