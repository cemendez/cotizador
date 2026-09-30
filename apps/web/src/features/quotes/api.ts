import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Paginated, Quote, QuoteStatus, QuoteSummary } from '../../types/api';
import { clientKeys } from '../clients/api';

export interface QuoteListParams {
    page: number;
    status: QuoteStatus | '';
    search: string;
}

export interface QuoteInput {
    clientId: string;
    title: string;
    currency: string;
    taxRate: number;
    validUntil: string | null;
    terms: string;
    notes: string;
    items: Array<{ description: string; unit: string; quantity: number; unitPrice: number }>;
}

export const quoteKeys = {
    all: ['quotes'] as const,
    list: (params: QuoteListParams) => [...quoteKeys.all, 'list', params] as const,
    detail: (id: string) => [...quoteKeys.all, 'details', id] as const,
};

export function useQuotes(params: QuoteListParams) {
    return useQuery({
        queryKey: quoteKeys.list(params),
        queryFn: () => {
            const query = new URLSearchParams({ page: String(params.page), pageSize: '10' });
            if (params.status) query.set('status', params.status);
            if (params.search) query.set('search', params.search);
            return api<Paginated<QuoteSummary>>(`/quotes?${query}`);
        },
        placeholderData: keepPreviousData,
    });
}

export function useQuote(id: string | undefined) {
    return useQuery({
        queryKey: quoteKeys.detail(id ?? ''),
        queryFn: () => api<Quote>(`/quotes/${id}`),
        enabled: Boolean(id),
    })
}

export function useSaveQuote(id?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: QuoteInput) =>
            id
                ? api<Quote>(`/quotes/${id}`, { method: 'PATCH', body: input })
                : api<Quote>('/quotes', { method: 'POST', body: input }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quoteKeys.all });
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
        }
    })
}

export function useChangeQuoteStatus(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (status: QuoteStatus) =>
            api<Quote>(`/quotes/${id}/status`, { method: 'PATCH', body: { status } }),
        onSuccess: (quote) => {
            queryClient.setQueryData(quoteKeys.detail(id), quote);
            queryClient.invalidateQueries({ queryKey: [...quoteKeys.all, 'list'] });
        }
    })
}

export function useDeleteQuote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api<void>(`/quotes/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quoteKeys.all });
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
        }
    })
}

export async function openPdf(path: string) {
    const tab = window.open('', '_blank');
    try {
        const blob = await api<Blob>(path, { responseType: 'blob' });
        const url = URL.createObjectURL(blob);
        if (tab) tab.location.href = url
        else window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000); // liberar memoria
    } catch (error) {
        tab?.close();
        throw error;
    }
}