import { useAuth } from '../auth/auth-context';

export function DashboardPage() {
    const { user } = useAuth();
    return (
        <div>
            <h1 className="text-2xl font-semibold text-slate-900">Hola, {user?.name}</h1>
            <p className="mt-1 text-slate-600">Aquí verás el resumen de tus cotizaciones.</p>
        </div>
    )
}