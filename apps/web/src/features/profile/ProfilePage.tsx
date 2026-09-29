import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../auth/auth-context';
import { Button } from '../../components/ui/Button';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { TextField } from '../../components/ui/TextField';
import { useChangePassword, useUpdateProfile } from './api';

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

const profileSchema = z.object({
    name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
    businessName: z.string().trim().max(150),
    rfc: z
        .string()
        .trim()
        .toUpperCase()
        .refine((value) => value === '' || RFC_REGEX.test(value), 'RFC con formato inválido'),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
        newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(72),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function SuccessMessage({ children }: { children: React.ReactNode }) {
    return <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{children}</div>;
}

function ProfileForm() {
    const { user } = useAuth();
    const updateProfile = useUpdateProfile();
    const [saved, setSaved] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting, isDirty },
        reset,
    } = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name ?? '', businessName: user?.businessName ?? '', rfc: user?.rfc ?? '' },
    });

    const onSubmit = async (values: ProfileValues) => {
        setSaved(false);
        try {
            const updated = await updateProfile.mutateAsync(values);
            // El formulario toma los valores guardados como nuevo punto de partida (isDirty vuelve a false)
            reset({ name: updated.name, businessName: updated.businessName ?? '', rfc: updated.rfc ?? '' });
            setSaved(true);
        } catch (error) {
            setError('root', { message: error instanceof Error ? error.message : 'Error inesperado' });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <div>
                <h2 className="font-semibold text-slate-900">Datos del emisor</h2>
                <p className="text-sm text-slate-500">Aparecen en tus cotizaciones y contratos en PDF.</p>
            </div>
            {errors.root && <ErrorAlert message={errors.root.message ?? ''} />}
            {saved && <SuccessMessage>Datos actualizados.</SuccessMessage>}

            <TextField label="Correo" value={user?.email ?? ''} disabled readOnly />
            <TextField label="Nombre *" error={errors.name?.message} {...register('name')} />
            <TextField label="Razón social o nombre comercial" error={errors.businessName?.message} {...register('businessName')} />
            <TextField label="RFC" className="font-mono uppercase" error={errors.rfc?.message} {...register('rfc')} />

            <div className="flex justify-end">
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                    Guardar cambios
                </Button>
            </div>
        </form>
    );
}

function PasswordForm() {
    const { logout } = useAuth();
    const changePassword = useChangePassword();
    const [changed, setChanged] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

    const onSubmit = async ({ currentPassword, newPassword }: PasswordValues) => {
        try {
            await changePassword.mutateAsync({ currentPassword, newPassword });
            reset();
            setChanged(true);
        } catch (error) {
            setError('currentPassword', { message: error instanceof Error ? error.message : 'Error inesperado' });
        }
    };

    if (changed) {
        return (
            <div className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="font-semibold text-slate-900">Contraseña</h2>
                <SuccessMessage>
                    Contraseña actualizada. Por seguridad se cerraron todas tus sesiones, incluida esta.
                </SuccessMessage>
                <Button onClick={logout}>Iniciar sesión de nuevo</Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="font-semibold text-slate-900">Cambiar contraseña</h2>
            <TextField
                label="Contraseña actual"
                type="password"
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
            />
            <TextField
                label="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                {...register('newPassword')}
            />
            <TextField
                label="Confirmar nueva contraseña"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
            />
            <div className="flex justify-end">
                <Button type="submit" loading={isSubmitting}>
                    Cambiar contraseña
                </Button>
            </div>
        </form>
    );
}

export function ProfilePage() {
    return (
        <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
            <ProfileForm />
            <PasswordForm />
        </div>
    );
}