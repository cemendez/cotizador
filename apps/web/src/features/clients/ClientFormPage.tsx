import { Link, useParams } from 'react-router';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { useClient } from './api';
import { ClientForm } from './ClientForm';

export function ClientFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id)
    const { data: client, isPending, isError, error } = useClient(id)

    return (
        <div className='max-w-3xl space-y-6'>
            <div>
                <Link to="/clients" className="text-sm text-indigo-600 hover:underline">
                    ← Clientes
                </Link>
                <h1 className='mt-2 text-2xl font-semibold text-slate-900'>
                    {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
                </h1>
            </div>

            {isEdit && isPending && <p className="text-sm text-slate-500">Cargando...</p>}
            {isEdit && isError && <ErrorAlert message={error.message} />}
            {(!isEdit || client) && <ClientForm key={client?.id ?? 'new'} client={client} />}

        </div>
    )
}