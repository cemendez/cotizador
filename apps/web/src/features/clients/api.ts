import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Client, Paginated } from '../../types/api';

export interface ClientListParams {
    page: number;
    search: string;
}

export interface ClientInput {
    name: string;
    company: string;
    email: string;
    phone: string;
    rfc: string;
    address: string;
    notes: string;
}

export const clientKeys = {
    all: ['clients'] as const,
    list: (params: ClientListParams) => [...clientKeys.all, 'list', params] as const,
    detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
};

export function useClients(params: ClientListParams) {
    return useQuery({
        queryKey: clientKeys.list(params),
        queryFn: () => {
            const query = new URLSearchParams({ page: String(params.page), pageSize: '10' });
            if (params.search) query.set('search', params.search);
            return api<Paginated<Client>>(`/clients?${query}`);
        },
        // Mientras carga la página siguiente, sigue mostrando la anterior (sin parpadeo)
        placeholderData: keepPreviousData,
    });
}

export function useClient(id: string | undefined) {
    return useQuery({
        queryKey: clientKeys.detail(id ?? ''),
        queryFn: () => api<Client>(`/clients/${id}`),
        enabled: Boolean(id),
    })
}

export function useSaveClient(id?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ClientInput) =>
            id
                ? api<Client>(`/clients/${id}`, { method: 'PATCH', body: input })
                : api<Client>(`/clients`, { method: 'POST', body: input }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
    });
}

export function useDeleteClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api<void>(`/clients/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
    });
}