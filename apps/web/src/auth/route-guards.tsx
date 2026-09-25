import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { useAuth } from './auth-context';

/** Solo usuarios autenticados. Si no, al login recordando a dónde quería ir. */
export function RequireAuth() {
    const { status } = useAuth();
    const location = useLocation();

    if (status === 'loading') return <FullPageSpinner />;
    if (status === 'anonymous') {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    return <Outlet />;
}

/** Solo visitantes (login, registro). Si ya hay sesión, al inicio. */
export function GuestOnly() {
    const { status } = useAuth();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? '/'

    if (status === 'loading') return <FullPageSpinner />;
    if (status === 'authenticated') return <Navigate to={from} replace />;
    return <Outlet />;
}