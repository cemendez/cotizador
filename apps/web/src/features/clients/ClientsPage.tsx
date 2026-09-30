import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Pagination } from '../../components/ui/Pagination';
import type { Client } from '../../types/api';
import { useClients, useDeleteClient } from './api';

export function ClientsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const search = searchParams.get('search') ?? '';

    const [searchInput, setSearchInput] = useState(search);
    const debounceRef = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(debounceRef.current), []);

    const { data, isPending, isError, error, isPlaceholderData } = useClients({ page, search });
    const deleteClient = useDeleteClient();
    const [toDelete, setToDelete] = useState<Client | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            const term = value.trim();
            // replace: las búsquedas no llenan el historial; al buscar se vuelve a la página 1
            setSearchParams(term ? { search: term } : {}, { replace: true });
        }, 300);
    };

    const goToPage = (nextPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        setSearchParams(params);
    };

    const closeDeleteDialog = () => {
        setToDelete(null);
        deleteClient.reset();
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        deleteClient.mutate(toDelete.id, {
            onSuccess: () => {
                // Si era el único de la página, retroceder para no mostrar una página vacía
                if (data && data.data.length === 1 && page > 1) goToPage(page - 1);
                closeDeleteDialog();
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
                <Link
                    to="/clients/new"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    Nuevo cliente
                </Link>
            </div>

            <input
                type="search"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar por nombre, empresa, correo o RFC"
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {isPending && <p className="text-sm text-slate-500">Cargando clientes…</p>}
            {isError && <ErrorAlert message={error.message} />}

            {data && data.data.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-slate-600">
                        {search ? `No hay clientes que coincidan con "${search}".` : 'Aún no tienes clientes registrados.'}
                    </p>
                </div>
            )}

            {data && data.data.length > 0 && (
                <div className={`overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 ${isPlaceholderData ? 'opacity-60' : ''}`}>
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 font-medium">Cliente</th>
                                <th className="px-4 py-3 font-medium">Correo</th>
                                <th className="px-4 py-3 font-medium">RFC</th>
                                <th className="px-4 py-3 text-center font-medium">Cotizaciones</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.data.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-900">{client.name}</p>
                                        {client.company && <p className="text-slate-500">{client.company}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{client.email ?? '—'}</td>
                                    <td className="px-4 py-3 font-mono text-slate-600">{client.rfc ?? '—'}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{client._count?.quotes ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                to={`/clients/${client.id}/edit`}
                                                className="rounded-lg px-3 py-1.5 font-medium text-indigo-600 hover:bg-indigo-50"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setToDelete(client)}
                                                className="rounded-lg px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && (
                <Pagination
                    page={data.meta.page}
                    totalPages={data.meta.totalPages}
                    total={data.meta.total}
                    onPageChange={goToPage}
                />
            )}

            <ConfirmDialog
                open={toDelete !== null}
                title="Eliminar cliente"
                loading={deleteClient.isPending}
                error={deleteClient.error?.message}
                onConfirm={confirmDelete}
                onClose={closeDeleteDialog}
            >
                ¿Seguro que quieres eliminar a <strong>{toDelete?.name}</strong>? Esta acción no se puede deshacer.
            </ConfirmDialog>
        </div>
    );
}