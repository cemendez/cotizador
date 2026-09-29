import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { DashboardSummary } from '../../types/api';

export function useDashboard() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api<DashboardSummary>('/dashboard'),
        staleTime: 0, // el  resumen depende de todo: se recarga en cada visita
    });
}