import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { PricingSettings } from '../../types/api';

export interface PricingInput {
    monthlyNetIncome: number;
    costEquipment: number;
    costTools: number;
    costOffice: number;
    costTransport: number;
    costServices: number;
    costAdvertising: number;
    marginPercent: number;
    taxReservePercent: number;
    billableHoursPerMonth: number;
    hourlyRate: number;
}

export const pricingKeys = { all: ['pricing'] as const };

export function usePricing() {
    return useQuery({ queryKey: pricingKeys.all, queryFn: () => api<PricingSettings>('/pricing') });
}

export function useSavePricing() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: PricingInput) => api<PricingSettings>('/pricing', { method: 'PUT', body: input }),
        onSuccess: (saved) => queryClient.setQueryData(pricingKeys.all, saved),
    });
}