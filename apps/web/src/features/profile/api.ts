import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth-context';
import { api } from '../../lib/api';
import type { User } from '../../types/api';

export interface ProfileInput {
    name: string;
    businessName: string;
    rfc: string;
}

export function useUpdateProfile() {
    const { updateUser } = useAuth();
    return useMutation({
        mutationFn: (input: ProfileInput) => api<User>('/users/me', { method: 'PATCH', body: input }),
        onSuccess: updateUser,
    })
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (input: { currentPassword: string; newPassword: string }) =>
            api<void>('/users/me/password', { method: 'PATCH', body: input }),
    })
}