import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import { z } from 'zod';
import { useAuth } from '../auth/auth-context';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { ApiError } from '../lib/api';

const schema = z
    .object({
        name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
        email: z.email('Correo inválido'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
    const { signup } = useAuth();
    const location = useLocation();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = async ({ name, email, password }: FormValues) => {
        try {
            await signup({ name, email, password });
        } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
                setError('email', { message: error.message });
                return;
            }
            setError('root', {
                message: error instanceof ApiError ? error.message : 'No se pudo conectar con el servidor',
            });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Crear cuenta</h1>
                    <p className="text-sm text-slate-500">Empieza a cotizar en minutos</p>
                </div>

                {errors.root && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
                )}

                <TextField label="Nombre" autoComplete="name" error={errors.name?.message} {...register('name')} />
                <TextField label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                <TextField
                    label="Contraseña"
                    type="password"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    {...register('password')}
                />
                <TextField
                    label="Confirmar contraseña"
                    type="password"
                    autoComplete="new-password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <Button type="submit" loading={isSubmitting} className="w-full">
                    Crear cuenta
                </Button>

                <p className="text-center text-sm text-slate-600">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" state={location.state} className="font-medium text-indigo-600 hover:underline">
                        Inicia sesión
                    </Link>
                </p>

            </form>
        </div>
    );
}