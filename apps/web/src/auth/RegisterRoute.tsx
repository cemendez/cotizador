import { Navigate } from 'react-router';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { RegisterPage } from '../pages/RegisterPage';
import { useRegistrationStatus } from './registration';

export function RegisterRoute() {
    const { data, isPending } = useRegistrationStatus();
    if (isPending) return <FullPageSpinner />;
    return data?.open ? <RegisterPage /> : <Navigate to="/login" replace />;
}