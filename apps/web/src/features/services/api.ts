import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Service } from '../../types/api';

export interface ServiceInput {
    name: string;
    description: string;
    estimatedHours: number;
    fixedPrice: number | null;
}

export const serviceKeys = { all: ['services'] as const };

export function useServices() {
    return useQuery({ queryKey: serviceKeys.all, queryFn: () => api<Service[]>('/services') });
}

export function useSaveService(id?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ServiceInput) =>
            id
                ? api<Service>(`/services/${id}`, { method: 'PATCH', body: input })
                : api<Service>('/services', { method: 'POST', body: input }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
    });
}

export function useDeleteService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api<void>(`/services/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
    });
}

export function useSeedServices() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api<Service[]>('/services/defaults', { method: 'POST' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
    });
}