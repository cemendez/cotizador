import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../auth/auth-context';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { formatDate, formatDateOnly, formatMoney } from '../../lib/format';
import type { DashboardQuote, MoneyByCurrency, QuoteStatus } from '../../types/api';
import { STATUS_LABELS } from '../quotes/status';
import { StatusBadge } from '../quotes/StatusBadge';
import { useDashboard } from './api';

function StatCard({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
    return (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{label}</p>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{children}</div>
            {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

function MoneyTotals({ groups }: { groups: MoneyByCurrency[] }) {
    if (groups.length === 0) return <>{formatMoney(0)}</>;
    return (
        <>
            {groups.map((group) => (
                <span key={group.currency} className="block">
                    {formatMoney(group.total, group.currency)}
                </span>
            ))}
        </>
    );
}

const countOf = (groups: MoneyByCurrency[]) => groups.reduce((sum, group) => sum + group.count, 0);

function QuoteList({ quotes, empty, showValidUntil }: { quotes: DashboardQuote[]; empty: string; showValidUntil?: boolean }) {
    if (quotes.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
    return (
        <ul className="divide-y divide-slate-100">
            {quotes.map((quote) => (
                <li key={quote.id}>
                    <Link to={`/quotes/${quote.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-slate-50">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                                <span className="font-mono text-indigo-600">{quote.folio}</span> · {quote.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {quote.client.company ?? quote.client.name} ·{' '}
                                {showValidUntil && quote.validUntil
                                    ? `vence ${formatDateOnly(quote.validUntil)}`
                                    : `actualizada ${formatDate(quote.updatedAt)}`}
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-sm font-medium tabular-nums">{formatMoney(quote.total, quote.currency)}</span>
                            <StatusBadge status={quote.status} />
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export function DashboardPage() {
    const { user } = useAuth();
    const { data, isPending, isError, error } = useDashboard();

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Hola, {user?.name}</h1>
                    <p className="text-slate-600">Este es el resumen de tu actividad.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/clients/new" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Nuevo cliente
                    </Link>
                    <Link to="/quotes/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        Nueva cotización
                    </Link>
                </div>
            </div>

            {!user?.businessName && !user?.rfc && (
                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
                    Completa tu razón social y RFC para que aparezcan en tus cotizaciones y contratos.{' '}
                    <Link to="/profile" className="font-medium underline">
                        Ir a mi perfil
                    </Link>
                </div>
            )}

            {isPending && <p className="text-sm text-slate-500">Cargando resumen…</p>}
            {isError && <ErrorAlert message={error.message} />}

            {data && (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Aceptado este mes" hint={`${countOf(data.acceptedThisMonth)} cotización(es)`}>
                            <MoneyTotals groups={data.acceptedThisMonth} />
                        </StatCard>
                        <StatCard label="Pendiente de respuesta" hint={`${countOf(data.pending)} enviada(s)`}>
                            <MoneyTotals groups={data.pending} />
                        </StatCard>
                        <StatCard label="Borradores">{data.statusCounts.DRAFT}</StatCard>
                        <StatCard label="Clientes">{data.clients}</StatCard>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(data.statusCounts) as QuoteStatus[]).map((status) => (
                            <Link
                                key={status}
                                to={`/quotes?status=${status}`}
                                className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                            >
                                {STATUS_LABELS[status]}: <strong>{data.statusCounts[status]}</strong>
                            </Link>
                        ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                            <h2 className="mb-2 font-semibold text-slate-900">Vencen en los próximos 7 días</h2>
                            <QuoteList
                                quotes={data.expiringSoon}
                                empty="No hay cotizaciones enviadas por vencer."
                                showValidUntil
                            />
                        </section>
                        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                            <h2 className="mb-2 font-semibold text-slate-900">Actividad reciente</h2>
                            <QuoteList quotes={data.recent} empty="Aún no tienes cotizaciones." />
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}