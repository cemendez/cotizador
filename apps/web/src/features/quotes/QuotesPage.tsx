import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate, formatMoney } from '../../lib/format';
import type { QuoteStatus } from '../../types/api';
import { useQuotes } from './api';
import { STATUS_LABELS } from './status';
import { StatusBadge } from './StatusBadge';

const FILTERS: Array<{ value: QuoteStatus | ''; label: string }> = [
    { value: '', label: 'Todas' },
    ...(Object.keys(STATUS_LABELS) as QuoteStatus[]).map((value) => ({ value, label: STATUS_LABELS[value] })),
];

export function QuotesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const search = searchParams.get('search') ?? '';
    const status = (searchParams.get('status') ?? '') as QuoteStatus | '';

    const [searchInput, setSearchInput] = useState(search);
    const debounceRef = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(debounceRef.current), []);

    const { data, isPending, isError, error, isPlaceholderData } = useQuotes({ page, status, search });

    // Cambiar un filtro siempre regresa a la página 1
    const updateParams = (changes: Record<string, string>, replace = false) => {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) {
            if (value) params.set(key, value);
            else params.delete(key)
        }
        params.delete('page');
        setSearchParams(params, { replace });
    }

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => updateParams({ search: value.trim() }, true), 300);
    }

    const goToPage = (nextPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        setSearchParams(params);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-slate-900">Cotizaciones</h1>
                <Link
                    to="/quotes/new"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    Nueva cotización
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.value || 'all'}
                            type="button"
                            onClick={() => updateParams({ status: filter.value })}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium ${status === filter.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Buscar por título o cliente"
                    className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {isPending && <p className="text-sm text-slate-500">Cargando cotizaciones…</p>}
            {isError && <ErrorAlert message={error.message} />}

            {data && data.data.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                    {search || status ? 'No hay cotizaciones con esos filtros.' : 'Aún no tienes cotizaciones.'}
                </div>
            )}

            {data && data.data.length > 0 && (
                <div className={`overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 ${isPlaceholderData ? 'opacity-60' : ''}`}>
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 font-medium">Folio</th>
                                <th className="px-4 py-3 font-medium">Título</th>
                                <th className="px-4 py-3 font-medium">Cliente</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 text-right font-medium">Total</th>
                                <th className="px-4 py-3 font-medium">Creada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.data.map((quote) => (
                                <tr key={quote.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <Link to={`/quotes/${quote.id}`} className="font-mono font-medium text-indigo-600 hover:underline">
                                            {quote.folio}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-slate-900">{quote.title}</td>
                                    <td className="px-4 py-3 text-slate-600">{quote.client.company ?? quote.client.name}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={quote.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                                        {formatMoney(quote.total, quote.currency)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{formatDate(quote.createdAt)}</td>
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
        </div>
    );
}