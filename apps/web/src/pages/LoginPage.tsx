import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import { z } from 'zod';
import { useAuth } from '../auth/auth-context';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { ApiError } from '../lib/api';

const schema = z.object({
    email: z.email('Correo inválido'),
    password: z.string().min(1, 'Ingresa tu contraseña'),
})

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
    const { login } = useAuth();
    const location = useLocation();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = async ({ email, password }: FormValues) => {
        try {
            await login(email, password);
        } catch (error) {
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
                    <h1 className="text-2xñ font-semibol text-slate-900">Iniciar sesión</h1>
                    <p className="text-sm text-slate-500">Gestiona tus clientes y cotizaciones</p>
                </div>

                {errors.root && (
                    <p className="rounded-lg gb-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
                )}

                <TextField label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />

                <TextField
                    label="Contraseña"
                    type="password"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register('password')}
                />

                <Button type="submit" loading={isSubmitting} className="w-full">
                    Entrar
                </Button>

                <p className="text-center text-sm text-slate-600">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" state={location.state} className="font-medium text-indigo-600 hover:underline">
                        Regístrate
                    </Link>
                </p>
            </form>
        </div>
    )
}