import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/** ¿Se permite crear cuentas nuevas? Se cierra en cuanto existe el primer usuario */
export function useRegistrationStatus() {
    return useQuery({
        queryKey: ['auth', 'registration'],
        queryFn: () => api<{ open: boolean }>('/auth/registration'),
        staleTime: 5 * 60_000,
    });
}