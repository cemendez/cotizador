import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // No reintentar errores del cliente (400, 404...), solo fallas de red o del servidor
            retry: (failureCount, error) =>
                error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
        },
    },
});